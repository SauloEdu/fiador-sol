use anchor_lang::prelude::*;

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
    pub fn due_ts(&self, index: usize) -> i64 {
        self.start_ts + self.period_secs * (index as i64 + 1)
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

    pub fn has_covered(&self) -> bool {
        self.periods[..self.total_periods as usize].contains(&PeriodState::Covered)
    }

    pub fn has_open(&self) -> bool {
        self.periods[..self.total_periods as usize].contains(&PeriodState::Open)
    }
}
