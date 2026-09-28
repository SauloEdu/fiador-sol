use anchor_lang::prelude::*;

/// Histórico de bom pagador. Só o programa escreve aqui, e a conta não é
/// transferível: a reputação é do inquilino.
#[account]
#[derive(InitSpace)]
pub struct TenantProfile {
    pub tenant: Pubkey,
    pub on_time: u32,
    pub late: u32,
    pub defaults: u32,
    /// Contratos iniciados (aceitos) por este inquilino.
    pub leases_started: u32,
    pub leases_completed: u32,
    pub bump: u8,
}

impl TenantProfile {
    /// Tier de reputação:
    /// 0 — sem histórico · 1 — ≥ 6 em dia · 2 — ≥ 12 em dia em ≥ 2 contratos.
    /// Qualquer calote zera o benefício.
    pub fn tier(&self) -> u8 {
        if self.defaults > 0 {
            0
        } else if self.on_time >= 12 && self.leases_started >= 2 {
            2
        } else if self.on_time >= 6 {
            1
        } else {
            0
        }
    }

    /// Quantos aluguéis de caução o tier exige (3 é o teto da Lei 8.245, art. 38).
    pub fn deposit_months(&self) -> u64 {
        match self.tier() {
            2 => 1,
            1 => 2,
            _ => 3,
        }
    }
}
