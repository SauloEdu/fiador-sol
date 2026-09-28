"use client";

import { Abas, App, Cartao, COR, Extrato, H2, Linha, Mov, Pad, reais, Txt, Valor } from "@/ui";
import { ABAS, useInquilino } from "../dados";

export default function Caucao() {
  const x = useInquilino();
  const l = x.l;
  const falta = Math.max(0, x.cheio - x.cofre);
  return (
    <App abas={<Abas itens={ABAS} ativa="Caução" />}>
      <div style={{ background: COR.tinta, color: "#fff", padding: "16px 20px 26px", display: "flex", flexDirection: "column", gap: 6 }}>
        <h1 style={{ margin: 0, fontSize: 17 }}>Caução</h1>
        <span style={{ fontSize: 14, color: "#C9D0DD", marginTop: 10 }}>Saldo do cofre do contrato</span>
        <Valor v={x.cofre} t={44} cor="#fff" />
        <span style={{ fontSize: 14, fontWeight: 650, color: "#8FD8B0" }}>+ {reais(x.rend)} de rendimento simulado</span>
      </div>
      <Pad style={{ marginTop: 18 }}>
        {falta > 0.5 && (
          <Cartao>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}><H2>Cofre abaixo do cheio</H2><span style={{ fontSize: 14, color: COR.graf }}>faltam {reais(falta)}</span></div>
            <div role="img" aria-label={`Cofre com ${reais(x.cofre)} de ${reais(x.cheio)}`} style={{ height: 12, borderRadius: 6, background: "#F4DAD7", overflow: "hidden" }}>
              <div style={{ width: `${(x.cofre / x.cheio) * 100}%`, height: "100%", background: COR.tinta }} />
            </div>
            <Txt peq>A caução pagou um aluguel. Quitando esse mês, o cofre volta a ficar cheio.</Txt>
          </Cartao>
        )}
        <Cartao pad="6px 18px 12px" gap={0}>
          <Linha k="Caução guardada" v={l ? reais(l.depositRequired / 1_000_000) : "—"} />
          <Linha k="Quem pode movimentar" v="só as regras do contrato" />
          <Linha k="Rendimento" v="10% ao ano (simulado)" />
          <Linha k="Devolução" v="no fim, sem pedido de danos" />
        </Cartao>
        {x.movCofre.length > 0 && <Extrato titulo="Movimentações do cofre" mais={["Ver tudo", "/inquilino/extrato?conta=cofre"]}>{x.movCofre.slice(0, 3).map((m, k) => <Mov key={k} m={m} />)}</Extrato>}
      </Pad>
    </App>
  );
}
