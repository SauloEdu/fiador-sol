use anchor_lang::prelude::*;

/// Pool coletivo de garantia ("fiador coletivo").
/// `total_assets` é contábil — nunca lido do saldo do cofre — para impedir
/// o ataque da primeira cota (SEGURANCA.md, item 6).
#[account]
#[derive(InitSpace)]
pub struct Pool {
    pub total_shares: u64,
    pub total_assets: u64,
    /// Cobertura prometida a contratos ativos; não pode ser sacada.
    pub locked_coverage: u64,
    pub premiums_earned: u64,
    pub bump: u8,
    pub vault_bump: u8,
}

impl Pool {
    pub fn free_assets(&self) -> u64 {
        self.total_assets.saturating_sub(self.locked_coverage)
    }
}
