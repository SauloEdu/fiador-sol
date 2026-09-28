"use client";

import { useD, useTick } from "@/components/DemoProvider";
import { agoraChain, type Evento } from "@/components/useDemo";
import { DEMO } from "@/lib/constants";
import { fromUnits } from "@/lib/format";
import { COR, type Movimento } from "@/ui";

const hora = (t: number) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/**
 * Eventos de resgate usam `periodo` para dizer a etapa:
 * 0 = resgate pedido (começa o aviso prévio), 1 = resgate concluído (dinheiro saiu do fundo).
 */
export const RESGATE_PEDIDO = 0;
export const RESGATE_CONCLUIDO = 1;

/** Tudo que as telas do Rafael precisam, calculado do fundo na Solana e dos eventos registrados. */
export function useInvestidor() {
  useTick();
  const d = useD();
  const snap = d.snap;
  const pool = snap?.pool ?? { totalAssets: 0, locked: 0, premiums: 0, totalShares: 0 };
  const pos = snap?.position ?? null;

  // Valor de uma cota = dinheiro do fundo ÷ número de cotas. Começa em R$ 1,00.
  const cota = pool.totalShares > 0 ? pool.totalAssets / pool.totalShares : 1;
  const cotas = fromUnits(pos?.shares ?? 0);
  const cotasPedidas = fromUnits(pos?.pending ?? 0);
  const posicao = cotas * cota;

  const noFundo = fromUnits(pool.totalAssets);
  const reservado = fromUnits(pool.locked);
  const livre = Math.max(0, noFundo - reservado);
  const premios = fromUnits(pool.premiums);
  const saldo = fromUnits(snap?.bal.investidor ?? 0);

  // Aviso prévio do resgate: conta a partir do pedido, no relógio da Solana.
  const agora = agoraChain(snap);
  const pediu = (pos?.pending ?? 0) > 0;
  const liberaEm = pediu ? (pos?.requestTs ?? 0) + DEMO.withdrawCooldownSecs : 0;
  const faltaResgate = pediu ? Math.max(0, liberaEm - agora) : 0;
  // O pedido vale por uma janela do tamanho do aviso prévio; depois vence (B-A12).
  const venceEm = pediu ? liberaEm + DEMO.withdrawCooldownSecs : 0;
  const pedidoVencido = pediu && agora > venceEm;
  const faltaVencer = pediu ? Math.max(0, venceEm - agora) : 0;

  // Eventos do investidor (mais novos primeiro).
  const ev = d.eventos.filter((e) => e.tipo === "ok" && (e.kind === "aporte" || e.kind === "resgate"));

  // Quanto ele colocou desde o último resgate concluído (para a variação "desde o aporte").
  let aportado = 0;
  for (const e of ev) {
    if (e.kind === "resgate" && e.periodo === RESGATE_CONCLUIDO) break;
    if (e.kind === "aporte") aportado += e.valor ?? 0;
  }
  const temAporte = aportado > 0 && cotas > 0;
  const variacao = temAporte ? posicao - aportado : 0;

  const movimentos: Movimento[] = ev.map((e: Evento): Movimento => {
    if (e.kind === "aporte")
      return { ic: "setaBaixo", cor: COR.caneta, titulo: "Aporte no fundo", sub: `${hora(e.t)} · Pix`, v: e.valor ?? 0, sinal: "+", status: ["APORTADO", COR.caneta] };
    if (e.periodo === RESGATE_PEDIDO)
      return { ic: "relogio", cor: COR.ambar, titulo: "Resgate pedido", sub: `${hora(e.t)} · aviso prévio de ${DEMO.withdrawCooldownSecs} s`, v: e.valor ?? 0, sinal: "↔", status: ["EM AVISO PRÉVIO", COR.ambar] };
    return { ic: "setaCima", cor: COR.verde, titulo: "Resgate concluído", sub: `${hora(e.t)} · para a sua conta`, v: e.valor ?? 0, sinal: "−", status: ["RESGATADO", COR.verde] };
  });

  return {
    d, snap, cota, cotas, cotasPedidas, posicao, noFundo, reservado, livre, premios, saldo,
    agora, pediu, liberaEm, faltaResgate, pedidoVencido, faltaVencer, ev, aportado, temAporte, variacao, movimentos,
    pronto: !!(snap && d.kp && d.addrs),
  };
}

/** "20.000,00" para cotas (sem R$). */
export const numCotas = (n: number) => new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

/** "0:25" para contagens curtas. */
export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const MENU: [string, string, string][] = [
  ["grafico", "Posição", "/investidor"],
  ["setaBaixo", "Aportar", "/investidor/aportar"],
  ["setaCima", "Resgatar", "/investidor/resgatar"],
  ["doc", "Documentos", "/investidor/documentos"],
];
