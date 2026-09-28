"use client";

import Link from "next/link";
import { useD, useTick } from "@/components/DemoProvider";
import { SenhaDemo } from "@/components/SenhaDemo";
import { agoraChain } from "@/components/useDemo";
import { apiPost } from "@/lib/api";
import { explorerTx } from "@/lib/constants";
import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { Botao, Cartao, COR, Linha, Nota, reais, Txt } from "@/ui";
import s from "./risco.module.css";

/**
 * Central de risco: o passo 1 do roteiro de resposta a golpes ("Conter"), em tela.
 * Na demo, o admin é uma chave no servidor, atrás da senha de apresentação.
 * Em produção, cada ação exige várias assinaturas (multisig).
 */
export default function Risco() {
  useTick();
  const d = useD();
  const snap = d.snap;
  const l = snap?.lease ?? null;
  const agora = agoraChain(snap);

  async function admin(rotulo: string, texto: string, pedido: Record<string, unknown>) {
    await d.executar("Equipe Fiador.sol", rotulo, () => texto, async () => {
      const r = await apiPost<{ assinatura?: string; erro?: string }>("/api/admin", pedido);
      if (r.erro || !r.assinatura) throw new Error(r.erro ?? "O servidor não confirmou a ação.");
      return r.assinatura;
    }, { kind: "risco" });
  }

  const imob = d.kp?.imobiliaria.publicKey.toBase58();
  const pendente = l ? fromUnits(l.poolPending) : 0;
  const faltaQuarentena = l ? Math.max(0, l.poolReleaseTs - agora) : 0;
  const ultimos = d.eventos.filter((e) => e.kind === "risco" && e.tipo === "ok").slice(0, 4);

  return (
    <main className={s.pagina}>
      <header className={s.topo}>
        <Link href="/" className={s.logo}>Fiador<span>.sol</span></Link>
        <div>
          <h1>Central de risco</h1>
          <p>O que a equipe faz quando suspeita de golpe: conter primeiro, investigar depois (Fiador Doc, 08).</p>
        </div>
        <Link href="/apresentacao" className={s.voltar}>Voltar ao Palco</Link>
      </header>

      <SenhaDemo protegida={!!snap?.protegida} />
      {d.ocupado && <p className={s.status} role="status">{d.ocupado}</p>}

      <div className={s.grade}>
        <Cartao pad="22px" gap={12}>
          <div className={s.titulo}>
            <h2>Pausa de emergência</h2>
            <span className={s.chip} style={{ background: snap?.pausado ? "#FBEAE8" : "#E3F1E9", color: snap?.pausado ? COR.verm : COR.verde }}>
              {snap?.pausado ? "Protocolo pausado" : "Funcionando"}
            </span>
          </div>
          <Txt peq>Bloqueia contratos novos e a entrada e a saída de dinheiro do fundo. O aluguel continua sendo pago, e a caução continua protegendo o proprietário.</Txt>
          <Botao disabled={!snap || !!d.ocupado} tipo={snap?.pausado ? "secundario" : "primario"}
            onClick={() => snap?.pausado
              ? admin("Retomando…", "A equipe retomou o protocolo: o fundo volta a funcionar.", { acao: "retomar" })
              : admin("Pausando…", "A equipe pausou o protocolo para investigar: o fundo não paga nem recebe aportes até a retomada.", { acao: "pausar" })}>
            {snap?.pausado ? "Retomar o protocolo" : "Pausar o protocolo"}
          </Botao>
        </Cartao>

        <Cartao pad="22px" gap={12}>
          <div className={s.titulo}>
            <h2>Imobiliária Sol</h2>
            <span className={s.chip} style={{ background: snap?.imobiliariaAtiva === false ? "#FBEAE8" : "#E3F1E9", color: snap?.imobiliariaAtiva === false ? COR.verm : COR.verde }}>
              {snap?.imobiliariaAtiva === false ? "Suspensa" : "Credenciada"}
            </span>
          </div>
          <Txt peq>Suspensa, ela não cria contratos e os convites dela não podem ser aceitos. Os contratos em andamento continuam, para não prejudicar quem é honesto.</Txt>
          <Botao disabled={!imob || !!d.ocupado} tipo={snap?.imobiliariaAtiva === false ? "secundario" : "primario"}
            onClick={() => snap?.imobiliariaAtiva === false
              ? admin("Reativando…", "A equipe reativou a Imobiliária Sol.", { acao: "reativar", imobiliaria: imob })
              : admin("Suspendendo…", "A equipe suspendeu a Imobiliária Sol enquanto investiga.", { acao: "suspender", imobiliaria: imob })}>
            {snap?.imobiliariaAtiva === false ? "Reativar a imobiliária" : "Suspender a imobiliária"}
          </Botao>
        </Cartao>

        <Cartao pad="22px" gap={12}>
          <div className={s.titulo}>
            <h2>Pagamento do fundo em quarentena</h2>
            {pendente > 0 && (
              <span className={s.chip} style={{ background: l?.poolFrozen ? "#FBEAE8" : "#FBF1E2", color: l?.poolFrozen ? COR.verm : COR.ambar }}>
                {l?.poolFrozen ? "Congelado" : faltaQuarentena > 0 ? `Libera em ${H.mmss(faltaQuarentena)}` : "Pronto para liberar"}
              </span>
            )}
          </div>
          {pendente > 0 && l ? (
            <>
              <div>
                <Linha k="Valor retido no cofre do fundo" v={reais(pendente)} forte />
                <Linha k="Para" v="Carlos Mendes (proprietário)" />
                <Linha k="Contrato" v={H.IMOVEL.endereco} />
              </div>
              <div className={s.botoes}>
                <Botao disabled={!!d.ocupado} tipo="secundario"
                  onClick={() => l.poolFrozen
                    ? admin("Descongelando…", "Investigação concluída sem golpe: o pagamento do fundo segue para o Carlos.", { acao: "descongelar", contrato: d.lease?.toBase58() })
                    : admin("Congelando…", `A equipe congelou ${reais(pendente)} do fundo para investigar este contrato.`, { acao: "congelar", contrato: d.lease?.toBase58() })}>
                  {l.poolFrozen ? "Descongelar (não foi golpe)" : "Congelar para investigar"}
                </Botao>
                <Botao disabled={!!d.ocupado}
                  onClick={() => admin("Cancelando…", `Golpe confirmado: ${reais(pendente)} voltaram ao fundo dos investidores. O proprietário não recebe.`, { acao: "cancelar", contrato: d.lease?.toBase58() })}>
                  Golpe confirmado: devolver ao fundo
                </Botao>
              </div>
            </>
          ) : (
            <Txt peq>Nenhum pagamento do fundo retido agora. Ele aparece aqui quando a caução acaba e o fundo cobre um mês: o valor fica {l ? "30 segundos" : "um tempo"} em quarentena antes de ir ao proprietário, e a equipe pode congelar ou cancelar.</Txt>
          )}
        </Cartao>
      </div>

      <Nota ic="cadeado" cor={COR.caneta} fundo="#E4E9FA">
        Na demonstração, estas ações são assinadas por uma chave da equipe no servidor. Em produção, cada uma exige várias assinaturas (multisig), e o dinheiro retido nunca sai do cofre do fundo até ser liberado.
      </Nota>

      {ultimos.length > 0 && (
        <section className={s.registro} aria-labelledby="reg-t">
          <h2 id="reg-t">Registrado na Solana</h2>
          <ol>
            {ultimos.map((e) => (
              <li key={e.id}>
                <span>{new Date(e.t).toLocaleTimeString("pt-BR")}</span>
                <span>{e.texto}</span>
                {e.sig && <a href={explorerTx(e.sig)} target="_blank" rel="noreferrer">ver registro</a>}
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
