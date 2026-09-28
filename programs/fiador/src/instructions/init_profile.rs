use anchor_lang::prelude::*;

use crate::state::*;

/// Cria o perfil de reputação do inquilino (uma vez por carteira).
/// Separado do aceite de contrato para usar `init` e nunca `init_if_needed`.
#[derive(Accounts)]
pub struct InitProfile<'info> {
    #[account(mut)]
    pub tenant: Signer<'info>,

    #[account(
        init,
        payer = tenant,
        space = 8 + TenantProfile::INIT_SPACE,
        seeds = [b"profile", tenant.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, TenantProfile>,

    pub system_program: Program<'info, System>,
}

pub fn handle_init_profile(ctx: Context<InitProfile>) -> Result<()> {
    let profile = &mut ctx.accounts.profile;
    profile.tenant = ctx.accounts.tenant.key();
    profile.bump = ctx.bumps.profile;
    Ok(())
}
