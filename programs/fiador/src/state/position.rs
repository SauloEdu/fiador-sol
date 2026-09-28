use anchor_lang::prelude::*;

/// Cotas de um investidor no pool de garantia.
#[account]
#[derive(InitSpace)]
pub struct Position {
    pub owner: Pubkey,
    pub shares: u64,
    /// Cotas com saque pedido (continuam absorvendo perdas até o saque).
    pub pending_shares: u64,
    pub request_ts: i64,
    pub bump: u8,
}
