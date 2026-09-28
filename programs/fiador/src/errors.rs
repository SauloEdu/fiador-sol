use anchor_lang::prelude::*;

#[error_code]
pub enum FiadorError {
    #[msg("Parâmetro de configuração inválido")]
    InvalidConfig,
    #[msg("Período menor que o mínimo permitido")]
    PeriodTooShort,
    #[msg("Número de períodos inválido")]
    InvalidPeriods,
    #[msg("Valor do aluguel inválido")]
    InvalidRent,
    #[msg("Proprietário e inquilino precisam ser pessoas diferentes")]
    SameParty,
    #[msg("Imobiliária não credenciada ou inativa")]
    AgencyInactive,
    #[msg("Contrato não está no estado esperado")]
    InvalidStatus,
    #[msg("Pool sem cobertura livre suficiente")]
    InsufficientPoolCoverage,
    #[msg("Imobiliária atingiu o limite de cobertura do pool")]
    AgencyCoverageLimit,
    #[msg("Conta de token com mint ou dono errado")]
    InvalidTokenAccount,
    #[msg("Estouro aritmético")]
    MathOverflow,
    #[msg("Todos os períodos já foram pagos")]
    NoPeriodDue,
    #[msg("Nenhum período vencido além da carência")]
    NothingToClaim,
    #[msg("O contrato ainda não chegou ao fim")]
    LeaseNotOver,
    #[msg("Ainda há períodos vencidos sem pagamento nem cobrança")]
    PendingPeriods,
    #[msg("Fora da janela de contestação")]
    DisputeWindowClosed,
    #[msg("A janela de contestação ainda está aberta")]
    DisputeWindowOpen,
    #[msg("Valor inválido")]
    InvalidAmount,
    #[msg("Aviso prévio de saque ainda não terminou")]
    CooldownActive,
    #[msg("Não há pedido de saque")]
    NoPendingWithdraw,
    #[msg("Saque maior que o valor livre do pool")]
    WithdrawExceedsFree,
    #[msg("Mint do selo inválido: precisa ser Token-2022, intransferível, 0 casas e autoridade = config")]
    InvalidBadgeMint,
    #[msg("Contas do selo ausentes ou erradas")]
    InvalidBadgeAccounts,
}
