import React from 'react';
import SettingsForm from '../components/settings/SettingsForm';
import IpfsSetupGuide from '../components/common/IpfsSetupGuide';
import { Settings as SettingsIcon, Database } from 'lucide-react';

const SettingsPage: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2 flex items-center">
          <SettingsIcon className="w-6 h-6 mr-2 text-[#a6ccb8]" />
          Settings
        </h1>
        <p className="text-[#546e7a]">
          Manage your security preferences and account settings
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
        <SettingsForm />
        </div>
        
        <div>
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2 flex items-center">
              <Database className="w-5 h-5 mr-2 text-[#a6ccb8]" />
              IPFS Configuration
            </h2>
            <p className="text-[#546e7a]">
              Set up and manage your local IPFS node for secure password storage
            </p>
          </div>
          
          <IpfsSetupGuide />
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;