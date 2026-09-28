"use client";

import { use } from "react";
import { explorerTx } from "@/lib/constants";
import * as H from "@/lib/historia";
import { App, Autenticacao, Barra, Botao, Carimbo, Cartao, COR, Documento, Estado, Icone, Linha, Pad, reais, Txt, Valor } from "@/ui";
import { useInquilino } from "../../dados";

export default function Comprovante({ params }: { params: Promise<{ i: string }> }) {
  const i = Number(use(params).i);
  const x = useInquilino();
  const l = x.l;
  const pago = x.evento("aluguel", i);
  const quit = x.evento("quitacao", i);
  const cob = x.evento("cobranca", i);
  const e = quit ?? pago ?? cob;
  if (!l || !e)
    return <App><Barra titulo="Comprovante" voltar="/inquilino/extrato" /><Pad><Cartao><Estado ic="recibo" cor={COR.graf} fundo={COR.mesa} titulo="Comprovante não encontrado" texto="Ele aparece depois que o pagamento é registrado na Solana." /></Cartao></Pad></App>;
  const quando = new Date(e.t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const [txt, cor] = quit ? ["QUITADO", COR.roxo] : pago ? ["PAGO", COR.verde] : ["PAGO PELA CAUÇÃO", COR.verm];
  return (
    <App>
      <Barra titulo="Comprovante" voltar="/inquilino/extrato" />
      <Pad>
        <Documento>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Recibo de aluguel de {H.nomeMes(i)}</span>
            <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>nº {String(i + 1).padStart(3, "0")}</span>
          </div>
          <Txt style={{ marginTop: 14 }}><b style={{ color: COR.tinta }}>Carlos Mendes</b> recebeu {pago ? <>de <b style={{ color: COR.tinta }}>Ana Lima</b></> : "do cofre do contrato"} a importância de</Txt>
          <div style={{ marginTop: 8 }}><Valor v={x.aluguel} t={40} inteiro /></div>
          <Txt style={{ marginTop: 8 }}>referente ao aluguel de {H.nomeMes(i)} de {H.anoMes(i)}, {H.IMOVEL.endereco}, {H.IMOVEL.bairro}.</Txt>
          <div style={{ marginTop: 12 }}>
            <Linha k="Pagador" v={pago ? "Ana Lima" : "Cofre do contrato"} />
            <Linha k="Recebedor" v="Carlos Mendes" />
            {pago && <Linha k="Taxa de garantia, para o fundo" v={reais(x.taxa)} />}
            {quit && <Linha k="Quitado pela Ana em" v={new Date(quit.t).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} />}
            <Linha k="Data e hora" v={quando} />
            <Linha k="Forma" v={pago ? "Pix" : "cobrança automática"} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 26px" }}><Carimbo txt={txt} cor={cor} t={30} rot={-8} data={H.dataCarimbo(i)} /></div>
          <Autenticacao sig={e.sig} href={e.sig ? explorerTx(e.sig) : undefined} />
          {e.sig && (
            <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: COR.mesa, display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: COR.graf }}>ID da transação na Solana</span>
              <span style={{ fontSize: 13, fontFamily: "ui-monospace, Menlo, monospace", wordBreak: "break-all" }}>{e.sig}</span>
            </div>
          )}
        </Documento>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Botao tipo="secundario" onClick={() => navigator.share?.({ title: "Comprovante Fiador.sol", text: e.texto }).catch(() => {})}><Icone n="compartilhar" t={20} />Compartilhar</Botao>
          <Botao tipo="secundario" onClick={() => window.print()}><Icone n="baixar" t={20} />Salvar PDF</Botao>
        </div>
      </Pad>
    </App>
  );
}
