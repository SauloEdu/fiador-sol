"use client";

import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import {
  Abas, Alerta, App, Atalhos, Banda, Botao, Cartao, Cartela, COR, Estado, Extrato, H2, Icone, Linha, LinkBotao, Mov, Pad, reais, Txt, Valor,
} from "@/ui";
import { ABAS, useOculto, useProprietario } from "./dados";

export default function Inicio() {
  const x = useProprietario();
  const [oculto, alternar] = useOculto();
  const { l, d } = x;
  const abas = <Abas itens={ABAS} ativa="Início" />;
  const banda = (
    <Banda iniciais={H.PESSOAS.proprietario.iniciais} ola="Olá, Carlos" sub={H.IMOVEL.endereco} avisos="/proprietario/extrato" oculto={oculto} onOlho={alternar} />
  );
  const esconder = (v: number) => (oculto ? "R$ ••••" : reais(v));

  if (d.erroGeral)
    return (
      <App>{banda}<Pad sobreposto><Cartao elevado><Estado ic="alerta" cor={COR.verm} fundo="#FBEAE8" titulo="Sem conexão com a Solana" texto={`${d.erroGeral}. Confira se a rede da demonstração está ligada.`} /></Cartao></Pad></App>
    );

  if (!x.pronto)
    return (
      <App>{banda}<Pad sobreposto><Cartao elevado><Estado girando titulo="Conectando à Solana" texto={d.ocupado ?? "Lendo o contrato na rede de teste…"} /></Cartao></Pad></App>
    );

  if (!l)
    return (
      <App abas={abas}>
        {banda}
        <Pad sobreposto>
          <Cartao elevado pad="22px">
            <Estado ic="enviar" cor={COR.caneta} fundo="#E4E9FA" titulo="Nenhum contrato ainda" texto="Quando a Imobiliária Sol criar o contrato do seu imóvel, ele aparece aqui." />
            <LinkBotao href="/imobiliaria" tipo="secundario">Abrir o painel da imobiliária</LinkBotao>
          </Cartao>
        </Pad>
      </App>
    );

  const emAndamento = l.status === "active" || l.status === "defaulted";

  // Cartão principal: saldo do Carlos e o próximo aluguel.
  const saldo = (
    <Cartao elevado pad="20px" gap={8}>
      <h1 style={{ margin: 0, fontSize: 15, fontWeight: 650, color: COR.graf }}>Saldo na conta Fiador.sol</h1>
      <Valor v={x.saldo} t={44} oculto={oculto} />
      <span style={{ fontSize: 14, fontWeight: 650 }}>
        {l.status === "pending"
          ? "Esperando a Ana guardar a caução para o contrato começar."
          : emAndamento && x.proximo >= 0
            ? `Próximo: ${H.nomeMes(x.proximo)}, vence em ${H.mmss(x.falta)}`
            : "Todos os aluguéis do contrato já foram recebidos."}
      </span>
      <div style={{ paddingTop: 6, display: "flex", flexDirection: "column", gap: 6 }}>
        <Botao disabled aria-describedby="dica-transferir">Transferir para o meu banco</Botao>
        <span id="dica-transferir" style={{ fontSize: 13, color: COR.graf, textAlign: "center" }}>
          Na demonstração a transferência fica desativada. Em produção, cai no seu Pix.
        </span>
      </div>
    </Cartao>
  );

  // Aviso do fim do contrato: vistoria, pedido de danos em análise ou encerrado.
  let aviso = null;
  if (l.status === "ending") {
    aviso = x.janelaAberta ? (
      <Alerta cor={COR.ambar} fundo="#FBF1E2" ic="balanca" faixa={`Vistoria de saída: ${H.mmss(x.fimJanela - x.agora)}`}>
        <H2>O contrato terminou. Encontrou algum dano?</H2>
        <Txt>Você pode pedir até {esconder(x.cofre)}, o que há no cofre. A Imobiliária Sol analisa e decide. Sem pedido, a caução volta para a Ana.</Txt>
        <div style={{ paddingTop: 8 }}><LinkBotao href="/proprietario/danos"><Icone n="balanca" t={20} cor="#fff" e={2} />Registrar danos</LinkBotao></div>
      </Alerta>
    ) : (
      <Alerta cor={COR.graf} fundo="#fff" ic="relogio" faixa="Prazo de vistoria encerrado">
        <H2>O prazo para pedir danos acabou.</H2>
        <Txt>No acerto final, a caução volta para a Ana com o rendimento simulado.</Txt>
      </Alerta>
    );
  } else if (l.status === "disputed") {
    aviso = (
      <Alerta cor={COR.ambar} fundo="#FBF1E2" ic="balanca" faixa="Pedido de danos em análise">
        <H2>Você pediu {esconder(fromUnits(l.disputeAmount))} da caução.</H2>
        <Txt>A Imobiliária Sol decide o valor. Até lá, a caução fica parada no cofre do contrato.</Txt>
      </Alerta>
    );
  } else if (l.status === "closed") {
    aviso = (
      <Cartao pad="20px" gap={6}>
        <H2>Contrato encerrado</H2>
        <Txt>Todos os aluguéis foram recebidos. A caução voltou para a Ana, menos os danos aprovados pela imobiliária.</Txt>
      </Cartao>
    );
  }

  return (
    <App abas={abas}>
      {banda}
      <Pad sobreposto>
        {saldo}
        {aviso}
        <Atalhos itens={[["recibo", "Extrato", "/proprietario/extrato"], ["doc", "Recibos", "/proprietario/extrato#recibos"], ["grafico", "Informe de IR", "/proprietario/contrato#ir"], ["casa", "Contrato", "/proprietario/contrato"]]} />
        {l.status !== "closed" && l.status !== "pending" && (
          <section aria-labelledby="protecao-t" style={{ display: "flex", flexDirection: "column", gap: 6, padding: "16px 18px", borderRadius: 18, background: "#fff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: "50%", background: COR.mesa, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}><Icone n="cadeado" t={24} /></span>
              <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <H2 id="protecao-t" style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Proteção do seu aluguel</H2>
                <Valor v={x.protecao} t={26} oculto={oculto} />
              </span>
            </div>
            <div>
              <Linha k="Caução no cofre" v={esconder(x.cofre)} />
              <Linha k="Fundo de garantia" v={x.fundoAtivo ? esconder(x.fundo) : "o fundo entra após o 2º aluguel pago"} />
            </div>
            <Txt peq>Se a Ana atrasar, o cofre paga você no fim da carência. Se a caução acabar, o fundo cobre até {reais(fromUnits(l.coverageCap))} neste contrato.</Txt>
          </section>
        )}
        {l.status !== "pending" && (
          <section aria-labelledby="cartela-t" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px" }}>
              <H2 id="cartela-t">Recebimentos</H2>
              <span style={{ fontSize: 14, color: COR.graf }}>{x.recebidos.length} de {l.totalPeriods} meses</span>
            </div>
            <div style={{ padding: 12, borderRadius: 18, background: "#fff" }}>
              <Cartela celulas={x.celulas} />
              <Txt peq style={{ padding: "12px 4px 2px" }}>PAGO: a Ana pagou. RECEBIDO: a Ana passou da carência e o cofre do contrato pagou você.</Txt>
            </div>
          </section>
        )}
        {x.movs.length > 0 && (
          <Extrato titulo="Últimas movimentações" mais={["Ver extrato", "/proprietario/extrato"]}>
            {x.movs.slice(0, 3).map((m, k) => <Mov key={k} m={m} oculto={oculto} />)}
          </Extrato>
        )}
      </Pad>
    </App>
  );
}
