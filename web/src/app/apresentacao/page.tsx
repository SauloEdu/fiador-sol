"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicKey } from "@solana/web3.js";
import { DemoProvider, useD, useTick } from "@/components/DemoProvider";
import { agoraChain, type Evento } from "@/components/useDemo";
import * as A from "@/lib/actions";
import { CLUSTER, PROGRAM_ID, explorerTx } from "@/lib/constants";
import { fromUnits } from "@/lib/format";
import * as H from "@/lib/historia";
import { Carimbo, COR, Icone, reais } from "@/ui";
import { Mini, simbolos } from "../imobiliaria/mini";
import s from "./palco.module.css";

/** Pix simulado sem tela (o Palco conduz a história; o celular mostra o app de verdade). */
async function pixAutomatico(carteira: PublicKey, valor: number) {
  const c = await fetch("/api/pix/cobranca", { method: "POST", body: JSON.stringify({ carteira: carteira.toBase58(), valor }) }).then((r) => r.json());
  if (c.erro) throw new Error(c.erro);
  const r = await fetch("/api/pix/confirmar", { method: "POST", body: JSON.stringify({ id: c.id }) }).then((x) => x.json());
  if (r.erro) throw new Error(r.erro);
}

const ETAPAS = ["Contrato e caução lacrada", "Primeiro mês pago", "Atraso: a caução paga", "Ana quita e o cofre enche", "Fim: caução volta"];

