"use client";

import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { Abas, App, Barra, Cartao, COR, H2, Linha, Nota, Pad, reais, Txt } from "@/ui";
import { ABAS, useProprietario } from "../dados";

const SITUACAO: Record<string, string> = {
  pending: "esperando a caução",
  active: "em andamento",
  defaulted: "em andamento, com atraso",
  ending: "terminou, vistoria de saída",
  disputed: "danos em análise",
  closed: "encerrado",
};

export default function Contrato() {
  const x = useProprietario();
  const l = x.l;

  // Informe de IR simples: soma dos aluguéis recebidos em cada ano.
  const porAno = new Map<number, number>();
  for (const i of x.recebidos) porAno.set(H.anoMes(i), (porAno.get(H.anoMes(i)) ?? 0) + x.aluguel);

  return (
    <App abas={<Abas itens={ABAS} ativa="Contrato" />}>
      <Barra titulo="Contrato" sub={H.IMOVEL.endereco} />
      <Pad>
        {!x.pronto ? (
          <Cartao pad="20px"><Txt>Lendo o contrato na Solana…</Txt></Cartao>
        ) : !l ? (
          <Cartao pad="20px" gap={6}><H2>Nenhum contrato ainda</H2><Txt>Quando a Imobiliária Sol criar o contrato do seu imóvel, o resumo aparece aqui.</Txt></Cartao>
        ) : (
          <>
            <section aria-labelledby="resumo-t" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <H2 id="resumo-t" style={{ padding: "0 4px" }}>Resumo</H2>
              <Cartao pad="6px 18px 12px" gap={0}>
                <Linha k="Imóvel" v={`${H.IMOVEL.endereco}, ${H.IMOVEL.bairro}`} />
                <Linha k="Inquilina" v={H.PESSOAS.inquilino.nome} />
                <Linha k="Imobiliária" v={H.PESSOAS.imobiliaria.nome} />
                <Linha k="Aluguel" v={reais(x.aluguel)} forte />
                <Linha k="Prazo" v={`${l.totalPeriods} meses (1 mês = ${l.periodSecs} s na demo)`} />
                <Linha k="Caução no cofre" v={`${reais(fromUnits(l.depositBalance))} de ${reais(fromUnits(l.depositRequired))}`} />
                <Linha k="Cobertura do fundo" v={`até ${reais(fromUnits(l.coverageCap))}`} />
                <Linha k="Situação" v={SITUACAO[l.status] ?? l.status} />
              </Cartao>
            </section>

            <section aria-labelledby="regras-t" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <H2 id="regras-t" style={{ padding: "0 4px" }}>Regras que protegem você</H2>
              <Cartao pad="16px 18px" gap={0}>
                <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 10, fontSize: 15, lineHeight: 1.45 }}>
                  <li>O aluguel chega inteiro para você. A taxa de garantia de {l.premiumBps / 100}% é paga pela Ana e vai para o fundo.</li>
                  <li>Se a Ana atrasar, há uma carência de {l.graceSecs} s na demo. Depois dela, o cofre do contrato paga você automaticamente.</li>
                  <li>Depois de 2 aluguéis pagos, se a caução acabar, o fundo de garantia cobre até 3 aluguéis, no máximo R$ 15.000.</li>
                  <li>No fim do contrato, você tem {l.disputeWindowSecs} s na demo para registrar danos. A Imobiliária Sol decide quanto sai da caução.</li>
                  <li>Ninguém mexe no cofre na mão: só as regras do contrato movimentam o dinheiro.</li>
                </ol>
              </Cartao>
            </section>

            <section id="ir" aria-labelledby="ir-t" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <H2 id="ir-t" style={{ padding: "0 4px" }}>Informe de IR</H2>
              <Cartao pad="6px 18px 12px" gap={0}>
                {porAno.size === 0 ? (
                  <Linha k="Aluguéis recebidos" v="nenhum ainda" />
                ) : (
                  [...porAno.entries()].map(([ano, total]) => (
                    <Linha key={ano} k={`Aluguéis recebidos em ${ano}`} v={reais(total)} forte />
                  ))
                )}
                <Linha k="Fonte pagadora" v={H.PESSOAS.inquilino.nome} />
              </Cartao>
              <Nota ic="info" cor={COR.caneta} fundo="#E4E9FA">
                Resumo para conferência, somado a partir do contrato na Solana. Inclui os meses que o cofre pagou por você. Não substitui o informe oficial.
              </Nota>
            </section>
          </>
        )}
      </Pad>
    </App>
  );
}
