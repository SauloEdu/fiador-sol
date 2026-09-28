use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::FiadorError;
use crate::state::*;
use crate::utils::move_tokens;

/// Acerto final: a caução que sobrou primeiro repõe o que o pool pagou,
/// depois volta ao inquilino com o rendimento simulado. A cobertura não usada
/// é destravada e a reputação do inquilino é atualizada.
#[derive(Accounts)]
pub struct CloseLease<'info> {
    pub caller: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = mint)]
    pub config: Box<Account<'info, Config>>,

    #[account(mut, seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [b"pool_vault"], bump = pool.vault_bump)]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, seeds = [b"yield_reserve"], bump)]
    pub yield_reserve: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, address = lease.agency)]
    pub agency: Box<Account<'info, Agency>>,

    #[account(
        mut,
        seeds = [b"lease", lease.landlord.as_ref(), lease.tenant.as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
    )]
    pub lease: Box<Account<'info, Lease>>,

    #[account(mut, seeds = [b"vault", lease.key().as_ref()], bump = lease.vault_bump)]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(mut, seeds = [b"profile", lease.tenant.as_ref()], bump = profile.bump)]
    pub profile: Box<Account<'info, TenantProfile>>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = lease.tenant,
        token::token_program = token_program,
    )]
    pub tenant_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_close_lease(ctx: Context<CloseLease>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let lease = &ctx.accounts.lease;
    match lease.status {
        LeaseStatus::Ending => {}
        // Contestação aberta precisa ser decidida pela imobiliária antes.
        LeaseStatus::Disputed => return err!(FiadorError::DisputeWindowOpen),
        _ => return err!(FiadorError::InvalidStatus),
    }
    let window_end = lease
        .end_ts
        .checked_add(lease.dispute_window_secs)
        .ok_or(FiadorError::MathOverflow)?;
    require!(
        lease.dispute_resolved || now > window_end,
        FiadorError::DisputeWindowOpen
    );

    // 1) Caução restante repõe o pool.
    let repay_pool = lease.deposit_balance.min(lease.pool_debt);
    let to_tenant = lease.deposit_balance - repay_pool;

    // 2) Rendimento simulado sobre a caução devolvida, limitado ao saldo da reserva.
    let elapsed = (now - lease.start_ts).max(0) as u128;
    let accrued = (to_tenant as u128)
        .checked_mul(lease.apy_bps as u128)
        .and_then(|v| v.checked_mul(elapsed))
        .ok_or(FiadorError::MathOverflow)?
        / (BPS as u128 * SECONDS_PER_YEAR as u128);
    let yield_paid = (accrued as u64).min(ctx.accounts.yield_reserve.amount);

    let token_program = ctx.accounts.token_program.key();
    let lease_id = lease.lease_id.to_le_bytes();
    let lease_seeds: &[&[u8]] = &[
        b"lease",
        lease.landlord.as_ref(),
        lease.tenant.as_ref(),
        &lease_id,
        &[lease.bump],
    ];
    move_tokens(
        token_program,
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.pool_vault.to_account_info(),
        &ctx.accounts.mint,
        ctx.accounts.lease.to_account_info(),
        repay_pool,
        Some(&[lease_seeds]),
    )?;
    move_tokens(
        token_program,
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.tenant_token.to_account_info(),
        &ctx.accounts.mint,
        ctx.accounts.lease.to_account_info(),
        to_tenant,
        Some(&[lease_seeds]),
    )?;
    let config_seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
    move_tokens(
        token_program,
        ctx.accounts.yield_reserve.to_account_info(),
        ctx.accounts.tenant_token.to_account_info(),
        &ctx.accounts.mint,
        ctx.accounts.config.to_account_info(),
        yield_paid,
        Some(&[config_seeds]),
    )?;

    // 3) Destrava a cobertura que não foi usada.
    let unused = lease.coverage_cap.saturating_sub(lease.pool_covered_total);
    let still_owed = lease.pool_debt - repay_pool;
    let defaulted = lease.has_covered();

    let pool = &mut ctx.accounts.pool;
    pool.total_assets = pool.total_assets.checked_add(repay_pool).ok_or(FiadorError::MathOverflow)?;
    pool.locked_coverage = pool.locked_coverage.saturating_sub(unused);
    let agency = &mut ctx.accounts.agency;
    agency.coverage_in_use = agency.coverage_in_use.saturating_sub(unused);

    // 4) Reputação: terminou devendo = calote.
    let profile = &mut ctx.accounts.profile;
    profile.leases_completed = profile.leases_completed.saturating_add(1);
    if defaulted {
        profile.defaults = profile.defaults.saturating_add(1);
    }

    let lease = &mut ctx.accounts.lease;
    lease.pool_debt = still_owed;
    lease.deposit_balance = 0;
    lease.status = LeaseStatus::Closed;
    Ok(())
}
