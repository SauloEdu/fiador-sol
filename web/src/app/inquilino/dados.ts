"use client";

import { useD, useTick } from "@/components/DemoProvider";
import { agoraChain, type Evento } from "@/components/useDemo";
import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { COR, type CelulaUI, type Movimento } from "@/ui";

const hora = (t: number) => new Date(t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

/** Tudo que as telas da Ana precisam, calculado do contrato na Solana e dos eventos registrados. */
export function useInquilino() {
  useTick();
  const d = useD();
  const snap = d.snap;
  const l = snap?.lease ?? null;
  const agora = agoraChain(snap);
  const ev = d.eventos.filter((e) => e.tipo === "ok" && (e.leaseId === undefined || e.leaseId === d.leaseId));
  const evento = (kind: Evento["kind"], periodo?: number) =>
    ev.find((e) => e.kind === kind && (periodo === undefined || e.periodo === periodo));

  const aluguel = l ? fromUnits(l.rent) : 2000;
  const taxa = l ? fromUnits(H.taxa(l)) : 160;
  const total = aluguel + taxa;
  const proximo = l ? H.proximoAPagar(l) : -1;
  const venc = l && proximo >= 0 ? H.vencimento(l, proximo) : 0;
  const falta = venc - agora;
  const emCarencia = !!l && proximo >= 0 && l.periods[proximo] === "open" && agora > venc && agora <= venc + l.graceSecs;
  const atrasado = !!l && proximo >= 0 && l.periods[proximo] === "open" && agora > venc + l.graceSecs;
  const pagoPelaCaucao = !!l && proximo >= 0 && l.periods[proximo] === "covered";
  const rend = l ? H.rendimento(l, agora) : 0;
  const cofre = l ? fromUnits(l.depositBalance) + rend : 0;
  const cheio = l ? fromUnits(l.depositRequired) + rend : 0;
  const pagos = l ? l.periods.filter((p) => p === "paid").length : 0;
  const saldo = fromUnits(snap?.bal.inquilino ?? 0);

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
          e === "quitado" ? quando("quitacao") :
          e === "atual" ? `vence em ${H.mmss(H.vencimento(l, i) - agora)}` :
          e === "carencia" ? `carência ${H.mmss(H.vencimento(l, i) + l.graceSecs - agora)}` : undefined;
        return { mes: H.nomeMes(i, true), estado: e, data };
      })
    : [];

  /** Movimentações da conta da Ana (Pix que saíram dela). */
  const movConta: Movimento[] = ev
    .filter((e) => e.kind === "aluguel" || e.kind === "quitacao" || e.kind === "caucao")
    .map((e): Movimento => {
      const i = e.periodo ?? 0;
      if (e.kind === "caucao")
        return { ic: "cofre", cor: COR.tinta, titulo: "Caução guardada", sub: `${hora(e.t)} · Pix para o cofre`, v: e.valor ?? 0, sinal: "−", href: "/inquilino/caucao", status: ["GUARDADA", COR.tinta] };
      if (e.kind === "quitacao")
        return { ic: "recibo", cor: COR.roxo, titulo: `Quitação de ${H.nomeMes(i)}`, sub: `${hora(e.t)} · Pix para o cofre`, v: e.valor ?? total, sinal: "−", href: `/inquilino/comprovante/${i}`, status: ["QUITADO", COR.roxo] };
      return { ic: "recibo", cor: COR.verde, titulo: `Aluguel de ${H.nomeMes(i)}`, sub: `${hora(e.t)} · Pix · Carlos M.`, v: e.valor ?? total, sinal: "−", href: `/inquilino/comprovante/${i}`, status: ["PAGO", COR.verde] };
    });

  /** Movimentações do cofre (o que as regras do contrato fizeram com a caução). */
  const movCofre: Movimento[] = ev
    .filter((e) => e.kind === "caucao" || e.kind === "cobranca" || e.kind === "quitacao" || e.kind === "acerto")
    .map((e): Movimento => {
      const i = e.periodo ?? 0;
      if (e.kind === "caucao") return { ic: "setaBaixo", cor: COR.tinta, titulo: "Caução guardada", sub: `${hora(e.t)} · da Ana`, v: e.valor ?? 0, sinal: "+", status: ["GUARDADA", COR.tinta] };
      if (e.kind === "cobranca") return { ic: "setaCima", cor: COR.verm, titulo: `Pagou ${H.nomeMes(i)} ao Carlos`, sub: `${hora(e.t)} · fim da carência`, v: aluguel, sinal: "−", href: `/inquilino/comprovante/${i}`, status: ["PELA CAUÇÃO", COR.verm] };
      if (e.kind === "quitacao") return { ic: "setaBaixo", cor: COR.roxo, titulo: `Reposição de ${H.nomeMes(i)}`, sub: `${hora(e.t)} · da Ana`, v: aluguel, sinal: "+", status: ["QUITADO", COR.roxo] };
      return { ic: "setaCima", cor: COR.verde, titulo: "Caução devolvida", sub: `${hora(e.t)} · para a Ana`, v: e.valor ?? 0, sinal: "−", status: ["DEVOLVIDA", COR.verde] };
    });

  return {
    d, snap, l, agora, ev, evento, aluguel, taxa, total, proximo, venc, falta, emCarencia, atrasado, pagoPelaCaucao,
    rend, cofre, cheio, pagos, saldo, celulas, movConta, movCofre, pronto: !!(snap && d.kp && d.addrs && d.lease),
  };
}

export const ABAS: [string, string, string][] = [
  ["casa", "Início", "/inquilino"],
  ["recibo", "Extrato", "/inquilino/extrato"],
  ["pix", "Pagar", "/inquilino/pagar"],
  ["cofre", "Caução", "/inquilino/caucao"],
  ["pessoa", "Conta", "/inquilino/conta"],
];
