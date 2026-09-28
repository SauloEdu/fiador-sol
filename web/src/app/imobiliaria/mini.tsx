import type { LeaseView } from "@/components/useDemo";
import * as H from "@/lib/historia";
import { COR } from "@/ui";
import s from "./imob.module.css";

type Simb = "p" | "c" | "q" | "g" | "x" | "a" | "-";
const MAPA: Record<Simb, [string, string, string, string]> = {
  p: ["✓", COR.verde, "#fff", "pago"],
  c: ["C", COR.verm, "#fff", "pago pela caução"],
  q: ["Q", COR.roxo, "#fff", "quitado"],
  g: ["…", "#FBF1E2", COR.ambar, "em carência"],
  x: ["!", "#FBEAE8", COR.verm, "atrasado"],
  a: ["", "#fff", COR.tinta, "mês atual"],
  "-": ["", "transparent", COR.graf, "a vencer"],
};

export function simbolos(l: LeaseView, agora: number): Simb[] {
  return l.periods.map((_, i) => {
    const e = H.celula(l, i, agora);
    return ({ pago: "p", caucao: "c", quitado: "q", carencia: "g", atrasado: "x", atual: "a", vazio: "-" } as const)[e];
  });
}

/** Mini-cartela da tabela: símbolo além da cor, para não depender só de cor. */
export function Mini({ cart }: { cart: string }) {
  const ss = cart.split("") as Simb[];
  const desc = ss.map((c, i) => (c === "-" ? null : `mês ${i + 1} ${MAPA[c][3]}`)).filter(Boolean).join(", ");
  return (
    <span role="img" aria-label={`Cartela: ${desc || "nenhum mês ainda"}`} className={s.mini} style={{ gridTemplateColumns: `repeat(${ss.length}, 16px)` }}>
      {ss.map((c, i) => {
        const [t, bg, fg] = MAPA[c];
        const borda = c === "g" ? `1.5px dashed ${COR.ambar}` : c === "-" ? "1px dashed #B7C0CD" : c === "a" ? `1.5px dashed ${COR.tinta}` : c === "x" ? `1.5px dashed ${COR.verm}` : "0";
        return <span key={i} aria-hidden="true" style={{ background: bg, color: fg, border: borda }}>{t}</span>;
      })}
    </span>
  );
}

export const LEGENDA: [Simb, string][] = [["p", "pago"], ["c", "pago pela caução"], ["q", "quitado depois"], ["g", "em carência"], ["-", "a vencer"]];
export function Legenda() {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 18, fontSize: 13, color: COR.graf, alignItems: "center" }}>
      {LEGENDA.map(([c, t]) => <span key={c} style={{ display: "flex", gap: 6, alignItems: "center" }}><Mini cart={c} />{t}</span>)}
    </div>
  );
}
