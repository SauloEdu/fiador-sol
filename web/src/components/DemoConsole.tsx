"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BN from "bn.js";
import { brl, fromUnits, short } from "@/lib/format";
import { CLUSTER, DEMO, explorerAddress, explorerTx } from "@/lib/constants";
import * as A from "@/lib/actions";
import * as H from "@/lib/historia";
import { Pix } from "./Pix";
import { agoraChain, useDemo, type LeaseView, type Snapshot } from "./useDemo";
import styles from "./demo.module.css";

/** Re-renderiza a cada segundo para as contagens regressivas andarem. */
function useTick() {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);
}

const mmss = (s: number) => {
  const v = Math.max(0, Math.ceil(s));
  return `${String(Math.floor(v / 60)).padStart(2, "0")}:${String(v % 60).padStart(2, "0")}`;
};

const STATUS: Record<LeaseView["status"], [string, string]> = {
  pending: ["Aguardando o inquilino", "t-warn"],
  active: ["Em dia", "t-good"],
  defaulted: ["Com mês em aberto", "t-bad"],
  ending: ["Prazo encerrado · janela de contestação", "t-purple"],
  disputed: ["Contestação aberta", "t-warn"],
  closed: ["Encerrado", "t-muted"],
};

function due(l: LeaseView, i: number) {
  return l.startTs + l.periodSecs * (i + 1);
}

function mes(l: LeaseView, i: number, now: number): { rotulo: string; cls: string; atual?: boolean } {
  const p = l.periods[i];
  if (p === "paid") return { rotulo: "Pago", cls: "t-good" };
  if (p === "covered") return { rotulo: "Coberto · inquilino deve", cls: "t-bad" };
  if (p === "settled") return { rotulo: "Quitado com atraso", cls: "t-purple" };
  if (l.status === "pending") return { rotulo: "A vencer", cls: "t-muted" };
  const d = due(l, i);
  if (now > d + l.graceSecs) return { rotulo: "Atrasado · cobrável", cls: "t-bad", atual: true };
  if (now > d) return { rotulo: "Vencido · carência", cls: "t-warn", atual: true };
  if (now >= d - l.periodSecs) return { rotulo: "Mês corrente", cls: "t-accent", atual: true };
  return { rotulo: "A vencer", cls: "t-muted" };
}

/** Mesma regra do programa (TenantProfile::deposit_months). */
function mesesDeCaucao(p: Snapshot["profile"]) {
  if (!p || p.defaults > 0) return 3;
  if (p.onTime >= 12 && p.leasesStarted >= 2) return 1;
  if (p.onTime >= 6) return 2;
  return 3;
}

