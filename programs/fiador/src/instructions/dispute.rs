use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::FiadorError;
use crate::state::*;
use crate::utils::move_tokens;

/// No fim do contrato, o proprietário pode contestar danos ou contas em aberto
/// dentro da janela (SEGURANCA.md, item 7).
#[derive(Accounts)]
pub struct OpenDispute<'info> {
    pub landlord: Signer<'info>,

    #[account(
        mut,
        seeds = [b"lease", landlord.key().as_ref(), lease.tenant.as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
        has_one = landlord,
    )]
    pub lease: Box<Account<'info, Lease>>,
}

pub fn handle_open_dispute(ctx: Context<OpenDispute>, amount: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let lease = &mut ctx.accounts.lease;
    require!(lease.status == LeaseStatus::Ending, FiadorError::InvalidStatus);
    // Decidida uma vez, a disputa não reabre (B-A18).
    require!(!lease.dispute_resolved, FiadorError::DisputeAlreadyResolved);
    let window_end = lease
        .end_ts
        .checked_add(lease.dispute_window_secs)
        .ok_or(FiadorError::MathOverflow)?;
    require!(now <= window_end, FiadorError::DisputeWindowClosed);
    require!(
        amount > 0 && amount <= lease.deposit_balance,
        FiadorError::InvalidAmount
    );
    lease.dispute_amount = amount;
    lease.status = LeaseStatus::Disputed;
    Ok(())
}

/// A imobiliária do contrato decide quanto da caução vai ao proprietário.
#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    pub agency_authority: Signer<'info>,

    #[account(
        seeds = [b"agency", agency_authority.key().as_ref()],
        bump = agency.bump,
        address = lease.agency,
    )]
    pub agency: Box<Account<'info, Agency>>,

    #[account(
        mut,
        seeds = [b"lease", lease.landlord.as_ref(), lease.tenant.as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
    )]
    pub lease: Box<Account<'info, Lease>>,

    #[account(mut, seeds = [b"vault", lease.key().as_ref()], bump = lease.vault_bump)]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = mint)]
    pub config: Box<Account<'info, Config>>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = lease.landlord,
        token::token_program = token_program,
    )]
    pub landlord_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_resolve_dispute(ctx: Context<ResolveDispute>, award: u64) -> Result<()> {
    let lease = &ctx.accounts.lease;
    require!(lease.status == LeaseStatus::Disputed, FiadorError::InvalidStatus);
    require!(
        award <= lease.dispute_amount && award <= lease.deposit_balance,
        FiadorError::InvalidAmount
    );

    let lease_id = lease.lease_id.to_le_bytes();
    let seeds: &[&[u8]] = &[
        b"lease",
        lease.landlord.as_ref(),
        lease.tenant.as_ref(),
        &lease_id,
        &[lease.bump],
    ];
    move_tokens(
        ctx.accounts.token_program.key(),
        ctx.accounts.vault.to_account_info(),
        ctx.accounts.landlord_token.to_account_info(),
        &ctx.accounts.mint,
        ctx.accounts.lease.to_account_info(),
        award,
        Some(&[seeds]),
    )?;

    let lease = &mut ctx.accounts.lease;
    lease.deposit_balance -= award;
    lease.dispute_resolved = true;
    lease.status = LeaseStatus::Ending;
    Ok(())
}
