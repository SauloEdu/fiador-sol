"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Abas, App, Barra, Cartao, COR, Estado, Extrato, Mov, Pad, Segmento, Txt, Valor } from "@/ui";
import { ABAS, useInquilino } from "../dados";

function Pagina() {
  const x = useInquilino();
  const cofre = useSearchParams().get("conta") === "cofre";
  const lista = cofre ? x.movCofre : x.movConta;
  const pagoTotal = x.movConta.filter((m) => m.titulo !== "Caução guardada").reduce((a, m) => a + m.v, 0);
  return (
    <App abas={<Abas itens={ABAS} ativa="Extrato" />}>
      <Barra titulo="Extrato" sub="Contrato da Rua das Acácias" />
      <Pad>
        <Segmento itens={[["Sua conta", "/inquilino/extrato", !cofre], ["Cofre da caução", "/inquilino/extrato?conta=cofre", cofre]]} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
          <Cartao pad="14px 16px" gap={4}>
            <span style={{ fontSize: 13, color: COR.graf }}>{cofre ? "Saldo do cofre" : "Aluguéis pagos"}</span>
            <Valor v={cofre ? x.cofre : pagoTotal} t={26} />
            <span style={{ fontSize: 13, color: COR.graf }}>{cofre ? "com rendimento simulado" : "com a taxa de garantia"}</span>
          </Cartao>
          <Cartao pad="14px 16px" gap={4}>
            <span style={{ fontSize: 13, color: COR.graf }}>{cofre ? "Usado para pagar" : "Saldo na conta"}</span>
            <Valor v={cofre ? x.movCofre.filter((m) => m.sinal === "−" && m.status?.[0] === "PELA CAUÇÃO").reduce((a, m) => a + m.v, 0) : x.saldo} t={26} />
            <span style={{ fontSize: 13, color: COR.graf }}>{cofre ? "aluguéis pela caução" : "reais digitais de teste"}</span>
          </Cartao>
        </div>
        {lista.length ? (
          <Extrato>{lista.map((m, k) => <Mov key={k} m={m} />)}</Extrato>
        ) : (
          <Cartao><Estado ic="recibo" cor={COR.graf} fundo={COR.mesa} titulo="Nada por aqui ainda" texto="As movimentações aparecem assim que acontecem na Solana." /></Cartao>
        )}
        <Txt peq>{cofre ? "O cofre é do contrato, não seu nem do Carlos. Só as regras movimentam: a cobrança no fim da carência e a devolução no fim." : "Aqui ficam os Pix que saíram de você. O que o cofre fez com a caução está na aba Cofre da caução."} Toque numa linha para ver o comprovante.</Txt>
      </Pad>
    </App>
  );
}
export default function P() { return <Suspense><Pagina /></Suspense>; }
