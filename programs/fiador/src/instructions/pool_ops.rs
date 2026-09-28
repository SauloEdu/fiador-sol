use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

use crate::errors::FiadorError;
use crate::state::*;
use crate::utils::move_tokens;

// ---------------------------------------------------------------- abrir posição

#[derive(Accounts)]
pub struct OpenPosition<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        payer = owner,
        space = 8 + Position::INIT_SPACE,
        seeds = [b"position", owner.key().as_ref()],
        bump,
    )]
    pub position: Box<Account<'info, Position>>,

    pub system_program: Program<'info, System>,
}

pub fn handle_open_position(ctx: Context<OpenPosition>) -> Result<()> {
    let position = &mut ctx.accounts.position;
    position.owner = ctx.accounts.owner.key();
    position.bump = ctx.bumps.position;
    Ok(())
}

// ---------------------------------------------------------------- depositar

#[derive(Accounts)]
pub struct PoolDeposit<'info> {
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"position", owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Box<Account<'info, Position>>,

    #[account(mut, seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [b"pool_vault"], bump = pool.vault_bump)]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = mint)]
    pub config: Box<Account<'info, Config>>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)]
    pub owner_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_pool_deposit(ctx: Context<PoolDeposit>, amount: u64) -> Result<()> {
    require!(amount > 0, FiadorError::InvalidAmount);
    require!(!ctx.accounts.config.paused, FiadorError::ProtocolPaused);
    let pool = &ctx.accounts.pool;
    // Cotas pelo valor contábil do pool, arredondando contra quem deposita.
    let shares = (amount as u128)
        .checked_mul(pool.total_shares as u128)
        .ok_or(FiadorError::MathOverflow)?
        / pool.total_assets as u128;
    let shares = u64::try_from(shares).map_err(|_| FiadorError::MathOverflow)?;
    require!(shares > 0, FiadorError::InvalidAmount);

    move_tokens(
        ctx.accounts.token_program.key(),
        ctx.accounts.owner_token.to_account_info(),
        ctx.accounts.pool_vault.to_account_info(),
        &ctx.accounts.mint,
        ctx.accounts.owner.to_account_info(),
        amount,
        None,
    )?;

    let pool = &mut ctx.accounts.pool;
    pool.total_assets = pool.total_assets.checked_add(amount).ok_or(FiadorError::MathOverflow)?;
    pool.total_shares = pool.total_shares.checked_add(shares).ok_or(FiadorError::MathOverflow)?;
    let position = &mut ctx.accounts.position;
    position.shares = position.shares.checked_add(shares).ok_or(FiadorError::MathOverflow)?;
    Ok(())
}

// ---------------------------------------------------------------- pedir saque

#[derive(Accounts)]
pub struct RequestWithdraw<'info> {
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"position", owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Box<Account<'info, Position>>,
}

/// Pede o saque de `shares` cotas. Elas continuam no pool (e absorvendo
/// perdas) até o fim do aviso prévio (SEGURANCA.md, item 4). `0` cancela.
pub fn handle_request_withdraw(ctx: Context<RequestWithdraw>, shares: u64) -> Result<()> {
    let position = &mut ctx.accounts.position;
    require!(shares <= position.shares, FiadorError::InvalidAmount);
    position.pending_shares = shares;
    position.request_ts = Clock::get()?.unix_timestamp;
    Ok(())
}

// ---------------------------------------------------------------- sacar

#[derive(Accounts)]
pub struct PoolWithdraw<'info> {
    pub owner: Signer<'info>,

    #[account(mut, seeds = [b"position", owner.key().as_ref()], bump = position.bump, has_one = owner)]
    pub position: Box<Account<'info, Position>>,

    #[account(mut, seeds = [b"pool"], bump = pool.bump)]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mut, seeds = [b"pool_vault"], bump = pool.vault_bump)]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(seeds = [b"config"], bump = config.bump, has_one = mint)]
    pub config: Box<Account<'info, Config>>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)]
    pub owner_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_pool_withdraw(ctx: Context<PoolWithdraw>) -> Result<()> {
    require!(!ctx.accounts.config.paused, FiadorError::ProtocolPaused);
    let now = Clock::get()?.unix_timestamp;
    let position = &ctx.accounts.position;
    let shares = position.pending_shares;
    require!(shares > 0, FiadorError::NoPendingWithdraw);
    let ready_at = position
        .request_ts
        .checked_add(ctx.accounts.config.withdraw_cooldown_secs)
        .ok_or(FiadorError::MathOverflow)?;
    require!(now >= ready_at, FiadorError::CooldownActive);

    let pool = &ctx.accounts.pool;
    let amount = (shares as u128)
        .checked_mul(pool.total_assets as u128)
        .ok_or(FiadorError::MathOverflow)?
        / pool.total_shares as u128;
    let amount = u64::try_from(amount).map_err(|_| FiadorError::MathOverflow)?;
    // Nunca libera cobertura prometida a contratos ativos (SEGURANCA.md, item 5).
    require!(amount <= pool.free_assets(), FiadorError::WithdrawExceedsFree);

    let seeds: &[&[u8]] = &[b"pool", &[pool.bump]];
    move_tokens(
        ctx.accounts.token_program.key(),
        ctx.accounts.pool_vault.to_account_info(),
        ctx.accounts.owner_token.to_account_info(),
        &ctx.accounts.mint,
        ctx.accounts.pool.to_account_info(),
        amount,
        Some(&[seeds]),
    )?;

    let pool = &mut ctx.accounts.pool;
    pool.total_assets -= amount;
    pool.total_shares -= shares;
    let position = &mut ctx.accounts.position;
    position.shares -= shares;
    position.pending_shares = 0;
    Ok(())
}
