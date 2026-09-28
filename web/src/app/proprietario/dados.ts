"use client";

import { useEffect, useState } from "react";
import { useD, useTick } from "@/components/DemoProvider";
import { agoraChain, type Evento } from "@/components/useDemo";
import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { COR, type CelulaUI, type Movimento } from "@/ui";

const hora = (t: number) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Movimentação com o horário, para o extrato poder agrupar por dia. */
export type MovComHora = Movimento & { t: number };

/** Tudo que as telas do Carlos precisam, calculado do contrato na Solana e dos eventos registrados. */
export function useProprietario() {
  useTick();
  const d = useD();
  const snap = d.snap;
  const l = snap?.lease ?? null;
  const agora = agoraChain(snap);
  const ev = d.eventos.filter((e) => e.tipo === "ok" && (e.leaseId === undefined || e.leaseId === d.leaseId));
  const evento = (kind: Evento["kind"], periodo?: number) =>
    ev.find((e) => e.kind === kind && (periodo === undefined || e.periodo === periodo));

  const aluguel = l ? fromUnits(l.rent) : 2000;
  const saldo = fromUnits(snap?.bal.proprietario ?? 0);

  // Meses já recebidos pelo Carlos: pagos pela Ana ou pagos pelo cofre (e depois quitados ou não).
  const recebidos = l ? l.periods.map((p, i) => ({ p, i })).filter(({ p }) => p === "paid" || p === "covered" || p === "settled").map(({ i }) => i) : [];
  const recebidoTotal = recebidos.length * aluguel;
  const daCaucao = l ? l.periods.filter((p) => p === "covered" || p === "settled").length * aluguel : 0;

  // Próximo aluguel que o Carlos ainda vai receber.
  const proximo = l ? l.periods.findIndex((p) => p === "open") : -1;
  const venc = l && proximo >= 0 ? H.vencimento(l, proximo) : 0;
  const falta = venc - agora;

  // Proteção: o que há no cofre agora mais a cobertura do fundo que ainda sobra.
  const cofre = l ? fromUnits(l.depositBalance) : 0;
  const pagosAteAgora = l ? l.paidOnTime + l.paidLate : 0;
  const fundoAtivo = !!l && pagosAteAgora >= l.coverageWaitingPeriods;
  const fundo = l && fundoAtivo ? fromUnits(H.coberturaDoFundo(l)) : 0;
  const protecao = cofre + fundo;

  // Janela para registrar danos, depois que o contrato termina.
  const fimJanela = l ? l.endTs + l.disputeWindowSecs : 0;
  const janelaAberta = !!l && l.status === "ending" && agora <= fimJanela;

  const celulas: CelulaUI[] = l
    ? l.periods.map((_, i) => {
        const e = H.celula(l, i, agora);
        const quando = (k: Evento["kind"]) => {
          const x = evento(k, i);
          return x ? new Date(x.t).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : undefined;
        };
        const data =
          e === "pago" ? quando("aluguel") :
          e === "caucao" ? quando("cobranca") :
          e === "quitado" ? quando("cobranca") :
          e === "atual" ? `vence em ${H.mmss(H.vencimento(l, i) - agora)}` :
          e === "carencia" ? `carência ${H.mmss(H.vencimento(l, i) + l.graceSecs - agora)}` : undefined;
        return { mes: H.nomeMes(i, true), estado: e, data, visao: "proprietario" };
      })
    : [];

  /** Movimentações da conta do Carlos: o que entrou para ele e o pedido de danos. */
  const movs: MovComHora[] = ev
    .filter((e) => e.kind === "aluguel" || e.kind === "cobranca" || e.kind === "danos" || (e.kind === "decisao" && (e.valor ?? 0) > 0))
    .map((e): MovComHora => {
      const i = e.periodo ?? 0;
      if (e.kind === "aluguel")
        return { t: e.t, ic: "setaBaixo", cor: COR.verde, titulo: `Aluguel de ${H.nomeMes(i)}`, sub: `${hora(e.t)} · de Ana Lima`, v: aluguel, sinal: "+", href: `/proprietario/comprovante/${i}`, status: ["RECEBIDO", COR.verde] };
      if (e.kind === "cobranca")
        return { t: e.t, ic: "cofre", cor: COR.verde, titulo: `Aluguel de ${H.nomeMes(i)}`, sub: `${hora(e.t)} · do cofre do contrato`, v: aluguel, sinal: "+", href: `/proprietario/comprovante/${i}`, status: ["RECEBIDO", COR.verde] };
      if (e.kind === "danos")
        return { t: e.t, ic: "balanca", cor: COR.ambar, titulo: "Pedido de danos", sub: `${hora(e.t)} · em análise pela imobiliária`, v: e.valor ?? 0, sinal: "↔", status: ["PEDIDO", COR.ambar] };
      return { t: e.t, ic: "balanca", cor: COR.roxo, titulo: "Danos aprovados", sub: `${hora(e.t)} · da caução, decisão da imobiliária`, v: e.valor ?? 0, sinal: "+", status: ["DECIDIDO", COR.roxo] };
    });

  return {
    d, snap, l, agora, ev, evento, aluguel, saldo, recebidos, recebidoTotal, daCaucao, proximo, venc, falta,
    cofre, fundo, fundoAtivo, protecao, fimJanela, janelaAberta, celulas, movs,
    pronto: !!(snap && d.kp && d.addrs && d.lease),
  };
}

/** Olho de ocultar valores: a escolha fica guardada neste navegador. */
export function useOculto() {
  const [oculto, set] = useState(false);
  useEffect(() => { try { set(localStorage.getItem("fiador-oculto") === "1"); } catch { /* ok */ } }, []);
  const alternar = () => set((v) => { try { localStorage.setItem("fiador-oculto", v ? "0" : "1"); } catch { /* ok */ } return !v; });
  return [oculto, alternar] as const;
}

export const ABAS: [string, string, string][] = [
  ["casa", "Início", "/proprietario"],
  ["recibo", "Extrato", "/proprietario/extrato"],
  ["doc", "Contrato", "/proprietario/contrato"],
  ["pessoa", "Conta", "/proprietario/conta"],
];
