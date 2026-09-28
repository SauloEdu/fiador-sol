"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useD } from "@/components/DemoProvider";
import { DEMO } from "@/lib/constants";
import { fromUnits } from "@/lib/format";
import { COR, Icone, reais } from "@/ui";
import s from "./imob.module.css";

const MENU: [string, string, string][] = [
  ["pessoas", "Contratos", "/imobiliaria"],
  ["enviar", "Novo contrato", "/imobiliaria/novo"],
  ["balanca", "Contrato da Ana", "/imobiliaria/contrato"],
  ["grafico", "Fundo de garantia", "/investidor"],
];

/** Moldura de internet banking empresarial: menu lateral escuro e barra superior. */
export function Casca({ children }: { children: ReactNode }) {
  const rota = usePathname();
  const d = useD();
  const l = d.snap?.lease;
  const reservado = l && l.status !== "closed" && l.status !== "pending" ? fromUnits(l.coverageCap - l.poolCoveredTotal) : 0;
  // Limite por imobiliária (B-A01): no máximo metade do fundo, conferido pelo programa a cada aceite.
  const limite = d.snap ? fromUnits(d.snap.pool.totalAssets) * (DEMO.agencyMaxPoolBps / 10_000) : 0;
  return (
    <div className={s.casca}>
      <aside className={s.lateral}>
        <Link href="/" className={s.logo}>Fiador<span>.sol</span></Link>
        <span className={s.empresa}><b>Imobiliária Sol Ltda.</b><span>CNPJ 12.345.678/0001-90 (exemplo)</span></span>
        <nav aria-label="Menu" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {MENU.map(([ic, t, h]) => (
            <Link key={t} href={h} className={`${s.item} ${rota === h ? s.itemAtivo : ""}`} aria-current={rota === h ? "page" : undefined}>
              <Icone n={ic} t={20} />{t}
            </Link>
          ))}
        </nav>
        <div className={s.reserva}>
          <span>Proteção do fundo reservada pelos seus contratos</span>
          <b>{reais(reservado)}</b>
          <span>de até {reais(limite)} (metade do fundo, limite por imobiliária)</span>
          <span>{l && l.status !== "closed" ? "1 contrato ativo na Solana" : "nenhum contrato ativo"}</span>
        </div>
      </aside>
      <div className={s.corpo}>
        <div className={s.topo}>
          <label className={s.busca}><Icone n="lupa" t={20} cor={COR.graf} /><span className="sr">Buscar</span><input placeholder="Buscar contratos" /></label>
          <span className={s.acesso}><Icone n="cadeado" t={18} cor={COR.verde} />Último acesso: hoje</span>
          <span className={s.usuaria}><span aria-hidden="true">MR</span><span style={{ display: "flex", flexDirection: "column" }}><b style={{ fontSize: 14 }}>Marta Rocha</b><span style={{ fontSize: 12, color: COR.graf }}>Gestora</span></span></span>
        </div>
        <main className={s.main}>{children}</main>
      </div>
    </div>
  );
}
