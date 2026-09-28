use anchor_lang::prelude::*;

/// Imobiliária credenciada pelo admin. Só ela cria contratos, o que barra
/// o conluio proprietário+inquilino para drenar o pool (SEGURANCA.md, item 1).
#[account]
#[derive(InitSpace)]
pub struct Agency {
    pub authority: Pubkey,
    pub active: bool,
    /// Soma da cobertura do pool travada pelos contratos ativos desta imobiliária.
    pub coverage_in_use: u64,
    pub bump: u8,
}
