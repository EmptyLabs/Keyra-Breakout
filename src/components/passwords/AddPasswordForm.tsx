import React, { useState, useEffect, FormEvent } from 'react';
import { usePassword, PasswordEntry } from '../../context/PasswordContext';
import { X, Save, RefreshCcw, Globe, AlertCircle } from 'lucide-react';
// Assuming @types/react and @types/lucide-react are installed or handled elsewhere
// import type { FC, FormEvent } from 'react'; // Explicitly import types if needed

import { generatePassword, encryptData } from '../../utils/encryption'; // Import encryptData
import { uploadToIpfs, checkIpfsConnection, forceIpfsConnectionCheck } from '../../utils/ipfs'; // Import IPFS utilities with new reconnect function
import { useAuth } from '../../context/AuthContext';

interface AddPasswordFormProps {
  onClose: () => void;
  editPassword?: PasswordEntry | null;
  onSuccess?: (data: {
    title: string;
    id: string;
    signature?: string;  // Optional transaction signature
  }) => void;
}

// Explicitly type the functional component
const AddPasswordForm: React.FC<AddPasswordFormProps> = ({ onClose, editPassword, onSuccess }) => {
  const { addPassword, updatePassword, categories, actionError } = usePassword();
  const { masterPassword, anchorWallet } = useAuth(); // Removed lpv2Keypair

  const [title, setTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('passwords');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ipfsConnected, setIpfsConnected] = useState(false);
  const [isCheckingIpfs, setIsCheckingIpfs] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Check IPFS connection when component mounts and improve error handling
  useEffect(() => {
    verifyIpfsConnection();
  }, []);

  const verifyIpfsConnection = async () => {
    setIsCheckingIpfs(true);
    try {
      const connected = await checkIpfsConnection();
      setIpfsConnected(connected);
      if (!connected) {
        setError('IPFS daemon is not running or not responding. Please check your IPFS daemon and click "Retry Connection" below.');
      } else {
        setError(''); // Clear error if connection is successful
      }
    } catch (error) {
      console.error("Error checking IPFS connection:", error);
      setError('Could not verify IPFS connection. Make sure your IPFS daemon is running.');
      setIpfsConnected(false);
    } finally {
      setIsCheckingIpfs(false);
    }
  };

  // Function to manually retry IPFS connection
  const retryIpfsConnection = async () => {
    setConnectionAttempts(prev => prev + 1);
    setError('Attempting to reconnect to IPFS daemon...');
    setIsCheckingIpfs(true);
    
    try {
      // Use the force reconnect function for a fresh connection attempt
      const reconnected = await forceIpfsConnectionCheck();
      setIpfsConnected(reconnected);
      
      if (reconnected) {
        setError(''); // Clear error
        console.log('Successfully reconnected to IPFS daemon!');
      } else {
        setError(`IPFS connection failed after retry attempt. Please ensure your IPFS daemon is running at http://localhost:5001`);
      }
    } catch (error) {
      console.error('Error during IPFS reconnection:', error);
      setError(`IPFS reconnection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCheckingIpfs(false);
    }
  };

  useEffect(() => {
    if (editPassword) {
      setTitle(editPassword.title);
      setUsername(editPassword.username);
      setPassword(editPassword.password);
      setUrl(editPassword.url);
      setCategory(editPassword.category);
    }
  }, [editPassword]);

  const handleGeneratePassword = () => {
    const newPassword = generatePassword(12, true, true, true, true);
    setPassword(newPassword);
  };

  // Explicitly type the event parameter
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Double-check IPFS connection before proceeding
    if (!ipfsConnected) {
      try {
        const connected = await forceIpfsConnectionCheck();
        setIpfsConnected(connected);
        if (!connected) {
          setError('IPFS daemon is still not running. Please start your IPFS daemon and click "Retry Connection" below.');
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        setError(`IPFS connection check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }
    }

    if (!title || !username || !password || !url) {
      setError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    if (!masterPassword) {
      setError('Master password not available. Please log in.');
      setIsSubmitting(false);
      return;
    }
    
    // anchorWallet is needed by the context for userMainPubkey
    if (!anchorWallet || !anchorWallet.publicKey) {
        setError('Wallet not connected or public key unavailable.');
        setIsSubmitting(false);
        return;
    }

    try {
      const dataToEncrypt = JSON.stringify({ title, username, password, url, category });
      
      console.log("Encrypting data...");
      let encryptedData;
      try {
        encryptedData = await encryptData(dataToEncrypt, masterPassword);
        if (!encryptedData) {
          throw new Error('Encryption returned null or undefined result');
        }
      } catch (encryptError: any) {
        console.error("Error encrypting data:", encryptError);
        setError(`Failed to encrypt data: ${encryptError.message || 'Unknown error'}`);
        setIsSubmitting(false);
        return;
      }

      console.log("Uploading encrypted data to IPFS...");
      let ipfsCid;
      try {
        ipfsCid = await uploadToIpfs(encryptedData);
        if (!ipfsCid) {
          throw new Error('IPFS upload returned null or undefined CID');
        }
      } catch (ipfsError: any) {
        console.error("Error uploading to IPFS:", ipfsError);
        setError(`Failed to upload data to IPFS: ${ipfsError.message || 'Unknown error'}`);
        
        // Offer chance to retry IPFS connection if upload fails
        setIpfsConnected(false);
        setIsSubmitting(false);
        return;
      }
      
      console.log("Encrypted data uploaded to IPFS with CID:", ipfsCid);

      let response;
      const passwordPayload = { title, username, password, url, category };

      console.log("Sending blockchain signal...");
      if (editPassword && editPassword.id) { // editPassword.id is the oldCid
        response = await updatePassword(editPassword.id, passwordPayload);
      } else {
        response = await addPassword(passwordPayload, ipfsCid); // Pass ipfsCid for new passwords
      }

      // Check if response is success
      if (response) {
        // Extract transaction signature if available
        let txSignature: string | undefined;
        let newCid = ipfsCid;
        
        if (typeof response === 'object') {
          // Use type assertion for safety
          const typedResponse = response as { signature?: string; id?: string; success: boolean };
          if (typedResponse.signature) {
            txSignature = typedResponse.signature;
          }
          if (typedResponse.id) {
            // For update operations, the new CID is returned
            newCid = typedResponse.id;
          }
        }
        
        // Determine success based on response type
        const success = typeof response === 'boolean' ? response : (response as { success: boolean }).success;
        
        if (success) {
          const successMsg = editPassword 
            ? `Password update signal sent. New IPFS CID: ${newCid}` 
            : `Password added successfully. IPFS CID: ${ipfsCid}`;
          
          // Indicate success with different styling
          setError(successMsg); // Using the error field to display success too
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess({
              title,
              id: newCid,
              signature: txSignature,
            });
          } else {
            // Delay closing to allow user to see success message
            setTimeout(() => {
                onClose();
            }, 3000); // Extended to 3 seconds to allow users to see the result
          }
        } else {
          // Error state will be set by the context's actionError, but we can set a generic one here too
          setError(actionError || (editPassword ? 'Failed to send update signal. Check console/notifications.' : 'Failed to send add signal. Check console/notifications.'));
        }
      } else {
        setError(actionError || 'Failed to send transaction. Please try again.');
      }
    } catch (err: any) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || 'An unexpected error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in backdrop-blur-sm">
      <div className="bg-[#111] rounded-lg shadow-xl max-w-md w-full mx-4 animate-slide-in border border-[#333]">
        <div className="flex justify-between items-center border-b border-[#222] px-6 py-4">
          <h3 className="font-bold text-xl text-white">
            {editPassword ? 'Edit Password' : 'Add New Password'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#222] text-gray-400 hover:text-white transition-all"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {!ipfsConnected && (
          <div className="bg-[#2b1211] p-4 mx-4 mt-4 rounded-md flex items-start border border-red-800">
            <AlertCircle size={20} className="text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">IPFS Connection Error</p>
              <p className="text-sm text-red-400 mb-3">
                Your IPFS daemon is not running or not responding. Please start it in your terminal with <code className="bg-red-900/30 px-1.5 py-0.5 rounded text-red-300">ipfs daemon</code>, then click the button below.
              </p>
              <button 
                onClick={retryIpfsConnection}
                disabled={isCheckingIpfs}
                className="bg-red-700 hover:bg-red-600 text-white py-2 px-4 rounded-md flex items-center justify-center text-sm transition-colors"
              >
                {isCheckingIpfs ? (
                  <>
                    <RefreshCcw size={14} className="mr-2 animate-spin" />
                    Checking Connection...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={14} className="mr-2" />
                    Retry Connection {connectionAttempts > 0 ? `(${connectionAttempts})` : ''}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4">
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1">
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} // Explicitly type e
                className="input-field"
                placeholder="e.g., Gmail Account"
                required
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} // Explicitly type e
                className="input-field"
                placeholder="e.g., your.email@gmail.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password
              </label>
              <div className="flex">
                <input
                  id="password"
                  type="text"
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} // Explicitly type e
                  className="input-field rounded-r-none flex-1"
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  onClick={handleGeneratePassword}
                  className="btn-secondary rounded-l-none border-l-0"
                >
                  <RefreshCcw size={16} />
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="url" className="block text-sm font-medium mb-1">
                Website URL
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Globe size={16} className="text-gray-400" />
                </div>
                <input
                  id="url"
                  type="text"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)} // Explicitly type e
                  className="input-field pl-10"
                  placeholder="e.g., gmail.com"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium mb-1">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)} // Explicitly type e
                className="input-field"
                required
              >
                {categories.map((cat: { id: string; name: string }) => ( // Explicitly type cat
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Display error from local state or PasswordContext actionError */}
          {(error || actionError) && ( // Assuming actionError is available from usePassword()
            <div className={`mt-4 text-sm animate-fade-in ${error.includes('successfully') || error.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
              {error || actionError}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting || !ipfsConnected}
            >
              {isSubmitting ? 'Processing...' : (
                <>
                  <Save size={16} className="mr-1" />
                  {editPassword ? 'Update' : 'Save'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPasswordForm;
