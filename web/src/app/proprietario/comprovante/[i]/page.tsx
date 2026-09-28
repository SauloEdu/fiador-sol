"use client";

import { use } from "react";
import { explorerTx } from "@/lib/constants";
import * as H from "@/lib/historia";
import { App, Autenticacao, Barra, Botao, Carimbo, Cartao, COR, Documento, H2, Icone, Linha, Pad, Txt, Valor } from "@/ui";
import { useProprietario } from "../../dados";

export default function Comprovante({ params }: { params: Promise<{ i: string }> }) {
  const i = Number(use(params).i);
  const x = useProprietario();
  const l = x.l;
  const estado = l?.periods[i];

  if (!x.pronto)
    return <App><Barra titulo="Comprovante" voltar="/proprietario/extrato" /><Pad><Cartao pad="20px"><Txt>Lendo o contrato na Solana…</Txt></Cartao></Pad></App>;

  if (!l || !estado || estado === "open")
    return (
      <App>
        <Barra titulo="Comprovante" voltar="/proprietario/extrato" />
        <Pad><Cartao pad="20px" gap={6}><H2>Comprovante não encontrado</H2><Txt>Ele aparece depois que o aluguel desse mês chega na sua conta.</Txt></Cartao></Pad>
      </App>
    );

  // Quem pagou vem do contrato na Solana; data e ID da transação vêm do evento registrado.
  const daAna = estado === "paid";
  const e = daAna ? x.evento("aluguel", i) : x.evento("cobranca", i);
  const origem = daAna ? "Ana Lima" : "cofre do contrato";
  const quando = e ? new Date(e.t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "registrado na Solana";
  const texto = `Carlos Mendes recebeu R$ ${x.aluguel} do ${origem}, aluguel de ${H.nomeMes(i)} de ${H.anoMes(i)}.`;

  return (
    <App>
      <Barra titulo="Comprovante" voltar="/proprietario/extrato" />
      <Pad>
        <Documento>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Recebimento de {H.nomeMes(i)}</span>
            <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>nº {String(i + 1).padStart(3, "0")}</span>
          </div>
          <Txt style={{ marginTop: 14 }}>
            <b style={{ color: COR.tinta }}>Carlos Mendes</b> recebeu {daAna ? <>de <b style={{ color: COR.tinta }}>Ana Lima</b></> : <>do <b style={{ color: COR.tinta }}>cofre do contrato</b></>} a importância de
          </Txt>
          <div style={{ marginTop: 8 }}><Valor v={x.aluguel} t={40} inteiro /></div>
          <Txt style={{ marginTop: 8 }}>referente ao aluguel de {H.nomeMes(i)} de {H.anoMes(i)}, {H.IMOVEL.endereco}, {H.IMOVEL.bairro}.</Txt>
          <div style={{ marginTop: 12 }}>
            <Linha k="Origem" v={daAna ? "Ana Lima" : "Cofre do contrato"} />
            <Linha k="Recebedor" v="Carlos Mendes" />
            <Linha k="Forma" v={daAna ? "Pix da inquilina" : "cobrança automática, fim da carência"} />
            {estado === "settled" && <Linha k="Depois" v="a Ana repôs o cofre" />}
            <Linha k="Data e hora" v={quando} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 26px" }}>
            <Carimbo txt="RECEBIDO" cor={COR.verde} t={28} rot={-8} data={e ? new Date(e.t).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase().replace(".", "") : undefined} />
          </div>
          <Autenticacao sig={e?.sig} href={e?.sig ? explorerTx(e.sig) : undefined} />
          <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: COR.mesa, display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COR.graf }}>ID da transação na Solana</span>
            <span style={{ fontSize: 13, fontFamily: "ui-monospace, Menlo, monospace", wordBreak: "break-all" }}>
              {e?.sig ?? "Não registrado neste navegador. O recebimento está no contrato, mas o ID fica no aparelho que viu a transação."}
            </span>
          </div>
        </Documento>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Botao tipo="secundario" onClick={() => navigator.share?.({ title: "Comprovante Fiador.sol", text: texto }).catch(() => {})}><Icone n="compartilhar" t={20} />Compartilhar</Botao>
          <Botao tipo="secundario" onClick={() => window.print()}><Icone n="baixar" t={20} />Salvar PDF</Botao>
        </div>
      </Pad>
    </App>
  );
}
