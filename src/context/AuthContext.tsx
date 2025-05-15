import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Wallet, useAnchorWallet, AnchorWallet, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, Connection, clusterApiUrl } from '@solana/web3.js';
// @ts-ignore: Could not find type definitions for anchor
import { AnchorProvider, Program, Idl } from '@coral-xyz/anchor';
import { 
  sendLpv2SignalTransaction, 
  Lpv2SignalMemo, 
  resetElusivInstance
} from '../utils/lpv2Service';
import {
  hashMasterPassword,
  verifyMasterPassword
} from "../utils/encryption";
import { PROGRAM_ID } from '../utils/constants';

// Import the program's IDL
import idl from '../../keyra_program/target/idl/solpasszk.json';
// Let's directly type the IDL
// const programID = new PublicKey((idl as any).metadata.address); // Cast idl to any
// There is no metadata.address in the IDL file, so we define programID directly
// We import PROGRAM_ID from constants.ts and don't define it again here

// Define the UserMetadata account structure based on the IDL
export interface UserMetadata { // Export the interface
  authority: PublicKey;
  lpv2ShieldedPubkey: PublicKey;
  relayer: PublicKey;
  dataPointers: string[]; // Assuming CIDs are strings
}

interface AuthContextType {
  wallet: Wallet | null; // This is from useWallet().wallet, maybe rename for clarity if confusing
  anchorWallet: AnchorWallet | undefined; // From useAnchorWallet()
  isConnected: boolean;
  masterPasswordHash: string | null; // Changed from masterPassword to masterPasswordHash
  isWalletVerified: boolean; // New flag to track if wallet has been verified via signature
  userAccount: UserMetadata | null; // Use the defined UserMetadata type
  setWallet: (wallet: Wallet | null) => void;
  verifyWalletOwnership: () => Promise<boolean>; // New function to verify wallet ownership
  login: (masterPassword: string) => Promise<void>;
  logout: () => void;
  fetchUserAccount: (userPublicKey: PublicKey) => Promise<void>;
  // Add properties needed by SettingsForm
  changeMasterPassword: (currentPassword: string, newPassword: string) => Promise<boolean>; // Placeholder function
  walletAddress: string | null; // Wallet public key as string
  disconnectWallet: () => void; // Function to disconnect wallet
  isLoading: boolean; // Add loading state
  error: string | null; // Add error state
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth message constants
const AUTH_SIGNATURE_KEY = 'keyra_wallet_signature';
const AUTH_MESSAGE = 'Sign this message to verify your wallet ownership for Keyra Password Manager.';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { wallet: connectedWallet, signMessage, publicKey: walletPublicKey } = useWallet(); // Use useWallet() for adapter and signMessage
  const anchorWalletFromHook = useAnchorWallet();
  const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

  // const [wallet, setWalletState] = useState<Wallet | null>(null); // replaced by useWallet().wallet
  const [masterPasswordHash, setMasterPasswordHash] = useState<string | null>(null); // Store hash
  const [isWalletVerified, setIsWalletVerified] = useState(false); // Track if wallet has been verified
  const [userAccount, setUserAccount] = useState<UserMetadata | null>(null); // Use the defined UserMetadata type
  const [isLoading, setIsLoading] = useState(false); // Initialize loading state
  const [error, setError] = useState<string | null>(null); // Initialize error state

  const anchorWallet = anchorWalletFromHook;
  // isConnected can be derived from walletPublicKey or anchorWallet.publicKey
  const isConnected = !!walletPublicKey || !!anchorWallet?.publicKey;
  const walletAddress = walletPublicKey?.toBase58() || anchorWallet?.publicKey?.toBase58() || null;

  const provider = anchorWallet
    ? new AnchorProvider(
        connection,
        anchorWallet,
        { commitment: 'confirmed' }
      )
    : null;

  // Program state variable - initialize as null first
  const [program, setProgram] = useState<Program<Idl> | null>(null);

  // Check for existing signature when wallet changes
  useEffect(() => {
    if (walletPublicKey) {
      // Check if we have a stored signature for this wallet
      const storedSignature = localStorage.getItem(`${AUTH_SIGNATURE_KEY}_${walletPublicKey.toBase58()}`);
      
      if (storedSignature) {
        // If signature exists, mark wallet as verified
        setIsWalletVerified(true);
      } else {
        // Reset wallet verification if wallet changes and no signature exists
        setIsWalletVerified(false);
      }
    } else {
      // Reset wallet verification when wallet disconnects
      setIsWalletVerified(false);
    }
  }, [walletPublicKey]);

