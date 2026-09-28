"use client";

import { useState } from "react";
import BN from "bn.js";
import * as A from "@/lib/actions";
import { DEMO, explorerTx } from "@/lib/constants";
import {
  Autenticacao, Botao, Carimbo, Cartao, COR, Documento, Estado, Linha, LinkBotao, Nota, Passos, reais, Txt, Valor,
} from "@/ui";
import { Conectando, useOculto } from "../Casca";
import { mmss, numCotas, RESGATE_CONCLUIDO, RESGATE_PEDIDO, useInvestidor } from "../dados";
import s from "../investidor.module.css";

type Etapa = "ver" | "processando" | "feito" | "erro";

export default function Resgatar() {
  const x = useInvestidor();
  const d = x.d;
  const oculto = useOculto();
  const [etapa, setEtapa] = useState<Etapa>("ver");
  const [acao, setAcao] = useState<"pedir" | "concluir">("pedir");
  const [sig, setSig] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resgatado, setResgatado] = useState(0);

  if (d.erroGeral || !x.pronto) return <Conectando erro={d.erroGeral} texto={d.ocupado} />;

  // Valor das cotas pedidas (ou de todas, antes do pedido), pela cota de agora.
  const valorPedido = x.cotasPedidas * x.cota;
  const cabeNoLivre = (x.pediu ? valorPedido : x.posicao) <= x.livre;

  async function pedir() {
    if (!d.kp || !d.snap?.position) return;
    setAcao("pedir");
    setEtapa("processando");
    const r = await d.executar(
      "Rafael", "Pedindo o resgate…",
      () => `Rafael pediu o resgate de todas as cotas (${reais(x.posicao)}). O aviso prévio de ${DEMO.withdrawCooldownSecs} s começou.`,
      () => A.requestWithdraw(d.connection, d.kp!.investidor, new BN(d.snap!.position!.shares)),
      { kind: "resgate", periodo: RESGATE_PEDIDO, valor: x.posicao }
    );
    if (r) setEtapa("ver");
    else { setErro(d.eventos[0]?.tipo === "erro" ? d.eventos[0].texto : "A rede não confirmou a transação."); setEtapa("erro"); }
  }

  async function concluir() {
    if (!d.kp || !d.addrs) return;
    setAcao("concluir");
    setEtapa("processando");
    setResgatado(valorPedido);
    const r = await d.executar(
      "Rafael", "Concluindo o resgate…",
      () => `Resgate concluído: ${reais(valorPedido)} saíram da parte livre do fundo para a conta do Rafael.`,
      () => A.poolWithdraw(d.connection, d.kp!.investidor, d.addrs!),
      { kind: "resgate", periodo: RESGATE_CONCLUIDO, valor: valorPedido }
    );
    if (r) { setSig(r); setEtapa("feito"); }
    else { setErro(d.eventos[0]?.tipo === "erro" ? d.eventos[0].texto : "A rede não confirmou a transação."); setEtapa("erro"); }
  }

  if (etapa === "processando")
    return (
      <div className={s.estreito}>
        <Estado girando titulo={acao === "pedir" ? "Registrando o pedido na Solana" : "Concluindo o resgate na Solana"} texto="Leva uns segundos. A tela avança sozinha." />
        <Cartao pad="20px">
          <Passos itens={acao === "pedir" ? [
            ["Pedido de resgate de todas as cotas", "agora"],
            [`Aviso prévio de ${DEMO.withdrawCooldownSecs} s`, ""],
          ] : [
            ["Aviso prévio cumprido", "ok"],
            [`${reais(resgatado)} saindo da parte livre do fundo`, "agora"],
            ["Comprovante carimbado", ""],
          ]} />
        </Cartao>
      </div>
    );

  if (etapa === "erro")
    return (
      <div className={s.estreito}>
        <Estado ic="alerta" cor={COR.verm} fundo="#FBEAE8" selo="NÃO CONSEGUIMOS REGISTRAR AGORA" titulo="O resgate não foi feito"
          texto="Suas cotas continuam no fundo. Nada foi perdido." />
        {erro && <Nota ic="info">{erro}</Nota>}
        <Botao onClick={() => { setErro(null); setEtapa("ver"); }}>Voltar ao resgate</Botao>
        <LinkBotao href="/investidor" tipo="secundario">Voltar para a posição</LinkBotao>
      </div>
    );

  if (etapa === "feito")
    return (
      <div className={s.estreito}>
        <Estado ic="check" cor="#fff" fundo={COR.verde} titulo="Resgate concluído" texto="O dinheiro saiu do fundo e está na sua conta Fiador.sol. Em produção, iria por Pix para o seu banco." />
        <Documento>
          <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Comprovante de resgate</span>
          <Txt style={{ marginTop: 12 }}>O Fundo de Garantia Fiador.sol pagou a <b style={{ color: COR.tinta }}>Rafael Viana</b> a importância de</Txt>
          <div style={{ marginTop: 8 }}><Valor v={resgatado} t={40} inteiro /></div>
          <div style={{ marginTop: 8 }}>
            <Linha k="Origem" v="parte livre do fundo" />
            <Linha k="Data" v={new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 26px" }}>
            <Carimbo txt="RESGATADO" cor={COR.verde} t={32} rot={-8} data={new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase().replace(".", "")} animar />
          </div>
          <Autenticacao sig={sig ?? undefined} href={sig ? explorerTx(sig) : undefined} />
        </Documento>
        <LinkBotao href="/investidor">Ver minha posição</LinkBotao>
      </div>
    );

  // ---------- etapa "ver": depende do que está na Solana ----------
  if (x.cotas <= 0)
    return (
      <div className={s.estreito}>
        <Cartao pad="28px 22px" gap={14}>
          <Estado ic="setaCima" cor={COR.graf} fundo={COR.mesa} titulo="Nada para resgatar" texto="Você não tem cotas no fundo agora." />
          <LinkBotao href="/investidor/aportar">Fazer um aporte</LinkBotao>
        </Cartao>
      </div>
    );

  // Pediu e o aviso prévio ainda corre.
  if (x.pediu && x.faltaResgate > 0)
    return (
      <div className={s.estreito}>
        <Cartao pad="24px 20px" gap={14}>
          <Estado ic="relogio" cor={COR.ambar} fundo="#FBF1E2" titulo="Resgate pedido"
            texto={<>O aviso prévio termina em <b role="timer" style={{ color: COR.tinta, fontVariantNumeric: "tabular-nums" }}>{mmss(x.faltaResgate)}</b>. Até lá, suas cotas continuam no fundo, ganhando e correndo risco como antes.</>} />
          <div>
            <Linha k="Cotas pedidas" v={numCotas(x.cotasPedidas)} />
            <Linha k="Valor estimado agora" v={oculto ? "R$ ••••" : reais(valorPedido)} />
            <Linha k="Aviso prévio" v={`${DEMO.withdrawCooldownSecs} s na demo`} />
          </div>
        </Cartao>
        {!cabeNoLivre && <AvisoLivre livre={x.livre} oculto={oculto} />}
        <Botao disabled>Concluir resgate (aguarde {mmss(x.faltaResgate)})</Botao>
      </div>
    );

  // O pedido venceu sem ser concluído: precisa pedir de novo (B-A12).
  if (x.pediu && x.pedidoVencido)
    return (
      <div className={s.estreito}>
        <Cartao pad="24px 20px" gap={14}>
          <Estado ic="relogio" cor={COR.ambar} fundo="#FBF1E2" titulo="O pedido de resgate venceu"
            texto={`Depois do aviso prévio, o resgate precisa ser concluído em ${DEMO.withdrawCooldownSecs} s. Isso impede que alguém deixe um pedido pronto para sair do fundo no instante em que vê um calote chegando. Peça de novo quando quiser.`} />
        </Cartao>
        <Botao onClick={pedir} disabled={!!d.ocupado}>Pedir o resgate de novo</Botao>
      </div>
    );

  // Aviso prévio cumprido.
  if (x.pediu)
    return (
      <div className={s.estreito}>
        <h1 className={s.titulo}>Concluir o resgate</h1>
        <Cartao pad="20px" gap={8}>
          <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Você vai receber, aproximadamente</span>
          <Valor v={valorPedido} t={44} oculto={oculto} />
          <div>
            <Linha k="Cotas" v={numCotas(x.cotasPedidas)} />
            <Linha k="Parte livre do fundo agora" v={oculto ? "R$ ••••" : reais(x.livre)} />
            <Linha k="Para" v="sua conta Fiador.sol" />
          </div>
        </Cartao>
        {!cabeNoLivre && <AvisoLivre livre={x.livre} oculto={oculto} />}
        <Botao onClick={concluir} disabled={!!d.ocupado}>Concluir resgate (em até {mmss(x.faltaVencer)})</Botao>
      </div>
    );

  // Ainda não pediu.
  return (
    <div className={s.estreito}>
      <h1 className={s.titulo}>Resgatar</h1>
      <Cartao pad="20px" gap={8}>
        <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Disponível para resgate</span>
        <Valor v={x.posicao} t={44} oculto={oculto} />
        <div>
          <Linha k="Cotas" v={numCotas(x.cotas)} />
          <Linha k="Aviso prévio" v={`${DEMO.withdrawCooldownSecs} s na demo`} />
          <Linha k="Parte livre do fundo agora" v={oculto ? "R$ ••••" : reais(x.livre)} />
        </div>
      </Cartao>
      <Nota ic="relogio" cor={COR.ambar} fundo="#FBF1E2">
        <b>Como funciona a liquidez.</b> Você pede agora e conclui depois do aviso prévio. O resgate só usa a parte livre do fundo:
        o dinheiro reservado para contratos em andamento só fica livre quando eles terminam.
      </Nota>
      {!cabeNoLivre && <AvisoLivre livre={x.livre} oculto={oculto} />}
      <Txt peq>
        Ao tocar em Pedir resgate, você pede o resgate de todas as suas cotas. Durante o aviso prévio elas continuam no fundo: se houver
        um calote nesse tempo, o valor pode cair.
      </Txt>
      <Botao onClick={pedir} disabled={!!d.ocupado}>Pedir resgate</Botao>
      <LinkBotao href="/investidor" tipo="texto">Cancelar</LinkBotao>
    </div>
  );
}

function AvisoLivre({ livre, oculto }: { livre: number; oculto: boolean }) {
  return (
    <Nota ic="alerta" cor={COR.verm} fundo="#FBEAE8">
      A parte livre do fundo agora ({oculto ? "R$ ••••" : reais(livre)}) é menor que o seu resgate. A conclusão só passa quando
      houver dinheiro livre suficiente, por exemplo depois que um contrato terminar ou outro investidor aportar.
    </Nota>
  );
}
