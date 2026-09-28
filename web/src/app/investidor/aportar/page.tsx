"use client";

import { useState } from "react";
import * as A from "@/lib/actions";
import { DEMO, explorerTx } from "@/lib/constants";
import { PixFluxo } from "@/components/PixFluxo";
import {
  Autenticacao, Botao, Carimbo, Cartao, COR, Documento, Estado, Icone, Linha, LinkBotao, Nota, Passos, reais, Txt, Valor,
} from "@/ui";
import { Conectando } from "../Casca";
import { numCotas, useInvestidor } from "../dados";
import s from "../investidor.module.css";

type Etapa = "valor" | "pix" | "processando" | "feito" | "erro";

const MINIMO = 100;
const MAXIMO = 500_000; // limite por hora do Pix simulado
const SUGESTOES = [5_000, 20_000, 50_000];

/** Lê "20.000,50" ou "20000.5" como número. */
function lerValor(txt: string) {
  const limpo = txt.replace(/[^\d,.]/g, "");
  const n = limpo.includes(",") ? Number(limpo.replace(/\./g, "").replace(",", ".")) : Number(limpo.replace(/\.(?=\d{3}(\D|$))/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export default function Aportar() {
  const x = useInvestidor();
  const d = x.d;
  const [etapa, setEtapa] = useState<Etapa>("valor");
  const [texto, setTexto] = useState("20.000");
  const [sig, setSig] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<{ valor: number; cotas: number; cota: number } | null>(null);

  if (d.erroGeral || !x.pronto) return <Conectando erro={d.erroGeral} texto={d.ocupado} />;

  const valor = lerValor(texto);
  const cotasPrevistas = valor / x.cota;
  const problema =
    valor < MINIMO ? `O aporte mínimo é ${reais(MINIMO, false)}.` :
    valor > MAXIMO ? `Na demonstração, o limite é ${reais(MAXIMO, false)} por aporte.` : null;

  async function aportarNaSolana() {
    if (!d.kp || !d.addrs) return;
    setEtapa("processando");
    setFeito({ valor, cotas: cotasPrevistas, cota: x.cota });
    const r = await d.executar(
      "Rafael", "Registrando o aporte…",
      () => `Rafael aportou ${reais(valor)} no fundo de garantia. Ele passa a receber parte dos ${DEMO.premiumBps / 100}% de cada aluguel pago.`,
      () => A.poolDeposit(d.connection, d.kp!.investidor, valor, d.addrs!),
      { kind: "aporte", valor }
    );
    if (r) { setSig(r); setEtapa("feito"); }
    else { setErro(d.eventos[0]?.tipo === "erro" ? d.eventos[0].texto : "A rede não confirmou a transação."); setEtapa("erro"); }
  }

  if (etapa === "valor")
    return (
      <div className={s.estreito}>
        <h1 className={s.titulo}>Aportar no fundo de garantia</h1>
        <Nota ic="pessoa" cor={COR.verde} fundo="#E3F1E9">
          <b>Seu perfil: arrojado</b> · compatível com risco alto. Este fundo é de risco alto.
        </Nota>
        <Cartao pad="20px" gap={14}>
          <div className={s.campo}>
            <label htmlFor="valor-aporte">Quanto você quer aportar?</label>
            <div className={s.campoCaixa}>
              <span aria-hidden="true">R$</span>
              <input
                id="valor-aporte" inputMode="decimal" autoComplete="off" value={texto}
                onChange={(e) => setTexto(e.target.value)}
                aria-describedby="previa-aporte" aria-invalid={!!problema}
              />
            </div>
            <div className={s.chips} role="group" aria-label="Valores sugeridos">
              {SUGESTOES.map((v) => (
                <button key={v} type="button" aria-pressed={valor === v} onClick={() => setTexto(v.toLocaleString("pt-BR"))}>
                  {reais(v, false)}
                </button>
              ))}
            </div>
            {problema && <p className={s.erroCampo} role="alert">{problema}</p>}
          </div>
          <div id="previa-aporte">
            <Linha k="Você recebe, aproximadamente" v={`${numCotas(problema ? 0 : cotasPrevistas)} cotas`} />
            <Linha k="Valor da cota agora" v={`R$ ${x.cota.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`} />
            <Linha k="Resgate" v="com aviso prévio, só da parte livre" />
            <Linha k="Forma de pagamento" v="Pix" />
          </div>
        </Cartao>
        <Nota ic="alerta" cor={COR.verm} fundo="#FBEAE8">
          <b>Você pode perder parte do valor.</b> O fundo paga os aluguéis quando a caução de um inquilino acaba. Não é poupança nem tem
          garantia do FGC. O rendimento vem de {DEMO.premiumBps / 100}% de cada aluguel e não é garantido.
        </Nota>
        <Txt peq>Ao gerar o Pix, você confirma que leu a lâmina do fundo e entende esses riscos.</Txt>
        <Botao onClick={() => setEtapa("pix")} disabled={!!problema}><Icone n="pix" t={20} e={2} />Gerar Pix</Botao>
        {x.saldo >= valor && !problema && (
          <Botao tipo="secundario" onClick={aportarNaSolana}>Aportar com o saldo da conta ({reais(x.saldo)})</Botao>
        )}
        <LinkBotao href="/investidor/documentos" tipo="texto">Ler a lâmina do fundo</LinkBotao>
      </div>
    );

  if (etapa === "pix")
    return (
      <div className={s.estreito}>
        <h1 className={s.titulo}>Pagar o aporte com Pix</h1>
        <PixFluxo
          carteira={d.kp!.investidor.publicKey}
          valor={Math.max(0, valor - x.saldo) || valor}
          linhas={[["Para", "Fundo de garantia Fiador.sol"], ["Aporte", reais(valor)], ["Cotas, aproximadamente", numCotas(cotasPrevistas)]]}
          onPago={aportarNaSolana}
          onCancelar={() => setEtapa("valor")}
        />
      </div>
    );

  if (etapa === "processando")
    return (
      <div className={s.estreito}>
        <Estado girando titulo="Pix recebido. Registrando na Solana." texto="Leva uns segundos. A tela avança sozinha." />
        <Cartao pad="20px">
          <Passos itens={[
            [`Pix de ${reais(feito?.valor ?? valor)} recebido`, "ok"],
            ["Dinheiro entrando no fundo e cotas sendo criadas", "agora"],
            ["Nota de aporte carimbada", ""],
          ]} />
        </Cartao>
      </div>
    );

  if (etapa === "erro")
    return (
      <div className={s.estreito}>
        <Estado ic="alerta" cor={COR.verm} fundo="#FBEAE8" selo="NÃO CONSEGUIMOS REGISTRAR AGORA" titulo="Seu Pix está guardado. Nada foi perdido."
          texto="O valor continua na sua conta Fiador.sol e você pode tentar de novo. Em produção, o parceiro de Pix faria o estorno." />
        {erro && <Nota ic="info">{erro}</Nota>}
        <Botao onClick={aportarNaSolana}>Tentar de novo</Botao>
        <LinkBotao href="/investidor" tipo="secundario">Voltar para a posição</LinkBotao>
      </div>
    );

  // feito
  const f = feito ?? { valor, cotas: cotasPrevistas, cota: x.cota };
  return (
    <div className={s.estreito}>
      <Estado ic="check" cor="#fff" fundo={COR.verde} titulo="Aporte concluído" texto="O dinheiro já está no fundo e começa a receber parte das taxas dos aluguéis." />
      <Documento>
        <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Nota de aporte</span>
        <Txt style={{ marginTop: 12 }}><b style={{ color: COR.tinta }}>Rafael Viana</b> aportou no Fundo de Garantia Fiador.sol a importância de</Txt>
        <div style={{ marginTop: 8 }}><Valor v={f.valor} t={40} inteiro /></div>
        <div style={{ marginTop: 8 }}>
          <Linha k="Cotas recebidas, aproximadamente" v={numCotas(f.cotas)} />
          <Linha k="Valor da cota no aporte" v={`R$ ${f.cota.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`} />
          <Linha k="Data" v={new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", margin: "18px 0 26px" }}>
          <Carimbo txt="APORTADO" cor={COR.caneta} t={32} rot={-8} data={new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).toUpperCase().replace(".", "")} animar />
        </div>
        <Autenticacao sig={sig ?? undefined} href={sig ? explorerTx(sig) : undefined} />
      </Documento>
      <LinkBotao href="/investidor">Ver minha posição</LinkBotao>
    </div>
  );
}
