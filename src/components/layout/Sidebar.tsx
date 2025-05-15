import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Key, RefreshCcw, FolderOpen, Settings, LogOut } from 'lucide-react';
import IpfsStatus from '../common/IpfsStatus';

const Sidebar: React.FC = () => {
  const { disconnectWallet } = useAuth();

  return (
    <aside className="bg-[#111111] border-r border-[#333333] w-64 min-h-screen flex flex-col">
      <div className="p-6 border-b border-[#333333]">
        <div className="flex items-center justify-center">
          <h1 className="text-2xl keyra-title">KEYRA</h1>
        </div>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <NavLink
              to="/passwords"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#a6ccb8]/10 text-[#a6ccb8] font-medium' 
                    : 'hover:bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#a6ccb8]'
                }`
              }
            >
              <Key className="w-5 h-5 mr-3" />
              <span>Passwords</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/generator"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#a6ccb8]/10 text-[#a6ccb8] font-medium' 
                    : 'hover:bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#a6ccb8]'
                }`
              }
            >
              <RefreshCcw className="w-5 h-5 mr-3" />
              <span>Generator</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/categories"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#a6ccb8]/10 text-[#a6ccb8] font-medium' 
                    : 'hover:bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#a6ccb8]'
                }`
              }
            >
              <FolderOpen className="w-5 h-5 mr-3" />
              <span>Categories</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/settings"
              className={({ isActive }) => 
                `flex items-center p-3 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-[#a6ccb8]/10 text-[#a6ccb8] font-medium' 
                    : 'hover:bg-[#1a1a1a] text-[#a0a0a0] hover:text-[#a6ccb8]'
                }`
              }
            >
              <Settings className="w-5 h-5 mr-3" />
              <span>Settings</span>
            </NavLink>
          </li>
        </ul>
      </nav>
      
      <div className="mt-auto p-4 border-t border-[#333333]">
        <div className="mb-4 p-3 bg-[#1a1a1a] rounded-lg">
          <IpfsStatus />
        </div>
        
        <button
          onClick={disconnectWallet}
          className="flex items-center p-3 w-full rounded-lg text-[#ef4444] hover:bg-[#ef444420] transition-all"
        >
          <LogOut className="w-5 h-5 mr-3" />
          <span>Disconnect</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;