function Palco() {
  useTick();
  const d = useD();
  const l = d.snap?.lease ?? null;
  const agora = agoraChain(d.snap);
  const [erro, setErro] = useState<string | null>(null);
  const HISTORIA = ["contrato", "caucao", "aluguel", "quitacao", "cobranca", "encerrou", "acerto", "danos", "decisao"];
  const ev = d.eventos.filter((e) => e.tipo === "ok" && e.sig && e.kind && HISTORIA.includes(e.kind) && (e.leaseId === undefined || e.leaseId === d.leaseId));
  const ultimo = ev[0];

  // Em que ponto da história estamos (derivado da Solana, não de cliques).
  const teveCobranca = !!l?.periods.some((p) => p === "covered" || p === "settled");
  const teveQuitacao = !!l?.periods.includes("settled");
  const etapa = !l || l.status === "pending" ? 0 : l.status === "closed" || l.status === "ending" || l.status === "disputed" ? 4
    : teveQuitacao ? 3 : teveCobranca ? 2 : l.paidOnTime + l.paidLate >= 1 ? 1 : 0;

  const i = l ? H.proximoAPagar(l) : -1;
  const aluguel = l ? fromUnits(l.rent) : 2000;
  const taxa = l ? fromUnits(H.taxa(l)) : 160;

  async function rodar(fn: () => Promise<unknown>) {
    setErro(null);
    try { await fn(); } catch (e) { setErro(A.readableError(e)); }
  }

  // Próximo passo sugerido e o botão "Avançar".
  let proximo: { rotulo: string; acao?: () => Promise<unknown>; espera?: string } = { rotulo: "" };
  if (d.kp && d.addrs && d.lease && d.agency) {
    const kp = d.kp, addrs = d.addrs, lease = d.lease, agency = d.agency;
    if (!l || l.status === "closed") {
      proximo = {
        rotulo: l ? "Começar outro contrato" : "Criar o contrato da Ana",
        acao: async () => {
          if (l) return d.novoContrato();
          await d.executar("Imobiliária Sol", "Criando o contrato…", () => "A Imobiliária Sol criou o contrato; o Carlos aprovou.",
            () => A.createLease(d.connection, kp.imobiliaria, kp.proprietario, kp.inquilino.publicKey, d.leaseId, 2000, 6, 60), { kind: "contrato", valor: 2000 });
        },
      };
    } else if (l.status === "pending") {
      const caucao = aluguel * H.mesesDeCaucao(d.snap?.profile ?? null);
      proximo = {
        rotulo: `Ana guarda ${reais(caucao, false)} de caução por Pix`,
        acao: async () => {
          await pixAutomatico(kp.inquilino.publicKey, caucao);
          await d.executar("Ana", "Guardando a caução…", () => `Ana guardou ${reais(caucao)} de caução no cofre do contrato.`,
            () => A.acceptLease(d.connection, kp.inquilino, lease, agency, addrs), { kind: "caucao", valor: caucao });
        },
      };
    } else if ((l.status === "active" || l.status === "defaulted") && i >= 0) {
      const venc = H.vencimento(l, i);
      const coberto = l.periods[i] === "covered";
      const pagar = async () => {
        await pixAutomatico(kp.inquilino.publicKey, aluguel + taxa);
        await d.executar("Ana", "Registrando o pagamento…", () => coberto ? `Ana quitou ${H.nomeMes(i)}: o cofre encheu de novo.` : `Ana pagou ${H.nomeMes(i)}: ${reais(aluguel)} para o Carlos e ${reais(taxa)} para o fundo.`,
          () => A.payRent(d.connection, kp.inquilino, lease, kp.proprietario.publicKey, addrs), { kind: coberto ? "quitacao" : "aluguel", periodo: i, valor: aluguel + taxa });
      };
      if (etapa === 1 && !coberto && !teveCobranca)
        proximo = agora > venc + l.graceSecs
          ? { rotulo: "A cobrança automática vai pagar o Carlos", espera: "aguardando o registro na Solana…" }
          : { rotulo: `Deixar ${H.nomeMes(i)} atrasar`, espera: agora > venc ? `carência termina em ${H.mmss(venc + l.graceSecs - agora)}` : `${H.nomeMes(i)} vence em ${H.mmss(venc - agora)}` };
      else if (!coberto && agora < H.inicio(l, i))
        proximo = { rotulo: `Ana paga ${H.nomeMes(i)}`, espera: `${H.nomeMes(i)} começa em ${H.mmss(H.inicio(l, i) - agora)}` };
      else proximo = { rotulo: coberto ? `Ana quita ${H.nomeMes(i)}` : `Ana paga ${H.nomeMes(i)}`, acao: pagar };
    } else if (l.status === "active" || l.status === "defaulted") {
      proximo = { rotulo: "Fim do prazo", espera: `o contrato termina em ${H.mmss(H.vencimento(l, l.totalPeriods - 1) - agora)}` };
    } else if (l.status === "ending") {
      proximo = { rotulo: "Vistoria de saída", espera: `janela de danos fecha em ${H.mmss(l.endTs + l.disputeWindowSecs - agora)}; depois a caução volta sozinha` };
    } else if (l.status === "disputed") {
      proximo = { rotulo: "A imobiliária decide os danos", espera: "no painel da imobiliária" };
    }
  }

  const carimbo: [string, string] | null = !ultimo ? null :
    ultimo.kind === "cobranca" ? ["PAGO PELA CAUÇÃO", COR.verm] :
    ultimo.kind === "quitacao" ? ["QUITADO", COR.roxo] :
    ultimo.kind === "aluguel" ? ["PAGO", COR.verde] :
    ultimo.kind === "caucao" ? ["LACRADA", COR.tinta] :
    ultimo.kind === "acerto" ? ["DEVOLVIDA", COR.verde] :
    ultimo.kind === "contrato" ? ["REGISTRADO", COR.tinta] : ["REGISTRADO", COR.tinta];
  const mensagem = !ultimo ? "Tudo o que acontecer aqui fica registrado na Solana." :
    ultimo.kind === "cobranca" ? `O Carlos recebeu ${reais(aluguel, false)} da caução. Ninguém precisou cobrar a Ana.` : ultimo.texto;

  const prot = l ? fromUnits(l.depositBalance) + fromUnits(H.coberturaDoFundo(l)) : 0;
  const m = H.momento(l, agora);

  return (
    <div className={s.palco}>
      <header className={s.topo}>
        <Link href="/" className={s.logo}>Fiador<span>.sol</span></Link>
        <h1 className={s.lema}>Ao vivo na Solana {CLUSTER === "devnet" ? "devnet" : "local"}. Na demonstração, 1 mês dura {l?.periodSecs ?? 60} segundos.</h1>
        <span className={s.relogio} role="timer">{m.titulo}</span>
        {proximo.acao ? (
          <button type="button" className={s.avancar} disabled={!!d.ocupado} onClick={() => rodar(proximo.acao!)}>
            {d.ocupado ?? `Avançar: ${proximo.rotulo}`}
          </button>
        ) : proximo.rotulo ? (
          <span className={s.esperando}><span className={s.pontinho} aria-hidden="true" />{proximo.rotulo}: {proximo.espera}</span>
        ) : null}
      </header>
      {erro && <p role="alert" className={s.erro}>{erro}</p>}
      <div className={s.grade}>
        <div className={s.celularCol}>
          <span className={s.legenda}>Celular da Ana</span>
          <div className={s.celular}><iframe title="App da Ana ao vivo" src="/inquilino" className={s.tela} /></div>
        </div>
        <div className={s.direita}>
          <div className={s.linha1}>
            <section className={s.fita} aria-labelledby="fita-t">
              <h2 id="fita-t">O que acabou de acontecer na Solana</h2>
              <ol>
                {ev.slice(0, 5).map((e: Evento) => (
                  <li key={e.id}>
                    <span>{new Date(e.t).toLocaleTimeString("pt-BR")}</span>
                    <span style={{ color: e.kind === "cobranca" ? COR.verm : COR.tinta }}>{e.texto}</span>
                    {e.sig && <a href={explorerTx(e.sig)} target="_blank" rel="noreferrer">{e.sig.slice(0, 6)}…</a>}
                  </li>
                ))}
                {!ev.length && <li><span>—</span><span style={{ color: COR.graf }}>Nada ainda. Toque em Avançar para começar.</span></li>}
              </ol>
            </section>
            <section className={s.destaque} aria-live="polite">
              <p>{mensagem}</p>
              {carimbo && <span key={ultimo?.id}><Carimbo txt={carimbo[0]} cor={carimbo[1]} t={32} rot={-6} animar data={ultimo?.periodo !== undefined ? H.dataCarimbo(ultimo.periodo) : undefined} /></span>}
              {ultimo?.sig && <a href={explorerTx(ultimo.sig)} target="_blank" rel="noreferrer" className={s.explorar}><Icone n="lupa" t={20} />Conferir a transação no explorador da Solana</a>}
            </section>
          </div>
          <section aria-labelledby="imob-t" className={s.imob}>
            <h2 id="imob-t">Na tela da Imobiliária Sol</h2>
            <div className={s.imobLinha}>
              <span><b>{H.IMOVEL.endereco}</b><span>Ana Lima, {reais(aluguel, false)}</span></span>
              {l ? <Mini cart={simbolos(l, agora).join("")} /> : <span style={{ color: COR.graf }}>sem contrato</span>}
              <b style={{ color: m.tom === "perigo" ? COR.verm : m.tom === "alerta" ? COR.ambar : m.tom === "ok" ? COR.verde : COR.tinta }}>{m.titulo}</b>
              <span className={s.prot}><b>proteção {reais(prot, false)}</b><span>{l && l.paidOnTime + l.paidLate >= 2 ? "caução + fundo" : "o fundo entra após o 2º aluguel pago"}</span></span>
            </div>
          </section>
          <ol aria-label="Roteiro da demonstração" className={s.etapas}>
            {ETAPAS.map((t, k) => (
              <li key={t} aria-current={k === etapa ? "step" : undefined} className={k === etapa ? s.agora : ""}>
                <span>{k < etapa ? "Feito" : k === etapa ? "Agora" : "Depois"}</span>{t}
              </li>
            ))}
          </ol>
          <div className={s.solana}>
            <b>Na Solana agora</b>
            <span>{ev.length} registros</span>
            <span>custo de cada registro ≈ R$ 0,01 (taxa média da rede)</span>
            <span className={s.programa}>Programa {PROGRAM_ID.toBase58().slice(0, 4)}…{PROGRAM_ID.toBase58().slice(-4)}</span>
          </div>
          <div className={s.links}>
            <Link href="/imobiliaria">Painel da imobiliária</Link>
            <Link href="/proprietario">App do Carlos</Link>
            <Link href="/investidor">Fundo de garantia</Link>
            <button type="button" onClick={() => { if (window.confirm("Recomeçar a demonstração do zero?")) d.novaDemo(); }}>Recomeçar do zero</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Apresentacao() {
  return <DemoProvider><Palco /></DemoProvider>;
}
