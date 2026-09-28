"use client";

import { DEMO } from "@/lib/constants";
import { COR, Icone, Linha, Nota, reais, Txt } from "@/ui";
import { useOculto } from "../Casca";
import { useInvestidor } from "../dados";
import s from "../investidor.module.css";

/**
 * Documentos de exemplo do fundo. Os números vêm da Solana quando existem;
 * o resto é texto de exemplo, marcado como tal.
 */
export default function Documentos() {
  const x = useInvestidor();
  const oculto = useOculto();
  const v = (n: number) => (!x.pronto ? "carregando…" : oculto ? "R$ ••••" : reais(n));
  const taxa = `${DEMO.premiumBps / 100}%`;

  const docs: { titulo: string; sub: string; corpo: React.ReactNode }[] = [
    {
      titulo: "Lâmina do fundo (exemplo)",
      sub: "Resumo de uma página: objetivo, risco, liquidez e taxas",
      corpo: (
        <>
          <Linha k="Objetivo" v="garantir aluguéis quando a caução do inquilino acaba" />
          <Linha k="Rendimento" v={`${taxa} de cada aluguel pago, divididos entre os cotistas`} />
          <Linha k="Risco" v={<b style={{ color: COR.verm }}>alto: perde com calotes</b>} />
          <Linha k="Liquidez" v={`aviso prévio de ${DEMO.withdrawCooldownSecs} s na demo, só da parte livre`} />
          <Linha k="Público" v="perfil arrojado" />
        </>
      ),
    },
    {
      titulo: "Regulamento (exemplo)",
      sub: "Regras do fundo, iguais às do programa na Solana",
      corpo: (
        <>
          <Txt peq>1. O fundo recebe {taxa} de cada aluguel pago pelos inquilinos.</Txt>
          <Txt peq>2. Cada contrato reserva uma parte do fundo como cobertura. Essa parte não pode ser resgatada enquanto o contrato estiver em andamento.</Txt>
          <Txt peq>3. O fundo só paga o proprietário depois que a caução do inquilino acaba.</Txt>
          <Txt peq>4. O valor da cota é o dinheiro do fundo dividido pelo número de cotas. Ganhos e perdas são de todos os cotistas, na proporção das cotas.</Txt>
          <Txt peq>5. O resgate é pedido, espera o aviso prévio e só usa a parte livre do fundo.</Txt>
        </>
      ),
    },
    {
      titulo: "Relatório do fundo",
      sub: "Números lidos agora da Solana",
      corpo: (
        <>
          <Linha k="Dinheiro no fundo" v={v(x.noFundo)} />
          <Linha k="Reservado para contratos" v={v(x.reservado)} />
          <Linha k="Livre" v={v(x.livre)} />
          <Linha k="Taxas de aluguel recebidas" v={v(x.premios)} />
          <Linha k="Valor da cota" v={x.pronto ? `R$ ${x.cota.toLocaleString("pt-BR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}` : "carregando…"} />
        </>
      ),
    },
  ];

  return (
    <div className={s.estreito} style={{ maxWidth: 720 }}>
      <h1 className={s.titulo}>Documentos</h1>
      <Txt>Toque num documento para abrir o resumo.</Txt>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {docs.map((d) => (
          <details key={d.titulo} className={s.doc} style={{ background: "#fff", borderRadius: 16 }}>
            <summary>
              <span className={s.docIcone} aria-hidden="true"><Icone n="doc" t={22} /></span>
              <span className={s.docTxt}><b>{d.titulo}</b><span>{d.sub}</span></span>
              <span className={s.docAbrir}>Abrir</span>
            </summary>
            <div className={s.docCorpo}>{d.corpo}</div>
          </details>
        ))}
      </div>
      <Nota ic="info" cor={COR.caneta} fundo="#E4E9FA">
        O fundo não é registrado na CVM; em produção, a estrutura jurídica será definida com assessoria.
      </Nota>
    </div>
  );
}
