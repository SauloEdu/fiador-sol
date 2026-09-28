"use client";

import Link from "next/link";
import { useState } from "react";
import { useD, useTick } from "@/components/DemoProvider";
import { agoraChain } from "@/components/useDemo";
import * as A from "@/lib/actions";
import { explorerTx } from "@/lib/constants";
import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { Botao, Cartao, Cartela, COR, Estado, LinkBotao, Linha, Nota, reais, Txt } from "@/ui";
import s from "../imob.module.css";

export default function Contrato() {
  useTick();
  const d = useD();
  const l = d.snap?.lease ?? null;
  const agora = agoraChain(d.snap);
  const [decisao, setDecisao] = useState<number | null>(null);
  const migalhas = (
    <nav aria-label="Você está em" className={s.migalhas}><Link href="/imobiliaria">Contratos</Link><span aria-hidden="true">›</span><span aria-current="page">{H.IMOVEL.endereco}</span></nav>
  );
  if (!l)
    return <>{migalhas}<Cartao pad="28px" style={{ maxWidth: 560 }}><Estado ic="enviar" cor={COR.caneta} fundo="#E4E9FA" titulo="Nenhum contrato ainda" texto="Crie o contrato da Ana para começar." /><LinkBotao href="/imobiliaria/novo">Novo contrato</LinkBotao></Cartao></>;

  const aluguel = fromUnits(l.rent);
  const cofre = fromUnits(l.depositBalance);
  const fundoLivre = fromUnits(H.coberturaDoFundo(l));
  const pedido = fromUnits(l.disputeAmount);
  const valorDecisao = decisao ?? Math.round(pedido * 0.66);
  const m = H.momento(l, agora);
  const ev = d.eventos.filter((e) => e.tipo === "ok" && e.leaseId === d.leaseId);

  async function decidir() {
    await d.executar(
      "Imobiliária Sol", "Registrando a decisão…",
      () => `A Imobiliária Sol decidiu: ${reais(valorDecisao)} da caução para o Carlos. O resto volta para a Ana.`,
      () => A.resolveDispute(d.connection, d.kp!.imobiliaria, d.lease!, d.kp!.proprietario.publicKey, valorDecisao, d.addrs!),
      { kind: "decisao", valor: valorDecisao }
    );
  }

  return (
    <>
      {migalhas}
      <div className={s.tituloLinha}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <h1 className={s.titulo}>{H.IMOVEL.endereco}</h1>
          <Txt>{H.PESSOAS.inquilino.nome} aluga de {H.PESSOAS.proprietario.nome}. {reais(aluguel)} por mês, {l.totalPeriods} meses. Agora: <b style={{ color: COR.tinta }}>{m.titulo.toLowerCase()}</b>.</Txt>
        </div>
      </div>
      <div className={s.grade2}>
        <div style={{ display: "flex", flexDirection: "column", gap: 20, minWidth: 0 }}>
          <Cartao pad="16px"><Cartela cols={6} celulas={l.periods.map((_, i) => ({ mes: H.nomeMes(i, true), estado: H.celula(l, i, agora) }))} /></Cartao>
          <div className={s.tabelaCaixa}>
            <table className={s.tabela}>
              <caption style={{ fontSize: 16, fontWeight: 700, color: COR.tinta }}>O que aconteceu, registrado na Solana</caption>
              <thead><tr><th scope="col">Quando</th><th scope="col">Evento</th><th scope="col">Registro</th></tr></thead>
              <tbody>
                {ev.length ? ev.map((e) => (
                  <tr key={e.id}>
                    <td style={{ whiteSpace: "nowrap", color: COR.graf }}>{new Date(e.t).toLocaleTimeString("pt-BR")}</td>
                    <td style={{ fontSize: 14 }}>{e.texto}</td>
                    <td>{e.sig ? <a href={explorerTx(e.sig)} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>{e.sig.slice(0, 6)}…</a> : "—"}</td>
                  </tr>
                )) : <tr><td colSpan={3} style={{ color: COR.graf }}>Os eventos aparecem aqui assim que acontecem.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {l.status === "disputed" && !l.disputeResolved && (
            <Cartao pad="20px" gap={10}>
              <h2 style={{ margin: 0, fontSize: 18 }}>Decidir os danos</h2>
              <Txt>O Carlos pediu {reais(pedido)} da caução. Decida quanto vai para ele; o resto volta para a Ana.</Txt>
              <label className={s.campo}>Valor para o proprietário (R$)
                <input type="number" min={0} max={pedido} step={50} value={valorDecisao} onChange={(e) => setDecisao(Math.min(pedido, Math.max(0, Number(e.target.value))))} />
                <small>De R$ 0 a {reais(pedido)}, o valor pedido</small>
              </label>
              <div><Linha k="Para o Carlos" v={reais(valorDecisao)} forte /><Linha k="Volta para a Ana" v={`${reais(Math.max(0, cofre - valorDecisao))} + rendimento`} /></div>
              <Botao onClick={decidir} disabled={!!d.ocupado}>{d.ocupado ?? "Confirmar e pagar"}</Botao>
              <Txt peq>Até R$ 1.000 basta uma gestora; acima disso, em produção, outra gestora confirma.</Txt>
            </Cartao>
          )}
          {m.tom === "perigo" && <Nota ic="alerta" cor={COR.verm} fundo="#FBEAE8">{m.titulo}. A cobrança automática paga o Carlos com a caução; vale conversar com a Ana.</Nota>}
          <Cartao pad="8px 18px 12px" gap={0}>
            <Linha k="Caução no cofre" v={reais(cofre)} />
            <Linha k="Fundo de garantia" v={fundoLivre ? `até ${reais(fundoLivre)}` : "entra após o 2º aluguel pago"} />
            <Linha k="Proteção restante" v={reais(cofre + fundoLivre)} forte />
            <Linha k="Pagos em dia / com atraso" v={`${l.paidOnTime} / ${l.paidLate}`} />
            <Linha k="1 mês na demonstração" v={`${l.periodSecs} s (carência ${l.graceSecs} s)`} />
          </Cartao>
          <LinkBotao href="/inquilino" tipo="secundario">Abrir o app da Ana</LinkBotao>
          <LinkBotao href="/proprietario" tipo="secundario">Abrir o app do Carlos</LinkBotao>
        </div>
      </div>
    </>
  );
}