  // Create program when provider changes
  useEffect(() => {
    let mounted = true;
    const setupProgram = async () => {
      if (!provider || !anchorWallet) {
        console.log("Provider or anchorWallet is null, cannot create program instance.");
        if (mounted) setProgram(null);
        return;
      }

      try {
        // Use a flag to ensure we only log once per session
        const programInitKey = 'program_init_logged';
        if (!window.sessionStorage.getItem(programInitKey)) {
          console.log("Starting program creation with provider from context scope...");
          window.sessionStorage.setItem(programInitKey, 'true');
        }
        
        // Use PROGRAM_ID (which is a PublicKey) directly
        // Prevent duplicate logging by using a more reliable approach
        try {
          // Create a unique key for this session's program initialization
          const programLogKey = `program_log_${PROGRAM_ID.toBase58()}`;
          
          // Check if we've already logged this information
          if (!window.sessionStorage.getItem(programLogKey)) {
            // Log program information only once per session
            console.log("Program ID from constants:", PROGRAM_ID.toBase58());
            console.log("Provider wallet publicKey:", provider.wallet.publicKey.toBase58());
            
            // Mark as logged for this session
            window.sessionStorage.setItem(programLogKey, Date.now().toString());
          }
        } catch (err) {
          // Silent catch - logging should never break functionality
          // If sessionStorage fails, we'll just log again next time
        }

        // Ensure argument order: idl, programId (PROGRAM_ID), provider
        const programInstance = new Program(idl as any, PROGRAM_ID, provider);

        if (mounted) {
          setProgram(programInstance);
          setError(null);
          console.log("Program created successfully.");
        }
      } catch (error) {
        console.error("Error setting up program instance:", error);
        if (mounted) {
          setError("Failed to initialize Solana program. Check Program ID, IDL, and network.");
          setProgram(null);
        }
      }
    };

    setupProgram();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, [provider, anchorWallet]);

  useEffect(() => {
    const loadMasterPasswordHash = async () => {
      const storedHash = localStorage.getItem("masterPasswordHash");
      if (storedHash) {
        setMasterPasswordHash(storedHash);
        // If user is logged in (has a hash), and wallet is connected, try to fetch account
        // This might also be a good place to initialize Elusiv instance if needed globally
        // For now, Elusiv is initialized on-demand by lpv2Service
      }
    };
    loadMasterPasswordHash();
  }, []); // Load on component mount

  useEffect(() => {
    if (!walletPublicKey) {
      setMasterPasswordHash(null); // Clear hash on disconnect
      setIsWalletVerified(false); // Reset verification status
      setUserAccount(null);
      setError(null); 
    } else if (isWalletVerified) {
      // Only fetch user account if wallet is verified
      fetchUserAccount(walletPublicKey);
    }
  }, [walletPublicKey, isWalletVerified]); 

  // Function to verify wallet ownership via signature
  const verifyWalletOwnership = async () => {
    setIsLoading(true);
    setError(null);

    if (!walletPublicKey || !signMessage) {
      setError("Wallet not connected or signing not available");
      setIsLoading(false);
      return false;
    }

    try {
      // Create message to sign
      const message = new TextEncoder().encode(AUTH_MESSAGE);
      
      // Request signature from wallet
      const signature = await signMessage(message);
      
      // Store signature in localStorage to remember verification
      localStorage.setItem(
        `${AUTH_SIGNATURE_KEY}_${walletPublicKey.toBase58()}`, 
        Buffer.from(signature).toString('base64')
      );
      
      // Update verification status
      setIsWalletVerified(true);
      console.log("Wallet ownership verified successfully");
      
      // Try to fetch the user account since wallet is now verified
      await fetchUserAccount(walletPublicKey);
      
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error verifying wallet ownership:", error);
      setError(error.message || "Failed to verify wallet ownership");
      setIsLoading(false);
      return false;
    }
  };

  const setWallet = (/* wallet: Wallet | null */) => {
    // This function might be less relevant if using useWallet() directly for connection status
    console.warn("setWallet in AuthContext might be redundant when using useWallet hook directly for connection management.");
  };

  const login = async (passwordToTry: string) => {
    setIsLoading(true); 
    setError(null); 
    if (!walletPublicKey) { // Check if wallet is connected
        setError("Please connect your wallet first.");
        setIsLoading(false);
        return;
    }

    if (!isWalletVerified) {
      setError("Please verify your wallet ownership first by signing a message.");
      setIsLoading(false);
      return;
    }

    try {
      const storedHash = localStorage.getItem("masterPasswordHash");
      if (storedHash) {
        const isValid = await verifyMasterPassword(passwordToTry, storedHash);
        if (isValid) {
          setMasterPasswordHash(storedHash);
          await fetchUserAccount(walletPublicKey); // Fetch account after successful password verification
          console.log("Login successful.");
        } else {
          setError("Invalid master password.");
          setMasterPasswordHash(null);
        }
      } else {
        // Case: No master password hash stored - this implies first-time setup for this browser session
        // Or, user is setting up a new master password.
        console.log("No master password hash found. Setting up new master password.");
        const newHash = await hashMasterPassword(passwordToTry);
        localStorage.setItem("masterPasswordHash", newHash);
        setMasterPasswordHash(newHash);
        // Optionally, trigger user account initialization or fetch if applicable on first setup
        // For now, just setting it. User might need to explicitly init their on-chain account.
        await fetchUserAccount(walletPublicKey); // Try fetching, it might exist or not
      }
    } catch (err: any) {
        console.error("Login error:", err);
        setError(err.message || "Failed to log in.");
        setMasterPasswordHash(null); 
    } finally {
        setIsLoading(false); 
    }
  };

  const logout = () => {
    setMasterPasswordHash(null);
    localStorage.removeItem("masterPasswordHash"); // Also remove from localStorage
    setUserAccount(null);
    setError(null); 
    // We don't reset wallet verification on logout, only on disconnect
    // Wallet disconnect is usually handled by the wallet adapter's UI/disconnect button
  };

  const fetchUserAccount = async (userPk: PublicKey) => {
    setIsLoading(true); 
    setError(null); 
    try {
        if (!program) {
            setError("Program not initialized. Connect wallet and ensure network is reachable.");
            console.error("fetchUserAccount failed: Program not initialized.");
            setIsLoading(false);
            return;
        }
        
        const [userMetadataPDA] = PublicKey.findProgramAddressSync(
            [Buffer.from('user_metadata'), userPk.toBuffer()],
            PROGRAM_ID
        );
        
        try {
            const account = await (program.account as any).userMetadata.fetch(userMetadataPDA);
            setUserAccount(account as UserMetadata); 
            console.log("Fetched user account:", account);
        } catch (error: any) {
            if (error.message.includes("Account does not exist")) {
                console.log("User account not found. It may need to be initialized.");
                setUserAccount(null);
            } else {
                throw error;
            }
        }
    } catch (error: any) {
        console.error("Error fetching user account:", error);
        setError(error.message || "Failed to fetch user account.");
        setUserAccount(null); 
    } finally {
        setIsLoading(false); 
    }
  };

  // Fully implement changeMasterPassword logic
  const changeMasterPassword = async (currentPassword: string, newPassword: string) => {
    setIsLoading(true);
    setError(null);

    if (!masterPasswordHash || !walletPublicKey || !signMessage || !anchorWallet || !program) {
      setError("Required information missing: Stored master password, wallet connection, program instance, or signing capabilities.");
      setIsLoading(false);
      return false;
    }

    const isCurrentPasswordValid = await verifyMasterPassword(
      currentPassword,
      masterPasswordHash,
    );

    if (!isCurrentPasswordValid) {
      setError("Current master password is incorrect.");
      setIsLoading(false);
      return false;
    }

    try {
      // 1. First, reset the Elusiv instance to clear any cached instances
      resetElusivInstance();
      
      // 2. For rekey, we need a new shielded public key (in our case, we're using the wallet public key)
      const newShieldedPublicKey = walletPublicKey;

      // 3. Construct the rekey memo with proper fields
      const memo: Lpv2SignalMemo = {
        action: 'rekey',
        userMainPubkey: walletPublicKey.toBase58(), // Required field per the interface
        newLpv2ShieldedPubkey: newShieldedPublicKey.toBase58(),
      };
      
      // 5. Send the rekey signal transaction to the relayer
      await sendLpv2SignalTransaction(
        anchorWallet,
        { // MessageSigner object
          publicKey: walletPublicKey,
          signMessage: signMessage
        },
        memo
      );
      
      // 6. Update master password hash locally
      const newHashedPassword = await hashMasterPassword(newPassword);
      localStorage.setItem("masterPasswordHash", newHashedPassword);
      setMasterPasswordHash(newHashedPassword);
      
      console.log("Master password changed successfully, rekey signal sent, and local hash updated.");
      setIsLoading(false);
      return true;
    } catch (error: any) {
      console.error("Error during master password change:", error);
      setError(`Failed to change master password: ${error.message}`);
      setIsLoading(false);
      return false;
    }
  };

  // Function to disconnect wallet
  const disconnectWallet = () => {
      if (connectedWallet?.adapter?.connected) {
          connectedWallet.adapter.disconnect();
      }
      // Clear wallet verification on disconnect
      setIsWalletVerified(false);
      if (walletPublicKey) {
        localStorage.removeItem(`${AUTH_SIGNATURE_KEY}_${walletPublicKey.toBase58()}`);
      }
  };

  return (
    <AuthContext.Provider value={{
      wallet: connectedWallet, // Use wallet from useWallet()
      anchorWallet,
      isConnected,
      masterPasswordHash,
      isWalletVerified,
      userAccount,
      setWallet,
      verifyWalletOwnership,
      login,
      logout,
      fetchUserAccount,
      changeMasterPassword,
      walletAddress,
      disconnectWallet,
      isLoading,
      error,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  // For components that were using `masterPassword` and expect the hash now, this is fine.
  // If some component strictly needs the raw password (which it shouldn't), that's a different issue.
  return { ...context, masterPassword: context.masterPasswordHash }; 
};
