import { randomUUID } from "node:crypto";

/**
 * Estado da cobrança. `emitindo` é gravado ANTES de pedir o tBRL à rede: duas chamadas
 * ao mesmo tempo, ou um "tentar de novo" depois de um erro, não emitem duas vezes (B-A19).
 */
export type EstadoCobranca = "aberta" | "emitindo" | "paga" | "falhou";
export type Cobranca = { id: string; carteira: string; valor: number; copiaECola: string; paga: boolean; estado: EstadoCobranca };

// Guardado no processo do servidor: é uma simulação de demonstração.
const g = globalThis as unknown as { __cobrancas?: Map<string, Cobranca> };
const cobrancas = (g.__cobrancas ??= new Map());

export function criarCobranca(carteira: string, valor: number): Cobranca {
  const id = randomUUID().replace(/-/g, "").slice(0, 25).toUpperCase();
  const valorTxt = valor.toFixed(2);
  // Formato inspirado no BR Code, mas sem validade: não pague este código em banco real.
  const copiaECola =
    `00020126360014BR.GOV.BCB.PIX0114FIADORSOL-DEMO52040000530398654${String(valorTxt.length).padStart(2, "0")}${valorTxt}` +
    `5802BR5910FIADOR SOL6008BRASILIA62290525${id}6304DEMO`;
  const c: Cobranca = { id, carteira, valor, copiaECola, paga: false, estado: "aberta" };
  cobrancas.set(id, c);
  return c;
}

export function buscarCobranca(id: string) {
  return cobrancas.get(id);
}
