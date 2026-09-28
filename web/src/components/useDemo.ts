"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Buffer } from "buffer";
import BN from "bn.js";
import { Connection, Keypair, PublicKey, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { RPC_URL } from "@/lib/constants";
import { getProgram } from "@/lib/program";
import { agencyPda, leasePda, poolPda, positionPda, profilePda } from "@/lib/pdas";
import * as A from "@/lib/actions";
import { Mes } from "@/lib/historia";

if (typeof window !== "undefined") {
  (window as unknown as { Buffer: typeof Buffer }).Buffer ??= Buffer;
}

export type Papel = "imobiliaria" | "proprietario" | "inquilino" | "investidor";
export const PAPEIS: Papel[] = ["imobiliaria", "proprietario", "inquilino", "investidor"];

const STORE = "fiador-demo-v1";

type Salvo = { wallets: Record<Papel, number[]>; leaseId: number; preparado: boolean };

function carregar(): Salvo | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Salvo) : null;
  } catch {
    return null;
  }
}
function salvar(s: Salvo) {
  try {
    localStorage.setItem(STORE, JSON.stringify(s));
  } catch {
    /* sem armazenamento: a demo segue só nesta aba */
  }
}
function novo(): Salvo {
  const wallets = Object.fromEntries(PAPEIS.map((p) => [p, Array.from(Keypair.generate().secretKey)])) as Record<
    Papel,
    number[]
  >;
  return { wallets, leaseId: 1, preparado: false };
}

export type EstadoPeriodo = "open" | "paid" | "covered" | "settled";
export type LeaseView = {
  status: "pending" | "active" | "defaulted" | "ending" | "disputed" | "closed";
  rent: number;
  periodSecs: number;
  graceSecs: number;
  totalPeriods: number;
  startTs: number;
  depositRequired: number;
  depositBalance: number;
  poolDebt: number;
  poolCoveredTotal: number;
  coverageCap: number;
  coverageWaitingPeriods: number;
  coverageGrowthBps: number;
  landlordDeductibleBps: number;
  landlordDebt: number;
  periods: EstadoPeriodo[];
  paidOnTime: number;
  paidLate: number;
  endTs: number;
  disputeWindowSecs: number;
  disputeAmount: number;
  disputeResolved: boolean;
  premiumBps: number;
};

export type Snapshot = {
  chainNow: number;
  fetchedAt: number;
  lease: LeaseView | null;
  pool: { totalAssets: number; locked: number; premiums: number; totalShares: number };
  profile: { onTime: number; late: number; defaults: number; leasesCompleted: number; leasesStarted: number } | null;
  position: { shares: number; pending: number; requestTs: number } | null;
  bal: Record<Papel, number>;
  badges: number;
};

/** `kind` e `periodo` deixam as telas montarem extrato e comprovantes a partir dos eventos. */
export type TipoEvento = "contrato" | "caucao" | "aluguel" | "quitacao" | "cobranca" | "encerrou" | "acerto" | "danos" | "decisao" | "pix" | "aporte" | "resgate";
export type Evento = {
  id: string; t: number; quem: string; texto: string; tipo: "ok" | "erro" | "info"; sig?: string;
  kind?: TipoEvento; periodo?: number; valor?: number; leaseId?: number;
};
const EVENTOS = "fiador-eventos-v1";
const CANAL = "fiador-demo";

const n = (v: BN | number) => (typeof v === "number" ? v : Number(v.toString()));
const key = (o: object) => Object.keys(o)[0];

