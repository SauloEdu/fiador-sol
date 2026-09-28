"use client";

import Link from "next/link";
import { useD, useTick } from "@/components/DemoProvider";
import { agoraChain } from "@/components/useDemo";
import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { COR, Documento, Icone, LinkBotao, reais, Txt } from "@/ui";
import { Legenda, Mini, simbolos } from "./mini";
import s from "./imob.module.css";

/** Contratos de exemplo, para a carteira não parecer vazia. Só o primeiro (da Ana) é real, na Solana. */
const EXEMPLOS = [
  { im: "Av. Central, 1104", inq: "Bruno Costa", al: 3400, cart: "ppcc--------", sit: "Caução pagou hoje", cor: COR.verm, prot: 13600 },
  { im: "Rua do Sol, 55", inq: "Diego Alves", al: 2600, cart: "pppg--------", sit: "Carência até 17/11", cor: COR.ambar, prot: 15600 },
  { im: "SQN 210, bloco C, 404", inq: "Eduardo Reis", al: 4100, cart: "pppppppppp--", sit: "Pago em 05/11", cor: COR.verde, prot: 24600 },
  { im: "CLN 408, loja 12", inq: "Gustavo Pires", al: 5200, cart: "pppp--------", sit: "Pago em 02/11", cor: COR.verde, prot: 30600 },
];

export default function Carteira() {
  useTick();
  const d = useD();
  const l = d.snap?.lease ?? null;
  const agora = agoraChain(d.snap);
  const m = H.momento(l, agora);
  const aluguelAna = l ? fromUnits(l.rent) : 0;
  const pagosAna = l ? l.periods.filter((p) => p === "paid" || p === "settled").length * aluguelAna : 0;
  const cauAna = l ? l.periods.filter((p) => p === "covered").length * aluguelAna : 0;
  const protAna = l ? fromUnits(l.depositBalance) + (l.paidOnTime + l.paidLate >= 2 ? fromUnits(l.coverageCap - l.poolCoveredTotal) : 0) : 0;
  const corSit = m.tom === "perigo" ? COR.verm : m.tom === "alerta" ? COR.ambar : m.tom === "ok" ? COR.verde : COR.tinta;
  const fita: [string, string, boolean][] = [
    ["Aluguéis do contrato real", reais(aluguelAna * (l?.totalPeriods ?? 0), false), false],
    ["Pagos pela Ana", reais(pagosAna, false), false],
    ["Pagos pela caução", reais(cauAna, false), false],
    ["Recebido pelo Carlos", reais(pagosAna + cauAna, false), true],
  ];
  return (
    <>
      <div className={s.tituloLinha}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className={s.titulo}>Contratos</h1>
          <Txt>{l ? `O contrato da Ana está: ${m.titulo.toLowerCase()}. Os outros contratos da lista são exemplos.` : "Nenhum contrato real ainda. Crie o primeiro para a demonstração começar."}</Txt>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <LinkBotao href="/imobiliaria/novo" peq><Icone n="enviar" t={20} cor="#fff" />Novo contrato</LinkBotao>
        </div>
      </div>
      <Documento style={{ padding: "16px 4px" }}>
        <div className={s.fita} style={{ gridTemplateColumns: `repeat(${fita.length}, minmax(0, 1fr))` }}>
          {fita.map(([k, v, tot]) => <div key={k} className={tot ? s.fitaTotal : ""}><span>{k}</span><b>{v}</b></div>)}
        </div>
      </Documento>
      <div className={s.tabelaCaixa}>
        <table className={s.tabela}>
          <caption>O primeiro contrato é real, na Solana. Os demais são exemplos para mostrar a carteira.</caption>
          <thead>
            <tr><th scope="col">Imóvel e inquilino</th><th scope="col" className={s.dir}>Aluguel</th><th scope="col">Cartela</th><th scope="col">Situação</th><th scope="col" className={s.dir}>Proteção</th></tr>
          </thead>
          <tbody>
            {l ? (
              <tr>
                <td><Link href="/imobiliaria/contrato" className={s.imovel}><b>{H.IMOVEL.endereco}</b><span>{H.PESSOAS.inquilino.nome} · na Solana</span></Link></td>
                <td className={s.dir}>{reais(aluguelAna, false)}</td>
                <td><Mini cart={simbolos(l, agora).join("")} /></td>
                <td style={{ fontSize: 14, fontWeight: 650, color: corSit }}>{m.titulo}</td>
                <td className={s.dir} style={{ color: COR.graf }}>{l.status === "closed" ? "encerrado" : reais(protAna, false)}</td>
              </tr>
            ) : (
              <tr><td colSpan={5}><Link href="/imobiliaria/novo" style={{ fontWeight: 650 }}>Criar o contrato da Ana na Solana</Link></td></tr>
            )}
            {EXEMPLOS.map((e) => (
              <tr key={e.im} className={s.exemplo}>
                <td><span className={s.imovel}><b>{e.im}</b><span>{e.inq} · exemplo</span></span></td>
                <td className={s.dir}>{reais(e.al, false)}</td>
                <td><Mini cart={e.cart} /></td>
                <td style={{ fontSize: 14, fontWeight: 650, color: e.cor }}>{e.sit}</td>
                <td className={s.dir} style={{ color: COR.graf }}>{reais(e.prot, false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Legenda />
    </>
  );
}
