import React, { useState, FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import { Loader2 } from 'lucide-react'; // Import Loader2 icon

const MasterPasswordForm: React.FC = () => {
  const [masterPassword, setMasterPassword] = useState('');
  // Get login, isLoading, and error from AuthContext
  const { login, isLoading, error } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    // Clear local error state, AuthContext error will be displayed
    // setError('');

    if (!masterPassword) {
      // Set local error if master password is empty before attempting login
      // setError('Master password is required.');
      return;
    }

    // login function in AuthContext now handles setting isLoading and error
    await login(masterPassword);
    // Optionally clear the password input after successful login (handled by AuthContext state clearing)
    // setMasterPassword('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="space-y-4">
        <div>
          <label htmlFor="masterPassword" className="block text-sm font-medium mb-1 text-[#a0a0a0]"> {/* Styled label */}
            Master Password
          </label>
          <input
            id="masterPassword"
            type="password"
            value={masterPassword}
            onChange={(e) => setMasterPassword(e.target.value)}
            className="input-field" // Use existing input-field class
            required
            disabled={isLoading} // Disable input while loading
          />
        </div>
      </div>

      {/* Error display is now handled by AuthPage using AuthContext error state */}
      {/* {error && (
        <div className="mt-4 text-[#e74c3c] text-sm animate-fade-in">
          {error}
        </div>
      )} */}

      <div className="mt-6">
        <button
          type="submit"
          className="btn-primary w-full" // Use existing btn-primary class
          disabled={isLoading} // Disable button while loading
        >
          {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
              'Unlock Vault'
          )}
        </button>
      </div>
    </form>
  );
};

export default MasterPasswordForm;
