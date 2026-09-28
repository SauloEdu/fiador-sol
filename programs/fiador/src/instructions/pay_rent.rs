use anchor_lang::prelude::*;
use anchor_spl::token_interface::{mint_to, Mint, MintTo, Token2022, TokenAccount, TokenInterface};

use crate::errors::FiadorError;
use crate::state::*;
use crate::utils::move_tokens;

/// O inquilino paga o próximo período em aberto.
///
/// - Período `Open`: aluguel vai direto ao proprietário e o prêmio ao pool.
/// - Período `Covered` (a caução/pool já pagou o proprietário): o dinheiro
///   repõe primeiro o pool e depois a caução — o proprietário nunca recebe
///   duas vezes pelo mesmo mês (SEGURANCA.md, item 3).
#[derive(Accounts)]
pub struct PayRent<'info> {
    #[account(mut)]
    pub tenant: Signer<'info>,

    #[account(mut, seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [b"pool_vault"], bump = pool.vault_bump)]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"lease", lease.landlord.as_ref(), tenant.key().as_ref(), &lease.lease_id.to_le_bytes()],
        bump = lease.bump,
        has_one = tenant,
    )]
    pub lease: Box<Account<'info, Lease>>,

    #[account(mut, seeds = [b"vault", lease.key().as_ref()], bump = lease.vault_bump)]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"profile", tenant.key().as_ref()],
        bump = profile.bump,
        has_one = tenant,
    )]
    pub profile: Box<Account<'info, TenantProfile>>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = mint)]
    pub config: Box<Account<'info, Config>>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = tenant,
        token::token_program = token_program,
    )]
    pub tenant_token: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Conta de tBRL do proprietário que recebe o aluguel.
    #[account(
        mut,
        token::mint = mint,
        token::authority = lease.landlord,
        token::token_program = token_program,
    )]
    pub landlord_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,

    // --- Selo "Bom Pagador" (obrigatórias quando a Config tem um selo definido) ---
    #[account(mut)]
    pub badge_mint: Option<Box<InterfaceAccount<'info, Mint>>>,
    #[account(mut)]
    pub tenant_badge: Option<Box<InterfaceAccount<'info, TokenAccount>>>,
    pub badge_token_program: Option<Program<'info, Token2022>>,
}

pub fn handle_pay_rent(ctx: Context<PayRent>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let lease = &ctx.accounts.lease;
    require!(
        matches!(lease.status, LeaseStatus::Active | LeaseStatus::Defaulted),
        FiadorError::InvalidStatus
    );
    let index = lease.next_unsettled().ok_or(FiadorError::NoPeriodDue)?;
    let state = lease.periods[index];
    let rent = lease.rent_amount;
    let premium = lease.premium().ok_or(FiadorError::MathOverflow)?;
    let on_time = state == PeriodState::Open && now <= lease.due_ts(index);

    let token_program = ctx.accounts.token_program.key();
    let tenant_info = ctx.accounts.tenant.to_account_info();
    let from = ctx.accounts.tenant_token.to_account_info();

    // Prêmio do pool: pago em todo período (é o "seguro").
    move_tokens(
        token_program,
        from.clone(),
        ctx.accounts.pool_vault.to_account_info(),
        &ctx.accounts.mint,
        tenant_info.clone(),
        premium,
        None,
    )?;

    let mut to_pool = premium;
    let mut to_vault = 0u64;
    if state == PeriodState::Open {
        move_tokens(
            token_program,
            from,
            ctx.accounts.landlord_token.to_account_info(),
            &ctx.accounts.mint,
            tenant_info,
            rent,
            None,
        )?;
    } else {
        // Covered: repõe o pool primeiro, depois a caução.
        let repay_pool = rent.min(lease.pool_debt);
        let repay_vault = rent - repay_pool;
        to_pool = to_pool.checked_add(repay_pool).ok_or(FiadorError::MathOverflow)?;
        to_vault = repay_vault;
        move_tokens(
            token_program,
            from.clone(),
            ctx.accounts.pool_vault.to_account_info(),
            &ctx.accounts.mint,
            tenant_info.clone(),
            repay_pool,
            None,
        )?;
        move_tokens(
            token_program,
            from,
            ctx.accounts.vault.to_account_info(),
            &ctx.accounts.mint,
            tenant_info,
            repay_vault,
            None,
        )?;
    }

    let pool = &mut ctx.accounts.pool;
    pool.total_assets = pool.total_assets.checked_add(to_pool).ok_or(FiadorError::MathOverflow)?;
    pool.premiums_earned = pool.premiums_earned.checked_add(premium).ok_or(FiadorError::MathOverflow)?;

    let lease = &mut ctx.accounts.lease;
    if state == PeriodState::Covered {
        let repay_pool = to_pool - premium;
        lease.pool_debt -= repay_pool;
        lease.deposit_debt = lease.deposit_debt.saturating_sub(to_vault);
        lease.deposit_balance = lease.deposit_balance.checked_add(to_vault).ok_or(FiadorError::MathOverflow)?;
        lease.periods[index] = PeriodState::Settled;
    } else {
        lease.periods[index] = PeriodState::Paid;
    }

    let profile = &mut ctx.accounts.profile;
    let mut earned_badge = false;
    if on_time {
        lease.paid_on_time = lease.paid_on_time.saturating_add(1);
        profile.on_time = profile.on_time.saturating_add(1);
        earned_badge = BADGE_MILESTONES.contains(&profile.on_time);
    } else {
        lease.paid_late = lease.paid_late.saturating_add(1);
        profile.late = profile.late.saturating_add(1);
    }

    if lease.status == LeaseStatus::Defaulted && !lease.has_covered() {
        lease.status = LeaseStatus::Active;
    }

    if ctx.accounts.config.badge_mint != Pubkey::default() {
        mint_badge_if_earned(&ctx, earned_badge)?;
    }
    Ok(())
}

/// Emite 1 selo quando o inquilino atinge 3, 6 ou 12 pagamentos em dia.
fn mint_badge_if_earned(ctx: &Context<PayRent>, earned: bool) -> Result<()> {
    let (Some(mint), Some(dest), Some(program)) = (
        ctx.accounts.badge_mint.as_ref(),
        ctx.accounts.tenant_badge.as_ref(),
        ctx.accounts.badge_token_program.as_ref(),
    ) else {
        return err!(FiadorError::InvalidBadgeAccounts);
    };
    require_keys_eq!(mint.key(), ctx.accounts.config.badge_mint, FiadorError::InvalidBadgeAccounts);
    require_keys_eq!(dest.mint, mint.key(), FiadorError::InvalidBadgeAccounts);
    require_keys_eq!(dest.owner, ctx.accounts.tenant.key(), FiadorError::InvalidBadgeAccounts);
    if !earned {
        return Ok(());
    }
    let seeds: &[&[u8]] = &[b"config", &[ctx.accounts.config.bump]];
    mint_to(
        CpiContext::new_with_signer(
            program.key(),
            MintTo {
                mint: mint.to_account_info(),
                to: dest.to_account_info(),
                authority: ctx.accounts.config.to_account_info(),
            },
            &[seeds],
        ),
        1,
    )
}
