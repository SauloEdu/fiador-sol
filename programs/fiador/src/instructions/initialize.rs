use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::errors::FiadorError;
use crate::state::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Config::INIT_SPACE,
        seeds = [b"config"],
        bump,
    )]
    pub config: Box<Account<'info, Config>>,

    #[account(
        init,
        payer = admin,
        space = 8 + Pool::INIT_SPACE,
        seeds = [b"pool"],
        bump,
    )]
    pub pool: Box<Account<'info, Pool>>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Cofre do pool: só o PDA `pool` movimenta.
    #[account(
        init,
        payer = admin,
        seeds = [b"pool_vault"],
        bump,
        token::mint = mint,
        token::authority = pool,
        token::token_program = token_program,
    )]
    pub pool_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Reserva que paga o rendimento simulado da caução: só o PDA `config` movimenta.
    #[account(
        init,
        payer = admin,
        seeds = [b"yield_reserve"],
        bump,
        token::mint = mint,
        token::authority = config,
        token::token_program = token_program,
    )]
    pub yield_reserve: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Conta do admin de onde sai o depósito inicial permanente do pool.
    #[account(
        mut,
        token::mint = mint,
        token::authority = admin,
        token::token_program = token_program,
    )]
    pub admin_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(ctx: Context<Initialize>, params: ConfigParams, initial_pool_deposit: u64) -> Result<()> {
    validate(&params)?;
    require!(initial_pool_deposit > 0, FiadorError::InvalidConfig);

    let config = &mut ctx.accounts.config;
    config.admin = ctx.accounts.admin.key();
    config.mint = ctx.accounts.mint.key();
    config.demo_mode = params.demo_mode;
    config.min_period_secs = params.min_period_secs;
    config.grace_secs = params.grace_secs;
    config.premium_bps = params.premium_bps;
    config.apy_bps = params.apy_bps;
    config.coverage_months = params.coverage_months;
    config.max_coverage_amount = params.max_coverage_amount;
    config.coverage_waiting_periods = params.coverage_waiting_periods;
    config.agency_max_pool_bps = params.agency_max_pool_bps;
    config.withdraw_cooldown_secs = params.withdraw_cooldown_secs;
    config.dispute_window_secs = params.dispute_window_secs;
    config.bump = ctx.bumps.config;

    // Depósito inicial do admin: vira cotas que ninguém pode sacar
    // (não existe Position para elas). Isso ancora o preço da cota.
    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.admin_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.pool_vault.to_account_info(),
                authority: ctx.accounts.admin.to_account_info(),
            },
        ),
        initial_pool_deposit,
        ctx.accounts.mint.decimals,
    )?;

    let pool = &mut ctx.accounts.pool;
    pool.total_shares = initial_pool_deposit;
    pool.total_assets = initial_pool_deposit;
    pool.locked_coverage = 0;
    pool.premiums_earned = 0;
    pool.bump = ctx.bumps.pool;
    pool.vault_bump = ctx.bumps.pool_vault;
    Ok(())
}

fn validate(p: &ConfigParams) -> Result<()> {
    // Fora do modo demonstração, "um mês" nunca pode ser curto
    // (impede reputação fabricada — SEGURANCA.md, item 2).
    if !p.demo_mode {
        require!(
            p.min_period_secs >= PRODUCTION_MIN_PERIOD_SECS,
            FiadorError::InvalidConfig
        );
    }
    require!(p.min_period_secs > 0, FiadorError::InvalidConfig);
    require!(p.grace_secs >= 0, FiadorError::InvalidConfig);
    require!((p.premium_bps as u64) <= BPS, FiadorError::InvalidConfig);
    require!((p.apy_bps as u64) <= BPS, FiadorError::InvalidConfig);
    require!(
        p.agency_max_pool_bps > 0 && (p.agency_max_pool_bps as u64) <= BPS,
        FiadorError::InvalidConfig
    );
    require!(p.withdraw_cooldown_secs >= 0, FiadorError::InvalidConfig);
    require!(p.dispute_window_secs >= 0, FiadorError::InvalidConfig);
    Ok(())
}
