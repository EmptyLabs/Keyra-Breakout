import { PublicKey } from "@solana/web3.js";
import { BN } from '@coral-xyz/anchor';

// The address that the relayer monitors for incoming private transactions
export const RELAYER_LPV2_MONITORING_ADDRESS = new PublicKey("AcGNd7QUx7jsy9yhTzc6unMfu9gU1AYL1PXdXz7CM1Tx");

// The address that client sends LPv2 signals to (relayer's public address)
export const RELAYER_LPV2_ADDRESS = new PublicKey("AcGNd7QUx7jsy9yhTzc6unMfu9gU1AYL1PXdXz7CM1Tx");

// If using a SPL token for signals, use its mint address. Otherwise, use SystemProgram ID for SOL
export const LPV2_SIGNAL_MINT_ADDRESS = new PublicKey("11111111111111111111111111111111");

// Amount to send in signal transactions (small amount)
export const LPV2_SIGNAL_AMOUNT = new BN(1000);

// RPC endpoint for Light Protocol with the user's Helius API key
export const LIGHT_RPC_ENDPOINT = "https://devnet.helius-rpc.com/?api-key=af246a79-0ec7-4fa1-af7e-d686d9ff3766";

// Keyra on-chain program ID 
export const PROGRAM_ID = new PublicKey("2WeZQkQ4cd86G2ymjQLRbCPGUWcipZSdFjsbKv2ArBT3");

