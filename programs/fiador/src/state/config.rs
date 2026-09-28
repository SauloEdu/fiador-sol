use anchor_lang::prelude::*;

/// Regras globais do protocolo. Criada uma única vez no `initialize`.
/// Contratos copiam os termos daqui na criação, então mudanças futuras
/// nunca alteram um contrato já assinado (SEGURANCA.md, item 8).
#[account]
#[derive(InitSpace)]
pub struct Config {
    pub admin: Pubkey,
    /// Stablecoin de real usada em tudo (tBRL na devnet).
    pub mint: Pubkey,
    /// Deploy de demonstração: permite "meses" de segundos. Fixado no initialize.
    pub demo_mode: bool,
    /// Duração mínima de um período (28 dias em produção).
    pub min_period_secs: i64,
    /// Duração máxima de um período. Impede "meses" de 100 anos que travam o fundo (B-A26).
    pub max_period_secs: i64,
    /// Aluguel mínimo. Impede reputação fabricada com aluguel de centavos (B-A23).
    pub min_rent_amount: u64,
    /// Carência depois do vencimento antes de poder cobrar o atraso.
    pub grace_secs: i64,
    /// Prêmio pago ao pool em cada aluguel, em pontos-base (800 = 8%).
    pub premium_bps: u16,
    /// Rendimento anual simulado da caução, em pontos-base (1000 = 10%).
    pub apy_bps: u16,
    /// Quantos aluguéis o pool cobre além da caução.
    pub coverage_months: u8,
    /// Teto absoluto de cobertura por contrato.
    pub max_coverage_amount: u64,
    /// Aluguéis pagos em dia exigidos antes de o pool passar a cobrir.
    pub coverage_waiting_periods: u8,
    /// Quanto a cobertura do fundo cresce a cada aluguel pago, em pontos-base de
    /// um aluguel (2500 = ¼ de aluguel por mês; cobertura cheia de 3 aluguéis em 12 meses).
    /// Tira o lucro do golpe de pagar pouco e dar calote logo (antifraude, camada 1).
    pub coverage_growth_bps: u16,
    /// Franquia do proprietário: parte do que falta que o fundo NÃO paga (2000 = 20%).
    /// Continua sendo dívida da inquilina com o proprietário (`landlord_debt`).
    pub landlord_deductible_bps: u16,
    /// Fatia máxima do pool que uma única imobiliária pode travar.
    pub agency_max_pool_bps: u16,
    /// Aviso prévio para sacar do pool.
    pub withdraw_cooldown_secs: i64,
    /// Janela para o proprietário contestar danos no fim do contrato.
    pub dispute_window_secs: i64,
    /// Mint do selo "Bom Pagador" (Token-2022, intransferível). `default` = ainda não definido.
    pub badge_mint: Pubkey,
    /// Pausa de emergência: bloqueia a entrada e a saída de dinheiro do fundo e
    /// novos contratos. O pagamento de aluguel continua (08-RESPOSTA-A-GOLPE, passo 1).
    pub paused: bool,
    /// Quarentena do pagamento do fundo: o valor fica retido esse tempo antes de
    /// ir ao proprietário, e o admin pode congelar ou cancelar (antifraude, camada 2).
    pub pool_quarantine_secs: i64,
    pub bump: u8,
}

/// Marcos de pagamentos em dia que rendem um selo.
pub const BADGE_MILESTONES: [u32; 3] = [3, 6, 12];

/// Parâmetros do `initialize`. Validados em `validate`.
#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct ConfigParams {
    pub demo_mode: bool,
    pub min_period_secs: i64,
    pub max_period_secs: i64,
    pub min_rent_amount: u64,
    pub grace_secs: i64,
    pub premium_bps: u16,
    pub apy_bps: u16,
    pub coverage_months: u8,
    pub max_coverage_amount: u64,
    pub coverage_waiting_periods: u8,
    pub coverage_growth_bps: u16,
    pub landlord_deductible_bps: u16,
    pub agency_max_pool_bps: u16,
    pub withdraw_cooldown_secs: i64,
    pub dispute_window_secs: i64,
    pub pool_quarantine_secs: i64,
}

/// 30 dias: a maior quarentena aceita para o pagamento do fundo.
pub const MAX_QUARANTINE_SECS: i64 = 30 * 24 * 60 * 60;

/// 28 dias: o menor "mês" aceito fora do modo demonstração.
pub const PRODUCTION_MIN_PERIOD_SECS: i64 = 28 * 24 * 60 * 60;
/// 35 dias: o maior "mês" aceito em qualquer modo (B-A26).
pub const MAX_PERIOD_SECS_LIMIT: i64 = 35 * 24 * 60 * 60;
pub const BPS: u64 = 10_000;
