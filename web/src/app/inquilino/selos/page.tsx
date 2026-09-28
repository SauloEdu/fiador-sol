"use client";

import { Abas, App, Barra, Botao, Cartao, COR, Forte, H2, Linha, Pad, Selo, Txt } from "@/ui";
import { ABAS, useInquilino } from "../dados";

export default function Selos() {
  const x = useInquilino();
  const p = x.snap?.profile;
  const emDia = p?.onTime ?? 0;
  const meta = [3, 6, 12].find((n) => n > emDia) ?? 12;
  const caucao = !p || p.defaults > 0 ? 3 : p.onTime >= 12 && p.leasesStarted >= 2 ? 1 : p.onTime >= 6 ? 2 : 3;
  return (
    <App abas={<Abas itens={ABAS} ativa="Início" />}>
      <Barra titulo="Selos" voltar="/inquilino" sub="Seu histórico de aluguel" />
      <Pad>
        <Cartao pad="18px" gap={12}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15 }}><b>{emDia} de {meta} meses em dia</b><span style={{ color: COR.graf }}>próximo selo: {meta}</span></div>
          <div role="progressbar" aria-valuenow={emDia} aria-valuemin={0} aria-valuemax={meta} aria-label="Meses em dia para o próximo selo" style={{ height: 12, borderRadius: 6, background: "#D9DFE8", overflow: "hidden" }}>
            <div style={{ width: `${Math.min(100, (emDia / meta) * 100)}%`, height: "100%", background: COR.verde }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 10 }}>
            {[3, 6, 12].map((n) => <Selo key={n} n={n} on={emDia >= n} t={84} />)}
          </div>
          <Txt peq>Selos na blockchain ({x.snap?.badges ?? 0} na sua conta). Eles não podem ser vendidos nem passados para outra pessoa.</Txt>
        </Cartao>
        <Cartao pad="6px 18px 12px" gap={0}>
          <Linha k="Pagamentos em dia" v={String(emDia)} />
          <Linha k="Pagos com atraso e quitados" v={String(p?.late ?? 0)} />
          <Linha k="Contratos encerrados devendo" v={String(p?.defaults ?? 0)} />
          <Linha k="Caução no próximo contrato" v={`${caucao} ${caucao === 1 ? "aluguel" : "aluguéis"}`} forte />
        </Cartao>
        <Cartao>
          <H2>Como diminuir a caução</H2>
          <div><Linha k="Sem histórico" v="3 aluguéis" /><Linha k="6 meses em dia" v="2 aluguéis" /><Linha k="12 em dia, em 2 contratos" v="1 aluguel" /></div>
          <Txt peq><Forte>Calote é só terminar um contrato devendo.</Forte> Um mês pago pela caução e depois quitado não é calote.</Txt>
        </Cartao>
        {x.d.kp && (
          <Botao tipo="secundario" disabled={emDia < 3} onClick={() => window.open(`/reputacao/${x.d.kp!.inquilino.publicKey.toBase58()}`, "_blank")}>
            {emDia < 3 ? "Compartilhar histórico (depois do primeiro selo)" : "Ver meu histórico público"}
          </Botao>
        )}
      </Pad>
    </App>
  );
}
