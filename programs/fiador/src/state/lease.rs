use anchor_lang::prelude::*;

use crate::errors::FiadorError;

/// Máximo de períodos (meses) por contrato: 36 = 3 anos.
pub const MAX_PERIODS: usize = 36;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum LeaseStatus {
    /// Criado pela imobiliária, aguardando o inquilino aceitar e depositar.
    Pending,
    Active,
    /// Houve cobrança de atraso e ainda há dívida com caução ou pool.
    Defaulted,
    /// Prazo acabou; janela de contestação aberta.
    Ending,
    Disputed,
    Closed,
}

/// Estado de cada período. Impede cobrar o mesmo mês duas vezes e impede
/// que o proprietário receba em dobro (SEGURANCA.md, item 3).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace, Debug)]
pub enum PeriodState {
    Open,
    /// Pago pelo inquilino (em dia ou atrasado, antes da cobrança).
    Paid,
    /// Proprietário recebeu da caução/pool; inquilino ainda deve.
    Covered,
    /// Coberto e depois quitado pelo inquilino.
    Settled,
}

#[account]
#[derive(InitSpace)]
pub struct Lease {
    pub agency: Pubkey,
    pub landlord: Pubkey,
    pub tenant: Pubkey,
    pub lease_id: u64,
    /// SHA-256 do PDF do contrato. Nenhum dado pessoal on-chain (LGPD).
    pub contract_hash: [u8; 32],

    // --- Termos copiados da Config na criação ---
    pub rent_amount: u64,
    pub period_secs: i64,
    pub total_periods: u8,
    pub grace_secs: i64,
    pub premium_bps: u16,
    pub apy_bps: u16,
    /// Quanto o pool cobre além da caução (já limitado pelo teto).
    pub coverage_cap: u64,
    pub coverage_waiting_periods: u8,
    pub coverage_growth_bps: u16,
    pub landlord_deductible_bps: u16,
    pub dispute_window_secs: i64,

    // --- Estado ---
    pub status: LeaseStatus,
    pub start_ts: i64,
    /// Caução exigida no aceite (depende do tier do inquilino).
    pub deposit_required: u64,
    /// Caução que está de fato no cofre agora.
    pub deposit_balance: u64,
    /// Quanto o inquilino deve repor na caução.
    pub deposit_debt: u64,
    /// Quanto o inquilino deve ao pool.
    pub pool_debt: u64,
    /// Quanto o proprietário deixou de receber em meses cobrados sem dinheiro
    /// suficiente (caução e cobertura esgotadas). É pago primeiro na quitação (B-A10).
    pub landlord_debt: u64,
    /// Total já pago pelo pool a este contrato (limitado a `coverage_cap`).
    pub pool_covered_total: u64,
    pub periods: [PeriodState; MAX_PERIODS],
    pub paid_on_time: u8,
    pub paid_late: u8,
    pub defaults: u8,
    pub end_ts: i64,
    pub dispute_amount: u64,
    pub dispute_resolved: bool,

    pub bump: u8,
    pub vault_bump: u8,
}

pub const SECONDS_PER_YEAR: i64 = 365 * 24 * 60 * 60;

impl Lease {
    /// Vencimento do período `index` (0 = primeiro mês): fim do período.
    /// Conta verificada: nunca entra em pânico por estouro (B-A26).
    pub fn due_ts(&self, index: usize) -> Result<i64> {
        self.period_secs
            .checked_mul(index as i64 + 1)
            .and_then(|d| self.start_ts.checked_add(d))
            .ok_or_else(|| error!(FiadorError::MathOverflow))
    }

    /// Início do período `index`: só a partir daí ele pode ser pago (B-A09).
    pub fn period_start(&self, index: usize) -> Result<i64> {
        self.due_ts(index)?
            .checked_sub(self.period_secs)
            .ok_or_else(|| error!(FiadorError::MathOverflow))
    }

    /// Primeiro período ainda não quitado (Open ou Covered), se houver.
    pub fn next_unsettled(&self) -> Option<usize> {
        (0..self.total_periods as usize)
            .find(|&i| matches!(self.periods[i], PeriodState::Open | PeriodState::Covered))
    }

    /// Prêmio do pool sobre um aluguel.
    pub fn premium(&self) -> Option<u64> {
        let p = (self.rent_amount as u128).checked_mul(self.premium_bps as u128)? / 10_000u128;
        u64::try_from(p).ok()
    }

    /// Cobertura do fundo liberada até agora: nada antes da espera; depois,
    /// `coverage_growth_bps` de um aluguel por aluguel pago, até o teto do contrato,
    /// menos o que o fundo já pagou (antifraude: cobertura crescente).
    pub fn coverage_available(&self) -> u64 {
        let paid = self.paid_on_time as u128 + self.paid_late as u128;
        if paid < self.coverage_waiting_periods as u128 {
            return 0;
        }
        let earned = (self.rent_amount as u128)
            .saturating_mul(self.coverage_growth_bps as u128)
            .saturating_mul(paid)
            / 10_000u128;
        let earned = u64::try_from(earned).unwrap_or(u64::MAX).min(self.coverage_cap);
        earned.saturating_sub(self.pool_covered_total)
    }

    /// Parte de um valor que o fundo paga depois da franquia do proprietário.
    pub fn after_deductible(&self, amount: u64) -> u64 {
        let share = 10_000u128 - self.landlord_deductible_bps as u128;
        ((amount as u128) * share / 10_000u128) as u64
    }

    pub fn has_covered(&self) -> bool {
        self.periods[..self.total_periods as usize].contains(&PeriodState::Covered)
    }

    pub fn has_open(&self) -> bool {
        self.periods[..self.total_periods as usize].contains(&PeriodState::Open)
    }
}
