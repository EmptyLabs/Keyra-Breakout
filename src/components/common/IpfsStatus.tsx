import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { checkIpfsConnection } from '../../utils/ipfs';

interface IpfsStatusProps {
  className?: string;
}

const IpfsStatus: React.FC<IpfsStatusProps> = ({ className = '' }) => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    setStatus('checking');
    try {
      const isConnected = await checkIpfsConnection();
      setStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error checking IPFS connection:', error);
      setStatus('disconnected');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-medium text-sm">IPFS:</span>
      
      {status === 'checking' ? (
        <div className="flex items-center gap-1">
          <RefreshCw size={16} className="animate-spin text-blue-500" />
          <span className="text-sm text-blue-500">Checking...</span>
        </div>
      ) : status === 'connected' ? (
        <div className="flex items-center gap-1">
          <CheckCircle size={16} className="text-green-500" />
          <span className="text-sm text-green-500">Connected</span>
        </div>
      ) : (
        <div className="flex items-center gap-1">
          <XCircle size={16} className="text-red-500" />
          <span className="text-sm text-red-500">Disconnected</span>
          <button 
            onClick={checkConnection}
            disabled={isChecking}
            className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-0.5 rounded ml-1"
          >
            {isChecking ? 'Checking...' : 'Retry'}
          </button>
        </div>
      )}
      
      <div className="ml-1 text-xs">
        {status === 'disconnected' && (
          <a 
            href="https://docs.ipfs.tech/install/command-line/" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            Install IPFS
          </a>
        )}
      </div>
    </div>
  );
};

export default IpfsStatus; 