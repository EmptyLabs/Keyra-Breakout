require('dotenv').config();
const { Connection, clusterApiUrl, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } = require('@solana/web3.js');
const { Program, AnchorProvider } = require('@project-serum/anchor');
const idl = require('../keyra_program/target/idl/solpasszk.json');
const { PasswordAction, initializeUserInstruction, programId } = require('./instructions');

// Constants
const RELAYER_LPV2_MONITORING_ADDRESS = new PublicKey("AcGNd7QUx7jsy9yhTzc6unMfu9gU1AYL1PXdXz7CM1Tx");

// TODO: Import Light Protocol v2 SDK and related types/utils
// const { Lpv2Client, Lpv2Transaction } = require('@lightprotocol/client');
// const { extractLpv2Data } = require('./lpv2_utils');

const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || clusterApiUrl('devnet');
const connection = new Connection(rpcEndpoint, 'confirmed');

const relayerPrivateKey = process.env.RELAYER_PRIVATE_KEY;
if (!relayerPrivateKey) {
    throw new Error('RELAYER_PRIVATE_KEY not found in .env');
}
const relayerKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(relayerPrivateKey)));
const relayerPubkey = relayerKeypair.publicKey;
console.log(`Relayer Public Key: ${relayerPubkey.toBase58()}`);

// Use programId from instructions.js
const keyraProgramId = programId;

const provider = new AnchorProvider(connection, {
    publicKey: relayerPubkey,
    signTransaction: async (tx) => {
        tx.partialSign(relayerKeypair);
        return tx;
    },
    signAllTransactions: async (txs) => {
        txs.forEach(tx => tx.partialSign(relayerKeypair));
        return txs;
    },
    // Removed payer from here, as .rpc() should use the provider's wallet by default
}, { commitment: 'confirmed' });

const program = new Program(idl, keyraProgramId, provider);

// Function to fetch UserMetadata PDA and its public key
async function getUserMetadata(userMainPubkey) {
    try {
        const [userMetadataPDAKey] = PublicKey.findProgramAddressSync(
            [Buffer.from('user_metadata'), userMainPubkey.toBuffer()],
            keyraProgramId
        );
        const accountData = await program.account.userMetadata.fetch(userMetadataPDAKey);
        return { publicKey: userMetadataPDAKey, data: accountData }; // Return both key and data
    } catch (error) {
        // If account not found, it might be a new user, which is not an error in all contexts
        if (error.message.includes("Account does not exist")) {
            console.log(`User metadata PDA not found for user ${userMainPubkey.toBase58()}. It may need to be initialized.`);
            return null;
        } 
        console.error(`Error fetching user metadata PDA for user ${userMainPubkey.toBase58()}:`, error);
        return null; 
    }
}

