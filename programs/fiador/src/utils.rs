use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer_checked, Mint, TransferChecked};

/// Transferência de tBRL. `signer` = sementes do PDA quando a saída é de um cofre.
pub fn move_tokens<'info>(
    token_program: Pubkey,
    from: AccountInfo<'info>,
    to: AccountInfo<'info>,
    mint: &InterfaceAccount<'info, Mint>,
    authority: AccountInfo<'info>,
    amount: u64,
    signer: Option<&[&[&[u8]]]>,
) -> Result<()> {
    if amount == 0 {
        return Ok(());
    }
    let accounts = TransferChecked { from, mint: mint.to_account_info(), to, authority };
    let ctx = match signer {
        Some(seeds) => CpiContext::new_with_signer(token_program, accounts, seeds),
        None => CpiContext::new(token_program, accounts),
    };
    transfer_checked(ctx, amount, mint.decimals)
}
