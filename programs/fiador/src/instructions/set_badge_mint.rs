use anchor_lang::prelude::*;
use anchor_spl::token_2022::spl_token_2022::{
    extension::{non_transferable::NonTransferable, BaseStateWithExtensions, StateWithExtensions},
    state::Mint as MintState,
};
use anchor_spl::token_interface::{Mint, Token2022};

use crate::errors::FiadorError;
use crate::state::*;

/// Admin define o mint do selo "Bom Pagador". O programa confere que o selo
/// não pode ser transferido nem vendido (extensão NonTransferable do Token-2022)
/// e que só o próprio programa (PDA `config`) consegue emiti-lo.
#[derive(Accounts)]
pub struct SetBadgeMint<'info> {
    pub admin: Signer<'info>,

    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Box<Account<'info, Config>>,

    #[account(
        mint::authority = config,
        mint::decimals = 0,
        mint::token_program = badge_token_program,
    )]
    pub badge_mint: Box<InterfaceAccount<'info, Mint>>,

    pub badge_token_program: Program<'info, Token2022>,
}

pub fn handle_set_badge_mint(ctx: Context<SetBadgeMint>) -> Result<()> {
    let info = ctx.accounts.badge_mint.to_account_info();
    let data = info.try_borrow_data()?;
    let mint = StateWithExtensions::<MintState>::unpack(&data)
        .map_err(|_| error!(FiadorError::InvalidBadgeMint))?;
    mint.get_extension::<NonTransferable>()
        .map_err(|_| error!(FiadorError::InvalidBadgeMint))?;
    drop(data);

    ctx.accounts.config.badge_mint = ctx.accounts.badge_mint.key();
    Ok(())
}
