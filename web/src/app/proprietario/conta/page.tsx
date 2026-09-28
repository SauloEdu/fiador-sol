"use client";

import Link from "next/link";
import { CLUSTER, explorerAddress } from "@/lib/constants";
import { PESSOAS } from "@/lib/historia";
import { Abas, App, Barra, Cartao, COR, Icone, Linha, Nota, Pad, reais, Txt } from "@/ui";
import { ABAS, useProprietario } from "../dados";

export default function Conta() {
  const x = useProprietario();
  const carteira = x.d.kp?.proprietario.publicKey.toBase58();
  const item = (ic: string, t: string, sub: string, href?: string) => {
    const corpo = (
      <>
        <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: "50%", background: COR.mesa, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icone n={ic} t={20} /></span>
        <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 15, fontWeight: 650 }}>{t}</span><span style={{ fontSize: 13, color: COR.graf }}>{sub}</span></span>
      </>
    );
    const st = { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", minHeight: 56, textDecoration: "none", color: COR.tinta, borderBottom: "1px solid #D9DFE8" } as const;
    return href ? <Link href={href} style={st} target={href.startsWith("http") ? "_blank" : undefined}>{corpo}</Link> : <div style={st}>{corpo}</div>;
  };
  return (
    <App abas={<Abas itens={ABAS} ativa="Conta" />}>
      <Barra titulo="Conta" />
      <Pad>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "0 4px" }}>
          <span aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", background: COR.tinta, color: COR.papel, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700 }}>{PESSOAS.proprietario.iniciais}</span>
          <span style={{ display: "flex", flexDirection: "column" }}><b style={{ fontSize: 19 }}>{PESSOAS.proprietario.nome}</b><span style={{ fontSize: 14, color: COR.graf }}>{PESSOAS.proprietario.email}</span></span>
        </div>
        <Cartao pad="6px 18px 12px" gap={0}>
          <Linha k="Saldo na conta Fiador.sol" v={reais(x.saldo)} forte />
          <Linha k="Conta para transferência" v="desativada na demo" />
          <Linha k="Rede" v={CLUSTER === "devnet" ? "Solana devnet" : "Solana local (teste)"} />
        </Cartao>
        <section style={{ background: "#fff", borderRadius: 18, overflow: "hidden" }}>
          {item("cadeado", "Acesso sem senha", "Código de 6 números no e-mail a cada entrada")}
          {item("celular", "Aparelhos conectados", "Este navegador · conta de teste criada automaticamente")}
          {carteira && item("doc", "Sua conta na Solana", `${carteira.slice(0, 6)}…${carteira.slice(-6)} · ver no explorador`, explorerAddress(carteira))}
        </section>
        <section id="ajuda" style={{ background: "#fff", borderRadius: 18, padding: "4px 16px" }}>
          {[["E se a Ana atrasar?", "Há uma carência. Depois dela, o cofre do contrato paga você automaticamente. Você não precisa cobrar ninguém."],
            ["E se a caução acabar?", "Depois de 2 aluguéis pagos, o fundo de garantia cobre até 3 aluguéis, no máximo R$ 15.000."],
            ["Como peço danos no fim?", "Quando o contrato termina, abre um prazo de vistoria. Registre o valor e a descrição; a Imobiliária Sol decide quanto sai da caução."]].map(([q, a], k) => (
            <details key={q} open={k === 0} style={{ borderBottom: "1px solid #D9DFE8" }}>
              <summary style={{ minHeight: 48, display: "flex", alignItems: "center", fontSize: 15, fontWeight: 650, cursor: "pointer" }}>{q}</summary>
              <p style={{ margin: "0 0 14px", fontSize: 14, lineHeight: 1.45, color: COR.graf }}>{a}</p>
            </details>
          ))}
        </section>
        <Nota ic="alerta"><b>Nunca pedimos seu código por telefone, WhatsApp ou e-mail.</b> Se alguém pedir, é golpe.</Nota>
        <Txt peq style={{ textAlign: "center" }}>Fiador.sol versão 1.0 · demonstração em rede de teste</Txt>
      </Pad>
    </App>
  );
}
