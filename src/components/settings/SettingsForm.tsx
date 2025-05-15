import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Key, AlertCircle, Wallet, Lock, LogOut, CheckCircle2 } from 'lucide-react';

const SettingsForm: React.FC = () => {
  const { changeMasterPassword, walletAddress, disconnectWallet } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState(''); // Used in validation and placeholder logic
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // TODO: Implement the complex logic for changing the master password
  // This involves:
  // 1. Validating the current master password.
  // 2. Deriving a NEW LPv2 shielded keypair from the NEW master password.
  // 3. Re-encrypting ALL existing IPFS password data using a key derived from the NEW master password.
  // 4. Uploading the re-encrypted data to IPFS to get new CIDs.
  // 5. Updating the list of CIDs and the LPv2 public key in the user's on-chain PDA via LPv2 signal transactions processed by the relayer.
  // This is a complex operation that requires careful orchestration and LPv2 SDK integration.
  const handleChangeMasterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Placeholder for actual logic
    console.warn("Placeholder: Master password change logic needs full implementation.");
    setError('Master password change is not yet fully implemented.'); // Indicate placeholder status
    // In a real implementation, you would perform the steps outlined in the TODO comment above.
    // The result of these steps would determine success or failure.

    // Example of how you might call a function in AuthContext (needs implementation there)
    // try {
    //   const success = await changeMasterPassword(currentPassword, newPassword);
    //   if (success) {
    //     setSuccess(true);
    //     setCurrentPassword('');
    //     setNewPassword('');
    //     setConfirmPassword('');
    //     setTimeout(() => setSuccess(false), 3000);
    //   } else {
    //     setError('Failed to change master password. Please check your current password.');
    //   }
    // } catch (err) {
    //   setError('An unexpected error occurred. Please try again.');
    // }
  };

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect? This will log you out and clear all local data.')) {
      disconnectWallet();
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-[#a6ccb8]/10 rounded-full flex items-center justify-center mr-4">
            <Wallet className="w-5 h-5 text-[#a6ccb8]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Wallet Connection</h2>
            <p className="text-[#a0a0a0] text-sm">Manage your connected wallet</p>
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#333333] rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#a0a0a0] text-sm mb-1">Connected Address</div>
              <div className="font-medium text-lg">{walletAddress ? formatAddress(walletAddress) : 'Not connected'}</div>
            </div>
            <button
              onClick={handleDisconnect}
              className="btn-danger"
            >
              <LogOut size={18} className="mr-2" />
              Disconnect
            </button>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="flex items-center mb-6">
          <div className="w-10 h-10 bg-[#a6ccb8]/10 rounded-full flex items-center justify-center mr-4">
            <Lock className="w-5 h-5 text-[#a6ccb8]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Security Settings</h2>
            <p className="text-[#a0a0a0] text-sm">Update your master password</p>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-[#10b981]/10 text-[#10b981] rounded-lg flex items-center animate-fade-in">
            <CheckCircle2 size={18} className="mr-2" />
            Master password changed successfully!
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-lg flex items-center animate-fade-in">
            <AlertCircle size={18} className="mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleChangeMasterPassword} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-2 text-[#a0a0a0]">
              Current Master Password
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter your current master password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-2 text-[#a0a0a0]">
              New Master Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter your new master password"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#666666] hover:text-white transition-colors"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-[#a0a0a0]">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-field pr-10"
                placeholder="Confirm your new master password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full mt-6"
          >
            <Key size={18} className="mr-2" />
            Update Master Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsForm;
