"use client";

import Link from "next/link";
import { useState } from "react";
import { useD } from "@/components/DemoProvider";
import * as A from "@/lib/actions";
import { explorerTx } from "@/lib/constants";
import * as H from "@/lib/historia";
import { Autenticacao, Botao, Carimbo, Cartao, COR, Estado, LinkBotao, Linha, Nota, reais, Txt, Valor } from "@/ui";
import s from "../imob.module.css";

export default function NovoContrato() {
  const d = useD();
  const l = d.snap?.lease ?? null;
  const [aluguel, setAluguel] = useState(2000);
  const [meses, setMeses] = useState(6);
  const [duracao, setDuracao] = useState(60);
  const [sig, setSig] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const taxa = Math.floor(aluguel * 0.08 * 100) / 100;
  const meses_caucao = H.mesesDeCaucao(d.snap?.profile ?? null);
  const pronto = !!(d.kp && d.snap);
  const ocupado = l && l.status !== "closed";

  async function enviar() {
    if (!d.kp) return;
    setEnviando(true);
    const r = await d.executar(
      "Imobiliária Sol", "Criando o contrato…",
      () => `A Imobiliária Sol criou o contrato da ${H.IMOVEL.endereco}: aluguel de ${reais(aluguel)}, ${meses} meses. O Carlos aprovou e a Ana recebeu o convite.`,
      () => A.createLease(d.connection, d.kp!.imobiliaria, d.kp!.proprietario, d.kp!.inquilino.publicKey, d.leaseId, aluguel, meses, duracao),
      { kind: "contrato", valor: aluguel }
    );
    setEnviando(false);
    if (r) setSig(r);
    else setErro("A Solana recusou o registro. Veja o detalhe abaixo e tente de novo.");
  }

  const migalhas = (
    <nav aria-label="Você está em" className={s.migalhas}><Link href="/imobiliaria">Contratos</Link><span aria-hidden="true">›</span><span aria-current="page">Novo contrato</span></nav>
  );

  if (sig)
    return (
      <>
        {migalhas}
        <Cartao pad="28px" style={{ maxWidth: 640 }}>
          <Estado ic="check" cor="#fff" fundo={COR.verde} selo="CONVITES ENVIADOS" titulo="Contrato criado na Solana" texto="O Carlos aprovou e a Ana recebeu o convite. O contrato começa quando ela guardar a caução." />
          <div style={{ display: "flex", justifyContent: "center", margin: "8px 0 16px" }}><Carimbo txt="REGISTRADO" cor={COR.tinta} t={26} rot={-6} animar /></div>
          <Autenticacao sig={sig} href={explorerTx(sig)} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 8 }}>
            <LinkBotao href="/imobiliaria/contrato" tipo="secundario">Ver o contrato</LinkBotao>
            <LinkBotao href="/inquilino">Abrir o app da Ana</LinkBotao>
          </div>
        </Cartao>
      </>
    );

  return (
    <>
      {migalhas}
      <h1 className={s.titulo}>Novo contrato: revise e envie</h1>
      <ol aria-label="Etapas" className={s.etapas}>
        {["Pessoas", "Condições", "Contrato", "Revisar"].map((x, i) => (
          <li key={x} aria-current={i === 3 ? "step" : undefined} style={{ color: i === 3 ? COR.tinta : COR.graf }}>
            <span aria-hidden="true" style={{ background: i === 3 ? COR.tinta : COR.verde }}>{i === 3 ? "4" : "✓"}</span>{x}
            {i < 3 && <span className={s.traco} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      {ocupado && (
        <Nota ic="info">
          Já existe um contrato da Ana na Solana ({H.momento(l, Date.now() / 1000).titulo.toLowerCase()}). Para criar outro com as mesmas pessoas, comece um novo contrato de demonstração.{" "}
          <button type="button" onClick={d.novoContrato} style={{ border: 0, background: "none", color: COR.caneta, fontWeight: 650, cursor: "pointer", padding: 0 }}>Começar outro contrato</button>
        </Nota>
      )}
      <div className={s.grade2}>
        <form onSubmit={(e) => { e.preventDefault(); enviar(); }} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <Cartao pad="22px" gap={14}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Imóvel e pessoas</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
              <label className={s.campo}>Endereço<input value={`${H.IMOVEL.endereco}, ${H.IMOVEL.bairro}`} readOnly /></label>
              <label className={s.campo}>Proprietário<input value={`${H.PESSOAS.proprietario.nome} · aprova no ato`} readOnly /></label>
              <label className={s.campo}>Inquilina<input value={H.PESSOAS.inquilino.nome} readOnly /><small>Recebe o convite no app</small></label>
              <label className={s.campo}>Contrato assinado<input value="PDF · só a impressão digital vai à Solana" readOnly /></label>
            </div>
          </Cartao>
          <Cartao pad="22px" gap={14}>
            <h2 style={{ margin: 0, fontSize: 18 }}>Condições</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              <label className={s.campo}>Aluguel (R$)<input type="number" min={100} step={100} value={aluguel} onChange={(e) => setAluguel(Number(e.target.value))} /></label>
              <label className={s.campo}>Prazo (meses)<input type="number" min={2} max={12} value={meses} onChange={(e) => setMeses(Math.min(12, Math.max(2, Number(e.target.value))))} /></label>
              <label className={s.campo}>1 mês na demo dura<select value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}><option value={60}>60 segundos</option><option value={90}>90 segundos</option><option value={120}>2 minutos</option></select></label>
            </div>
            <Txt peq>Carência e janela de danos seguem as regras do protocolo na demonstração (segundos em vez de dias).</Txt>
          </Cartao>
          {erro && <Nota ic="alerta" cor={COR.verm} fundo="#FBEAE8">{erro} {d.eventos.find((e) => e.tipo === "erro")?.texto}</Nota>}
          <div style={{ display: "flex", gap: 12 }}>
            <Botao type="submit" disabled={!pronto || !!ocupado || enviando || !(aluguel > 0)} style={{ width: "auto" }}>{enviando ? "Registrando na Solana…" : "Enviar convites"}</Botao>
            <LinkBotao href="/imobiliaria" tipo="secundario" peq>Cancelar</LinkBotao>
          </div>
        </form>
        <Cartao pad="20px" gap={8}>
          <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Prévia do que a Ana vai receber</span>
          <b style={{ fontSize: 19 }}>{H.IMOVEL.endereco}</b>
          <div><Linha k="Aluguel" v={reais(aluguel)} /><Linha k="Taxa de garantia (não volta)" v={reais(taxa)} /><Linha k="Todo mês" v={reais(aluguel + taxa)} forte /></div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingTop: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}><span style={{ fontSize: 13, fontWeight: 650, color: COR.graf }}>Caução</span><Valor v={aluguel * meses_caucao} t={30} /></div>
            <Carimbo txt="SEM FIADOR" cor={COR.verde} t={18} rot={-8} />
          </div>
          <Txt peq>{meses_caucao} aluguéis, pela reputação da Ana na Solana. Proteção do Carlos: a caução e, depois de 2 aluguéis pagos, até {reais(Math.min(aluguel * 3, 15000), false)} do fundo.</Txt>
        </Cartao>
      </div>
    </>
  );
}
