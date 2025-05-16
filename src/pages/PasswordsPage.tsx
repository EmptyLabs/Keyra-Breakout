import React, { useState, useMemo, useEffect } from 'react';
import { usePassword, PasswordEntry } from '../context/PasswordContext'; // Import usePassword
// useAuth is no longer needed here as masterPassword and userAccount are used in PasswordContext
// import { useAuth } from '../context/AuthContext';
import PasswordList, { SortField, SortOrder } from '../components/passwords/PasswordList'; // Import SortField and SortOrder
import PasswordGrid from '../components/passwords/PasswordGrid';
import AddPasswordForm from '../components/passwords/AddPasswordForm';
import { PlusCircle, Key, Loader2, AlertCircle, ExternalLink, Check, ArrowRight, Shield } from 'lucide-react'; // Added more icons
import TransactionLink from '../components/common/TransactionLink';

// Removed local SortField and SortOrder types
// type SortField = 'title' | 'username' | 'url' | 'createdAt';
// type SortOrder = 'asc' | 'desc';

// Interface for success message with transaction details
interface SuccessMessageData {
  message: string;
  txSignature?: string;
  ipfsCid?: string;
  timestamp: number;
}

const PasswordsPage: React.FC = () => {
  // Get passwords, loading state, and action functions from PasswordContext
  const { passwords, isLoadingPasswords, isLoadingAction, actionError, deletePassword } = usePassword(); // Get action states
  // Removed useAuth as masterPassword and userAccount are accessed within PasswordContext

  const [showAddForm, setShowAddForm] = useState(false);
  const [editPassword, setEditPassword] = useState<PasswordEntry | null>(null);
  // Updated success message to include transaction details
  const [successMessage, setSuccessMessage] = useState<SuccessMessageData | null>(null);
  
  // Clear success message after a delay
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 7000); // Extended to 7 seconds to give users more time to see and click links
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Function to open Solana Explorer in a new tab
  const openSolanaExplorer = (signature: string) => {
    // Devnet olarak güncellenmiş URL
    window.open(`https://solscan.io/tx/${signature}?cluster=devnet`, '_blank', 'noopener,noreferrer');
  };

  // Function to open IPFS gateway in a new tab
  const openIpfsGateway = (cid: string) => {
    window.open(`https://ipfs.io/ipfs/${cid}`, '_blank', 'noopener,noreferrer');
  };

  const [searchQuery, setSearchQuery] = useState('');
  // Use imported SortField and SortOrder types for local state
  const [sortField, setSortField] = useState<SortField>('title');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Apply filtering and sorting to the passwords from context
  const filteredAndSortedPasswords = useMemo(() => {
    let result = [...passwords];

    // Apply category filter
    if (selectedCategory !== 'all') {
      result = result.filter(password => password.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(password =>
        password.title.toLowerCase().includes(query) ||
        password.username.toLowerCase().includes(query) ||
        password.url.toLowerCase().includes(query) ||
        password.category.toLowerCase().includes(query) // Also search category
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      // Handle sorting based on string fields
      const fieldA = (a as any)[sortField]; // Use any for dynamic field access
      const fieldB = (b as any)[sortField]; // Use any for dynamic field access

      if (fieldA > fieldB) {
          comparison = 1;
      } else if (fieldA < fieldB) {
          comparison = -1;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [passwords, searchQuery, sortField, sortOrder, selectedCategory]); // Depend on passwords from context


  const handleAddNewClick = () => {
    setEditPassword(null); // Clear any password being edited
    setShowAddForm(true); // Show the Add/Edit form
  };

  const handleCloseForm = () => {
    setShowAddForm(false); // Hide the form
    setEditPassword(null); // Clear the password being edited
  };

  const handleStartEditPassword = (password: PasswordEntry) => {
    setEditPassword(password); // Set the password to be edited
    setShowAddForm(true); // Show the Add/Edit form
  };

  // handleDeletePassword now comes from usePassword and is async and also sets the success message with transaction details
  const handleDeletePassword = async (id: string): Promise<boolean> => { // Explicitly return Promise<boolean>
    if (confirm('Are you sure you want to delete this password?')) {
      // Call the async delete function from context
      const success = await deletePassword(id);
      if (success) {
          // Extract transaction signature if available from the return value
          let txSignature: string | undefined;
          if (typeof success === 'object' && success.signature) {
            txSignature = success.signature;
          }
          
          setSuccessMessage({
            message: "Password successfully deleted.",
            txSignature,
            ipfsCid: id, // The IPFS CID that was deleted
            timestamp: Date.now()
          });
          
          return true; // Return true on success
      } else {
          console.error("Failed to send delete signal.");
          // Show an error message to the user
          return false; // Return false on failure
      }
    }
    return false; // Return false if confirmation is cancelled
  };

  // Removed promptForMasterPassword and handleRevealPassword
  // as password data is decrypted in PasswordContext

  // Removed handleSubmitMasterPassword

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 border-b border-[#222] pb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <Key className="w-6 h-6 mr-2 text-[#a6ccb8]" />
            Passwords
          </h1>
          <p className="text-[#546e7a]">
            Manage and organize your secure passwords
          </p>
        </div>

        <button
          onClick={handleAddNewClick}
          className="btn-primary lg:w-auto transition-all duration-200 hover:shadow-lg hover:scale-105"
          disabled={isLoadingAction} // Disable button while an action is loading
        >
          <PlusCircle size={18} className="mr-2" />
          Add Password
        </button>
      </div>

      {/* Enhanced success message display with transaction details */}
      {successMessage && (
        <div className="p-4 mb-5 bg-green-500/10 text-green-700 rounded-md animate-fade-in border border-green-200 shadow-md transform hover:shadow-lg transition-all duration-200">
          <div className="flex items-center mb-2">
            <div className="bg-green-100 rounded-full p-1 mr-2">
              <Check size={20} className="text-green-500" />
            </div>
            <span className="font-medium">{successMessage.message}</span>
          </div>
          
          {/* Additional transaction details section */}
          <div className="mt-2 text-sm space-y-1.5 bg-green-50/50 p-3 rounded-md">
            {successMessage.txSignature && (
              <div className="flex items-center">
                <ArrowRight size={14} className="mr-1.5 opacity-70" />
                <span className="mr-1.5">Transaction:</span>
                <TransactionLink 
                  signature={successMessage.txSignature} 
                  truncate={true}
                  label={`${successMessage.txSignature.substring(0, 8)}...`}
                  cluster="devnet"
                />
              </div>
            )}
            
            {successMessage.ipfsCid && (
              <div className="flex items-center">
                <ArrowRight size={14} className="mr-1.5 opacity-70" />
                <span className="mr-1.5">IPFS CID:</span>
                <a 
                  href={`https://ipfs.io/ipfs/${successMessage.ipfsCid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                  title={`View on IPFS: ${successMessage.ipfsCid}`}
                >
                  {successMessage.ipfsCid.substring(0, 12)}...
                  <ExternalLink size={12} className="ml-1" />
                </a>
              </div>
            )}
            
            <div className="text-xs text-green-600/70 mt-1.5">
              Completed: {new Date(successMessage.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Display loading state for actions */}
      {isLoadingAction && (
        <div className="p-4 mb-4 bg-blue-500/10 text-blue-600 rounded-md animate-fade-in shadow-md flex items-center gap-3">
          <div className="relative">
            <Loader2 className="w-6 h-6 animate-spin" />
            <Shield className="w-3 h-3 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" />
          </div>
          <div>
            <span className="font-medium">Processing</span>
            <p className="text-sm text-blue-500">Transaction is being processed on the Solana blockchain...</p>
          </div>
        </div>
      )}

      {/* Display error state for actions */}
      {actionError && (
        <div className="p-4 mb-4 bg-red-500/10 text-red-600 rounded-md flex items-start animate-fade-in border border-red-200 shadow-md">
          <AlertCircle size={20} className="mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium">Transaction Error</p>
            <p className="text-sm mt-1">{actionError}</p>
            <p className="text-xs mt-2 text-red-500/80">
              Please try again or check the console for more information.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* PasswordList component now receives passwords prop */}
        <PasswordList
          passwords={passwords} // Pass passwords from context
          onSearch={setSearchQuery}
          onSort={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
          onCategoryChange={setSelectedCategory}
        />

        <PasswordGrid
          // Passwords are now accessed within PasswordGrid via usePassword
          // passwords={filteredAndSortedPasswords} // Removed
          onDelete={handleDeletePassword} // Pass the async delete handler
          onStartEdit={handleStartEditPassword} // Pass the new edit handler
          searchQuery={searchQuery} // Pass searchQuery for potential internal filtering/display
          // onReveal is removed
        />
      </div>

      {/* Conditionally render the Add/Edit Password Form */}
      {showAddForm && (
        <AddPasswordForm
          onClose={handleCloseForm}
          editPassword={editPassword} // Pass the password object for editing
          onSuccess={(data) => {
            // Set success message with transaction data when password is added/updated
            setSuccessMessage({
              message: editPassword 
                ? `Password "${data.title}" successfully updated.` 
                : `Password "${data.title}" successfully added.`,
              txSignature: data.signature,
              ipfsCid: data.id,
              timestamp: Date.now()
            });
            handleCloseForm();
          }}
        />
      )}

      {/* Removed Master Password Prompt as it's handled by AuthContext */}
    </div>
  );
};


export default PasswordsPage;
