"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import * as H from "@/lib/historia";
import {
  Abas, Alerta, App, Atalhos, Banda, Cartao, Cartela, COR, Estado, Extrato, Forte, H2, Icone, Linha, LinkBotao, Mov, Pad, reais, Selo, Txt, Valor,
} from "@/ui";
import { ABAS, useInquilino } from "./dados";

function useOculto() {
  const [oculto, set] = useState(false);
  useEffect(() => { try { set(localStorage.getItem("fiador-oculto") === "1"); } catch { /* ok */ } }, []);
  const alternar = () => set((v) => { try { localStorage.setItem("fiador-oculto", v ? "0" : "1"); } catch { /* ok */ } return !v; });
  return [oculto, alternar] as const;
}

export default function Inicio() {
  const x = useInquilino();
  const [oculto, alternar] = useOculto();
  const { l, d } = x;
  const abas = <Abas itens={ABAS} ativa="Início" />;
  const banda = (
    <Banda iniciais={H.PESSOAS.inquilino.iniciais} ola="Olá, Ana" sub={H.IMOVEL.endereco} avisos="/inquilino/extrato" oculto={oculto} onOlho={alternar} />
  );

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
            <Estado ic="enviar" cor={COR.caneta} fundo="#E4E9FA" titulo="Nenhum contrato ainda" texto="Quando a Imobiliária Sol criar o seu contrato, o convite aparece aqui." />
            <LinkBotao href="/imobiliaria" tipo="secundario">Abrir o painel da imobiliária</LinkBotao>
          </Cartao>
        </Pad>
      </App>
    );

  if (l.status === "pending")
    return (
      <App abas={abas}>
        {banda}
        <Pad sobreposto>
          <Cartao elevado pad="20px" gap={8}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, background: "#B45309", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>IS</span>
              <span style={{ display: "flex", flexDirection: "column" }}><b style={{ fontSize: 15 }}>Imobiliária Sol</b><span style={{ fontSize: 13, color: COR.graf }}>convida você · credenciada no Fiador.sol</span></span>
            </div>
            <h1 style={{ margin: "8px 0 0", fontSize: 26, lineHeight: 1.15, letterSpacing: "-0.02em" }}>Ana, seu aluguel pode começar sem fiador.</h1>
            <div>
              <Linha k="Aluguel, para Carlos Mendes" v={reais(x.aluguel)} />
              <Linha k="Taxa de garantia, 8% (não volta)" v={reais(x.taxa)} />
              <Linha k="Prazo" v={`${l.totalPeriods} meses (1 mês = ${l.periodSecs} s na demo)`} />
              <Linha k="Caução, uma vez só" v={`${H.mesesDeCaucao(x.snap?.profile ?? null)} aluguéis`} forte />
            </div>
            <LinkBotao href="/inquilino/aceitar">Ver o convite e aceitar</LinkBotao>
          </Cartao>
        </Pad>
      </App>
    );

  const i = x.proximo;
  let cartaoPrincipal;
  if (l.status === "closed") {
    cartaoPrincipal = (
      <Cartao elevado pad="20px" gap={8}>
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 650, color: COR.graf }}>Contrato encerrado</h1>
        <Txt>A caução voltou para a sua conta Fiador.sol, com o rendimento, menos os danos aprovados pela imobiliária.</Txt>
        <LinkBotao href="/inquilino/extrato?conta=cofre" tipo="secundario">Ver a devolução</LinkBotao>
      </Cartao>
    );
  } else if (l.status === "ending" || l.status === "disputed") {
    cartaoPrincipal = (
      <Alerta cor={COR.graf} fundo="#fff" ic="balanca" faixa={l.status === "disputed" ? "Pedido de danos em análise" : "Vistoria de saída"}>
        <h1 style={{ margin: 0, fontSize: 22 }}>{l.status === "disputed" ? "O Carlos pediu parte da caução." : "Todos os meses foram pagos."}</h1>
        <Txt>{l.status === "disputed" ? "A Imobiliária Sol decide o valor. Até lá, a caução fica parada no cofre." : "O Carlos tem um prazo para registrar danos. Depois, a caução volta para você com o rendimento."}</Txt>
      </Alerta>
    );
  } else if (i < 0) {
    cartaoPrincipal = (
      <Cartao elevado pad="20px"><Estado ic="check" cor="#fff" fundo={COR.verde} titulo="Todos os aluguéis pagos" texto="Falta só o fim do prazo do contrato." /></Cartao>
    );
  } else if (x.pagoPelaCaucao || x.atrasado) {
    cartaoPrincipal = (
      <Alerta cor={COR.verm} fundo="#FBEAE8" ic="cofre" faixa={x.pagoPelaCaucao ? "Pago pela caução" : "Carência terminou"}>
        <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>{x.pagoPelaCaucao ? `A caução pagou ${H.nomeMes(i)} por você. Falta repor o cofre.` : `${H.Mes(i)} passou da carência. A caução vai pagar o Carlos.`}</h1>
        <Valor v={x.total} t={40} oculto={oculto} />
        <div><Linha k="O Carlos recebe" v="do cofre do contrato" /><Linha k="Para repor o cofre" v={reais(x.aluguel)} /></div>
        <div style={{ paddingTop: 8 }}><LinkBotao href="/inquilino/pagar"><Icone n="pix" t={20} cor="#fff" e={2} />{x.pagoPelaCaucao ? `Quitar ${H.nomeMes(i)} com Pix` : "Pagar agora com Pix"}</LinkBotao></div>
      </Alerta>
    );
  } else if (x.emCarencia) {
    cartaoPrincipal = (
      <Alerta cor={COR.ambar} fundo="#FBF1E2" ic="relogio" faixa={`Em carência: ${H.mmss(x.venc + l.graceSecs - x.agora)}`}>
        <h1 style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>{H.Mes(i)} venceu. Ainda dá tempo.</h1>
        <Valor v={x.total} t={40} oculto={oculto} />
        <Txt>Pagando na carência, o Carlos recebe de você e a caução fica intacta. Depois dela, a cobrança automática usa a caução.</Txt>
        <div style={{ paddingTop: 8 }}><LinkBotao href="/inquilino/pagar"><Icone n="pix" t={20} cor="#fff" e={2} />Pagar agora com Pix</LinkBotao></div>
      </Alerta>
    );
  } else {
    cartaoPrincipal = (
      <Cartao elevado pad="20px" gap={8}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 650, color: COR.graf }}>Aluguel de {H.nomeMes(i)}</h1>
          <span style={{ fontSize: 14, fontWeight: 650 }}>vence em {H.mmss(x.falta)}</span>
        </div>
        <Valor v={x.total} t={44} oculto={oculto} />
        <div>
          <Linha k="Aluguel, para Carlos Mendes" v={oculto ? "R$ ••••" : reais(x.aluguel)} />
          <Linha k="Taxa de garantia (não volta)" v={oculto ? "R$ ••••" : reais(x.taxa)} />
        </div>
        <div style={{ paddingTop: 6 }}><LinkBotao href="/inquilino/pagar"><Icone n="pix" t={20} cor="#fff" e={2} />Pagar com Pix</LinkBotao></div>
      </Cartao>
    );
  }

  const emDia = x.snap?.profile?.onTime ?? 0;
  const proximoSelo = [3, 6, 12].find((n) => n > emDia) ?? 12;
  return (
    <App abas={abas}>
      {banda}
      <Pad sobreposto>
        {cartaoPrincipal}
        <Atalhos itens={[["recibo", "Recibos", "/inquilino/extrato"], ["selo", "Selos", "/inquilino/selos"], ["doc", "Contrato", "/inquilino/aceitar?ver=1"], ["info", "Ajuda", "/inquilino/conta#ajuda"]]} />
        <section aria-labelledby="cartela-t" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "0 4px" }}>
            <H2 id="cartela-t">Cartela do contrato</H2>
            <span style={{ fontSize: 14, color: COR.graf }}>{l.periods.filter((p) => p !== "open").length} de {l.totalPeriods} meses</span>
          </div>
          <div style={{ padding: 12, borderRadius: 18, background: "#fff" }}>
            <Cartela celulas={x.celulas} />
            <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "14px 4px 2px" }}>
              <Selo n={proximoSelo} on={false} t={52} />
              <Txt peq><Forte>{emDia} de {proximoSelo} meses em dia para o próximo selo.</Forte> Mês pago pela caução e depois quitado conta como atraso, não como calote.</Txt>
            </div>
          </div>
        </section>
        <Link href="/inquilino/caucao" style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px", borderRadius: 18, background: "#fff", textDecoration: "none", color: COR.tinta }}>
          <span aria-hidden="true" style={{ width: 46, height: 46, borderRadius: "50%", background: COR.mesa, display: "flex", alignItems: "center", justifyContent: "center" }}><Icone n="cofre" t={24} /></span>
          <span style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <span style={{ fontSize: 14, fontWeight: 650, color: COR.graf }}>Caução no cofre do contrato</span>
            <Valor v={x.cofre} t={26} oculto={oculto} />
            <span style={{ fontSize: 13, color: COR.graf }}>com rendimento simulado de 10% ao ano</span>
          </span>
          <Icone n="avancar" t={20} cor={COR.caneta} e={2.2} />
        </Link>
        {x.movConta.length > 0 && (
          <Extrato titulo="Últimas movimentações" mais={["Ver extrato", "/inquilino/extrato"]}>
            {x.movConta.slice(0, 3).map((m, k) => <Mov key={k} m={m} oculto={oculto} />)}
          </Extrato>
        )}
      </Pad>
    </App>
  );
}
