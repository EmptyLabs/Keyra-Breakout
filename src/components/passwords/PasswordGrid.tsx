import React from 'react';
import { usePassword, PasswordEntry } from '../../context/PasswordContext'; // Import usePassword
import PasswordCard from './PasswordCard';
import { Key, Loader2, Search, Plus, ShieldX } from 'lucide-react'; // Import additional icons

// Define props interface for PasswordGrid
interface PasswordGridProps {
  onDelete: (id: string) => Promise<boolean | { success: boolean; signature?: string }>; // Updated type to match return type from context
  onStartEdit: (password: PasswordEntry) => void; // Prop to handle starting the edit flow
  searchQuery: string; // Keep searchQuery prop for filtering
}

// Component now receives props
const PasswordGrid: React.FC<PasswordGridProps> = ({ onStartEdit, searchQuery }) => {
  // Get passwords and loading state from PasswordContext
  const { passwords, isLoadingPasswords, deletePassword } = usePassword(); // Removed updatePassword as it's not passed directly

  // Filter passwords based on search query
  const filteredPasswords = passwords.filter(password =>
      password.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      password.category.toLowerCase().includes(searchQuery.toLowerCase())
  );


  if (isLoadingPasswords) {
      return (
          <div className="text-center py-16 bg-[#111111] rounded-lg border border-[#333333] animate-fade-in shadow-lg">
              <div className="relative mx-auto w-20 h-20 mb-6">
                <Loader2 className="w-20 h-20 text-[#a6ccb8] animate-spin absolute" />
                <Key className="w-10 h-10 text-[#a6ccb8]/30 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-xl font-medium text-[#a0a0a0] mb-2">Loading Passwords...</h3>
              <p className="text-[#666666] max-w-md mx-auto">
                Your passwords are being retrieved from IPFS and securely decrypted
              </p>
          </div>
      );
  }

  if (filteredPasswords.length === 0) {
    return (
      <div className="text-center py-16 bg-[#111111] rounded-lg border border-[#333333] animate-fade-in shadow-lg">
        {searchQuery ? (
          <>
            <div className="relative w-20 h-20 mx-auto mb-6">
              <Search className="w-20 h-20 text-[#333333]" />
              <ShieldX className="w-10 h-10 text-[#333333] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h3 className="text-xl font-medium text-[#a0a0a0] mb-3">No results found for your search</h3>
            <p className="text-[#666666] mb-6 max-w-md mx-auto">
              No passwords found for "{searchQuery}". Please try different keywords.
            </p>
            <button className="inline-flex items-center text-[#a6ccb8] hover:text-[#8cb8a1] transition-colors cursor-pointer border-b border-dotted border-[#a6ccb8]">
              Search all passwords
            </button>
          </>
        ) : (
          <>
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <Key className="w-20 h-20 text-[#333333]" />
              <div className="absolute top-0 right-0 w-8 h-8 bg-[#111111] rounded-full border-4 border-[#111111] flex items-center justify-center">
                <Plus className="w-6 h-6 text-[#a6ccb8]" />
              </div>
            </div>
            <h3 className="text-xl font-medium text-[#a0a0a0] mb-3">You haven't saved any passwords yet</h3>
            <p className="text-[#666666] mb-6 max-w-md mx-auto">
              Use the "Add Password" button at the top of the page to add your first password and securely manage your credentials.
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
      {filteredPasswords.map(password => (
        <PasswordCard
          key={password.id}
          password={password}
          // Pass action functions from context (or parent)
          onDelete={deletePassword}
          onStartEdit={onStartEdit} // Pass the onStartEdit prop
        />
      ))}
    </div>
  );
};

export default PasswordGrid;
