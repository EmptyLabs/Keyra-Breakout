import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import MasterPasswordForm from '../components/auth/MasterPasswordForm';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Loader2, AlertCircle, Wallet, Key, Shield, CheckCircle2 } from 'lucide-react';

// Import Wallet Adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

const AuthPage: React.FC = () => {
  // Get isConnected, masterPassword, isLoading, error, and isWalletVerified from AuthContext
  const { 
    isConnected, 
    masterPassword, 
    isLoading, 
    error, 
    isWalletVerified,
    verifyWalletOwnership
  } = useAuth();

  // If wallet is connected, verified, and master password is set, redirect to dashboard
  if (isConnected && masterPassword && isWalletVerified) {
    return <Navigate to="/" replace />;
  }

  // Handle verify button click
  const handleVerify = async () => {
    await verifyWalletOwnership();
  };

  // Helper function to determine the message to display
  const getStatusMessage = () => {
    if (!isConnected) {
      return "Connect your wallet to continue";
    } else if (!isWalletVerified) {
      return "Verify your wallet ownership by signing a message";
    } else {
      return "Wallet verified, enter your master password";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black">
      <div className="p-8 bg-[#111111] border border-[#333333] rounded-lg shadow-lg max-w-md w-full mx-4 animate-fade-in">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-[#a6ccb8]/10 rounded-full flex items-center justify-center mb-6">
            <Wallet className="w-10 h-10 text-[#a6ccb8]" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 text-white text-center">
            KEYRA Encrypted Password Manager
          </h2>
          
          <p className="text-[#a0a0a0] text-center mb-6">
            {getStatusMessage()}
          </p>
        </div>

        {/* Display loading state */}
        {isLoading && (
          <div className="flex items-center justify-center text-[#a0a0a0] mb-4">
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Loading...
          </div>
        )}

        {/* Display error state */}
        {error && (
          <div className="p-3 mb-4 bg-red-500/10 text-red-500 rounded-md flex items-center animate-fade-in">
            <AlertCircle size={18} className="mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Steps */}
        <div className="space-y-4">
          {/* Step 1: Wallet Connection */}
          <div className={`flex items-center justify-between p-3 rounded-md ${isConnected ? 'bg-green-500/10' : 'bg-[#1a1a1a]'}`}>
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-[#333] mr-3 text-sm">
                1
              </span>
              <span>Connect Wallet</span>
            </div>
            {isConnected ? (
              <CheckCircle2 className="text-green-500" size={20} />
            ) : (
              <div className="custom-wallet-button">
                <WalletMultiButton />
              </div>
            )}
          </div>

          {/* Step 2: Verify Wallet Ownership */}
          <div className={`flex items-center justify-between p-3 rounded-md ${isWalletVerified ? 'bg-green-500/10' : 'bg-[#1a1a1a]'} ${!isConnected ? 'opacity-50' : ''}`}>
            <div className="flex items-center">
              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-[#333] mr-3 text-sm">
                2
              </span>
              <span>Verify Ownership</span>
            </div>
            {isWalletVerified ? (
              <CheckCircle2 className="text-green-500" size={20} />
            ) : isConnected && !isLoading ? (
              <button 
                onClick={handleVerify}
                disabled={!isConnected}
                className="px-4 py-2 bg-[#a6ccb8] hover:bg-[#95bbaa] text-black rounded-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign Message
              </button>
            ) : null}
          </div>
          
          {/* Step 3: Master Password */}
          <div className={`p-3 rounded-md ${!isConnected || !isWalletVerified ? 'opacity-50' : 'bg-[#1a1a1a]'}`}>
            <div className="flex items-center mb-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full border border-[#333] mr-3 text-sm">
                3
              </span>
              <span>Enter Master Password</span>
            </div>
            
            {isConnected && isWalletVerified && !isLoading && !masterPassword && (
              <MasterPasswordForm />
            )}
          </div>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <div className="bg-[#1a1a1a] p-3 rounded-xl flex flex-col items-center">
            <div className="w-10 h-10 bg-[#a6ccb8]/10 rounded-full flex items-center justify-center mb-2">
              <Key className="w-5 h-5 text-[#a6ccb8]" />
            </div>
            <h3 className="text-sm font-medium mb-1">Secure Storage</h3>
            <p className="text-xs text-[#a0a0a0] text-center">
              Encrypted storage on IPFS
            </p>
          </div>
          
          <div className="bg-[#1a1a1a] p-3 rounded-xl flex flex-col items-center">
            <div className="w-10 h-10 bg-[#a6ccb8]/10 rounded-full flex items-center justify-center mb-2">
              <Shield className="w-5 h-5 text-[#a6ccb8]" />
            </div>
            <h3 className="text-sm font-medium mb-1">Blockchain Security</h3>
            <p className="text-xs text-[#a0a0a0] text-center">
              Maximum privacy with Solana technology
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
