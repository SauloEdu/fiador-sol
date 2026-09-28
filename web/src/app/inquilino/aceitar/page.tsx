"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import * as A from "@/lib/actions";
import { explorerTx } from "@/lib/constants";
import * as H from "@/lib/historia";
import { PixFluxo } from "@/components/PixFluxo";
import {
  App, Autenticacao, Barra, Botao, Carimbo, Cartao, COR, Documento, Estado, Linha, LinkBotao, Pad, Passos, reais, Txt, Valor,
} from "@/ui";
import { useInquilino } from "../dados";

type Etapa = "convite" | "pix" | "processando" | "feito" | "erro";

function Aceitar() {
  const x = useInquilino();
  const { l, d } = x;
  const so = useSearchParams().get("ver") === "1";
  const [etapa, setEtapa] = useState<Etapa>("convite");
  const [sig, setSig] = useState<string | null>(null);

  if (!x.pronto) return <App><Barra titulo="Convite" voltar="/inquilino" /><Pad><Cartao><Estado girando titulo="Lendo o contrato" /></Cartao></Pad></App>;
  if (!l)
    return (
      <App><Barra titulo="Convite" voltar="/inquilino" /><Pad><Estado ic="enviar" cor={COR.caneta} fundo="#E4E9FA" titulo="Nenhum convite ainda" texto="A Imobiliária Sol ainda não criou o seu contrato." /></Pad></App>
    );

  const meses = H.mesesDeCaucao(x.snap?.profile ?? null);
  const caucao = l.status === "pending" ? x.aluguel * meses : x.cheio - x.rend;
  const aceitavel = l.status === "pending" && !so;

  async function aceitarNaSolana() {
    setEtapa("processando");
    const r = await d.executar(
      "Ana", "Guardando a caução…",
      () => `Ana guardou ${reais(caucao)} de caução no cofre do contrato. O contrato começou.`,
      () => A.acceptLease(d.connection, d.kp!.inquilino, d.lease!, d.agency!, d.addrs!),
      { kind: "caucao", valor: caucao }
    );
    if (r) { setSig(r); setEtapa("feito"); } else setEtapa("erro");
  }

  if (etapa === "convite")
    return (
      <App>
        <Barra titulo="Convite" voltar="/inquilino" nivel="p" />
        <Pad>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: "#B45309", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>IS</span>
            <span style={{ display: "flex", flexDirection: "column" }}><b style={{ fontSize: 15 }}>Imobiliária Sol</b><span style={{ fontSize: 13, color: COR.graf }}>convida você · credenciada no Fiador.sol</span></span>
          </div>
          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1, letterSpacing: "-0.025em" }}>Ana, seu aluguel pode começar sem fiador.</h1>
          <Cartao gap={8}>
            <span style={{ fontSize: 20, fontWeight: 750 }}>{H.IMOVEL.endereco}</span>
            <Txt peq>{H.IMOVEL.bairro}. {l.totalPeriods} meses. Na demonstração, 1 mês dura {l.periodSecs} segundos.</Txt>
            <div>
              <Linha k="Aluguel, para Carlos Mendes" v={reais(x.aluguel)} />
              <Linha k="Taxa de garantia, 8% (não volta)" v={reais(x.taxa)} />
              <Linha k="Você paga todo mês" v={reais(x.total)} forte />
            </div>
          </Cartao>
          <Cartao>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Caução, uma vez só</span>
                <Valor v={caucao} t={36} />
              </div>
              <Carimbo txt="SEM FIADOR" cor={COR.verde} t={18} rot={-8} />
            </div>
            <Txt peq>{meses} aluguéis, porque {meses === 3 ? "você ainda não tem histórico" : "seu histórico de bom pagador reduziu a caução"}. Fica num cofre do contrato que só as regras movimentam, rende 10% ao ano (simulado) e volta no fim, menos danos que a imobiliária aprovar.</Txt>
          </Cartao>
          <Cartao gap={6}>
            <b style={{ fontSize: 15 }}>O contrato em 5 pontos</b>
            <ol style={{ margin: 0, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8, fontSize: 15, lineHeight: 1.45, color: COR.graf }}>
              <li>Aluguel para o Carlos todo mês, mais 8% de taxa de garantia que vai para o fundo e não volta.</li>
              <li>Caução no cofre do contrato, rendendo.</li>
              <li>Atrasou? Carência de {l.graceSecs} s na demo (5 dias no produto). Depois, a caução paga o Carlos e você quita para repor.</li>
              <li>No fim, o Carlos pode registrar danos; a Imobiliária Sol decide. Discordou? Procon ou Justiça.</li>
              <li>O resto da caução volta para você com o rendimento, e os meses em dia viram selos.</li>
            </ol>
          </Cartao>
          {aceitavel ? (
            <>
              <Txt peq>Ao tocar em Aceitar, você concorda com o contrato, incluindo a taxa de garantia de 8% que não volta.</Txt>
              <Botao onClick={() => (x.saldo >= caucao ? aceitarNaSolana() : setEtapa("pix"))}>Aceitar e guardar a caução</Botao>
            </>
          ) : (
            <LinkBotao href="/inquilino" tipo="secundario">Voltar para o início</LinkBotao>
          )}
        </Pad>
      </App>
    );

  if (etapa === "pix")
    return (
      <App>
        <Barra titulo="Pagar com Pix" fechar="/inquilino" sub="caução do contrato" />
        <Pad>
          <PixFluxo carteira={d.kp!.inquilino.publicKey} valor={Math.max(1, caucao - x.saldo)}
            linhas={[["Para", "Cofre do contrato"], ["Volta para você", "no fim, com rendimento"]]}
            onPago={aceitarNaSolana} onCancelar={() => setEtapa("convite")} />
        </Pad>
      </App>
    );

  if (etapa === "processando")
    return (
      <App>
        <Barra titulo="Processando" nivel="p" />
        <Estado girando titulo="Pix recebido. Guardando a caução." texto="Leva uns segundos. A tela avança sozinha." />
        <Pad style={{ marginTop: 22 }}>
          <Cartao pad="20px">
            <Passos itens={[[`Pix de ${reais(caucao)} recebido`, "ok"], ["Convertido em real digital de teste", "ok"], ["Guardando no cofre do contrato, na Solana", "agora"], ["Contrato ativo", ""]]} />
          </Cartao>
        </Pad>
      </App>
    );

  if (etapa === "erro")
    return (
      <App>
        <Barra titulo="Caução" fechar="/inquilino" nivel="p" />
        <Estado ic="alerta" cor={COR.verm} fundo="#FBEAE8" titulo="Não conseguimos guardar a caução agora" texto={d.eventos[0]?.texto ?? "Tente de novo em instantes."} />
        <Pad style={{ marginTop: 22 }}><Botao onClick={aceitarNaSolana}>Tentar de novo</Botao></Pad>
      </App>
    );

  return (
    <App>
      <Barra titulo="Caução" fechar="/inquilino" nivel="p" />
      <Estado ic="check" cor="#fff" fundo={COR.verde} selo="CONTRATO ATIVO" titulo="Caução guardada e lacrada"
        texto="Só as regras do contrato movimentam esse dinheiro: a imobiliária não consegue tirar de lá por conta própria." />
      <Pad style={{ marginTop: 20 }}>
        <Documento>
          <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Comprovante de caução</span>
          <div style={{ marginTop: 10 }}><Valor v={caucao} t={40} inteiro /></div>
          <div style={{ marginTop: 10 }}>
            <Linha k="Guardada em" v={new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })} />
            <Linha k="Rende" v="simulado na demo; em produção, o da aplicação" />
            <Linha k="Primeiro aluguel" v={`vence em ${l.periodSecs} s`} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "16px 0 24px" }}><Carimbo txt="LACRADA" cor={COR.tinta} t={28} rot={-6} animar /></div>
          <Autenticacao sig={sig ?? undefined} href={sig ? explorerTx(sig) : undefined} />
        </Documento>
        <LinkBotao href="/inquilino">Ir para o meu aluguel</LinkBotao>
      </Pad>
    </App>
  );
}

export default function Pagina() {
  return <Suspense><Aceitar /></Suspense>;
}
