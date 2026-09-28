use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::errors::FiadorError;
use crate::state::*;

/// O inquilino aceita o contrato: deposita a caução no cofre do contrato e
/// o pool trava a cobertura prometida.
#[derive(Accounts)]
pub struct AcceptLease<'info> {
    #[account(mut)]
    pub tenant: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = mint)]
    pub config: Box<Account<'info, Config>>,

    #[account(mut, seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, address = lease.agency)]
    pub agency: Box<Account<'info, Agency>>,

    #[account(
        mut,
        seeds = [b"lease", lease.landlord.as_ref(), tenant.key().as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
        has_one = tenant,
    )]
    pub lease: Box<Account<'info, Lease>>,

    #[account(
        mut,
        seeds = [b"profile", tenant.key().as_ref()],
        bump = profile.bump,
        has_one = tenant,
    )]
    pub profile: Box<Account<'info, TenantProfile>>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Cofre da caução: só o PDA do contrato movimenta.
    #[account(
        init,
        payer = tenant,
        seeds = [b"vault", lease.key().as_ref()],
        bump,
        token::mint = mint,
        token::authority = lease,
        token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = tenant,
        token::token_program = token_program,
    )]
    pub tenant_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handle_accept_lease(ctx: Context<AcceptLease>) -> Result<()> {
    let lease = &ctx.accounts.lease;
    require!(lease.status == LeaseStatus::Pending, FiadorError::InvalidStatus);
    require!(ctx.accounts.agency.active, FiadorError::AgencyInactive);
    require!(!ctx.accounts.config.paused, FiadorError::ProtocolPaused);

    // Caução conforme a reputação: 3, 2 ou 1 aluguel.
    let deposit = lease
        .rent_amount
        .checked_mul(ctx.accounts.profile.deposit_months())
        .ok_or(FiadorError::MathOverflow)?;
    let cap = lease.coverage_cap;

    // O pool só promete o que tem livre (SEGURANCA.md, item 5)...
    let pool = &ctx.accounts.pool;
    require!(pool.free_assets() >= cap, FiadorError::InsufficientPoolCoverage);

    // ...e nenhuma imobiliária concentra mais que a fatia máxima do pool (item 1).
    let agency_limit = (pool.total_assets as u128)
        .checked_mul(ctx.accounts.config.agency_max_pool_bps as u128)
        .ok_or(FiadorError::MathOverflow)?
        / BPS as u128;
    let agency_after = ctx
        .accounts
        .agency
        .coverage_in_use
        .checked_add(cap)
        .ok_or(FiadorError::MathOverflow)?;
    require!(
        (agency_after as u128) <= agency_limit,
        FiadorError::AgencyCoverageLimit
    );

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.tenant_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.tenant.to_account_info(),
            },
        ),
        deposit,
        ctx.accounts.mint.decimals,
    )?;

    let pool = &mut ctx.accounts.pool;
    pool.locked_coverage = pool
        .locked_coverage
        .checked_add(cap)
        .ok_or(FiadorError::MathOverflow)?;
    ctx.accounts.agency.coverage_in_use = agency_after;

    let profile = &mut ctx.accounts.profile;
    profile.leases_started = profile.leases_started.saturating_add(1);

    let lease = &mut ctx.accounts.lease;
    lease.status = LeaseStatus::Active;
    lease.start_ts = Clock::get()?.unix_timestamp;
    lease.deposit_required = deposit;
    lease.deposit_balance = deposit;
    lease.vault_bump = ctx.bumps.vault;
    Ok(())
}
