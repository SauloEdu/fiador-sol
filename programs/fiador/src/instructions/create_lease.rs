use anchor_lang::prelude::*;

use crate::errors::FiadorError;
use crate::state::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct LeaseTerms {
    pub rent_amount: u64,
    pub period_secs: i64,
    pub total_periods: u8,
    pub contract_hash: [u8; 32],
}

/// A imobiliária credenciada e o proprietário assinam juntos.
#[derive(Accounts)]
#[instruction(lease_id: u64)]
pub struct CreateLease<'info> {
    #[account(mut)]
    pub agency_authority: Signer<'info>,

    pub landlord: Signer<'info>,

    /// CHECK: só a chave pública do inquilino é gravada; ele confirma no `accept_lease`.
    pub tenant: UncheckedAccount<'info>,

    #[account(seeds = [b"config"], bump = config.bump)]
    pub config: Account<'info, Config>,

    #[account(
        seeds = [b"agency", agency_authority.key().as_ref()],
        bump = agency.bump,
        constraint = agency.active @ FiadorError::AgencyInactive,
    )]
    pub agency: Account<'info, Agency>,

    #[account(
        init,
        payer = agency_authority,
        space = 8 + Lease::INIT_SPACE,
        seeds = [b"lease", landlord.key().as_ref(), tenant.key().as_ref(), &lease_id.to_le_bytes()],
        bump,
    )]
    pub lease: Account<'info, Lease>,

    pub system_program: Program<'info, System>,
}

pub fn handle_create_lease(ctx: Context<CreateLease>, lease_id: u64, terms: LeaseTerms) -> Result<()> {
    let config = &ctx.accounts.config;
    let landlord = ctx.accounts.landlord.key();
    let tenant = ctx.accounts.tenant.key();

    // Conluio óbvio: ninguém aluga de si mesmo nem é inquilino da própria imobiliária.
    require_keys_neq!(landlord, tenant, FiadorError::SameParty);
    require_keys_neq!(ctx.accounts.agency_authority.key(), tenant, FiadorError::SameParty);
    // A imobiliária decide as disputas: não pode ser parte interessada (B-A25).
    require_keys_neq!(ctx.accounts.agency_authority.key(), landlord, FiadorError::AgencyIsLandlord);

    require!(terms.rent_amount >= config.min_rent_amount, FiadorError::InvalidRent);
    require!(terms.period_secs >= config.min_period_secs, FiadorError::PeriodTooShort);
    require!(terms.period_secs <= config.max_period_secs, FiadorError::PeriodTooLong);
    require!(
        terms.total_periods > 0 && (terms.total_periods as usize) <= MAX_PERIODS,
        FiadorError::InvalidPeriods
    );

    let by_months = terms
        .rent_amount
        .checked_mul(config.coverage_months as u64)
        .ok_or(FiadorError::MathOverflow)?;
    let coverage_cap = by_months.min(config.max_coverage_amount);

    let lease = &mut ctx.accounts.lease;
    lease.agency = ctx.accounts.agency.key();
    lease.landlord = landlord;
    lease.tenant = tenant;
    lease.lease_id = lease_id;
    lease.contract_hash = terms.contract_hash;

    lease.rent_amount = terms.rent_amount;
    lease.period_secs = terms.period_secs;
    lease.total_periods = terms.total_periods;
    lease.grace_secs = config.grace_secs;
    lease.premium_bps = config.premium_bps;
    lease.apy_bps = config.apy_bps;
    lease.coverage_cap = coverage_cap;
    lease.coverage_waiting_periods = config.coverage_waiting_periods;
    lease.coverage_growth_bps = config.coverage_growth_bps;
    lease.landlord_deductible_bps = config.landlord_deductible_bps;
    lease.dispute_window_secs = config.dispute_window_secs;

    lease.status = LeaseStatus::Pending;
    lease.periods = [PeriodState::Open; MAX_PERIODS];
    lease.bump = ctx.bumps.lease;
    Ok(())
}
