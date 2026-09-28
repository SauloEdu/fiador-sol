"use client";

import { useState } from "react";
import * as A from "@/lib/actions";
import { explorerTx } from "@/lib/constants";
import * as H from "@/lib/historia";
import { PixFluxo } from "@/components/PixFluxo";
import {
  Abas, App, Autenticacao, Barra, Botao, Carimbo, Cartao, COR, Documento, Estado, Icone, Linha, LinkBotao, Nota, Pad, Passos, reais, Txt, Valor,
} from "@/ui";
import { ABAS, useInquilino } from "../dados";

type Etapa = "revisar" | "pix" | "processando" | "feito" | "erro";

export default function Pagar() {
  const x = useInquilino();
  const { l, d } = x;
  const [etapa, setEtapa] = useState<Etapa>("revisar");
  const [sig, setSig] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [mesPago, setMesPago] = useState<number>(-1);
  const [quitacao, setQuitacao] = useState(false);

  if (!x.pronto || !l)
    return <App abas={<Abas itens={ABAS} ativa="Pagar" />}><Barra titulo="Pagar" voltar="/inquilino" /><Pad><Cartao><Estado girando titulo="Lendo o contrato" /></Cartao></Pad></App>;

  const i = x.proximo;
  const ativo = l.status === "active" || l.status === "defaulted";
  if ((!ativo || i < 0) && etapa === "revisar")
    return (
      <App abas={<Abas itens={ABAS} ativa="Pagar" />}>
        <Barra titulo="Pagar" voltar="/inquilino" />
        <Pad>
          <Estado ic="check" cor={COR.verde} fundo="#E3F1E9" titulo="Nenhum pagamento pendente" texto={l.status === "pending" ? "Primeiro guarde a caução para o contrato começar." : "Não há aluguel em aberto neste contrato."} />
          <LinkBotao href={l.status === "pending" ? "/inquilino/aceitar" : "/inquilino/extrato"} tipo="secundario">{l.status === "pending" ? "Guardar a caução" : "Ver comprovantes"}</LinkBotao>
        </Pad>
      </App>
    );

  const ehQuitacao = i >= 0 && l.periods[i] === "covered";
  const noPrazo = i >= 0 && x.agora <= H.vencimento(l, i);

  async function pagarNaSolana() {
    if (!d.kp || !d.addrs || !d.lease) return;
    setEtapa("processando");
    setMesPago(i);
    setQuitacao(ehQuitacao);
    const r = await d.executar(
      "Ana", "Registrando o pagamento…",
      () => ehQuitacao ? `Ana quitou ${H.nomeMes(i)}: R$ ${x.aluguel} voltaram ao cofre e R$ ${x.taxa} foram para o fundo.` : `Ana pagou ${H.nomeMes(i)}: R$ ${x.aluguel} para o Carlos e R$ ${x.taxa} para o fundo.`,
      () => A.payRent(d.connection, d.kp!.inquilino, d.lease!, d.kp!.proprietario.publicKey, d.addrs!),
      { kind: ehQuitacao ? "quitacao" : "aluguel", periodo: i, valor: x.total }
    );
    if (r) { setSig(r); setEtapa("feito"); }
    else { setErro(d.eventos[0]?.tipo === "erro" ? d.eventos[0].texto : "A rede não confirmou a transação."); setEtapa("erro"); }
  }

  if (etapa === "revisar")
    return (
      <App>
        <Barra titulo="Revise o pagamento" voltar="/inquilino" sub={ehQuitacao ? `Quitação de ${H.nomeMes(i)}` : `Aluguel de ${H.nomeMes(i)}`} />
        <Pad>
          <Cartao pad="20px" gap={8}>
            <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Você vai pagar</span>
            <Valor v={x.total} t={44} />
            <div>
              <Linha k={ehQuitacao ? "Para repor o cofre" : "Para"} v={ehQuitacao ? reais(x.aluguel) : `Carlos Mendes, ${reais(x.aluguel, false)}`} />
              <Linha k="Taxa de garantia, para o fundo" v={reais(x.taxa)} />
              <Linha k="Situação" v={ehQuitacao ? "pago pela caução" : noPrazo ? "no prazo" : x.emCarencia ? "em carência" : "atrasado"} />
              <Linha k="Forma de pagamento" v="Pix" />
            </div>
          </Cartao>
          <Nota ic="cadeado" cor={COR.caneta} fundo="#E4E9FA">
            O Pix cai numa conta do contrato e um registro na Solana {ehQuitacao ? "devolve o dinheiro ao cofre" : "manda o aluguel ao Carlos"} e a taxa ao fundo. Ninguém toca no dinheiro no meio do caminho.
          </Nota>
          <Txt peq>A taxa de garantia não é devolvida. Ela paga a proteção do proprietário caso a caução acabe.</Txt>
          <Botao onClick={() => setEtapa("pix")}>Gerar código Pix</Botao>
          {x.saldo >= x.total && <Botao tipo="secundario" onClick={pagarNaSolana}>Pagar com o saldo da conta ({reais(x.saldo)})</Botao>}
          <LinkBotao href="/inquilino" tipo="texto" style={{ alignSelf: "center" }}>Cancelar</LinkBotao>
        </Pad>
      </App>
    );

  if (etapa === "pix")
    return (
      <App>
        <Barra titulo="Pagar com Pix" fechar="/inquilino" sub={ehQuitacao ? `quitação de ${H.nomeMes(i)}` : `aluguel de ${H.nomeMes(i)}`} />
        <Pad>
          <PixFluxo
            carteira={d.kp!.inquilino.publicKey}
            valor={Math.max(0, x.total - x.saldo) || x.total}
            linhas={ehQuitacao ? [["Para o cofre", reais(x.aluguel)], ["Fundo de garantia", reais(x.taxa)]] : [["Para", `Carlos Mendes, ${reais(x.aluguel, false)}`], ["Fundo de garantia", reais(x.taxa)]]}
            onPago={pagarNaSolana}
            onCancelar={() => setEtapa("revisar")}
          />
        </Pad>
      </App>
    );

  if (etapa === "processando")
    return (
      <App>
        <Barra titulo="Processando" nivel="p" />
        <Estado girando titulo="Pix recebido. Registrando na Solana." texto="Leva uns segundos. A tela avança sozinha." />
        <Pad style={{ marginTop: 22 }}>
          <Cartao pad="20px">
            <Passos itens={[
              [`Pix de ${reais(x.total)} recebido`, "ok"],
              [quitacao ? `${reais(x.aluguel)} de volta ao cofre e ${reais(x.taxa)} ao fundo` : `${reais(x.aluguel)} para o Carlos e ${reais(x.taxa)} para o fundo, num só registro`, "agora"],
              ["Recibo carimbado", ""],
            ]} />
          </Cartao>
        </Pad>
      </App>
    );

  if (etapa === "erro")
    return (
      <App>
        <Barra titulo="Pagamento" fechar="/inquilino" nivel="p" />
        <Estado ic="alerta" cor={COR.verm} fundo="#FBEAE8" selo="NÃO CONSEGUIMOS REGISTRAR AGORA" titulo="Seu Pix está guardado. Nada foi perdido."
          texto="O valor continua na sua conta Fiador.sol e você pode tentar de novo quando quiser. Em produção, o parceiro de Pix faria o estorno." />
        <Pad style={{ marginTop: 22 }}>
          {erro && <Nota ic="info">{erro}</Nota>}
          <Botao onClick={pagarNaSolana}>Tentar de novo</Botao>
          <LinkBotao href="/inquilino" tipo="secundario">Voltar para o início</LinkBotao>
        </Pad>
      </App>
    );

  // feito
  const emDia = x.snap?.profile?.onTime ?? 0;
  const ganhouSelo = [3, 6, 12].includes(emDia) && !quitacao && x.agora <= H.vencimento(l, mesPago) + 1;
  return (
    <App>
      <Barra titulo="Comprovante" fechar="/inquilino" />
      <div className="surgir" style={{ padding: "10px 20px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}>
        <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: "50%", background: COR.verde, display: "flex", alignItems: "center", justifyContent: "center" }}><Icone n="check" t={34} cor="#fff" e={3} /></span>
        <h2 style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 750, letterSpacing: "-0.02em" }}>{quitacao ? "Quitação concluída" : "Pagamento concluído"}</h2>
        <Valor v={x.total} t={36} />
        <span style={{ fontSize: 14, color: COR.graf }}>{quitacao ? "o cofre está cheio de novo" : "para Carlos Mendes"} · agora</span>
      </div>
      <Pad style={{ marginTop: 20 }}>
        <Documento>
          <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>{quitacao ? `Quitação de ${H.nomeMes(mesPago)}` : `Recibo de aluguel de ${H.nomeMes(mesPago)} de ${H.anoMes(mesPago)}`}</span>
          <Txt style={{ marginTop: 12 }}>{quitacao ? <>A <b style={{ color: COR.tinta }}>Ana Lima</b> repôs no cofre do contrato a importância de</> : <><b style={{ color: COR.tinta }}>Carlos Mendes</b> recebeu de <b style={{ color: COR.tinta }}>Ana Lima</b> a importância de</>}</Txt>
          <div style={{ marginTop: 8 }}><Valor v={x.aluguel} t={40} inteiro /></div>
          <Txt style={{ marginTop: 8 }}>A taxa de garantia de {reais(x.taxa)} foi para o fundo.</Txt>
          <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 26px" }}>
            <Carimbo txt={quitacao ? "QUITADO" : "PAGO"} cor={quitacao ? COR.roxo : COR.verde} t={34} rot={-8} data={H.dataCarimbo(mesPago)} animar />
          </div>
          <Autenticacao sig={sig ?? undefined} href={sig ? explorerTx(sig) : undefined} />
        </Documento>
        {ganhouSelo && <Nota ic="selo" cor={COR.verde} fundo="#E3F1E9"><b>Novo selo de bom pagador: {emDia} meses em dia.</b> Ele já está na sua conta e não pode ser vendido nem transferido.</Nota>}
        <LinkBotao href={`/inquilino/comprovante/${mesPago}`} tipo="secundario"><Icone n="recibo" t={20} />Ver comprovante completo</LinkBotao>
        <LinkBotao href="/inquilino">Voltar para o início</LinkBotao>
      </Pad>
    </App>
  );
}
