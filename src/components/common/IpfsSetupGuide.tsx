import React from 'react';
import { Terminal, Info, ExternalLink, Server } from 'lucide-react';

interface IpfsSetupGuideProps {
  className?: string;
}

const IpfsSetupGuide: React.FC<IpfsSetupGuideProps> = ({ className = '' }) => {
  return (
    <div className={`bg-[#111111] rounded-lg shadow-md p-6 border border-[#333333] hover:border-[#a6ccb8]/20 transition-all duration-300 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <Server size={18} className="text-[#a6ccb8]" />
        <h2 className="text-xl font-bold text-white">IPFS Setup Guide</h2>
      </div>
      
      <div className="text-[#a0a0a0] mb-4">
        <p>
          Keyra uses IPFS (InterPlanetary File System) to store your encrypted passwords in a decentralized manner.
          You need to have an IPFS daemon running locally on your machine for the application to work properly.
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Step 1: Install IPFS</h3>
        <p className="mb-3 text-[#a0a0a0]">If you haven't installed IPFS yet, follow the official installation guide:</p>
        <a 
          href="https://docs.ipfs.tech/install/command-line/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#a6ccb8] hover:text-[#8eb3a0] transition-colors border-b border-dotted border-[#a6ccb8]/50 inline-block"
        >
          IPFS Installation Guide <ExternalLink size={14} />
        </a>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Step 2: Initialize IPFS</h3>
        <p className="mb-3 text-[#a0a0a0]">After installation, you need to initialize IPFS once:</p>
        <div className="bg-black text-[#a0a0a0] p-3 rounded-md font-mono text-sm flex items-start mb-2 border border-[#333333]">
          <Terminal size={16} className="mr-2 mt-0.5 text-[#a6ccb8] flex-shrink-0" />
          <code>ipfs init</code>
        </div>
        <p className="text-sm text-[#666666]">This creates your IPFS node configuration files.</p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Step 3: Start the IPFS daemon</h3>
        <p className="mb-3 text-[#a0a0a0]">Run the following command to start the IPFS daemon:</p>
        <div className="bg-black text-[#a0a0a0] p-3 rounded-md font-mono text-sm flex items-start mb-2 border border-[#333333]">
          <Terminal size={16} className="mr-2 mt-0.5 text-[#a6ccb8] flex-shrink-0" />
          <code>ipfs daemon</code>
        </div>
        <p className="text-sm text-[#666666]">Keep this terminal window open while using Keyra.</p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 text-white">Step 4: Verify Connection</h3>
        <p className="mb-3 text-[#a0a0a0]">
          After starting the daemon, refresh this page. The IPFS status indicator
          in the sidebar should show "Connected".
        </p>
      </div>
      
      <div className="bg-[#1a2420] border-l-4 border-[#a6ccb8] p-4 rounded">
        <h4 className="font-semibold text-[#a6ccb8]">Important Notes:</h4>
        <ul className="list-disc ml-5 mt-2 text-[#a0a0a0] text-sm space-y-2">
          <li>The IPFS daemon must be running whenever you use Keyra</li>
          <li>Your passwords are stored encrypted on IPFS - only you can decrypt them with your master password</li>
          <li>For best performance, make sure IPFS is properly connected to the network</li>
          <li>When you're done using Keyra, you can stop the IPFS daemon by pressing Ctrl+C in the terminal</li>
        </ul>
      </div>
    </div>
  );
};

export default IpfsSetupGuide; 