async function processLpv2Transaction(memoObject) { // Expects parsed memo object
    console.log('Processing Lpv2 transaction based on extracted memo:', memoObject);
    try {
        const userMainPubkey = new PublicKey(memoObject.userMainPubkey);

        const userMetadataInfo = await getUserMetadata(userMainPubkey);
        if (!userMetadataInfo) {
            console.error(`User metadata PDA not found for user ${userMainPubkey.toBase58()}. Cannot process action.`);
            return;
        }
        const userMetadataPDAKey = userMetadataInfo.publicKey;

        const { action: actionString, cid, old_cid, new_cid, newLpv2ShieldedPubkey } = memoObject;

        if (actionString === 'rekey') {
            if (!newLpv2ShieldedPubkey) {
                console.error("'rekey' action received but newLpv2ShieldedPubkey is missing in memo.");
                return;
            }
            try {
                const newShieldedKey = new PublicKey(newLpv2ShieldedPubkey);
                console.log(`Calling updateLpv2ShieldedKey for user ${userMainPubkey.toBase58()} with new key ${newShieldedKey.toBase58()}`);
                const txSignature = await program.methods.updateLpv2ShieldedKey(newShieldedKey)
                    .accounts({
                        userMetadata: userMetadataPDAKey,
                        relayer: relayerKeypair.publicKey,
                    })
                    .rpc();
                console.log(`Successfully sent updateLpv2ShieldedKey transaction. TX ID: ${txSignature}`);
            } catch (rekeyError) {
                console.error(`Error calling updateLpv2ShieldedKey for user ${userMainPubkey.toBase58()}:`, rekeyError);
            }
            return; // Rekey action handled
        }

        let actionEnum;
        switch (actionString) {
            case 'add': actionEnum = PasswordAction.Add; break;
            case 'update': actionEnum = PasswordAction.Update; break;
            case 'delete': actionEnum = PasswordAction.Delete; break;
            default:
                console.error(`Unknown action type in memo: ${actionString}`);
                return;
        }

        console.log(`Calling on-chain program for user ${userMainPubkey.toBase58()} with action ${actionString}`);
        
        const finalCid = cid === undefined ? null : cid;
        const finalOldCid = old_cid === undefined ? null : old_cid;
        const finalNewCid = new_cid === undefined ? null : new_cid;

        const txSignature = await program.methods
            .processLpv2Action(actionEnum, finalCid, finalOldCid, finalNewCid)
            .accounts({
                userMetadata: userMetadataPDAKey,
                relayer: relayerKeypair.publicKey,
            })
            .rpc();

        console.log(`Successfully sent processLpv2Action to on-chain program. TX ID: ${txSignature}`);

    } catch (error) {
        console.error('Error processing Lpv2 transaction from extracted memo:', error);
    }
}

let lastProcessedTxSignature = null; // To avoid reprocessing the same transaction (simple deduplication)

// Create an Elusiv-like class for the relayer to monitor transactions
class RelayerElusiv {
  constructor(connection, relayerKeypair) {
    this.connection = connection;
    this.relayerKeypair = relayerKeypair;
    this.monitoringPubkey = RELAYER_LPV2_MONITORING_ADDRESS;
  }

  /**
   * Gets recent private transactions sent to the relayer's monitoring address
   * In a production system, this would use the actual Light Protocol SDK methods
   */
  async getPrivateTransactions(limit = 10) {
    try {
      // For simulation, we'll use Solana's getSignaturesForAddress to get recent transactions
      // In a real implementation, this would use Light Protocol's SDK methods
      const signatures = await this.connection.getSignaturesForAddress(
        this.monitoringPubkey,
        { limit }
      );

      if (!signatures || signatures.length === 0) {
        return [];
      }

      const transactions = [];

      for (const signatureInfo of signatures) {
        try {
          const tx = await this.connection.getTransaction(signatureInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });

          if (!tx || !tx.meta || !tx.transaction) {
            continue;
          }

          // Look for memo instruction in the transaction
          const memoInstructions = tx.transaction.message.instructions.filter(
            (instruction) => {
              // Check if it's a memo instruction (program ID for memo program)
              if (!instruction || !instruction.programId) return false;
              return instruction.programId.toBase58 && instruction.programId.toBase58() === 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr';
            }
          );

          if (memoInstructions.length > 0) {
            for (const memoInstruction of memoInstructions) {
              // Decode memo data
              const memoData = Buffer.from(memoInstruction.data, 'base64').toString('utf8');
              
              try {
                // Try to parse the memo as JSON
                const memoJson = JSON.parse(memoData);
                
                // If it has the expected format for our application
                if (memoJson && memoJson.action && memoJson.userMainPubkey) {
                  transactions.push({
                    sig: signatureInfo.signature,
                    memo: memoData,
                    timestamp: signatureInfo.blockTime,
                    parsed: memoJson
                  });
                }
              } catch (parseError) {
                console.log(`Non-JSON memo found: ${memoData}`);
              }
            }
          }
        } catch (txError) {
          console.error(`Error fetching transaction details for ${signatureInfo.signature}:`, txError);
        }
      }

      return transactions;
    } catch (error) {
      console.error('Error fetching private transactions:', error);
      return [];
    }
  }
}

