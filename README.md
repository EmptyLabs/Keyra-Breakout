# KEYRA: Privacy-Focused Password Manager
![keyra-lp](https://github.com/user-attachments/assets/cc1023f9-cf83-4e64-881b-f006f49c63b6)

## Overview

KEYRA is a secure, privacy-focused password manager that leverages blockchain technology, decentralized storage, and ZKPs. Built on Solana, it utilizes Light Protocol for privacy-preserving transactions and IPFS for encrypted storage, providing a comprehensive solution for securely managing passwords and sensitive information.


## Why We Prefer to Use Light Protocol?

Light Protocol serves as the privacy layer of our application, offering several critical advantages:

1. **Private Operations**: 
   - Light Protocol enables users to perform password CRUD (Create, Read, Update, Delete) operations privately.
   - Users operate with a "shielded pubkey" that has no connection to their main wallet, preserving anonymity.

2. **LPv2 Signal Mechanism**:
   - The `sendLpv2SignalTransaction()` function sends signals to the blockchain for password operations.
   - These signals are sent through a "relayer" service, allowing users to perform transactions without exposing their main wallet.
   - This approach creates a separation between the user's identity and their password management actions.

3. **Transaction Structure**:
   - To add, update, or delete passwords, encrypted messages are sent to the blockchain.
   - These messages contain the operation type and CIDs (Content Identifiers) of data stored on IPFS.
   - The encryption and indirection provide multiple layers of privacy protection.

### Data Flow with Light Protocol

1. **Adding Password Process**:
   1. User inputs password data in the application
   2. Data is encrypted with the master password using AES-GCM
   3. Encrypted data is uploaded to IPFS, generating a Content Identifier (CID)
   4. An LPv2 signal transaction is created through Light Protocol
   5. Transaction is signed and sent to the blockchain
   6. The Solana program adds the CID to the user's account metadata

2. **Retrieving Password Process**:
   1. When the application starts, user connects their wallet
   2. Master password is verified
   3. User account and CID list are retrieved from the Solana program
   4. Encrypted data for each CID is fetched from IPFS
   5. Data is decrypted with the master password and displayed to the user

### Technical Implementation

1. **Encryption**:
   - Uses AES-256-GCM encryption for password data
   - Master password is strengthened using PBKDF2 with 100,000 iterations
   - Web Crypto API provides browser-compatible encryption

2. **LPv2 Transactions**:
   - `buildSendTx()`: Creates transactions with memo data
   - `sendLightTx()`: Sends signed transactions to the blockchain
   - Transactions utilize Solana's Versioned Transaction structure

3. **Anchor Program Structure**:
   - `UserMetadata`: Data structure storing user information and IPFS CIDs
   - `ProcessLpv2Action`: Instruction managing password operations
   - Secure storage of user data using Program Derived Addresses (PDAs)

By leveraging Light Protocol's privacy features, KEYRA creates a secure ecosystem where even blockchain observers cannot determine which passwords a user is managing, who owns which passwords, or access any of the password content.


## Key Features

- **Blockchain Authentication**: Secure wallet-based authentication with signature verification
- **Zero-Knowledge Operations**: Light Protocol integration for private transactions
- **Decentralized Storage**: IPFS for storing encrypted password data
- **Master Password Security**: Strong encryption with AES-256-GCM and PBKDF2
- **Intuitive UI**: Modern, responsive interface with category organization
- **Password Generator**: Built-in tool for creating strong, unique passwords
- **Multi-Category Support**: Organize passwords into customizable categories

## Architecture

KEYRA employs a multi-layered architecture to ensure security and privacy:

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend                           │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │ Auth Context │   │ Password    │   │ User Interface  │    │
│  │             │   │ Context     │   │ Components      │    │
│  └─────────────┘   └─────────────┘   └─────────────────┘    │
└───────────┬─────────────────┬───────────────────┬───────────┘
            │                 │                   │
┌───────────▼─────────┐ ┌────▼───────────┐ ┌─────▼─────────────┐
│ Solana Integration  │ │ IPFS Client    │ │ Light Protocol    │
│ (Wallet & Program)  │ │ (Decentralized)│ │ (Privacy)         │
└───────────┬─────────┘ └────┬───────────┘ └─────┬─────────────┘
            │                │                   │
┌───────────▼────────────────▼───────────────────▼─────────────┐
│                       Relayer Service                         │
│  (Processes LPv2 Signal Transactions for On-Chain Updates)    │
└─────────────────────────────────────────────────────────────┘
```

### Components

1. **Solana Program (Smart Contract)**
   - User metadata storage
   - Password data pointer management
   - Light Protocol integration

2. **React Frontend**
   - Wallet integration with Phantom and Solflare
   - Master password authentication
   - Password management UI

3. **Light Protocol Integration**
   - Private transactions for data operations
   - Shielded public keys for enhanced privacy

4. **IPFS Storage**
   - Encrypted password storage
   - Decentralized content addressing

5. **Relayer Service**
   - Monitors and processes LPv2 signal transactions
   - Updates on-chain state based on signals

## Technical Details

### Light Protocol Integration

The Light Protocol integration enables privacy-preserving transactions for password management operations.

**Relayer Address**: `AcGNd7QUx7jsy9yhTzc6unMfu9gU1AYL1PXdXz7CM1Tx`

**Signal Transaction Format**:
```typescript
export interface Lpv2SignalMemo {
  action: 'add' | 'update' | 'delete' | 'rekey';
  cid?: string;
  old_cid?: string;
  new_cid?: string;
  userMainPubkey: string;
  newLpv2ShieldedPubkey?: string;
}
```


### Solana Program

The Solana program is built using Anchor framework (v0.29.0) and deployed to the Solana devnet.

**Program ID**: `2WeZQkQ4cd86G2ymjQLRbCPGUWcipZSdFjsbKv2ArBT3`

**Key Instructions**:
- `initialize_user`: Creates a PDA (Program Derived Address) for the user
- `process_lpv2_action`: Processes password actions (add, update, delete)
- `update_lpv2_shielded_key`: Updates the user's LPv2 shielded public key

**Account Structure**:
```rust
#[account]
pub struct UserMetadata {
    pub authority: Pubkey,
    pub lpv2_shielded_pubkey: Pubkey,
    pub relayer: Pubkey,
    pub data_pointers: Vec<String>, // IPFS CIDs
}
```



### Encryption Mechanism

KEYRA employs strong encryption using Web Crypto API:

- **AES-256-GCM** for password data encryption
- **PBKDF2** with 100,000 iterations for key derivation
- **SHA-512** for master password hashing

```typescript
// Password encryption flow
const dataToEncrypt = JSON.stringify({ title, username, password, url, category });
const encryptedData = await encryptData(dataToEncrypt, masterPassword);
const ipfsCid = await uploadToIpfs(encryptedData);
```

### IPFS Storage

Password data is stored on IPFS in encrypted form. The application requires a running IPFS daemon for operation.

**IPFS Configuration**:
```bash
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:5173", "http://127.0.0.1:5173", "https://webui.ipfs.io"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
```

## Installation and Setup

### Prerequisites

- Node.js (v16+)
- Rust and Solana CLI (for program development)
- IPFS daemon
- Solana wallet (Phantom or Solflare)

### Frontend Setup

1. Clone the repository
   ```bash
   git clone https://github.com/emptylabs/keyra-mvp.git
   cd keyra
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Start the development server
   ```bash
   npm run dev
   ```

### IPFS Configuration

1. Install IPFS daemon following [official instructions](https://docs.ipfs.tech/install/)

2. Configure CORS settings
   ```bash
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin '["http://localhost:5173", "http://127.0.0.1:5173", "https://webui.ipfs.io"]'
   ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
   ```

3. Start IPFS daemon
   ```bash
   ipfs daemon
   ```

### Relayer Service Setup

1. Navigate to the relayer directory
   ```bash
   cd keyra-relayer
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create `.env` file with the following content
   ```
   SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
   RELAYER_PRIVATE_KEY=[base58 private key]
   ```

4. Start the relayer
   ```bash
   npm start
   ```

## User Flow

1. **Authentication**
   - Connect wallet (Phantom or Solflare)
   - Verify wallet ownership through message signing
   - Create or enter master password

2. **Password Management**
   - Add new passwords (encrypted with master password)
   - View passwords (decrypted locally)
   - Update or delete passwords
   - Organize passwords into categories

3. **Data Flow**
   - Passwords encrypted client-side
   - Encrypted data stored on IPFS
   - IPFS CID recorded on Solana via Light Protocol
   - Operations executed through privacy-preserving transactions

## Security Considerations

The KEYRA password manager implements several security measures:

- **Zero-Knowledge Architecture**: Data operations use Light Protocol for privacy
- **Client-Side Encryption**: All sensitive data is encrypted/decrypted locally
- **Strong Cryptography**: AES-256-GCM with key derivation via PBKDF2
- **No Server Storage**: No centralized database of passwords
- **Two-Factor Authentication**: Both wallet and master password required
- **Blockchain Immutability**: Tamper-resistant record of operations

## Project Structure

```
├── keyra_program/             # Solana Anchor program
│   ├── programs/              # Program source code
│   │   └── keyra_program/     # Rust implementation
│   │
│   ├── tests/                 # Program tests
│   └── Anchor.toml            # Anchor configuration
│
├── keyra-relayer/             # Relayer service
│   ├── index.js               # Main relayer logic
│   └── instructions.js        # Program instruction builders
│
├── src/                       # Frontend source code
│   ├── components/            # React components
│   │   ├── auth/              # Authentication components
│   │   ├── common/            # Shared components
│   │   ├── generator/         # Password generator
│   │   ├── layout/            # UI layout components
│   │   ├── passwords/         # Password management
│   │   └── settings/          # Settings components
│   │
│   ├── context/               # React context providers
│   │   ├── AuthContext.tsx    # Authentication context
│   │   └── PasswordContext.tsx # Password management context
│   │
│   ├── pages/                 # Application pages
│   │   ├── AuthPage.tsx       # Login page
│   │   ├── Dashboard.tsx      # Main dashboard
│   │   └── PasswordsPage.tsx  # Password listing
│   │
│   ├── utils/                 # Utility functions
│   │   ├── encryption.ts      # Cryptographic utilities
│   │   ├── ipfs.ts            # IPFS integration
│   │   └── lpv2Service.ts     # Light Protocol integration
│   │
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
│
├── public/                    # Static assets
└── index.html                 # HTML entry point
```

## API Reference

### Solana Program Instructions

| Instruction | Description | Parameters |
|-------------|-------------|------------|
| `initialize_user` | Initialize user PDA | `lpv2_shielded_pubkey`, `relayer` |
| `process_lpv2_action` | Process password action | `action`, `cid`, `old_cid`, `new_cid` |
| `update_lpv2_shielded_key` | Update LPv2 key | `new_shielded_pubkey` |

### React Hooks

| Hook | Description | Returns |
|------|-------------|---------|
| `useAuth()` | Authentication context | `{ wallet, isConnected, masterPassword, ... }` |
| `usePassword()` | Password management | `{ passwords, categories, addPassword, ... }` |

### Encryption Functions

| Function | Description | Parameters |
|----------|-------------|------------|
| `encryptData()` | Encrypt data with AES-GCM | `data: string, password: string` |
| `decryptData()` | Decrypt encrypted data | `encryptedData: string, password: string` |
| `hashMasterPassword()` | Hash master password | `password: string` |

## Deployment Information

### Solana Program

- **Program ID**: `2WeZQkQ4cd86G2ymjQLRbCPGUWcipZSdFjsbKv2ArBT3`
- **Cluster**: Solana Devnet

### Relayer Service

- **Relayer Address**: `AcGNd7QUx7jsy9yhTzc6unMfu9gU1AYL1PXdXz7CM1Tx`
- **Monitoring Address**: `AcGNd7QUx7jsy9yhTzc6unMfu9gU1AYL1PXdXz7CM1Tx`

### Light Protocol Configuration

- **RPC Endpoint**: Uses Helius API with key `af246a79-****-4fa1-****-d686d9ff37**`

## Troubleshooting

### Common Issues

1. **IPFS Connection Errors**
   - Ensure IPFS daemon is running with `ipfs daemon`
   - Verify CORS settings are properly configured
   - Try restarting the IPFS daemon

2. **Wallet Connection Issues**
   - Make sure you're using a compatible wallet (Phantom or Solflare)
   - Ensure wallet is on the Solana devnet network
   - Check that the browser extension is up to date

3. **Transaction Failures**
   - Check Solana account balance (devnet SOL)
   - Verify network connectivity to Solana RPC endpoint
   - Inspect console logs for detailed error messages

## Development Guidelines

### Adding New Features

1. **New Password Fields**:
   - Update the `PasswordEntry` interface in `PasswordContext.tsx`
   - Modify encryption/decryption logic in `encryption.ts`
   - Update UI components in `components/passwords/`

2. **Solana Program Changes**:
   - Modify Rust code in `keyra_program/programs/keyra_program/src/lib.rs`
   - Update IDL and typescript bindings
   - Test thoroughly before deployment

### Testing

- Frontend: Using React Testing Library
- Smart Contract: Anchor test framework
- Integration: Manual testing with test wallets

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Solana](https://solana.com/) - Blockchain platform
- [Light Protocol](https://lightprotocol.com/) - Privacy layer
- [IPFS](https://ipfs.io/) - Decentralized storage
- [Anchor](https://project-serum.github.io/anchor/) - Solana framework

## Contributors

- Development Team
- Light Protocol Team (consultation)

## Contact

For issues, feature requests, or contributions, please open an issue in the repository.

---
