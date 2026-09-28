//! Fiador.sol — garantia locatícia on-chain.
//! Visão geral e regras: docs/ARQUITETURA.md · Ameaças: docs/SEGURANCA.md
use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;
pub mod utils;

pub use instructions::*;
pub use state::*;

declare_id!("C6wuEPiedMo2hxs6DEHSxefKAEwRkKdcQucbi1DVg2wV");

#[program]
pub mod fiador {
    use super::*;

    /// Cria as regras globais, o pool (com depósito inicial permanente) e a reserva de rendimento.
    pub fn initialize(ctx: Context<Initialize>, params: ConfigParams, initial_pool_deposit: u64) -> Result<()> {
        instructions::initialize::handle_initialize(ctx, params, initial_pool_deposit)
    }

    /// Admin credencia uma imobiliária.
    pub fn register_agency(ctx: Context<RegisterAgency>, authority: Pubkey) -> Result<()> {
        instructions::register_agency::handle_register_agency(ctx, authority)
    }

    /// Inquilino cria seu perfil de reputação.
    pub fn init_profile(ctx: Context<InitProfile>) -> Result<()> {
        instructions::init_profile::handle_init_profile(ctx)
    }

    /// Imobiliária + proprietário registram um contrato.
    pub fn create_lease(ctx: Context<CreateLease>, lease_id: u64, terms: LeaseTerms) -> Result<()> {
        instructions::create_lease::handle_create_lease(ctx, lease_id, terms)
    }

    /// Inquilino aceita e deposita a caução.
    pub fn accept_lease(ctx: Context<AcceptLease>) -> Result<()> {
        instructions::accept_lease::handle_accept_lease(ctx)
    }

    /// Inquilino paga o próximo mês (ou quita um mês já coberto).
    pub fn pay_rent(ctx: Context<PayRent>) -> Result<()> {
        instructions::pay_rent::handle_pay_rent(ctx)
    }

    /// Qualquer um cobra um mês vencido além da carência: caução e pool pagam o proprietário.
    pub fn claim_default(ctx: Context<ClaimDefault>) -> Result<()> {
        instructions::claim_default::handle_claim_default(ctx)
    }

    /// Fim do prazo: abre a janela de contestação.
    pub fn end_lease(ctx: Context<EndLease>) -> Result<()> {
        instructions::end_lease::handle_end_lease(ctx)
    }

    /// Proprietário contesta danos dentro da janela.
    pub fn open_dispute(ctx: Context<OpenDispute>, amount: u64) -> Result<()> {
        instructions::dispute::handle_open_dispute(ctx, amount)
    }

    /// Imobiliária decide quanto da caução vai ao proprietário.
    pub fn resolve_dispute(ctx: Context<ResolveDispute>, award: u64) -> Result<()> {
        instructions::dispute::handle_resolve_dispute(ctx, award)
    }

    /// Acerto final: repõe o pool, devolve caução + rendimento, atualiza reputação.
    pub fn close_lease(ctx: Context<CloseLease>) -> Result<()> {
        instructions::close_lease::handle_close_lease(ctx)
    }

    /// Investidor abre sua posição no pool.
    pub fn open_position(ctx: Context<OpenPosition>) -> Result<()> {
        instructions::pool_ops::handle_open_position(ctx)
    }

    /// Investidor deposita tBRL no pool e recebe cotas.
    pub fn pool_deposit(ctx: Context<PoolDeposit>, amount: u64) -> Result<()> {
        instructions::pool_ops::handle_pool_deposit(ctx, amount)
    }

    /// Investidor pede saque (aviso prévio).
    pub fn request_withdraw(ctx: Context<RequestWithdraw>, shares: u64) -> Result<()> {
        instructions::pool_ops::handle_request_withdraw(ctx, shares)
    }

    /// Investidor saca depois do aviso prévio.
    pub fn pool_withdraw(ctx: Context<PoolWithdraw>) -> Result<()> {
        instructions::pool_ops::handle_pool_withdraw(ctx)
    }

    /// Admin define o mint do selo "Bom Pagador" (Token-2022 intransferível).
    pub fn set_badge_mint(ctx: Context<SetBadgeMint>) -> Result<()> {
        instructions::set_badge_mint::handle_set_badge_mint(ctx)
    }
}
