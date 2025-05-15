import React, { FC } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';


import '@solana/wallet-adapter-react-ui/styles.css';

const WalletConnect: FC = () => {
  const { publicKey } = useWallet();

  return (
    <div>
      <WalletMultiButton />
      {publicKey ? (
        <p>Connected: {publicKey.toBase58()}</p>
      ) : (
        <p>Wallet not connected</p>
      )}
    </div>
  );
};

export default WalletConnect;
