use anchor_lang::prelude::*;

declare_id!("2WeZQkQ4cd86G2ymjQLRbCPGUWcipZSdFjsbKv2ArBT3");

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum PasswordAction {
    Add,
    Update,
    Delete,
}

#[program]
pub mod solpasszk {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>, lpv2_shielded_pubkey: Pubkey, relayer: Pubkey) -> Result<()> {
        msg!("Initializing user metadata PDA for user: {}", ctx.accounts.user.key());
        msg!("LPv2 Shielded Pubkey received: {}", lpv2_shielded_pubkey);
        msg!("Relayer Pubkey received: {}", relayer);

        let user_metadata = &mut ctx.accounts.user_metadata;
        user_metadata.authority = ctx.accounts.user.key();
        user_metadata.lpv2_shielded_pubkey = lpv2_shielded_pubkey;
        user_metadata.relayer = relayer; // Store the relayer's public key
        // Initialize other fields if needed, e.g., version, data pointers list
        user_metadata.data_pointers = Vec::new(); // Example: Initialize an empty list for data pointers

        msg!("User metadata PDA initialized at address: {}", user_metadata.key());
        Ok(())
    }

    pub fn process_lpv2_action(
        ctx: Context<ProcessLpv2Action>,
        action: PasswordAction,
        cid: Option<String>, // Used for Add and Delete
        old_cid: Option<String>, // Used for Update
        new_cid: Option<String>, // Used for Update
    ) -> Result<()> {
        msg!("Processing LPv2 action for user: {}", ctx.accounts.user_metadata.authority.key());

        let user_metadata = &mut ctx.accounts.user_metadata;

        match action {
            PasswordAction::Add => {
                if let Some(new_cid_string) = cid {
                    user_metadata.data_pointers.push(new_cid_string);
                    msg!("Data pointer added.");
                } else {
                    // Handle error: CID missing for Add action
                    msg!("Error: CID missing for Add action.");
                    return Err(ErrorCode::InvalidActionData.into());
                }
            }
            PasswordAction::Update => {
                if let (Some(old_cid_string), Some(new_cid_string)) = (old_cid, new_cid) {
                    if let Some(index) = user_metadata.data_pointers.iter().position(|d| d == &old_cid_string) {
                        user_metadata.data_pointers[index] = new_cid_string.clone(); // Clone the string for the replacement
                        msg!("Data pointer updated.");
                    } else {
                        msg!("Old data pointer not found for update.");
                        // Consider returning an error if the old data pointer is not found
                    }
                } else {
                    // Handle error: old_cid or new_cid missing for Update action
                    msg!("Error: old_cid or new_cid missing for Update action.");
                    return Err(ErrorCode::InvalidActionData.into());
                }
            }
            PasswordAction::Delete => {
                if let Some(cid_to_delete_string) = cid {
                    let initial_len = user_metadata.data_pointers.len();
                    user_metadata.data_pointers.retain(|d| d != &cid_to_delete_string);
                    if user_metadata.data_pointers.len() == initial_len {
                         msg!("Data pointer to delete not found.");
                         // Consider returning an error if the data pointer is not found
                    } else {
                         msg!("Data pointer deleted.");
                    }
                } else {
                    // Handle error: CID missing for Delete action
                    msg!("Error: CID missing for Delete action.");
                    return Err(ErrorCode::InvalidActionData.into());
                }
            }
        }

        Ok(())
    }

    pub fn update_lpv2_shielded_key(ctx: Context<UpdateLpv2ShieldedKey>, new_shielded_pubkey: Pubkey) -> Result<()> {
        msg!("Updating LPv2 shielded key for user: {}", ctx.accounts.user_metadata.authority.key());
        msg!("New LPv2 Shielded Pubkey: {}", new_shielded_pubkey);

        let user_metadata = &mut ctx.accounts.user_metadata;
        user_metadata.lpv2_shielded_pubkey = new_shielded_pubkey;

        msg!("LPv2 shielded key updated successfully.");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>, // The user initializing their account (pays for rent)

    #[account(
        init, // Initialize the account
        payer = user, // The user pays for the account creation
        space = UserMetadata::space(), // Calculate space needed
        seeds = [b"user_metadata", user.key().as_ref()], // Seeds for the PDA
        bump // Store the bump seed
    )]
    pub user_metadata: Account<'info, UserMetadata>, // The PDA account to store user metadata

    pub system_program: Program<'info, System>, // Required for account creation
}

#[derive(Accounts)]
pub struct ProcessLpv2Action<'info> {
    // This instruction should only be callable by the trusted relayer
    #[account(
        mut, // We need mutable access to modify data_pointers
        // We find the PDA using the authority's key, ensuring we modify the correct user's data.
        seeds = [b"user_metadata", user_metadata.authority.key().as_ref()], // Use user_metadata.authority for seeds
        bump, // The bump seed for the PDA
        has_one = relayer // Ensure the signer is the trusted relayer
    )]
    pub user_metadata: Account<'info, UserMetadata>, // The PDA account to modify

    // The relayer account, must be a signer
    pub relayer: Signer<'info>,
}

#[derive(Accounts)]
pub struct UpdateLpv2ShieldedKey<'info> {
    #[account(
        mut,
        seeds = [b"user_metadata", user_metadata.authority.key().as_ref()],
        bump,
        has_one = relayer // Crucial constraint: ensures signer is the stored relayer
    )]
    pub user_metadata: Account<'info, UserMetadata>,

    pub relayer: Signer<'info>,
}

#[account]
pub struct UserMetadata {
    pub authority: Pubkey, // The user who owns this metadata
    pub lpv2_shielded_pubkey: Pubkey,
    pub relayer: Pubkey, // Add the relayer's public key
    // Add other fields like off-chain data pointers (e.g., IPFS CIDs)
    pub data_pointers: Vec<String>, // Example: A list of CIDs
    // Add versioning, etc. if needed
}

impl UserMetadata {
    // Calculate the space required for the account based on the hash and potential pointers
    pub fn space() -> usize {
        8 // Discriminator
        + 32 // authority (Pubkey)
        + 32 // lpv2_shielded_pubkey (Pubkey)
        + 32 // relayer (Pubkey) // Add space for relayer
        + 4 // data_pointers Vec discriminator
        + 100 // Allocate some extra space for future pointers initially
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: Signer does not match the authority of the user metadata.")]
    Unauthorized,
    #[msg("Invalid action data provided for the LPv2 action.")]
    InvalidActionData,
    // Add other potential errors later
}
