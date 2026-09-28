//! Resposta a golpes e incidentes (Fiador Doc/08-RESPOSTA-A-GOLPE.md, passo 1 "Conter").
//!
//! - `set_paused`: pausa geral. Bloqueia contratos novos e a entrada e a saída de
//!   dinheiro do fundo; o pagamento de aluguel continua.
//! - `set_agency_active`: suspende (ou reativa) uma imobiliária suspeita.
//! - `freeze_pool_payment`: congela um pagamento do fundo em quarentena.
//! - `cancel_pool_payment`: golpe confirmado; o valor em quarentena volta ao fundo.
//! - `release_pool_payment`: fim da quarentena; qualquer um libera o pagamento ao proprietário.
//!
//! As quatro primeiras são do admin. Em produção, o admin é um multisig (D-14).
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::FiadorError;
use crate::events::*;
use crate::state::*;
use crate::utils::move_tokens;

// ------------------------------------------------------------------ pausa

#[derive(Accounts)]
pub struct SetPaused<'info> {
    pub admin: Signer<'info>,

    #[account(mut, seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,
}

pub fn handle_set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
    ctx.accounts.config.paused = paused;
    emit!(ProtocoloPausado { pausado: paused });
    Ok(())
}

// ------------------------------------------------------------- imobiliária

#[derive(Accounts)]
pub struct SetAgencyActive<'info> {
    pub admin: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Account<'info, Config>,

    #[account(mut, seeds = [b"agency", agency.authority.as_ref()], bump = agency.bump)]
    pub agency: Account<'info, Agency>,
}

/// Imobiliária suspensa não cria contratos e seus convites pendentes não podem ser
/// aceitos. Os contratos em andamento continuam, para não prejudicar quem é honesto.
pub fn handle_set_agency_active(ctx: Context<SetAgencyActive>, active: bool) -> Result<()> {
    let agency = &mut ctx.accounts.agency;
    agency.active = active;
    emit!(ImobiliariaAtualizada { agency: agency.key(), ativa: active });
    Ok(())
}

// ------------------------------------------------- congelar / cancelar

#[derive(Accounts)]
pub struct AdminPoolPayment<'info> {
    pub admin: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = admin)]
    pub config: Box<Account<'info, Config>>,

    #[account(mut, seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(
        mut,
        seeds = [b"lease", lease.landlord.as_ref(), lease.tenant.as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
    )]
    pub lease: Box<Account<'info, Lease>>,
}

pub fn handle_freeze_pool_payment(ctx: Context<AdminPoolPayment>, frozen: bool) -> Result<()> {
    let lease = &mut ctx.accounts.lease;
    require!(lease.pool_pending > 0, FiadorError::NothingPending);
    lease.pool_frozen = frozen;
    emit!(PagamentoDoFundoCongelado { lease: lease.key(), congelado: frozen });
    Ok(())
}

/// Golpe confirmado: o valor em quarentena nunca saiu do cofre do fundo e volta a
/// contar como patrimônio dos investidores. A cobertura do contrato continua
/// consumida (o fundo não paga de novo este contrato) e a inquilina deixa de dever
/// esse valor ao fundo. O proprietário não recebe.
pub fn handle_cancel_pool_payment(ctx: Context<AdminPoolPayment>) -> Result<()> {
    let lease = &mut ctx.accounts.lease;
    let amount = lease.pool_pending;
    require!(amount > 0, FiadorError::NothingPending);
    lease.pool_pending = 0;
    lease.pool_frozen = false;
    lease.pool_debt = lease.pool_debt.saturating_sub(amount);
    let pool = &mut ctx.accounts.pool;
    pool.total_assets = pool.total_assets.checked_add(amount).ok_or(FiadorError::MathOverflow)?;
    emit!(PagamentoDoFundoCancelado { lease: ctx.accounts.lease.key(), valor: amount });
    Ok(())
}

// ------------------------------------------------------------- liberar

#[derive(Accounts)]
pub struct ReleasePoolPayment<'info> {
    /// Qualquer carteira (o keeper) libera depois do prazo; só paga a taxa.
    pub caller: Signer<'info>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = mint)]
    pub config: Box<Account<'info, Config>>,

    #[account(seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [b"pool_vault"], bump = pool.vault_bump)]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"lease", lease.landlord.as_ref(), lease.tenant.as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
    )]
    pub lease: Box<Account<'info, Lease>>,

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

pub fn handle_release_pool_payment(ctx: Context<ReleasePoolPayment>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let lease = &ctx.accounts.lease;
    let amount = lease.pool_pending;
    require!(amount > 0, FiadorError::NothingPending);
    require!(!ctx.accounts.config.paused, FiadorError::ProtocolPaused);
    require!(!lease.pool_frozen, FiadorError::PoolPaymentFrozen);
    require!(now >= lease.pool_release_ts, FiadorError::QuarantineActive);

    let pool_seeds: &[&[u8]] = &[b"pool", &[ctx.accounts.pool.bump]];
    move_tokens(
        ctx.accounts.token_program.key(),
        ctx.accounts.pool_vault.to_account_info(),
        ctx.accounts.landlord_token.to_account_info(),
        &ctx.accounts.mint,
        ctx.accounts.pool.to_account_info(),
        amount,
        Some(&[pool_seeds]),
    )?;
    let lease = &mut ctx.accounts.lease;
    lease.pool_pending = 0;
    emit!(PagamentoDoFundoLiberado { lease: lease.key(), valor: amount });
    Ok(())
}
