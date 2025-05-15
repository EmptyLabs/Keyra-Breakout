import React, { useState } from 'react';
import { PasswordEntry } from '../../context/PasswordContext';
import { Copy, Eye, EyeOff, Globe, Trash, Edit, AlertTriangle, Check, Lock, User, ExternalLink, Shield } from 'lucide-react';

interface PasswordCardProps {
  password: PasswordEntry;
  onDelete: (id: string) => Promise<boolean | { success: boolean; signature?: string }>;
  onStartEdit: (password: PasswordEntry) => void;
}

const PasswordCard: React.FC<PasswordCardProps> = ({
  password,
  onDelete,
  onStartEdit,
}) => {
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<'username' | 'password' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleCopyText = async (text: string, type: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error(`Failed to copy ${type}`, error);
    }
  };

  const handleToggleReveal = () => {
    setRevealed(prev => !prev);
  };

  const handleDeleteClick = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    
    setLoading(true);
    try {
      await onDelete(password.id);
    } catch (error) {
      console.error("Failed to delete password:", error);
      setLoading(false);
      setConfirmDelete(false);
    }
  };

  const getPasswordStrength = (password: string): { level: string; color: string } => {
    if (password.length < 8) return { level: 'Weak', color: 'bg-red-500' };
    if (password.length < 12) return { level: 'Medium', color: 'bg-yellow-500' };
    if (password.length < 16) return { level: 'Good', color: 'bg-green-500' };
    return { level: 'Strong', color: 'bg-emerald-500' };
  };

  const passwordStrength = getPasswordStrength(password.password);

  return (
    <div className="card group hover:shadow-lg transition-all duration-300 hover:border-[#a6ccb8]/50 relative overflow-hidden transform hover:-translate-y-1">
      {/* Strength indicator */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${passwordStrength.color} transition-all duration-300`}></div>
      
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold mb-1 truncate group-hover:text-[#a6ccb8] transition-colors" title={password.title}>
            {password.title}
          </h3>
          <div className="text-sm text-[#546e7a] flex items-center">
            <Globe className="w-4 h-4 mr-1.5 flex-shrink-0 opacity-50" />
            <a
              href={password.url.startsWith('http') ? password.url : `https://${password.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#a6ccb8] transition-colors truncate max-w-[200px] inline-flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <span className="truncate">{password.url}</span>
              <ExternalLink size={12} className="ml-1.5 opacity-75" />
            </a>
          </div>
        </div>
        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onStartEdit(password)}
            className="p-2 rounded-full hover:bg-[#1a2420] text-gray-400 hover:text-[#a6ccb8] transition-all"
            title="Edit"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={handleDeleteClick}
            className={`p-2 rounded-full ${confirmDelete ? 'bg-red-500/20 text-red-500 animate-pulse' : 'hover:bg-[#2b1a1a] text-gray-400 hover:text-[#e74c3c]'} transition-all`}
            disabled={loading}
            title={confirmDelete ? 'Confirm Delete' : 'Delete'}
          >
            {confirmDelete ? <AlertTriangle size={16} /> : <Trash size={16} />}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Username */}
        <div className="p-3 bg-[#111]/80 rounded-lg hover:bg-[#131313] transition-colors">
          <div className="text-sm font-medium text-[#546e7a] flex items-center mb-2">
            <User size={14} className="mr-1.5 opacity-70" />
            <span>Username</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="font-medium truncate mr-2">{password.username}</div>
            <button
              onClick={() => handleCopyText(password.username, 'username')}
              className={`p-2 rounded-full ${copied === 'username' ? 'bg-green-500/20 text-green-500' : 'hover:bg-[#1a1a1a] text-gray-400 hover:text-gray-300'} transition-all`}
              title="Copy username"
            >
              {copied === 'username' ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="p-3 bg-[#111]/80 rounded-lg hover:bg-[#131313] transition-colors">
          <div className="text-sm font-medium text-[#546e7a] flex items-center mb-2">
            <Lock size={14} className="mr-1.5 opacity-70" />
            <span>Password</span>
            <div className={`ml-auto flex items-center text-xs px-2 py-0.5 rounded-full ${passwordStrength.color}/20 text-${passwordStrength.color.replace('bg-', '')}`}>
              <Shield size={12} className="mr-1 opacity-70" />
              {passwordStrength.level}
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="font-medium font-mono truncate mr-2">
              {revealed ? password.password : '••••••••••'}
            </div>
            <div className="flex space-x-1">
              <button
                onClick={handleToggleReveal}
                className="p-2 rounded-full hover:bg-[#1a1a1a] text-gray-400 hover:text-gray-300 transition-all"
                title={revealed ? "Hide password" : "Show password"}
              >
                {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => handleCopyText(password.password, 'password')}
                className={`p-2 rounded-full ${copied === 'password' ? 'bg-green-500/20 text-green-500' : 'hover:bg-[#1a1a1a] text-gray-400 hover:text-gray-300'} transition-all`}
                title="Copy password"
              >
                {copied === 'password' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Card footer */}
      <div className="mt-6 pt-4 border-t border-[#222] flex justify-between items-center text-xs">
        <div className="text-gray-500 truncate max-w-[150px] hover:text-blue-500 transition-colors group" title={`IPFS CID: ${password.id}`}>
          <span className="font-medium">IPFS:</span> 
          <a 
            href={`https://ipfs.io/ipfs/${password.id}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:underline ml-1 inline-flex items-center group-hover:text-blue-400"
            onClick={(e) => e.stopPropagation()}
          >
            {password.id.substring(0, 8)}...
            <ExternalLink size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
        <div className="px-2.5 py-1 bg-[#a6ccb8]/10 rounded-full text-[#a6ccb8]">
          {password.category}
        </div>
      </div>
    </div>
  );
};

export default PasswordCard;
