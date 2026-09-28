"use client";

import { DEMO } from "@/lib/constants";
import { Cartao, COR, Estado, Extrato, H2, Linha, LinkBotao, Mov, Nota, reais, Txt, Valor } from "@/ui";
import { Conectando, useOculto } from "./Casca";
import { mmss, numCotas, useInvestidor } from "./dados";
import s from "./investidor.module.css";

const pct = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2, signDisplay: "exceptZero" });

export default function Posicao() {
  const x = useInvestidor();
  const oculto = useOculto();
  const esconde = (v: string) => (oculto ? "R$ ••••" : v);

  if (x.d.erroGeral || !x.pronto) return <Conectando erro={x.d.erroGeral} texto={x.d.ocupado} />;

  const temPosicao = x.cotas > 0;
  const fracaoReservada = x.noFundo > 0 ? Math.min(1, x.reservado / x.noFundo) : 0;

  /* ---------- números do fundo (servem para as duas situações) ---------- */
  const numerosDoFundo = (
    <section aria-labelledby="fundo-t" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <H2 id="fundo-t">O fundo agora</H2>
      <div className={s.numeros}>
        <div className={s.numero}>
          <span>No fundo</span>
          <Valor v={x.noFundo} t={26} oculto={oculto} />
          <span>de todos os investidores</span>
        </div>
        <div className={s.numero}>
          <span>Reservado para contratos</span>
          <Valor v={x.reservado} t={26} oculto={oculto} />
          <span>garante aluguéis em andamento</span>
        </div>
        <div className={s.numero}>
          <span>Livre</span>
          <Valor v={x.livre} t={26} oculto={oculto} />
          <span>pode ser resgatado</span>
        </div>
      </div>
      <div
        className={s.barraFundo} role="img"
        aria-label={`${Math.round(fracaoReservada * 100)}% do fundo reservado para contratos e ${Math.round((1 - fracaoReservada) * 100)}% livre`}
      >
        <div style={{ width: `${fracaoReservada * 100}%` }} />
      </div>
      <Txt peq>Cinza: reservado para contratos. Verde: livre. Valor da cota agora: {oculto ? "R$ ••••" : `R$ ${x.cota.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`}.</Txt>
    </section>
  );

  const sobre = (
    <Cartao pad="20px" gap={4}>
      <H2>Sobre este investimento</H2>
      <div>
        <Linha k="Liquidez" v={`aviso prévio de ${DEMO.withdrawCooldownSecs} s (demo)`} />
        <Linha k="Risco" v={<b style={{ color: COR.verm }}>alto</b>} />
        <Linha k="Rendimento" v={`${DEMO.premiumBps / 100}% dos aluguéis pagos`} />
        <Linha k="O fundo paga" v="quando a caução acaba" />
      </div>
      <Txt peq style={{ marginTop: 8 }}>
        Você perde dinheiro quando há calotes maiores que a caução. O resgate usa só a parte livre do fundo: o que está reservado
        para contratos em andamento espera o contrato terminar.
      </Txt>
    </Cartao>
  );

  const extrato = x.movimentos.length > 0 ? (
    <Extrato titulo="Movimentações">
      {x.movimentos.map((m, k) => <Mov key={k} m={m} oculto={oculto} />)}
    </Extrato>
  ) : null;

  if (!temPosicao)
    return (
      <div className={s.grade}>
        <div className={s.coluna}>
          <Cartao pad="28px 22px" gap={14}>
            <Estado ic="grafico" cor={COR.caneta} fundo="#E4E9FA" titulo="Você ainda não tem aportes"
              texto={`O fundo garante aluguéis e recebe ${DEMO.premiumBps / 100}% de cada aluguel pago. É um investimento de risco: você pode perder parte do valor.`} />
            <LinkBotao href="/investidor/aportar">Fazer o primeiro aporte</LinkBotao>
            <LinkBotao href="/investidor/documentos" tipo="secundario">Ler a lâmina do fundo</LinkBotao>
          </Cartao>
          {numerosDoFundo}
          {extrato}
        </div>
        <div className={s.coluna}>{sobre}</div>
      </div>
    );

  // Arredondamento das cotas pode dar diferenças de centavos: abaixo de 1 centavo, conta como zero.
  const variacao = Math.abs(x.variacao) < 0.01 ? 0 : x.variacao;
  const sinal = variacao > 0 ? "+ " : variacao < 0 ? "− " : "";
  return (
    <div className={s.grade}>
      <div className={s.coluna}>
        <section className={s.heroi} aria-labelledby="posicao-t">
          <h1 id="posicao-t">Sua posição no fundo</h1>
          <Valor v={x.posicao} t={48} cor="#fff" oculto={oculto} />
          <div className={s.heroiLinha}>
            {x.temAporte && (
              <span>
                <span className={variacao < 0 ? s.desce : s.sobe}>
                  {sinal}{esconde(reais(Math.abs(variacao)))} ({pct.format(variacao / x.aportado)})
                </span>{" "}
                desde o aporte de {esconde(reais(x.aportado))}
              </span>
            )}
            <span>{numCotas(x.cotas)} cotas</span>
          </div>
          <span style={{ fontSize: 13, color: "var(--claro-sobre-tinta)" }}>Rendimento de risco, não garantido.</span>
          {x.pediu && (
            <Nota ic="relogio" cor={COR.ambar} fundo="#FBF1E2">
              {x.faltaResgate > 0
                ? <>Resgate pedido. Libera em <b style={{ fontVariantNumeric: "tabular-nums" }}>{mmss(x.faltaResgate)}</b>.</>
                : <>O aviso prévio terminou. Você já pode concluir o resgate.</>}
            </Nota>
          )}
          <div className={s.botoes}>
            <LinkBotao href="/investidor/aportar">Aportar</LinkBotao>
            <LinkBotao href="/investidor/resgatar" tipo="secundario" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.75)" }}>{x.pediu && x.faltaResgate <= 0 ? "Concluir resgate" : "Resgatar"}</LinkBotao>
          </div>
        </section>
        {numerosDoFundo}
        {extrato}
      </div>
      <div className={s.coluna}>
        {sobre}
        <Cartao pad="20px" gap={4}>
          <H2>Sua conta</H2>
          <div>
            <Linha k="Saldo parado na conta" v={esconde(reais(x.saldo))} />
            <Linha k="Prêmios que o fundo já recebeu" v={esconde(reais(x.premios))} />
          </div>
          <Txt peq style={{ marginTop: 8 }}>O saldo parado não rende. Ele é o dinheiro de um resgate que ainda não voltou para o banco.</Txt>
        </Cartao>
      </div>
    </div>
  );
}
