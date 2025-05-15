import React from 'react';
import { ExternalLink } from 'lucide-react';

interface TransactionLinkProps {
  signature: string;
  label?: string;
  truncate?: boolean;
  className?: string;
  explorer?: 'solscan' | 'explorer';
  cluster?: 'devnet' | 'mainnet-beta' | 'testnet';
}

const TransactionLink: React.FC<TransactionLinkProps> = ({
  signature,
  label = 'View Transaction',
  truncate = true,
  className = '',
  explorer = 'solscan',
  cluster = 'devnet',
}) => {
  if (!signature) return null;

  let baseUrl = '';
  
  if (explorer === 'solscan') {
    baseUrl = cluster === 'devnet' 
      ? 'https://solscan.io/tx/' + signature + '?cluster=devnet' 
      : cluster === 'testnet'
        ? 'https://solscan.io/tx/' + signature + '?cluster=testnet'
        : 'https://solscan.io/tx/' + signature;
  } else {
    baseUrl = `https://explorer.solana.com/tx/${signature}` + (cluster !== 'mainnet-beta' ? `?cluster=${cluster}` : '');
  }
  
  const displayText = truncate 
    ? `${signature.substring(0, 8)}...${signature.substring(signature.length - 4)}` 
    : signature;

  return (
    <a
      href={baseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center text-blue-600 hover:text-blue-800 hover:underline ${className}`}
      title={`${explorer === 'solscan' ? 'Solscan' : 'Solana Explorer'} üzerinde işlemi görüntüle (${cluster})`}
    >
      {label ? label : displayText}
      <ExternalLink size={12} className="ml-1" />
    </a>
  );
};

export default TransactionLink; 