export function useDemo() {
  const connection = useMemo(() => new Connection(RPC_URL, "confirmed"), []);
  const [salvo, setSalvo] = useState<Salvo | null>(null);
  const [addrs, setAddrs] = useState<A.Addrs | null>(null);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [keeperAuto, setKeeperAuto] = useState(true);
  const vistos = useRef(new Set<string>());
  const canal = useRef<BroadcastChannel | null>(null);
  const preparadoNestaSessao = useRef(false);

  const kp = useMemo(() => {
    if (!salvo) return null;
    return Object.fromEntries(
      PAPEIS.map((p) => [p, Keypair.fromSecretKey(Uint8Array.from(salvo.wallets[p]))])
    ) as Record<Papel, Keypair>;
  }, [salvo]);

  const lease = useMemo(
    () => (kp && salvo ? leasePda(kp.proprietario.publicKey, kp.inquilino.publicKey, salvo.leaseId) : null),
    [kp, salvo]
  );

  /** Guarda o evento, avisa as outras abas (Palco, app, painel) e evita duplicados pela assinatura. */
  const adicionar = useCallback((ev: Evento) => {
    if (ev.sig) {
      if (vistos.current.has(ev.sig)) return;
      vistos.current.add(ev.sig);
    }
    setEventos((xs) => {
      const novos = [ev, ...xs].slice(0, 120);
      try { localStorage.setItem(EVENTOS, JSON.stringify(novos)); } catch { /* sem armazenamento */ }
      return novos;
    });
  }, []);
  const registrar = useCallback((e: Omit<Evento, "id" | "t">) => {
    const ev: Evento = { ...e, id: crypto.randomUUID(), t: Date.now() };
    if (ev.sig && vistos.current.has(ev.sig)) return;
    adicionar(ev);
    canal.current?.postMessage(ev);
  }, [adicionar]);

  useEffect(() => {
    try {
      const xs = JSON.parse(localStorage.getItem(EVENTOS) ?? "[]") as Evento[];
      xs.forEach((x) => x.sig && vistos.current.add(x.sig));
      setEventos(xs);
    } catch { /* começa vazio */ }
    if (typeof BroadcastChannel === "undefined") return;
    const c = new BroadcastChannel(CANAL);
    c.onmessage = (m) => {
      const d = m.data as Evento | { reset: true; salvo?: Salvo };
      if ("reset" in d) {
        vistos.current.clear();
        setEventos([]);
        if (d.salvo) {
          if (!d.salvo.preparado) preparadoNestaSessao.current = false;
          setSalvo(d.salvo);
        }
        return;
      }
      adicionar(d);
    };
    canal.current = c;
    return () => c.close();
  }, [adicionar]);

  // --- início: carteiras, endereços e preparação no servidor ---
  useEffect(() => {
    setSalvo(carregar() ?? novo());
  }, []);

  useEffect(() => {
    if (!salvo) return;
    salvar(salvo);
    (async () => {
      try {
        const r = await fetch("/api/estado").then((x) => x.json());
        if (r.erro) throw new Error(r.erro);
        setAddrs({ mint: new PublicKey(r.mint), badgeMint: new PublicKey(r.badgeMint) });
        // Sempre reconfere: a rede de teste pode ter sido reiniciada (a preparação é idempotente).
        if (!preparadoNestaSessao.current) {
          preparadoNestaSessao.current = true;
          setOcupado("Preparando as contas de teste…");
          const body = Object.fromEntries(
            PAPEIS.map((p) => [p, Keypair.fromSecretKey(Uint8Array.from(salvo.wallets[p])).publicKey.toBase58()])
          );
          const p = await fetch("/api/demo/preparar", { method: "POST", body: JSON.stringify(body) }).then((x) =>
            x.json()
          );
          if (p.erro) throw new Error(p.erro);
          if (!salvo.preparado) {
            setSalvo({ ...salvo, preparado: true });
            registrar({ quem: "Sistema", tipo: "info", texto: "Contas de teste criadas. A imobiliária foi credenciada pelo administrador do protocolo." });
          }
          setOcupado(null);
        }
      } catch (e) {
        setOcupado(null);
        setErroGeral((e as Error).message);
      }
    })();
  }, [salvo, registrar]);

  // --- leitura da blockchain a cada 2 s ---
  const atualizar = useCallback(async () => {
    if (!kp || !addrs || !lease) return;
    const program = getProgram(connection, { publicKey: kp.inquilino.publicKey });
    const [clock, l, pool, profile, position, ...bals] = await Promise.all([
      connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY),
      program.account.lease.fetchNullable(lease),
      program.account.pool.fetch(poolPda()),
      program.account.tenantProfile.fetchNullable(profilePda(kp.inquilino.publicKey)),
      program.account.position.fetchNullable(positionPda(kp.investidor.publicKey)),
      ...PAPEIS.map((p) => A.tokenBalance(connection, addrs.mint, kp[p].publicKey)),
      A.tokenBalance(connection, addrs.badgeMint, kp.inquilino.publicKey, true),
    ]);
    const badges = bals.pop() as number;
    setSnap({
      chainNow: clock ? Number(clock.data.readBigInt64LE(32)) : Math.floor(Date.now() / 1000),
      fetchedAt: Date.now(),
      lease: l
        ? {
            status: key(l.status) as LeaseView["status"],
            rent: n(l.rentAmount),
            periodSecs: n(l.periodSecs),
            graceSecs: n(l.graceSecs),
            totalPeriods: l.totalPeriods,
            startTs: n(l.startTs),
            depositRequired: n(l.depositRequired),
            depositBalance: n(l.depositBalance),
            poolDebt: n(l.poolDebt),
            poolCoveredTotal: n(l.poolCoveredTotal),
            coverageCap: n(l.coverageCap),
            coverageWaitingPeriods: l.coverageWaitingPeriods,
            coverageGrowthBps: l.coverageGrowthBps,
            landlordDeductibleBps: l.landlordDeductibleBps,
            landlordDebt: n(l.landlordDebt),
            periods: l.periods.slice(0, l.totalPeriods).map((p) => key(p) as EstadoPeriodo),
            paidOnTime: l.paidOnTime,
            paidLate: l.paidLate,
            endTs: n(l.endTs),
            disputeWindowSecs: n(l.disputeWindowSecs),
            disputeAmount: n(l.disputeAmount),
            disputeResolved: l.disputeResolved,
            premiumBps: l.premiumBps,
          }
        : null,
      pool: {
        totalAssets: n(pool.totalAssets),
        locked: n(pool.lockedCoverage),
        premiums: n(pool.premiumsEarned),
        totalShares: n(pool.totalShares),
      },
      profile: profile
        ? {
            onTime: profile.onTime,
            late: profile.late,
            defaults: profile.defaults,
            leasesCompleted: profile.leasesCompleted,
            leasesStarted: profile.leasesStarted,
          }
        : null,
      position: position
        ? { shares: n(position.shares), pending: n(position.pendingShares), requestTs: n(position.requestTs) }
        : null,
      bal: Object.fromEntries(PAPEIS.map((p, i) => [p, bals[i] as number])) as Record<Papel, number>,
      badges,
    });
  }, [kp, addrs, lease, connection]);

  useEffect(() => {
    if (!salvo?.preparado) return;
    atualizar().catch(() => {});
    const t = setInterval(() => atualizar().catch(() => {}), 2000);
    return () => clearInterval(t);
  }, [salvo?.preparado, atualizar]);

  // --- keeper automático ---
  useEffect(() => {
    if (!keeperAuto || !salvo?.preparado || !lease) return;
    const alvo = lease.toBase58();
    const rodar = async () => {
      try {
        const r = await fetch("/api/keeper", { method: "POST" }).then((x) => x.json());
        for (const f of r.feitas ?? []) {
          if (f.contrato !== alvo) continue;
          const texto =
            f.acao === "cobrou_atraso"
              ? `${Mes(f.mes! - 1)} passou da carência sem pagamento. A cobrança automática pagou o Carlos com a caução.`
              : f.acao === "encerrou_prazo"
                ? "O prazo do contrato terminou. Abriu a janela para o Carlos registrar danos."
                : "Acerto final: a caução voltou para a Ana com o rendimento, e a proteção do fundo foi liberada.";
          registrar({
            quem: "Cobrança automática", tipo: "ok", texto, sig: f.assinatura, leaseId: salvo?.leaseId,
            kind: f.acao === "cobrou_atraso" ? "cobranca" : f.acao === "encerrou_prazo" ? "encerrou" : "acerto",
            periodo: f.mes ? f.mes - 1 : undefined,
          });
        }
        if (r.feitas?.length) atualizar().catch(() => {});
      } catch {
        /* tenta de novo no próximo ciclo */
      }
    };
    const t = setInterval(rodar, 5000);
    return () => clearInterval(t);
  }, [keeperAuto, salvo?.preparado, salvo?.leaseId, lease, registrar, atualizar]);

  // --- executor de ações ---
  const executar = useCallback(
    async (
      quem: string,
      rotulo: string,
      texto: (sig: string) => string,
      fn: () => Promise<string>,
      meta?: Pick<Evento, "kind" | "periodo" | "valor">
    ): Promise<string | null> => {
      setOcupado(rotulo);
      try {
        const sig = await fn();
        registrar({ quem, tipo: "ok", texto: texto(sig), sig, leaseId: salvo?.leaseId, ...meta });
        await atualizar();
        return sig;
      } catch (e) {
        registrar({ quem, tipo: "erro", texto: A.readableError(e) });
        return null;
      } finally {
        setOcupado(null);
      }
    },
    [registrar, atualizar, salvo?.leaseId]
  );

  /** Começa outro contrato com as mesmas pessoas (avisa as outras abas). */
  const novoContrato = useCallback(() => {
    if (!salvo) return;
    const s2 = { ...salvo, leaseId: salvo.leaseId + 1 };
    setSalvo(s2);
    vistos.current.clear();
    setEventos([]);
    try { localStorage.setItem(EVENTOS, "[]"); } catch { /* ok */ }
    canal.current?.postMessage({ reset: true, salvo: s2 });
  }, [salvo]);

  const novaDemo = useCallback(() => {
    const s2 = novo();
    preparadoNestaSessao.current = false;
    vistos.current.clear();
    setEventos([]);
    setSnap(null);
    setSalvo(s2);
    try { localStorage.setItem(EVENTOS, "[]"); } catch { /* ok */ }
    canal.current?.postMessage({ reset: true, salvo: s2 });
  }, []);

  return {
    connection,
    kp,
    addrs,
    lease,
    leaseId: salvo?.leaseId ?? 1,
    agency: kp ? agencyPda(kp.imobiliaria.publicKey) : null,
    snap,
    eventos,
    ocupado,
    erroGeral,
    keeperAuto,
    setKeeperAuto,
    executar,
    registrar,
    atualizar,
    novoContrato,
    novaDemo,
  };
}

/** Relógio da blockchain interpolado entre leituras, para a contagem regressiva andar lisa. */
export function agoraChain(snap: Snapshot | null) {
  if (!snap) return Math.floor(Date.now() / 1000);
  return snap.chainNow + (Date.now() - snap.fetchedAt) / 1000;
}
