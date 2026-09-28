use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::FiadorError;
use crate::events::*;
use crate::state::*;
use crate::utils::move_tokens;

/// Cobra um período vencido além da carência: o proprietário recebe da caução
/// e, se faltar, do pool. Qualquer carteira pode chamar (o "keeper"), mas o
/// programa confere o relógio e o estado do período — ninguém cobra antes da
/// hora nem duas vezes o mesmo mês.
#[derive(Accounts)]
pub struct ClaimDefault<'info> {
    /// Quem aciona só paga a taxa da transação.
    pub caller: Signer<'info>,

    #[account(mut, seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [b"pool_vault"], bump = pool.vault_bump)]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,

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

pub fn handle_claim_default(ctx: Context<ClaimDefault>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let lease = &ctx.accounts.lease;
    require!(
        matches!(lease.status, LeaseStatus::Active | LeaseStatus::Defaulted),
        FiadorError::InvalidStatus
    );

    // Só o primeiro período em aberto, e só depois do vencimento + carência.
    let index = (0..lease.total_periods as usize)
        .find(|&i| lease.periods[i] == PeriodState::Open)
        .ok_or(FiadorError::NothingToClaim)?;
    let deadline = lease
        .due_ts(index)?
        .checked_add(lease.grace_secs)
        .ok_or(FiadorError::MathOverflow)?;
    require!(now > deadline, FiadorError::NothingToClaim);

    let rent = lease.rent_amount;
    let from_deposit = rent.min(lease.deposit_balance);
    let missing = rent - from_deposit;

    // O fundo só entra depois de `coverage_waiting_periods` aluguéis pagos, com
    // cobertura que cresce a cada aluguel pago (até o teto do contrato), e paga
    // só a parte fora da franquia do proprietário (antifraude, camada 1).
    // Com o protocolo pausado, o fundo não paga ninguém (a caução continua pagando).
    let from_pool = if ctx.accounts.config.paused {
        0
    } else {
        lease
            .after_deductible(missing)
            .min(lease.coverage_available())
            .min(ctx.accounts.pool.total_assets)
    };
    // Quarentena: o pagamento do fundo fica retido no cofre do fundo e só vai ao
    // proprietário depois do prazo, se ninguém congelar (antifraude, camada 2).
    let quarantine = ctx.accounts.config.pool_quarantine_secs;
    let pay_pool_now = if quarantine > 0 { 0 } else { from_pool };

    let token_program = ctx.accounts.token_program.key();
    let landlord_to = ctx.accounts.landlord_token.to_account_info();

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
        landlord_to.clone(),
        &ctx.accounts.mint,
        ctx.accounts.lease.to_account_info(),
        from_deposit,
        Some(&[lease_seeds]),
    )?;

    let pool_seeds: &[&[u8]] = &[b"pool", &[ctx.accounts.pool.bump]];
    move_tokens(
        token_program,
        ctx.accounts.pool_vault.to_account_info(),
        landlord_to,
        &ctx.accounts.mint,
        ctx.accounts.pool.to_account_info(),
        pay_pool_now,
        Some(&[pool_seeds]),
    )?;

    // O que o pool pagou sai da cobertura travada (já foi usado).
    let pool = &mut ctx.accounts.pool;
    pool.total_assets = pool.total_assets.checked_sub(from_pool).ok_or(FiadorError::MathOverflow)?;
    pool.locked_coverage = pool.locked_coverage.saturating_sub(from_pool);
    let agency = &mut ctx.accounts.agency;
    agency.coverage_in_use = agency.coverage_in_use.saturating_sub(from_pool);

    let lease = &mut ctx.accounts.lease;
    lease.deposit_balance -= from_deposit;
    lease.deposit_debt = lease.deposit_debt.checked_add(from_deposit).ok_or(FiadorError::MathOverflow)?;
    lease.pool_debt = lease.pool_debt.checked_add(from_pool).ok_or(FiadorError::MathOverflow)?;
    lease.pool_covered_total = lease.pool_covered_total.checked_add(from_pool).ok_or(FiadorError::MathOverflow)?;
    // Caução e cobertura esgotadas: o que faltou vira dívida com o proprietário,
    // paga primeiro quando a inquilina quitar (B-A10).
    let shortfall = missing - from_pool;
    lease.landlord_debt = lease.landlord_debt.checked_add(shortfall).ok_or(FiadorError::MathOverflow)?;
    if pay_pool_now < from_pool {
        lease.pool_pending = lease.pool_pending.checked_add(from_pool).ok_or(FiadorError::MathOverflow)?;
        lease.pool_release_ts = now.checked_add(quarantine).ok_or(FiadorError::MathOverflow)?;
    }
    emit!(AtrasoCobrado {
        lease: ctx.accounts.lease.key(),
        periodo: index as u8,
        da_caucao: from_deposit,
        do_fundo: from_pool,
        em_quarentena: pay_pool_now < from_pool,
        falta_ao_proprietario: shortfall,
    });
    let lease = &mut ctx.accounts.lease;
    lease.periods[index] = PeriodState::Covered;
    lease.defaults = lease.defaults.saturating_add(1);
    lease.status = LeaseStatus::Defaulted;
    Ok(())
}
