/**
 * Traduz o estado do contrato na Solana para a história que as telas contam:
 * nomes das pessoas, meses do contrato, cartela, cofre e próximos passos.
 * Na demonstração, 1 mês do contrato dura `periodSecs` segundos (60 por padrão).
 */
import type { LeaseView, Snapshot } from "@/components/useDemo";
import { fromUnits } from "./format";

export const PESSOAS = {
  inquilino: { nome: "Ana Lima", curto: "Ana", iniciais: "AL", email: "ana.lima@example.com" },
  proprietario: { nome: "Carlos Mendes", curto: "Carlos", iniciais: "CM", email: "carlos.mendes@example.com" },
  imobiliaria: { nome: "Imobiliária Sol", curto: "Sol", iniciais: "IS", gestora: "Marta Rocha" },
  investidor: { nome: "Rafael Viana", curto: "Rafael", iniciais: "RV" },
} as const;

export const IMOVEL = { endereco: "Rua das Acácias, 302", bairro: "Asa Norte, Brasília" };

/** O contrato da demonstração começa em agosto de 2026; cada período é um mês. */
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const MES_INICIAL = 7; // agosto
export function nomeMes(i: number, curto = false) {
  const m = MESES[(MES_INICIAL + i) % 12];
  return curto ? m.slice(0, 3) : m;
}
export function anoMes(i: number) {
  return 2026 + Math.floor((MES_INICIAL + i) / 12);
}
/** Data do carimbo no calendário da história: "AGO 2026". */
export const dataCarimbo = (i: number) => `${nomeMes(i, true).toUpperCase()} ${anoMes(i)}`;
export const Mes = (i: number) => {
  const m = nomeMes(i);
  return m[0].toUpperCase() + m.slice(1);
};

export const vencimento = (l: LeaseView, i: number) => l.startTs + l.periodSecs * (i + 1);
/** Início do mês `i`: o programa só aceita o pagamento a partir daqui (B-A09). */
export const inicio = (l: LeaseView, i: number) => vencimento(l, i) - l.periodSecs;

export type EstadoCelula = "pago" | "caucao" | "quitado" | "atual" | "carencia" | "atrasado" | "vazio";

/** Estado de cada mês na cartela, na visão do inquilino. */
export function celula(l: LeaseView, i: number, agora: number): EstadoCelula {
  const p = l.periods[i];
  if (p === "paid") return "pago";
  if (p === "covered") return "caucao";
  if (p === "settled") return "quitado";
  if (l.status === "pending") return "vazio";
  const d = vencimento(l, i);
  if (agora > d + l.graceSecs) return "atrasado";
  if (agora > d) return "carencia";
  if (agora >= d - l.periodSecs) return "atual";
  return "vazio";
}

/** Primeiro mês que ainda precisa de dinheiro da inquilina (aberto ou pago pela caução). */
export function proximoAPagar(l: LeaseView) {
  return l.periods.findIndex((p) => p === "open" || p === "covered");
}

/**
 * Cobertura do fundo liberada até agora (mesma regra do programa, `Lease::coverage_available`):
 * nada antes da espera; depois, uma fração do aluguel por aluguel pago, até o teto,
 * menos o que o fundo já pagou. Em unidades de tBRL.
 */
export function coberturaDoFundo(l: LeaseView) {
  const pagos = l.paidOnTime + l.paidLate;
  if (pagos < l.coverageWaitingPeriods) return 0;
  const liberada = Math.min(Math.floor((l.rent * l.coverageGrowthBps * pagos) / 10_000), l.coverageCap);
  return Math.max(0, liberada - l.poolCoveredTotal);
}
/** Parte do que faltar que o fundo paga (fora da franquia do proprietário), em %. */
export const partDoFundo = (l: LeaseView) => 100 - l.landlordDeductibleBps / 100;

export const taxa = (l: LeaseView) => Math.floor((l.rent * l.premiumBps) / 10_000);

/** Mesma regra do programa (TenantProfile::deposit_months). */
export function mesesDeCaucao(p: Snapshot["profile"]) {
  if (!p || p.defaults > 0) return 3;
  if (p.onTime >= 12 && p.leasesStarted >= 2) return 1;
  if (p.onTime >= 6) return 2;
  return 3;
}

/**
 * Rendimento simulado da caução, com a mesma conta do programa (`close_lease`):
 * taxa anual do contrato, 1 ano = 12 meses do contrato, contado só até o fim do prazo,
 * sobre a caução que está no cofre. Em produção, o rendimento viria de aplicação real,
 * sem taxa garantida (B-A20).
 */
export function rendimento(l: LeaseView, agora: number) {
  if (l.status === "pending" || l.startTs === 0) return 0;
  const fimPrazo = vencimento(l, l.totalPeriods - 1);
  const fim = l.status === "closed" ? Math.min(l.endTs, fimPrazo) : Math.min(agora, fimPrazo);
  const anos = Math.max(0, fim - l.startTs) / (l.periodSecs * 12);
  const base = l.status === "closed" ? l.depositRequired : l.depositBalance;
  return fromUnits(base) * (l.apyBps / 10_000) * anos;
}

export function mmss(s: number) {
  const v = Math.max(0, Math.ceil(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, "0")}`;
}

/** Frase curta do momento do contrato, para cabeçalhos e o Palco. */
export function momento(l: LeaseView | null, agora: number): { titulo: string; tom: "neutro" | "alerta" | "perigo" | "ok" } {
  if (!l) return { titulo: "Nenhum contrato ainda", tom: "neutro" };
  if (l.status === "pending") return { titulo: "Esperando a caução", tom: "neutro" };
  if (l.status === "closed") return { titulo: "Contrato encerrado", tom: "ok" };
  if (l.status === "ending") return { titulo: "Vistoria de saída", tom: "neutro" };
  if (l.status === "disputed") return { titulo: "Danos em análise", tom: "alerta" };
  const i = proximoAPagar(l);
  if (i < 0) return { titulo: "Tudo pago", tom: "ok" };
  if (l.periods[i] === "covered") return { titulo: `${Mes(i)} pago pela caução`, tom: "perigo" };
  const d = vencimento(l, i);
  if (agora > d + l.graceSecs) return { titulo: `${Mes(i)} atrasado`, tom: "perigo" };
  if (agora > d) return { titulo: `${Mes(i)} em carência`, tom: "alerta" };
  return { titulo: `${Mes(i)} vence em ${mmss(d - agora)}`, tom: "neutro" };
}
