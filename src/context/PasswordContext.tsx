import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext'; // Import useAuth
import { decryptData, encryptData } from '../utils/encryption'; // Import decryptData and encryptData for updates
import { retrieveFromIpfs, uploadToIpfs, checkIpfsConnection } from '../utils/ipfs'; // Import IPFS utilities
import { sendLpv2SignalTransaction, Lpv2SignalMemo } from '../utils/lpv2Service'; // Import new service
//@ts-ignore
import { PublicKey } from '@solana/web3.js';
import { useWallet } from '@solana/wallet-adapter-react'; // Import useWallet

export interface PasswordEntry {
  // Note: ID will now be the IPFS CID
  id: string; // IPFS CID
  title: string;
  username: string;
  password: string;
  url: string;
  category: string;
  // createdAt: number; // Removed as it's not stored in the encrypted data
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

// Define the localStorage key for categories
const CATEGORIES_STORAGE_KEY = 'keyra_categories';

interface PasswordContextType {
  passwords: PasswordEntry[];
  categories: Category[];
  // These functions will now trigger LPv2 signal transactions via the relayer and return signatures
  addPassword: (password: Omit<PasswordEntry, 'id'>, ipfsCid: string) => Promise<boolean | { success: boolean, signature?: string }>;
  deletePassword: (id: string) => Promise<boolean | { success: boolean, signature?: string }>;
  updatePassword: (oldCid: string, newData: Partial<Omit<PasswordEntry, 'id'>>) => Promise<boolean | { success: boolean, signature?: string, id?: string }>;
  // getPassword is likely not needed as passwords are in state after decryption
  // getPassword: (id: string, masterPassword: string) => string | null; // Removed
  addCategory: (category: Omit<Category, 'id'>) => boolean; // Categories still local for now
  deleteCategory: (id: string) => boolean; // Categories still local for now
  updateCategory: (id: string, data: Partial<Category>) => boolean; // Categories still local for now
  // unlockVault is handled by AuthContext login
  // unlockVault: (masterPassword: string) => boolean; // Removed
  isLoadingPasswords: boolean; // Add loading state for fetching passwords
  isLoadingAction: boolean; // Add loading state for add/update/delete actions
  actionError: string | null; // Add error state for add/update/delete actions
}

const PasswordContext = createContext<PasswordContextType | undefined>(undefined);

export const usePassword = () => {
  const context = useContext(PasswordContext);
  if (!context) {
    throw new Error('usePassword must be used within a PasswordProvider');
  }
  return context;
};

interface PasswordProviderProps {
  children: ReactNode;
}

export const PasswordProvider: React.FC<PasswordProviderProps> = ({ children }) => {
  const { userAccount, masterPassword, anchorWallet } = useAuth(); // Get userAccount and anchorWallet
  const { publicKey: walletPublicKey, signMessage } = useWallet(); // Get publicKey and signMessage for messageSigner
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  // Initialize categories from localStorage or use defaults
  const [categories, setCategories] = useState<Category[]>(() => {
    const savedCategories = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (savedCategories) {
      try {
        return JSON.parse(savedCategories);
      } catch (error) {
        console.error("Failed to parse categories from localStorage:", error);
        // Fallback to default categories if parsing fails
        return [
          { id: 'passwords', name: 'Passwords', icon: 'key' },
          { id: 'credit-cards', name: 'Credit Cards', icon: 'credit-card' },
          { id: 'notes', name: 'Secure Notes', icon: 'file-text' }
        ];
      }
    }
    // Default categories if nothing in localStorage
    return [
      { id: 'passwords', name: 'Passwords', icon: 'key' },
      { id: 'credit-cards', name: 'Credit Cards', icon: 'credit-card' },
      { id: 'notes', name: 'Secure Notes', icon: 'file-text' }
    ];
  });
  const [isLoadingPasswords, setIsLoadingPasswords] = useState(false);
  const [isLoadingAction, setIsLoadingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [ipfsConnected, setIpfsConnected] = useState(false);

  // Effect to save categories to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error("Failed to save categories to localStorage:", error);
    }
  }, [categories]); // Depend on categories state

  // Effect to check IPFS connection
  useEffect(() => {
    const verifyIpfsConnection = async () => {
      const connected = await checkIpfsConnection();
      setIpfsConnected(connected);
      
      if (!connected) {
        console.error("IPFS connection failed. Please make sure your IPFS daemon is running.");
        setActionError("IPFS daemon is not running. Please start your IPFS daemon and refresh the page.");
      } else {
        console.log("IPFS connection verified successfully");
        setActionError(null);
      }
    };
    
    verifyIpfsConnection();
    
    // Set up periodic connection check (every 30 seconds)
    const interval = setInterval(verifyIpfsConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Remove mock mode related effects
  // Effect to load passwords from userAccount data pointers
  useEffect(() => {
    const fetchAndDecryptPasswords = async () => {
      if (!userAccount || !masterPassword) {
        // Clear passwords if not logged in or account not available
        setPasswords([]);
        return;
      }

      setIsLoadingPasswords(true);
      const fetchedPasswords: PasswordEntry[] = [];

      try {
        if (userAccount.dataPointers && userAccount.dataPointers.length > 0) {
          for (const cid of userAccount.dataPointers) {
            try {
              const encryptedData = await retrieveFromIpfs(cid);
              if (encryptedData) {
                const decryptedData = await decryptData(encryptedData, masterPassword);
                if (decryptedData) {
                  try {
                    const passwordEntry: Omit<PasswordEntry, 'id'> = JSON.parse(decryptedData);
                    fetchedPasswords.push({ ...passwordEntry, id: cid }); // Use CID as ID
                  } catch (parseError) {
                    console.error(`Failed to parse decrypted data for CID ${cid}:`, parseError);
                  }
                } else {
                  console.error(`Failed to decrypt data for CID ${cid}`);
                }
              } else {
                console.error(`Failed to retrieve data from IPFS for CID ${cid}`);
              }
            } catch (error) {
              console.error(`Error processing CID ${cid}:`, error);
            }
          }
        } else {
          console.log("No data pointers found in user account. Using empty password list.");
        }
      } catch (error) {
        console.error("Error fetching passwords:", error);
      }

      setPasswords(fetchedPasswords);
      setIsLoadingPasswords(false);
    };

    fetchAndDecryptPasswords();
  }, [userAccount, masterPassword]); // Removed isMockMode dependency

  const addPassword = async (passwordData: Omit<PasswordEntry, 'id'>, ipfsCid?: string): Promise<boolean | { success: boolean, signature?: string }> => {
    if (!masterPassword) {
      setActionError("Cannot add password: Master password not available.");
      return false;
    }

    if (!ipfsConnected) {
      setActionError("Cannot add password: IPFS daemon is not running.");
      return false;
    }

    setIsLoadingAction(true);
    setActionError(null);

    try {
      // Real mode with blockchain integration
      if (!anchorWallet || !walletPublicKey || !signMessage) {
        setActionError("Cannot add password: Missing wallet or signer.");
        return false;
      }

      const messageSigner = { publicKey: walletPublicKey, signMessage };
      const memo: Lpv2SignalMemo = {
        action: 'add',
        cid: ipfsCid || '', // Use provided CID or empty string (should be validated by caller)
        userMainPubkey: anchorWallet.publicKey.toBase58(),
      };
      
      try {
        const signature = await sendLpv2SignalTransaction(anchorWallet, messageSigner, memo);
        console.log('Add password signal sent for CID:', ipfsCid, 'with signature:', signature);
        
        // Optimistically update UI since signal is sent
        if (ipfsCid) {
          const newPassword: PasswordEntry = { ...passwordData, id: ipfsCid };
          setPasswords(prev => [...prev, newPassword]);
        }
        
        return { success: true, signature };
      } catch (signalError: any) {
        console.error("Error sending add password signal:", signalError);
        setActionError(signalError.message || "Failed to send add password signal.");
        
        // Attempt to update UI anyway in case of blockchain issues
        if (ipfsCid) {
          const newPassword: PasswordEntry = { ...passwordData, id: ipfsCid };
          setPasswords(prev => [...prev, newPassword]);
          console.warn('Updated UI despite signal error');
          return true;
        }
        
        return false;
      }
    } catch (err: any) {
      console.error("Error in add password flow:", err);
      setActionError(err.message || "Failed to add password.");
      return false;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const deletePassword = async (id: string): Promise<boolean | { success: boolean, signature?: string }> => {
    if (!masterPassword) {
      setActionError("Cannot delete password: Master password not available.");
      return false;
    }

    if (!ipfsConnected) {
      setActionError("Cannot delete password: IPFS daemon is not running.");
      return false;
    }

    setIsLoadingAction(true);
    setActionError(null);

    try {
      // Real mode with blockchain integration
      if (!anchorWallet || !walletPublicKey || !signMessage) {
        setActionError("Cannot delete password: Missing wallet or signer.");
        return false;
      }

      const messageSigner = { publicKey: walletPublicKey, signMessage };
      const memo: Lpv2SignalMemo = {
        action: 'delete',
        cid: id, // id is the IPFS CID to delete
        userMainPubkey: anchorWallet.publicKey.toBase58(),
      };
      
      try {
        const signature = await sendLpv2SignalTransaction(anchorWallet, messageSigner, memo);
        console.log('Delete password signal sent for CID:', id, 'with signature:', signature);
        
        // Optimistically update UI
        setPasswords(prev => prev.filter(p => p.id !== id));
        
        return { success: true, signature };
      } catch (signalError: any) {
        console.error("Error sending delete password signal:", signalError);
        setActionError(signalError.message || "Failed to send delete password signal.");
        
        // Attempt to update UI anyway in case of blockchain issues
        setPasswords(prev => prev.filter(p => p.id !== id));
        console.warn('Updated UI despite signal error');
        return true;
      }
    } catch (err: any) {
      console.error("Error in delete password flow:", err);
      setActionError(err.message || "Failed to delete password.");
      return false;
    } finally {
      setIsLoadingAction(false);
    }
  };

  const updatePassword = async (oldCid: string, newData: Partial<Omit<PasswordEntry, 'id'>>): Promise<boolean | { success: boolean, signature?: string, id?: string }> => {
    if (!masterPassword) {
      setActionError("Cannot update password: Master password not available.");
      return false;
    }

    if (!ipfsConnected) {
      setActionError("Cannot update password: IPFS daemon is not running.");
      return false;
    }

    setIsLoadingAction(true);
    setActionError(null);

    try {
      const existingEntry = passwords.find(p => p.id === oldCid);
      if (!existingEntry) {
        setActionError("Password to update not found locally.");
        return false;
      }

      const updatedData = { ...existingEntry, ...newData, id: '' }; // Remove id for encryption

      // Real mode with blockchain and IPFS
      if (!anchorWallet || !walletPublicKey || !signMessage) {
        setActionError("Cannot update password: Missing wallet or signer.");
        return false;
      }

      // Re-encrypt and upload
      const dataToReEncrypt = JSON.stringify({
        title: updatedData.title,
        username: updatedData.username,
        password: updatedData.password,
        url: updatedData.url,
        category: updatedData.category
      });

      let newEncryptedData;
      try {
        newEncryptedData = await encryptData(dataToReEncrypt, masterPassword);
        if (!newEncryptedData) {
          setActionError("Failed to re-encrypt data for update.");
          return false;
        }
      } catch (encryptError: any) {
        console.error("Error encrypting password data:", encryptError);
        setActionError(encryptError.message || "Failed to encrypt password data.");
        return false;
      }

      let newCid;
      try {
        newCid = await uploadToIpfs(newEncryptedData);
        if (!newCid) {
          setActionError("Failed to re-upload data to IPFS for update.");
          return false;
        }
      } catch (ipfsError: any) {
        console.error("Error uploading to IPFS:", ipfsError);
        setActionError(ipfsError.message || "Failed to upload to IPFS.");
        return false;
      }

      // Send blockchain signal
      try {
        const messageSigner = { publicKey: walletPublicKey, signMessage };
        const memo: Lpv2SignalMemo = {
          action: 'update',
          old_cid: oldCid,
          new_cid: newCid,
          userMainPubkey: anchorWallet.publicKey.toBase58(),
        };
        
        const signature = await sendLpv2SignalTransaction(anchorWallet, messageSigner, memo);
        console.log('Update password signal sent. Old CID:', oldCid, 'New CID:', newCid, 'Signature:', signature);
        
        // Optimistically update UI
        setPasswords(prev => 
          prev.map(p => p.id === oldCid ? { ...updatedData, id: newCid } : p)
        );
        
        return { success: true, signature, id: newCid };
      } catch (signalError: any) {
        console.error("Error sending update password signal:", signalError);
        setActionError(signalError.message || "Failed to send update signal, but data was uploaded.");
        
        // Attempt to update UI anyway in case of blockchain issues
        setPasswords(prev => 
          prev.map(p => p.id === oldCid ? { ...updatedData, id: newCid } : p)
        );
        console.warn('Updated UI despite signal error');
        return true;
      }
    } catch (err: any) {
      console.error("Error in update password flow:", err);
      setActionError(err.message || "Failed to update password.");
      return false;
    } finally {
      setIsLoadingAction(false);
    }
  };

  // Category management remains local for now
  const addCategory = (categoryData: Omit<Category, 'id'>): boolean => {
    // TODO: Consider if categories should also be stored on-chain or linked via LPv2
    const newCategory: Category = {
      ...categoryData,
      id: crypto.randomUUID() // Still using local UUID for now
    };

    setCategories(prev => {
      const updatedCategories = [...prev, newCategory];
      // Save updated categories to localStorage
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
      } catch (error) {
        console.error("Failed to save categories to localStorage:", error);
      }
      return updatedCategories;
    });
    console.warn("Placeholder: addCategory called. Categories are currently local.");
    return true;
  };

  const deleteCategory = (id: string): boolean => {
    // TODO: Consider if categories should also be stored on-chain or linked via LPv2
    // Don't allow deletion of default categories
    if (['passwords', 'credit-cards', 'notes'].includes(id)) {
      return false;
    }

    setCategories(prev => {
      const updatedCategories = prev.filter(c => c.id !== id);
      // Save updated categories to localStorage
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
      } catch (error) {
        console.error("Failed to save categories to localStorage:", error);
      }
      return updatedCategories;
    });
     console.warn("Placeholder: deleteCategory called. Categories are currently local.");
    return true;
  };

  const updateCategory = (id: string, data: Partial<Category>): boolean => {
    // TODO: Consider if categories should also be stored on-chain or linked via LPv2
    setCategories(prev => {
      const updatedCategories = prev.map(c => c.id === id ? { ...c, ...data } : c);
      // Save updated categories to localStorage
      try {
        localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updatedCategories));
      } catch (error) {
        console.error("Failed to save categories to localStorage:", error);
      }
      return updatedCategories;
    });
     console.warn("Placeholder: updateCategory called. Categories are currently local.");
    return true;
  };

  const value = {
    passwords,
    categories,
    addPassword,
    deletePassword,
    updatePassword,
    // getPassword is removed
    addCategory,
    deleteCategory,
    updateCategory,
    // unlockVault is removed
    isLoadingPasswords,
    isLoadingAction,
    actionError,
  };

  return <PasswordContext.Provider value={value}>{children}</PasswordContext.Provider>;
};
