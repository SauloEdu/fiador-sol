"use client";

import * as H from "@/lib/historia";
import { Abas, App, Barra, Cartao, COR, Dia, Extrato, H2, Mov, Pad, Txt, Valor, type Movimento } from "@/ui";
import { ABAS, useProprietario, type MovComHora } from "../dados";

/** "Hoje", "Ontem" ou a data, para separar o extrato por dia. */
function rotuloDia(t: number) {
  const dia = new Date(t).toDateString();
  const hoje = new Date();
  const ontem = new Date(Date.now() - 86_400_000);
  if (dia === hoje.toDateString()) return "Hoje";
  if (dia === ontem.toDateString()) return "Ontem";
  return new Date(t).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" });
}

function agrupar(movs: MovComHora[]) {
  const grupos: { dia: string; itens: MovComHora[] }[] = [];
  for (const m of movs) {
    const dia = rotuloDia(m.t);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.dia === dia) ultimo.itens.push(m);
    else grupos.push({ dia, itens: [m] });
  }
  return grupos;
}

export default function ExtratoProprietario() {
  const x = useProprietario();
  const l = x.l;

  // Um recibo por mês recebido, lido direto do contrato na Solana.
  const recibos: Movimento[] = l
    ? x.recebidos.map((i) => {
        const daAna = l.periods[i] === "paid";
        return {
          ic: "recibo", cor: COR.verde, titulo: `Recibo de ${H.nomeMes(i)} de ${H.anoMes(i)}`,
          sub: daAna ? "de Ana Lima" : "do cofre do contrato", v: x.aluguel, sinal: "+",
          href: `/proprietario/comprovante/${i}`, status: ["RECEBIDO", COR.verde],
        };
      })
    : [];

  return (
    <App abas={<Abas itens={ABAS} ativa="Extrato" />}>
      <Barra titulo="Extrato" sub="Contrato da Rua das Acácias" />
      <Pad>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Cartao pad="14px 16px" gap={4}>
            <span style={{ fontSize: 13, color: COR.graf }}>Aluguéis recebidos</span>
            <Valor v={x.recebidoTotal} t={26} />
            <span style={{ fontSize: 13, color: COR.graf }}>{x.recebidos.length} {x.recebidos.length === 1 ? "mês" : "meses"}</span>
          </Cartao>
          <Cartao pad="14px 16px" gap={4}>
            <span style={{ fontSize: 13, color: COR.graf }}>Vindo da caução</span>
            <Valor v={x.daCaucao} t={26} />
            <span style={{ fontSize: 13, color: COR.graf }}>pago pelo cofre</span>
          </Cartao>
        </div>

        {x.movs.length ? (
          <Extrato titulo="Movimentações">
            {agrupar(x.movs).map((g) => [
              <Dia key={`d-${g.dia}`}>{g.dia}</Dia>,
              ...g.itens.map((m, k) => <Mov key={`${g.dia}-${k}`} m={m} />),
            ])}
          </Extrato>
        ) : (
          <Cartao pad="20px" gap={6}><H2>Nada por aqui ainda</H2><Txt>As movimentações aparecem assim que acontecem na Solana.</Txt></Cartao>
        )}

        {recibos.length > 0 && (
          <div id="recibos">
            <Extrato titulo="Recibos por mês">{recibos.map((m, k) => <Mov key={k} m={m} />)}</Extrato>
          </div>
        )}
        <Txt peq>O aluguel chega inteiro para você. A taxa de garantia é paga pela Ana e vai para o fundo. Toque numa linha para ver o comprovante.</Txt>
      </Pad>
    </App>
  );
}
