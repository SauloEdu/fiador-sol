"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Buffer } from "buffer";
import { Connection, PublicKey } from "@solana/web3.js";
import { explorerAddress, RPC_URL } from "@/lib/constants";
import { tokenBalance } from "@/lib/actions";
import { short } from "@/lib/format";
import { profilePda } from "@/lib/pdas";
import { getProgram } from "@/lib/program";
import { Cartao, COR, Icone, Linha, Selo, Txt } from "@/ui";

if (typeof window !== "undefined") {
  (window as unknown as { Buffer: typeof Buffer }).Buffer ??= Buffer;
}

type Perfil = { onTime: number; late: number; defaults: number; leasesStarted: number; leasesCompleted: number };
type Leitura =
  | { fase: "lendo" }
  | { fase: "invalida" }
  | { fase: "erro"; msg: string }
  | { fase: "pronto"; perfil: Perfil | null; selos: number };

/** Mesma regra do programa (TenantProfile::tier): quantos aluguéis de caução no próximo contrato. */
function caucaoNoProximo(p: Perfil | null) {
  if (!p || p.defaults > 0) return 3;
  if (p.onTime >= 12 && p.leasesStarted >= 2) return 1;
  if (p.onTime >= 6) return 2;
  return 3;
}

/** Lê da Solana o histórico (TenantProfile) e os selos (tokens intransferíveis) da carteira. */
export function Historico({ carteira }: { carteira: string }) {
  const [r, setR] = useState<Leitura>({ fase: "lendo" });

  useEffect(() => {
    let dono: PublicKey;
    try { dono = new PublicKey(carteira); } catch { setR({ fase: "invalida" }); return; }
    let vivo = true;
    (async () => {
      try {
        const connection = new Connection(RPC_URL, "confirmed");
        const program = getProgram(connection, { publicKey: dono });
        const [p, estado] = await Promise.all([
          program.account.tenantProfile.fetchNullable(profilePda(dono)),
          fetch("/api/estado").then((x) => x.json()),
        ]);
        if (estado.erro) throw new Error(estado.erro);
        const selos = await tokenBalance(connection, new PublicKey(estado.badgeMint), dono, true);
        const perfil = p
          ? { onTime: p.onTime, late: p.late, defaults: p.defaults, leasesStarted: p.leasesStarted, leasesCompleted: p.leasesCompleted }
          : null;
        if (vivo) setR({ fase: "pronto", perfil, selos });
      } catch (e) {
        if (vivo) setR({ fase: "erro", msg: (e as Error).message });
      }
    })();
    return () => { vivo = false; };
  }, [carteira]);

  const pronto = r.fase === "pronto" ? r : null;
  const p = pronto?.perfil ?? null;
  const temHistorico = !!p && p.onTime + p.late + p.defaults + p.leasesStarted > 0;
  const titulo =
    r.fase === "lendo" ? "Lendo o histórico…" :
    r.fase === "invalida" ? "Endereço inválido" :
    r.fase === "erro" ? "Não foi possível ler o histórico" :
    !temHistorico ? "Sem histórico ainda" :
    p!.defaults > 0 ? "Histórico com contrato devendo" :
    p!.onTime > 0 ? "Bom pagador" : "Histórico em formação";
  const caucao = caucaoNoProximo(p);
  const registro = r.fase === "pronto" ? explorerAddress(p ? profilePda(new PublicKey(carteira)).toBase58() : carteira) : null;

  return (
    <div style={{ minHeight: "100dvh", background: COR.mesa }}>
      <header style={{ background: COR.tinta, color: "#fff", padding: "18px 16px 72px" }}>
        <div style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
          <Link href="/" style={{ color: "#fff", textDecoration: "none", fontSize: 21, fontWeight: 780, letterSpacing: "-0.03em", alignSelf: "flex-start", minHeight: 44, display: "flex", alignItems: "center" }}>
            Fiador<span style={{ color: "#a9b8ff" }}>.sol</span>
          </Link>
          <span style={{ fontSize: 14, color: "var(--claro-sobre-tinta)", paddingTop: 8 }}>Histórico de inquilino, compartilhado pela própria pessoa</span>
          <h1 style={{ margin: 0, fontSize: "clamp(32px, 7vw, 44px)", lineHeight: 1.08, letterSpacing: "-0.03em", fontWeight: 780 }}>{titulo}</h1>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, paddingTop: 4 }}>
            {pronto && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: "#E3F1E9", color: COR.verde, fontSize: 13, fontWeight: 700 }}>
                <Icone n="check" t={16} e={2.6} cor={COR.verde} />Verificado na Solana
              </span>
            )}
            <span title={carteira} style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--claro-sobre-tinta)" }}>
              Carteira {short(carteira, 4)}
            </span>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: "-48px auto 0", padding: "0 16px 48px", display: "flex", flexDirection: "column", gap: 18 }}>
        {r.fase === "lendo" && <Cartao pad="24px 20px"><div role="status"><Txt>Consultando a Solana. Os números vêm direto do programa na rede.</Txt></div></Cartao>}
        {r.fase === "invalida" && (
          <Cartao pad="24px 20px"><Txt>Este link não tem um endereço de carteira válido. Peça o link de novo para a pessoa.</Txt></Cartao>
        )}
        {r.fase === "erro" && (
          <Cartao pad="24px 20px"><Txt>Não consegui falar com a rede da Solana ({r.msg}). Tente de novo em alguns instantes.</Txt></Cartao>
        )}

        {pronto && (
          <>
            <Cartao elevado pad="22px 20px" gap={16}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }} aria-label="Selos de bom pagador" role="group">
                {[3, 6, 12].map((n, i) => (
                  <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <Selo n={n} on={i < pronto.selos} t={76} />
                    <span style={{ fontSize: 13, color: COR.graf, textAlign: "center" }}>{n} meses em dia</span>
                  </div>
                ))}
              </div>
              <div>
                <Linha k="Pagamentos em dia" v={String(p?.onTime ?? 0)} />
                <Linha k="Pagos com atraso e quitados" v={String(p?.late ?? 0)} />
                <Linha k="Contratos encerrados devendo" v={<span style={{ color: (p?.defaults ?? 0) > 0 ? COR.verm : undefined }}>{p?.defaults ?? 0}</span>} />
                <Linha k="Contratos concluídos" v={`${p?.leasesCompleted ?? 0} de ${p?.leasesStarted ?? 0} iniciados`} />
              </div>
            </Cartao>

            <section aria-label="Caução no próximo contrato" style={{ background: "#E3F1E9", borderRadius: 18, padding: "18px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <b style={{ fontSize: 52, lineHeight: 1, fontWeight: 800, color: COR.verde, fontVariantNumeric: "tabular-nums" }}>{caucao}</b>
              <span style={{ fontSize: 17, fontWeight: 650, lineHeight: 1.3 }}>
                {caucao === 1 ? "aluguel" : "aluguéis"} de caução no próximo contrato
                {caucao < 3 && <span style={{ display: "block", fontSize: 14, fontWeight: 500, color: COR.graf }}>em vez de 3, por causa deste histórico</span>}
              </span>
            </section>

            <Txt peq>
              Só o programa do Fiador.sol consegue escrever esses números. Os selos são tokens que não podem ser vendidos nem passados para
              outra carteira. Um mês pago pela caução e depois quitado conta como atraso, não como calote.
            </Txt>
            {registro && (
              <a href={registro} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44, fontSize: 15, fontWeight: 650 }}>
                Ver o registro público na Solana <Icone n="avancar" t={18} e={2.2} />
              </a>
            )}
          </>
        )}

        <p style={{ margin: 0, display: "flex", gap: 10, alignItems: "flex-start", fontSize: 14, color: COR.graf }}>
          <Icone n="cadeado" t={20} cor={COR.graf} />Nome, CPF e valores de aluguel não aparecem aqui.
        </p>
      </main>
    </div>
  );
}
