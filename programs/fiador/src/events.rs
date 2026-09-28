//! Eventos do programa: tudo o que move dinheiro fica registrado nos logs da
//! transação, para monitorar, conciliar e investigar golpes (B-A38).
use anchor_lang::prelude::*;

#[event]
pub struct AluguelPago {
    pub lease: Pubkey,
    pub periodo: u8,
    pub em_dia: bool,
    pub ao_proprietario: u64,
    pub ao_fundo: u64,
    pub a_caucao: u64,
}

#[event]
pub struct AtrasoCobrado {
    pub lease: Pubkey,
    pub periodo: u8,
    pub da_caucao: u64,
    pub do_fundo: u64,
    pub em_quarentena: bool,
    pub falta_ao_proprietario: u64,
}

#[event]
pub struct PagamentoDoFundoLiberado {
    pub lease: Pubkey,
    pub valor: u64,
}

#[event]
pub struct PagamentoDoFundoCongelado {
    pub lease: Pubkey,
    pub congelado: bool,
}

#[event]
pub struct PagamentoDoFundoCancelado {
    pub lease: Pubkey,
    pub valor: u64,
}

#[event]
pub struct ProtocoloPausado {
    pub pausado: bool,
}

#[event]
pub struct ImobiliariaAtualizada {
    pub agency: Pubkey,
    pub ativa: bool,
}

#[event]
pub struct ContratoEncerrado {
    pub lease: Pubkey,
    pub devolvido_a_inquilina: u64,
    pub rendimento: u64,
    /// Rendimento devido pela conta. Se for maior que o pago, a reserva acabou (B-A20).
    pub rendimento_devido: u64,
    pub calote: bool,
}
