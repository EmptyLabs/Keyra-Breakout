// instructions.js
const { PublicKey, SystemProgram, AccountMeta } = require('@solana/web3.js');
// const { AnchorProvider, Program, BN } = require('@project-serum/anchor'); // BN might still be needed if passing BN to methods
const idl = require('../keyra_program/target/idl/solpasszk.json');

// idl.metadata.address was undefined, hardcoding programId
const programId = new PublicKey("2WeZQkQ4cd86G2ymjQLRbCPGUWcipZSdFjsbKv2ArBT3");

// Enum to match Anchor enum definition
const PasswordAction = {
    Add: { add: {} },
    Update: { update: {} },
    Delete: { delete: {} }
};

// Helper function to generate a UserMetadata PDA
function getUserMetadataPDA(userMainPubkey) {
    const [userMetadataPDAKey] = PublicKey.findProgramAddressSync(
        [Buffer.from('user_metadata'), userMainPubkey.toBuffer()],
        programId
    );
    return userMetadataPDAKey;
}

// Instruction to initialize a user in the system
async function initializeUserInstruction(program, userMainPubkey, userLpv2ShieldedKey, relayerPDA) {
    try {
        if (!userMainPubkey || !userLpv2ShieldedKey || !relayerPDA) {
            throw new Error("Missing required parameters for initializeUserInstruction");
        }

        const userMetadataPDAKey = getUserMetadataPDA(userMainPubkey);

        return await program.methods
            .initializeUser(userLpv2ShieldedKey)
            .accounts({
                user: userMainPubkey,
                userMetadata: userMetadataPDAKey,
                systemProgram: SystemProgram.programId,
                relayerPda: relayerPDA,
            })
            .instruction();
    } catch (error) {
        console.error(`Error in initializeUserInstruction:`, error);
        throw error;
    }
}

// Instruction to process a Light Protocol v2 action (add, update, delete)
async function processLpv2ActionInstruction(program, userMetadataPDA, relayerPubkey, action, cid, oldCid, newCid) {
    try {
        if (!userMetadataPDA || !relayerPubkey) {
            throw new Error("Missing required parameters for processLpv2ActionInstruction");
        }

        return await program.methods
            .processLpv2Action(action, cid, oldCid, newCid)
            .accounts({
                userMetadata: userMetadataPDA,
                relayer: relayerPubkey,
            })
            .instruction();
    } catch (error) {
        console.error(`Error in processLpv2ActionInstruction:`, error);
        throw error;
    }
}

module.exports = {
    PasswordAction,
    initializeUserInstruction,
    processLpv2ActionInstruction,
    programId
};
