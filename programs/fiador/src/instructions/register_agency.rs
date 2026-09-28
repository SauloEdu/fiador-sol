use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
#[instruction(authority: Pubkey)]
pub struct RegisterAgency<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,

    #[account(
        init,
        payer = admin,
        space = 8 + Agency::INIT_SPACE,
        seeds = [b"agency", authority.as_ref()],
        bump,
    )]
    pub agency: Account<'info, Agency>,

    pub system_program: Program<'info, System>,
}

pub fn handle_register_agency(ctx: Context<RegisterAgency>, authority: Pubkey) -> Result<()> {
    let agency = &mut ctx.accounts.agency;
    agency.authority = authority;
    agency.active = true;
    agency.coverage_in_use = 0;
    agency.bump = ctx.bumps.agency;
    Ok(())
}