// Initialize the relayer Elusiv instance
let relayerElusivInstance = null;

async function getRelayerElusivInstance() {
  if (!relayerElusivInstance) {
    // For simplicity, we're using a direct instance creation here
    // In a production system, you might want a more sophisticated initialization
    relayerElusivInstance = new RelayerElusiv(connection, relayerKeypair);
    console.log('RelayerElusiv instance initialized');
  }
  return relayerElusivInstance;
}

async function monitorAndProcessElusivTransactions() {
  console.log('(Relayer) Checking for new transactions...');
  try {
    // Get the RelayerElusiv instance
    const elusiv = await getRelayerElusivInstance();
    if (!elusiv) {
      console.error("(Relayer) Elusiv instance not available.");
      return;
    }

    // Fetch recent private transactions 
    const privateTxs = await elusiv.getPrivateTransactions(10);

    if (!privateTxs || privateTxs.length === 0) {
      console.log('(Relayer) No new private transactions found.');
      return;
    }
    
    console.log(`(Relayer) Found ${privateTxs.length} private transactions. Processing...`);

    // Process in reverse order (oldest of the fetched first) for better transaction ordering
    for (const tx of privateTxs.reverse()) {
      const currentTxSig = tx.sig; // Use tx.sig as the unique identifier

      // Simple deduplication: if we have a lastProcessedTxSignature and it's the same, skip it
      if (currentTxSig && currentTxSig === lastProcessedTxSignature) {
        console.log(`(Relayer) Skipping already processed transaction: ${currentTxSig}`);
        continue;
      }
      
      if (tx.memo) {
        console.log(`(Relayer) Found transaction with memo: ${tx.memo}, Sig: ${currentTxSig}`);
        
        // If we already parsed the memo during transaction fetching, use that
        if (tx.parsed) {
          console.log('(Relayer) Using pre-parsed memo:', tx.parsed);
          await processLpv2Transaction(tx.parsed);
          lastProcessedTxSignature = currentTxSig;
        } else {
          // Otherwise, try to parse it here
          try {
            const memoObject = JSON.parse(tx.memo);

            if (memoObject && memoObject.action && memoObject.userMainPubkey) {
              console.log('(Relayer) Keyra-relevant memo found:', memoObject);
              await processLpv2Transaction(memoObject);
              lastProcessedTxSignature = currentTxSig;
            } else {
              console.log(`(Relayer) Memo does not match Keyra format or is missing required fields.`);
            }
          } catch (parseError) {
            console.error('(Relayer) Failed to parse memo JSON:', parseError, 'Memo content:', tx.memo);
          }
        }
      } else {
        console.log(`(Relayer) Transaction ${currentTxSig} has no memo.`);
      }
    }
  } catch (error) {
    console.error('(Relayer) Error during Elusiv transaction monitoring:', error);
  }
}

// Updated monitoring function to replace simulation
async function startRelayerMonitoring() {
    console.log('Starting Keyra Relayer: Elusiv Transaction Monitoring Activated.');
    
    try {
        await getRelayerElusivInstance(); // Initialize Elusiv instance at startup
        console.log("Relayer Elusiv instance pre-warmed.");
    } catch (e) {
        console.error("Failed to initialize Relayer Elusiv instance at startup:", e);
        // Decide if relayer should exit or retry
        return; 
    }

    // Initial check
    await monitorAndProcessElusivTransactions();

    // Periodically check for new transactions (e.g., every 15 seconds)
    setInterval(async () => {
        await monitorAndProcessElusivTransactions();
    }, 15000); // Check every 15 seconds
}

startRelayerMonitoring();

// Keep alive by logging a message, actual keep-alive might be managed by process manager like PM2
setInterval(() => {
    // console.log("Relayer is alive...");
}, 60 * 60 * 1000); // Log every hour