export function DemoConsole() {
  useTick();
  const d = useDemo();
  const { kp, addrs, snap, lease } = d;
  const [aluguel, setAluguel] = useState(2000);
  const [meses, setMeses] = useState(6);
  const [duracao, setDuracao] = useState(120);
  const [dano, setDano] = useState(1500);
  const [decisao, setDecisao] = useState(1000);
  const [aporte, setAporte] = useState(20000);

  const now = agoraChain(snap);
  const l = snap?.lease ?? null;
  const premium = l ? Math.floor((l.rent * l.premiumBps) / 10_000) : 0;
  const proximo = l ? l.periods.findIndex((p) => p === "open" || p === "covered") : -1;
  const primeiroAberto = l ? l.periods.findIndex((p) => p === "open") : -1;

  // contagem do momento
  let relogio = "";
  if (l && (l.status === "active" || l.status === "defaulted") && primeiroAberto >= 0) {
    const dd = due(l, primeiroAberto);
    relogio =
      now < dd
        ? `Mês ${primeiroAberto + 1} vence em ${mmss(dd - now)}`
        : now < dd + l.graceSecs
          ? `Mês ${primeiroAberto + 1} venceu · carência acaba em ${mmss(dd + l.graceSecs - now)}`
          : `Mês ${primeiroAberto + 1} atrasado · o keeper pode cobrar`;
  } else if (l && (l.status === "active" || l.status === "defaulted")) {
    const fimPrazo = due(l, l.totalPeriods - 1);
    relogio =
      now < fimPrazo
        ? `Todos os meses quitados · o prazo termina em ${mmss(fimPrazo - now)}`
        : "Prazo terminado · o keeper encerra o contrato";
  } else if (l && l.status === "ending") {
    const fim = l.endTs + l.disputeWindowSecs;
    relogio = now < fim ? `Janela de contestação fecha em ${mmss(fim - now)}` : "Janela fechada · acerto final a caminho";
  }

  const passos: [string, boolean][] = [
    ["A imobiliária cria o contrato", !!l],
    ["O inquilino compra tBRL via Pix", !!l && (l.status !== "pending" || (snap?.bal.inquilino ?? 0) > 0)],
    ["O inquilino aceita e deposita a caução", !!l && l.status !== "pending"],
    ["Paga um mês em dia (aluguel + 8% ao pool)", (l?.paidOnTime ?? 0) >= 1],
    ["Deixa um mês atrasar: o keeper cobra e o proprietário recebe da caução", !!l && l.periods.some((p) => p === "covered" || p === "settled")],
    ["Quita o mês atrasado: o dinheiro volta para a caução", !!l && l.periods.includes("settled")],
    ["Paga até o fim: a caução volta com rendimento", l?.status === "closed"],
  ];
  const proximoPasso = passos.findIndex(([, ok]) => !ok);

  // Quanto falta na carteira do inquilino para o próximo passo (sugestão do Pix).
  const saldoInq = fromUnits(snap?.bal.inquilino ?? 0);
  const custoMes = l ? fromUnits(l.rent + premium) : 0;
  const precisa = !l
    ? aluguel * mesesDeCaucao(snap?.profile ?? null) + aluguel * 1.08
    : l.status === "pending"
      ? fromUnits(l.rent) * mesesDeCaucao(snap?.profile ?? null) + custoMes
      : custoMes;
  const sugestaoInquilino = Math.max(100, Math.ceil(Math.max(precisa - saldoInq, custoMes || 100) / 100) * 100);

  /** Confere o saldo antes de mandar a transação, com uma mensagem clara. */
  function temSaldo(quem: string, reais: number, saldo: number) {
    if (saldo + 1e-9 >= reais) return true;
    d.registrar({ quem, tipo: "erro", texto: `Saldo de tBRL insuficiente: precisa de ${brl(reais, true)} e tem ${brl(saldo, true)}. Compre com Pix.` });
    return false;
  }

  if (d.erroGeral) {
    return (
      <div className={styles.main}>
        <p className={styles.notice}>
          Não consegui conectar à rede da demo: {d.erroGeral}. Verifique se a Solana local está rodando e se o
          comando <code>npm run setup</code> foi executado.
        </p>
      </div>
    );
  }

  const pronto = kp && addrs && lease && d.agency;

  return (
    <div className={styles.page}>
      <header className={styles.bar}>
        <Link href="/" className={styles.logo}>
          Fiador<span>.sol</span>
        </Link>
        <span className="tag t-accent">Demo ao vivo · Solana {CLUSTER === "devnet" ? "devnet" : "local"}</span>
        <div className={styles.barRight}>
          <span className={styles.clock} title="Relógio usado pelo programa para vencimentos">
            relógio da rede {new Date(now * 1000).toLocaleTimeString("pt-BR")}
          </span>
          <label className={styles.toggle}>
            <input
              id="keeper-auto"
              type="checkbox"
              checked={d.keeperAuto}
              onChange={(e) => d.setKeeperAuto(e.target.checked)}
            />
            Keeper automático
          </label>
          <button className="btn small ghost" type="button" onClick={d.novaDemo}>
            Recomeçar do zero
          </button>
        </div>
      </header>

      {!pronto || !snap ? (
        <div className={styles.main}>
          <p className="muted">{d.ocupado ?? "Conectando à rede…"}</p>
        </div>
      ) : (
        <main className={styles.main}>
          <div className={styles.col}>
            {/* ---------------- contrato ---------------- */}
            <section className={styles.contract} aria-labelledby="contrato">
              <div className={styles.contractHead}>
                <div style={{ display: "grid", gap: 4 }}>
                  <span className="eyebrow">
                    Contrato #{d.leaseId}
                    {l ? ` · 1 mês = ${l.periodSecs >= 120 ? `${l.periodSecs / 60} min` : `${l.periodSecs} s`} na demo` : ""}
                  </span>
                  <h1 id="contrato">
                    {l ? `Aluguel de ${brl(l.rent)} por mês` : "Nenhum contrato ainda"}
                  </h1>
                </div>
                {l && <span className={`tag ${STATUS[l.status][1]}`}>{STATUS[l.status][0]}</span>}
              </div>
              {l ? (
                <>
                  {relogio && <p className={styles.countdown}>{relogio}</p>}
                  <div className={styles.months}>
                    {l.periods.map((_, i) => {
                      const m = mes(l, i, now);
                      return (
                        <div key={i} className={`${styles.month} ${m.atual && i === primeiroAberto ? styles.now : ""}`}>
                          <span className={styles.monthN}>
                            <span>mês {i + 1}</span>
                          </span>
                          <span className={`tag ${m.cls}`}>{m.rotulo}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className={styles.facts}>
                    <div className={styles.fact}>
                      <b>{brl(l.depositBalance)}</b>
                      <span>Caução no cofre{l.depositRequired ? ` (de ${brl(l.depositRequired)})` : ""}</span>
                    </div>
                    <div className={styles.fact}>
                      <b>{brl(H.coberturaDoFundo(l))}</b>
                      <span>Cobertura do pool liberada (cresce a cada mês pago, até {brl(l.coverageCap)})</span>
                    </div>
                    <div className={styles.fact}>
                      <b>{l.paidOnTime} · {l.paidLate}</b>
                      <span>Meses pagos em dia · com atraso</span>
                    </div>
                    <div className={styles.fact}>
                      <b>{brl(l.poolDebt)}</b>
                      <span>Inquilino deve ao pool</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="muted">Comece pela imobiliária: ela cria o contrato junto com o proprietário.</p>
              )}
            </section>

            {/* ---------------- papéis ---------------- */}
            <div className={styles.roles}>
              {/* Imobiliária */}
              <section className={styles.role} aria-labelledby="r-imob">
                <div className={styles.roleHead}>
                  <h2 id="r-imob">
                    <span className={styles.dot} style={{ background: "var(--ink)" }} /> Imobiliária
                  </h2>
                  <a className={styles.addr} href={explorerAddress(kp.imobiliaria.publicKey.toBase58())} target="_blank" rel="noreferrer">
                    {short(kp.imobiliaria.publicKey.toBase58())}
                  </a>
                </div>
                {!l ? (
                  <>
                    <p className={styles.hint}>
                      Credenciada no protocolo. Cria o contrato junto com o proprietário (as duas carteiras assinam).
                    </p>
                    <div className="row">
                      <label className="field" style={{ flex: "1 1 110px" }}>
                        Aluguel (R$)
                        <input id="aluguel" type="number" min={100} step={100} value={aluguel} onChange={(e) => setAluguel(Number(e.target.value))} />
                      </label>
                      <label className="field" style={{ flex: "1 1 120px" }}>
                        1 mês na demo dura
                        <select id="duracao" value={duracao} onChange={(e) => setDuracao(Number(e.target.value))}>
                          <option value={60}>1 minuto</option>
                          <option value={120}>2 minutos</option>
                          <option value={300}>5 minutos</option>
                        </select>
                      </label>
                      <label className="field" style={{ flex: "1 1 90px" }}>
                        Meses
                        <select id="meses" value={meses} onChange={(e) => setMeses(Number(e.target.value))}>
                          {[3, 4, 6, 8, 12].map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <p className={styles.hint}>
                      Caução exigida deste inquilino: {mesesDeCaucao(snap.profile)} {mesesDeCaucao(snap.profile) > 1 ? "aluguéis" : "aluguel"} ={" "}
                      {brl(aluguel * mesesDeCaucao(snap.profile), true)}
                      {mesesDeCaucao(snap.profile) < 3 ? " — menos caução por causa do histórico de bom pagador." : "."}
                    </p>
                    <button
                      className="btn primary"
                      type="button"
                      disabled={!!d.ocupado}
                      onClick={() =>
                        d.executar(
                          "Imobiliária",
                          "Criando o contrato…",
                          () =>
                            `Contrato #${d.leaseId} criado: aluguel de ${brl(aluguel, true)} por ${meses} meses. Só o hash do contrato vai para a blockchain.`,
                          () =>
                            A.createLease(d.connection, kp.imobiliaria, kp.proprietario, kp.inquilino.publicKey, d.leaseId, aluguel, meses, duracao)
                        )
                      }
                    >
                      Criar contrato
                    </button>
                  </>
                ) : l.status === "disputed" ? (
                  <>
                    <p className={styles.hint}>
                      O proprietário contestou {brl(l.disputeAmount)} de danos. A imobiliária decide quanto sai da caução.
                    </p>
                    <div className="row">
                      <label className="field" style={{ flex: "1 1 120px" }}>
                        Valor aprovado (R$)
                        <input id="decisao" type="number" min={0} value={decisao} onChange={(e) => setDecisao(Number(e.target.value))} />
                      </label>
                      <button
                        className="btn primary"
                        type="button"
                        disabled={!!d.ocupado}
                        onClick={() =>
                          d.executar("Imobiliária", "Registrando a decisão…", () => `Decisão registrada: ${brl(decisao, true)} da caução vão ao proprietário.`, () =>
                            A.resolveDispute(d.connection, kp.imobiliaria, lease, kp.proprietario.publicKey, decisao, addrs)
                          )
                        }
                      >
                        Decidir
                      </button>
                    </div>
                  </>
                ) : l.status === "closed" ? (
                  <>
                    <p className={styles.hint}>
                      Contrato encerrado. Um novo contrato com o mesmo inquilino usa a reputação dele para definir a caução.
                    </p>
                    <button className="btn" type="button" onClick={d.novoContrato}>
                      Novo contrato com o mesmo inquilino
                    </button>
                  </>
                ) : (
                  <dl className={styles.kv}>
                    <dt>Aluguel</dt>
                    <dd>{brl(l.rent)}</dd>
                    <dt>Prêmio ao pool (8%)</dt>
                    <dd>{brl(premium)}</dd>
                    <dt>Cobertura máxima do pool</dt>
                    <dd>{brl(l.coverageCap)}</dd>
                    <dt>Carência</dt>
                    <dd>{l.graceSecs} s</dd>
                  </dl>
                )}
              </section>

              {/* Inquilino */}
              <section className={styles.role} aria-labelledby="r-inq">
                <div className={styles.roleHead}>
                  <h2 id="r-inq">
                    <span className={styles.dot} style={{ background: "var(--accent)" }} /> Inquilino
                  </h2>
                  <a className={styles.addr} href={explorerAddress(kp.inquilino.publicKey.toBase58())} target="_blank" rel="noreferrer">
                    {short(kp.inquilino.publicKey.toBase58())}
                  </a>
                </div>
                <div>
                  <div className={styles.big}>{brl(snap.bal.inquilino)}</div>
                  <span className={styles.hint}>saldo em tBRL (stablecoin de real de teste)</span>
                </div>
                <Pix
                  key={`pix-inq-${sugestaoInquilino}`}
                  carteira={kp.inquilino.publicKey}
                  sugerido={sugestaoInquilino}
                  rotulo="Comprar com Pix"
                  onPago={(v, sig) => {
                    d.registrar({ quem: "Inquilino", tipo: "ok", texto: `Pix de ${brl(v, true)} confirmado: virou ${brl(v, true)} em tBRL na carteira.`, sig });
                    d.atualizar();
                  }}
                />
                {l?.status === "pending" && (
                  <button
                    className="btn primary"
                    type="button"
                    disabled={!!d.ocupado}
                    onClick={() =>
                      temSaldo("Inquilino", fromUnits(l.rent) * mesesDeCaucao(snap.profile), saldoInq) &&
                      d.executar(
                        "Inquilino",
                        "Depositando a caução…",
                        () => `Contrato aceito. A caução foi para o cofre do contrato, que só o programa movimenta, e o pool reservou a cobertura.`,
                        () => A.acceptLease(d.connection, kp.inquilino, lease, d.agency!, addrs)
                      )
                    }
                  >
                    Aceitar e depositar caução de {brl(l.rent * mesesDeCaucao(snap.profile))}
                  </button>
                )}
                {l && (l.status === "active" || l.status === "defaulted") && proximo >= 0 && (
                  <button
                    className="btn primary"
                    type="button"
                    disabled={!!d.ocupado || (l.periods[proximo] !== "covered" && now < due(l, proximo) - l.periodSecs)}
                    onClick={() => {
                      if (!temSaldo("Inquilino", custoMes, saldoInq)) return;
                      const coberto = l.periods[proximo] === "covered";
                      const emDia = !coberto && now <= due(l, proximo);
                      d.executar(
                        "Inquilino",
                        "Pagando…",
                        () =>
                          coberto
                            ? `Mês ${proximo + 1} quitado. O proprietário já tinha recebido, então o dinheiro repôs o pool e a caução.`
                            : `Mês ${proximo + 1} pago ${emDia ? "em dia" : "com atraso"}: ${brl(l.rent)} direto ao proprietário e ${brl(premium)} de prêmio ao pool.`,
                        () => A.payRent(d.connection, kp.inquilino, lease, kp.proprietario.publicKey, addrs)
                      );
                    }}
                  >
                    {l.periods[proximo] === "covered"
                      ? `Quitar mês ${proximo + 1} em atraso — ${brl(l.rent + premium)}`
                      : `Pagar mês ${proximo + 1} — ${brl(l.rent + premium)}`}
                  </button>
                )}
                <div className={styles.seals} aria-label={`${snap.badges} selo(s) de bom pagador`}>
                  {[3, 6, 12].map((m, i) => (
                    <span key={m} className={`${styles.seal} ${i < snap.badges ? "" : styles.off}`} title={`Selo aos ${m} meses em dia`}>
                      {m}
                    </span>
                  ))}
                  <span className={styles.hint}>
                    {snap.badges ? `${snap.badges} selo(s) intransferível(is)` : "selos aos 3, 6 e 12 meses em dia"}
                  </span>
                </div>
                <p className={styles.hint}>
                  Reputação: {snap.profile?.onTime ?? 0} em dia · {snap.profile?.late ?? 0} com atraso · {snap.profile?.defaults ?? 0} calote(s).{" "}
                  <Link href={`/reputacao/${kp.inquilino.publicKey.toBase58()}`} target="_blank">
                    Ver página pública
                  </Link>
                </p>
              </section>

              {/* Proprietário */}
              <section className={styles.role} aria-labelledby="r-prop">
                <div className={styles.roleHead}>
                  <h2 id="r-prop">
                    <span className={styles.dot} style={{ background: "var(--warn)" }} /> Proprietário
                  </h2>
                  <a className={styles.addr} href={explorerAddress(kp.proprietario.publicKey.toBase58())} target="_blank" rel="noreferrer">
                    {short(kp.proprietario.publicKey.toBase58())}
                  </a>
                </div>
                <div>
                  <div className={styles.big}>{brl(snap.bal.proprietario)}</div>
                  <span className={styles.hint}>recebido até agora</span>
                </div>
                <p className={styles.hint}>
                  Recebe o aluguel direto na carteira. Se atrasar, recebe da caução na hora, sem ação de despejo.
                </p>
                {l?.status === "ending" && now <= l.endTs + l.disputeWindowSecs && (
                  <div className="row">
                    <label className="field" style={{ flex: "1 1 120px" }}>
                      Danos no imóvel (R$)
                      <input id="dano" type="number" min={1} value={dano} onChange={(e) => setDano(Number(e.target.value))} />
                    </label>
                    <button
                      className="btn"
                      type="button"
                      disabled={!!d.ocupado}
                      onClick={() =>
                        d.executar("Proprietário", "Abrindo contestação…", () => `Contestação de ${brl(dano, true)} aberta. A devolução da caução fica suspensa até a imobiliária decidir.`, () =>
                          A.openDispute(d.connection, kp.proprietario, lease, dano)
                        )
                      }
                    >
                      Contestar danos
                    </button>
                  </div>
                )}
              </section>

              {/* Investidor */}
              <Investidor d={d} snap={snap} aporte={aporte} setAporte={setAporte} now={now} />
            </div>
          </div>

          {/* ---------------- lateral ---------------- */}
          <aside className={styles.side}>
            <section className={styles.panel} aria-labelledby="roteiro">
              <h2 id="roteiro">Roteiro da demo</h2>
              <ol className={styles.guide}>
                {passos.map(([t, ok], i) => (
                  <li key={t} className={ok ? styles.done : i === proximoPasso ? styles.next : ""}>
                    <span>{t}</span>
                  </li>
                ))}
              </ol>
            </section>
            <section className={styles.panel} aria-labelledby="feed">
              <h2 id="feed">O que aconteceu</h2>
              <div className={styles.feed} role="log">
                {d.eventos.length === 0 && <p className={styles.hint}>As transações aparecem aqui, com link para o explorer.</p>}
                {d.eventos.map((e) => (
                  <div key={e.id} className={`${styles.ev} ${e.tipo === "erro" ? styles.erro : ""}`}>
                    <div className={styles.evHead}>
                      <span>{new Date(e.t).toLocaleTimeString("pt-BR")}</span>
                      <span className={`tag ${e.quem === "Keeper" ? "t-purple" : e.tipo === "erro" ? "t-bad" : "t-muted"}`}>{e.quem}</span>
                    </div>
                    <p>{e.tipo === "erro" ? `Recusado pelo programa: ${e.texto}` : e.texto}</p>
                    {e.sig && (
                      <a className={styles.addr} href={explorerTx(e.sig)} target="_blank" rel="noreferrer">
                        ver transação {short(e.sig, 6)}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </main>
      )}
      {d.ocupado && <div className={styles.busy}>{d.ocupado}</div>}
    </div>
  );
}

function Investidor({
  d,
  snap,
  aporte,
  setAporte,
  now,
}: {
  d: ReturnType<typeof useDemo>;
  snap: Snapshot;
  aporte: number;
  setAporte: (n: number) => void;
  now: number;
}) {
  const { kp, addrs } = d;
  if (!kp || !addrs) return null;
  const pos = snap.position;
  const valor = pos && snap.pool.totalShares ? (pos.shares * snap.pool.totalAssets) / snap.pool.totalShares : 0;
  const liberaEm = pos && pos.pending ? pos.requestTs + DEMO.withdrawCooldownSecs - now : 0;
  return (
    <section className={styles.role} aria-labelledby="r-inv">
      <div className={styles.roleHead}>
        <h2 id="r-inv">
          <span className={styles.dot} style={{ background: "var(--purple)" }} /> Investidor do pool
        </h2>
        <a className={styles.addr} href={explorerAddress(kp.investidor.publicKey.toBase58())} target="_blank" rel="noreferrer">
          {short(kp.investidor.publicKey.toBase58())}
        </a>
      </div>
      <dl className={styles.kv}>
        <dt>Pool de garantia</dt>
        <dd>{brl(snap.pool.totalAssets)}</dd>
        <dt>Cobertura reservada</dt>
        <dd>{brl(snap.pool.locked)}</dd>
        <dt>Prêmios recebidos</dt>
        <dd>{brl(snap.pool.premiums)}</dd>
        <dt>Minha posição</dt>
        <dd>{brl(valor)}</dd>
        <dt>Saldo na carteira</dt>
        <dd>{brl(snap.bal.investidor)}</dd>
      </dl>
      <Pix
        carteira={kp.investidor.publicKey}
        sugerido={20000}
        rotulo="Comprar com Pix"
        onPago={(v, sig) => {
          d.registrar({ quem: "Investidor", tipo: "ok", texto: `Pix de ${brl(v, true)} confirmado.`, sig });
          d.atualizar();
        }}
      />
      <div className="row">
        <label className="field" style={{ flex: "1 1 120px" }}>
          Aportar no pool (R$)
          <input id="aporte" type="number" min={1} step={1000} value={aporte} onChange={(e) => setAporte(Number(e.target.value))} />
        </label>
        <button
          className="btn purple"
          type="button"
          disabled={!!d.ocupado || snap.bal.investidor <= 0}
          onClick={() =>
            (fromUnits(snap.bal.investidor) >= aporte ||
              (d.registrar({ quem: "Investidor", tipo: "erro", texto: `Saldo insuficiente para aportar ${brl(aporte, true)}. Compre com Pix.` }), false)) &&
            d.executar("Investidor", "Aportando…", () => `Aporte de ${brl(aporte, true)} no pool. Ele passa a ganhar parte dos prêmios de cada aluguel.`, () =>
              A.poolDeposit(d.connection, kp.investidor, aporte, addrs)
            )
          }
        >
          Aportar
        </button>
      </div>
      {pos && pos.shares > 0 && (
        <div className="row">
          {!pos.pending ? (
            <button
              className="btn small"
              type="button"
              disabled={!!d.ocupado}
              onClick={() =>
                d.executar("Investidor", "Pedindo saque…", () => `Saque pedido. Aviso prévio de ${DEMO.withdrawCooldownSecs} s: até lá, a posição ainda garante os contratos.`, () =>
                  A.requestWithdraw(d.connection, kp.investidor, new BN(pos.shares))
                )
              }
            >
              Pedir saque de tudo
            </button>
          ) : (
            <button
              className="btn small"
              type="button"
              disabled={!!d.ocupado || liberaEm > 0}
              onClick={() =>
                d.executar("Investidor", "Sacando…", () => "Saque feito: o valor das cotas voltou para a carteira.", () =>
                  A.poolWithdraw(d.connection, kp.investidor, addrs)
                )
              }
            >
              {liberaEm > 0 ? `Saque libera em ${Math.ceil(liberaEm)} s` : "Sacar"}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
