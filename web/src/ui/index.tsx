/**
 * Componentes visuais do Fiador.sol, iguais aos do canvas de design.
 * Regra: cada componente só desenha; quem sabe do contrato é lib/historia.ts.
 */
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import s from "./ui.module.css";

export const COR = {
  tinta: "#141E36", graf: "#4F596C", caneta: "#1F3FBF", verde: "#23704A", verm: "#B0271F",
  roxo: "#5A3CB0", ambar: "#8A5208", papel: "#FFFEFB", mesa: "#E9EDF2",
};

/* ------------------------------------------------------------------ ícones */
const ICONES: Record<string, ReactNode> = {
  casa: <path d="M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" />,
  recibo: <><path d="M7 3h10v18l-2.5-1.6L12 21l-2.5-1.6L7 21z" /><path d="M9.5 8h5M9.5 12h5" /></>,
  pix: <><path d="M12 3.5 20.5 12 12 20.5 3.5 12z" /><path d="M8.5 12 12 8.5 15.5 12 12 15.5z" /></>,
  cofre: <><rect x="3.5" y="5" width="17" height="14" rx="2" /><circle cx="12" cy="12" r="3.2" /><path d="M12 8.8V7M15.2 12H17" /></>,
  pessoa: <><circle cx="12" cy="8.5" r="4" /><path d="M4.5 20c.9-4 3.8-6.2 7.5-6.2s6.6 2.2 7.5 6.2" /></>,
  pessoas: <><circle cx="9" cy="8.5" r="3.5" /><path d="M3 20c.6-3.4 3-5.5 6-5.5s5.4 2.1 6 5.5" /><path d="M16 5.2a3.5 3.5 0 0 1 0 6.6M17.5 14.7c1.8.7 3.1 2.5 3.5 5.3" /></>,
  sino: <><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>,
  olho: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  olhoOff: <><path d="M3 3l18 18" /><path d="M10.6 5.6A10 10 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.3 6.9C3.9 8.6 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.3-1" /></>,
  voltar: <path d="M15 5 8 12l7 7" />,
  avancar: <path d="M9 5l7 7-7 7" />,
  fechar: <path d="M6 6l12 12M18 6 6 18" />,
  copiar: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" /></>,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alerta: <><path d="M12 4 21 19H3z" /><path d="M12 10v4M12 16.5h.01" /></>,
  relogio: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  selo: <><circle cx="12" cy="10" r="5.5" /><path d="M9 14.8 7.5 21 12 18.8 16.5 21 15 14.8" /></>,
  doc: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></>,
  cadeado: <><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  grafico: <><path d="M4 20V4M4 20h16" /><path d="M8 16v-4M12 16V8M16 16v-6" /></>,
  setaBaixo: <path d="M12 4v16M6 14l6 6 6-6" />,
  setaCima: <path d="M12 20V4M6 10l6-6 6 6" />,
  compartilhar: <><path d="M12 15V4M8 8l4-4 4 4" /><path d="M5 12v7a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7" /></>,
  baixar: <><path d="M12 4v11M8 11l4 4 4-4" /><path d="M5 19h14" /></>,
  balanca: <><path d="M12 4v16M7 20h10M5 7h14" /><path d="M5 7 2.5 13a3 3 0 0 0 5 0zM19 7l-2.5 6a3 3 0 0 0 5 0z" /></>,
  ajustes: <><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>,
  enviar: <><path d="M4 12 20 4l-5 16-3.5-6.5z" /><path d="m11.5 13.5 3-3" /></>,
  lupa: <><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.4-4.4" /></>,
  celular: <><rect x="7" y="3" width="10" height="18" rx="2" /><path d="M11 18h2" /></>,
};

export function Icone({ n, t = 22, cor = "currentColor", e = 1.8, style }: { n: keyof typeof ICONES | string; t?: number; cor?: string; e?: number; style?: CSSProperties }) {
  return (
    <svg width={t} height={t} viewBox="0 0 24 24" fill="none" stroke={cor} strokeWidth={e} strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flex: "none", ...style }}>
      {ICONES[n]}
    </svg>
  );
}

/* ------------------------------------------------------------------ texto e valores */
const fmt = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
/** "R$ 2.160,00" com espaço inseparável. */
export const reais = (v: number, centavos = true) => `R$ ${(centavos ? fmt : fmt0).format(v)}`;

/** Valor de saldo: R$ e centavos menores. Em documento, use `inteiro`. */
export function Valor({ v, t = 44, cor, inteiro, oculto }: { v: number; t?: number; cor?: string; inteiro?: boolean; oculto?: boolean }) {
  const txt = reais(v);
  if (oculto) return <span className={s.valor} style={{ fontSize: t, color: cor }}>R$ ••••</span>;
  if (inteiro || t < 26) return <span className={s.valor} style={{ fontSize: t, color: cor }}>{txt}</span>;
  const [int, cent] = fmt.format(v).split(",");
  return (
    <span className={s.valor} style={{ fontSize: t, color: cor }}>
      <span className="sr">{txt}</span>
      <span aria-hidden="true"><span className={s.valorRs}>R$</span>{int}<span className={s.valorCent}>,{cent}</span></span>
    </span>
  );
}

export const Txt = ({ children, peq, style }: { children: ReactNode; peq?: boolean; style?: CSSProperties }) =>
  <p className={peq ? s.txtPeq : s.txt} style={style}>{children}</p>;
export const Forte = ({ children }: { children: ReactNode }) => <b className={s.forte}>{children}</b>;
export const H1 = ({ children, t, style }: { children: ReactNode; t?: number; style?: CSSProperties }) =>
  <h1 className={s.h1} style={{ fontSize: t, ...style }}>{children}</h1>;
export const H2 = ({ children, id, style }: { children: ReactNode; id?: string; style?: CSSProperties }) =>
  <h2 className={s.h2} id={id} style={style}>{children}</h2>;
export const Rotulo = ({ children, as = "span" }: { children: ReactNode; as?: "span" | "h1" | "h2" }) => {
  const T = as;
  return <T className={s.rotulo}>{children}</T>;
};

export function Linha({ k, v, forte }: { k: ReactNode; v: ReactNode; forte?: boolean }) {
  return <div className={`${s.linha} ${forte ? s.linhaForte : ""}`}><span>{k}</span><span>{v}</span></div>;
}

/* ------------------------------------------------------------------ blocos */
export function Cartao({ children, pad, gap, elevado, style }: { children: ReactNode; pad?: string; gap?: number; elevado?: boolean; style?: CSSProperties }) {
  return <div className={`${s.cartao} ${elevado ? s.elevado : ""}`} style={{ padding: pad, gap, ...style }}>{children}</div>;
}

export function Documento({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div className={s.doc}>
      <div className={s.docPapel} style={style}>{children}</div>
      <div className={s.serrilha} aria-hidden="true" />
    </div>
  );
}

export function Autenticacao({ sig, quem = "Registrado pelo contrato Fiador.sol", href }: { sig?: string; quem?: string; href?: string }) {
  const curto = sig ? `${sig.slice(0, 6)}…${sig.slice(-6)}` : "aguardando";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
      <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: "50%", background: COR.verm, boxShadow: "inset 0 0 0 3px #C4382F, inset 0 0 0 4px #8E1D17", flex: "none" }} />
      <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 650 }}>{quem}</span>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>Registro público {curto}</a>
        ) : (
          <span style={{ fontSize: 13, color: COR.graf }}>Registro público {curto}</span>
        )}
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ botões */
type BotaoProps = { children: ReactNode; tipo?: "primario" | "secundario" | "texto"; peq?: boolean; style?: CSSProperties };
export function Botao({ children, tipo = "primario", peq, style, ...p }: BotaoProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={`${s.btn} ${s[tipo]} ${peq ? s.peq : ""}`} style={style} {...p}>{children}</button>;
}
export function LinkBotao({ children, tipo = "primario", peq, style, href }: BotaoProps & { href: string }) {
  return <Link href={href} className={`${s.btn} ${s[tipo]} ${peq ? s.peq : ""}`} style={style}>{children}</Link>;
}

/* ------------------------------------------------------------------ estrutura de app */
export function Banda({ iniciais, ola, sub, avisos, oculto, onOlho, children }: {
  iniciais: string; ola: string; sub: string; avisos?: string; oculto?: boolean; onOlho?: () => void; children?: ReactNode;
}) {
  return (
    <div className={s.banda}>
      <div className={s.bandaLinha}>
        <span className={s.avatar} aria-hidden="true">{iniciais}</span>
        <span className={s.bandaTxt}><b>{ola}</b><span>{sub}</span></span>
        {onOlho && (
          <button type="button" className={s.icone44} onClick={onOlho} aria-pressed={oculto} aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}>
            <Icone n={oculto ? "olhoOff" : "olho"} t={23} />
          </button>
        )}
        {avisos && (
          <Link href={avisos} className={s.icone44} aria-label="Avisos" style={{ color: "#fff" }}>
            <Icone n="sino" t={23} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

export function Barra({ titulo, fechar, voltar, sub, nivel = "h1", direita }: {
  titulo: string; fechar?: string; voltar?: string; sub?: string; nivel?: "h1" | "p"; direita?: ReactNode;
}) {
  const T = nivel;
  const alvo = fechar ?? voltar;
  return (
    <div className={s.barra}>
      {alvo ? (
        <Link href={alvo} className={s.icone44} aria-label={fechar ? "Fechar" : "Voltar"} style={{ color: COR.tinta }}>
          <Icone n={fechar ? "fechar" : "voltar"} t={22} e={2.2} />
        </Link>
      ) : <span />}
      <div className={s.barraMeio}><T>{titulo}</T>{sub && <span>{sub}</span>}</div>
      {direita ?? <span />}
    </div>
  );
}

export function Atalhos({ itens }: { itens: [string, string, string][] }) {
  return (
    <nav aria-label="Atalhos" className={s.atalhos} style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
      {itens.map(([ic, lab, href]) => (
        <Link key={lab} href={href} className={s.atalho}>
          <span className={s.atalhoBola}><Icone n={ic} t={24} e={1.9} /></span>{lab}
        </Link>
      ))}
    </nav>
  );
}

export type Movimento = { ic: string; cor: string; titulo: string; sub: string; v: number; sinal: "+" | "−" | "↔"; href?: string; status?: [string, string] };
export function Mov({ m, oculto }: { m: Movimento; oculto?: boolean }) {
  const corpo = (
    <>
      <span className={s.movIcone} aria-hidden="true"><Icone n={m.ic} t={20} cor={m.cor} /></span>
      <span className={s.movTxt}><b>{m.titulo}</b><span>{m.sub}</span></span>
      <span className={s.movValor}>
        <b style={{ color: m.sinal === "+" ? COR.verde : COR.tinta }}>{m.sinal} {oculto ? "R$ ••••" : reais(m.v)}</b>
        {m.status && <span style={{ color: m.status[1] }}>{m.status[0]}</span>}
      </span>
    </>
  );
  return <li>{m.href ? <Link href={m.href} className={s.mov}>{corpo}</Link> : <div className={s.mov}>{corpo}</div>}</li>;
}
export function Extrato({ titulo, mais, children }: { titulo?: string; mais?: [string, string]; children: ReactNode }) {
  return (
    <section className={s.extrato}>
      {titulo && (
        <div className={s.extratoHead}>
          <H2>{titulo}</H2>
          {mais && <Link href={mais[1]} style={{ fontSize: 14, fontWeight: 650, textDecoration: "none", minHeight: 44, display: "flex", alignItems: "center" }}>{mais[0]}</Link>}
        </div>
      )}
      <ul className={s.lista}>{children}</ul>
    </section>
  );
}
export const Dia = ({ children }: { children: ReactNode }) => <li className={s.dia}>{children}</li>;

export function Abas({ itens, ativa }: { itens: [string, string, string][]; ativa: string }) {
  return (
    <nav aria-label="Seções do app" className={s.abas} style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
      {itens.map(([ic, lab, href]) => {
        const on = lab === ativa;
        return (
          <Link key={lab} href={href} className={`${s.aba} ${on ? s.abaAtiva : ""}`} aria-current={on ? "page" : undefined}>
            <Icone n={ic} t={24} e={on ? 2.1 : 1.7} /><span>{lab}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function App({ children, abas, fundo }: { children: ReactNode; abas?: ReactNode; fundo?: string }) {
  return (
    <div className={`${s.app} ${abas ? "" : s.appSemAbas}`} style={{ background: fundo }}>
      {children}
      {abas}
    </div>
  );
}
export const Pad = ({ children, sobreposto, style }: { children: ReactNode; sobreposto?: boolean; style?: CSSProperties }) =>
  <div className={`${s.pad} ${sobreposto ? s.sobreposto : ""}`} style={style}>{children}</div>;

/* ------------------------------------------------------------------ identidade Recibo */
export function Carimbo({ txt, cor, t = 22, rot = -7, data, dupla = true, animar, rotulo }: {
  txt: string; cor: string; t?: number; rot?: number; data?: string; dupla?: boolean; animar?: boolean; rotulo?: string;
}) {
  const borda = Math.max(2, Math.round(t / 9));
  const estilo: CSSProperties & { "--rot": string } = {
    "--rot": `${rot}deg`, color: cor, borderColor: cor, borderWidth: borda, borderRadius: Math.max(4, t / 4),
    padding: `${Math.max(5, t / 3)}px ${Math.max(8, t / 2)}px`, gap: Math.max(3, t / 6),
    boxShadow: dupla ? `inset 0 0 0 ${Math.max(2, t / 11)}px ${COR.papel}, inset 0 0 0 ${Math.max(3, t / 7)}px ${cor}` : undefined,
  };
  return (
    <span role="img" aria-label={`Carimbo: ${rotulo ?? txt.toLowerCase()}${data ? `, ${data}` : ""}`} className={`${s.carimbo} ${animar ? s.carimbar : ""}`} style={estilo}>
      <span style={{ fontSize: t, letterSpacing: "0.08em", lineHeight: 1 }}>{txt}</span>
      {data && <span style={{ fontSize: Math.max(13, Math.round(t * 0.46)), letterSpacing: "0.12em", lineHeight: 1, fontWeight: 700 }}>{data}</span>}
    </span>
  );
}

export function Selo({ n, on, t = 60 }: { n: number; on: boolean; t?: number }) {
  const cor = on ? COR.verde : "#7A8496";
  const dash = on ? undefined : "4 4";
  return (
    <svg width={t} height={t} viewBox="0 0 120 120" role="img" aria-label={`${on ? "Selo conquistado" : "Selo ainda não conquistado"}: ${n} meses em dia`} style={{ flex: "none" }}>
      <g fill="none" stroke={cor}>
        <circle cx="60" cy="60" r="57" strokeWidth="3.5" strokeDasharray={dash} />
        <circle cx="60" cy="60" r="35" strokeWidth="2.5" strokeDasharray={dash} />
        <text x="60" y="71" textAnchor="middle" fontFamily="Barlow Condensed, Arial Narrow, sans-serif" fontWeight="800" fontSize="34" fill={on ? COR.verde : COR.graf} stroke="none">{n}</text>
      </g>
    </svg>
  );
}

export type CelulaUI = { mes: string; estado: "pago" | "caucao" | "quitado" | "atual" | "carencia" | "atrasado" | "vazio"; data?: string; visao?: "inquilino" | "proprietario" };
export function Cartela({ celulas, cols = 4 }: { celulas: CelulaUI[]; cols?: number }) {
  return (
    <div role="list" aria-label={`Cartela do contrato, ${celulas.length} meses`} className={s.cartela} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {celulas.map((c) => {
        let meio: ReactNode = null;
        let cls = "";
        let desc = "a vencer";
        if (c.estado === "pago") { meio = <Carimbo txt="PAGO" cor={COR.verde} t={17} rot={-6} dupla={false} />; desc = `pago ${c.data ?? ""}`; }
        else if (c.estado === "caucao") {
          meio = c.visao === "proprietario"
            ? <Carimbo txt="RECEBIDO" cor={COR.verde} t={13} rot={5} dupla={false} rotulo="recebido da caução" />
            : <Carimbo txt="CAUÇÃO" cor={COR.verm} t={15} rot={6} dupla={false} rotulo="pago pela caução" />;
          desc = "pago pela caução";
        } else if (c.estado === "quitado") { meio = <Carimbo txt="QUITADO" cor={COR.roxo} t={14} rot={5} dupla={false} />; desc = "quitado depois"; }
        else if (c.estado === "atual") { cls = s.celulaAtual; meio = <span style={{ fontSize: 13, fontWeight: 750 }}>{c.data}</span>; desc = `mês atual, ${c.data}`; }
        else if (c.estado === "carencia") { cls = s.celulaCarencia; meio = <span style={{ fontSize: 13, fontWeight: 750, color: COR.ambar }}>{c.data}</span>; desc = `em carência, ${c.data}`; }
        else if (c.estado === "atrasado") { cls = s.celulaAtraso; meio = <span style={{ fontSize: 13, fontWeight: 750, color: COR.verm }}>atrasado</span>; desc = "atrasado"; }
        else cls = s.celulaVazia;
        const mostraData = c.data && ["pago", "caucao", "quitado"].includes(c.estado);
        return (
          <div key={c.mes} role="listitem" aria-label={`${c.mes}: ${desc}`} className={`${s.celula} ${cls}`}>
            <span>{c.mes}</span>
            <span className={s.celulaMeio}>{meio}</span>
            {mostraData && <span className={s.celulaData}>{c.data}</span>}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ estados e avisos */
export function Estado({ ic, cor, fundo, titulo, texto, selo, girando }: {
  ic?: string; cor?: string; fundo?: string; titulo: string; texto?: ReactNode; selo?: string; girando?: boolean;
}) {
  return (
    <div className={s.estado}>
      {girando ? <span className={s.girando} aria-hidden="true" /> : (
        <span className={s.estadoIcone} style={{ background: fundo }} aria-hidden="true"><Icone n={ic ?? "check"} t={32} cor={cor} e={2.6} /></span>
      )}
      {selo && <span className={s.estadoSelo} style={{ color: cor === "#fff" || cor === "#FFFFFF" ? COR.graf : cor }}>{selo}</span>}
      <h1 className={s.h1} style={{ fontSize: 26 }}>{titulo}</h1>
      {texto && <p className={s.txt}>{texto}</p>}
    </div>
  );
}

export function Passos({ itens }: { itens: [string, "ok" | "agora" | ""][] }) {
  return (
    <ol role="status" aria-live="polite" className={s.passos}>
      {itens.map(([txt, st]) => (
        <li key={txt} className={s.passo} style={{ color: st ? COR.tinta : COR.graf, fontWeight: st === "agora" ? 650 : 500 }}>
          {st === "ok" ? (
            <span className={s.passoBola} style={{ background: COR.verde }}><Icone n="check" t={16} cor="#fff" e={3} /></span>
          ) : st === "agora" ? (
            <span className={`${s.passoBola} ${s.girando}`} style={{ width: 28, height: 28, borderWidth: 3 }} />
          ) : (
            <span className={s.passoBola} style={{ border: "2px dashed #B7C0CD" }} />
          )}
          {txt}
        </li>
      ))}
    </ol>
  );
}

export function Alerta({ cor, fundo, ic, faixa, children }: { cor: string; fundo: string; ic: string; faixa: string; children: ReactNode }) {
  return (
    <section className={s.alerta}>
      <div className={s.alertaFaixa} style={{ background: fundo, color: cor }}><Icone n={ic} t={20} cor={cor} e={2} />{faixa}</div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </section>
  );
}

export function Nota({ ic = "info", cor = COR.ambar, fundo = "#FBF1E2", children }: { ic?: string; cor?: string; fundo?: string; children: ReactNode }) {
  return <div className={s.nota} style={{ background: fundo, color: COR.tinta }}><Icone n={ic} t={22} cor={cor} />{<span>{children}</span>}</div>;
}

export function Segmento({ itens }: { itens: [string, string, boolean][] }) {
  return (
    <nav aria-label="Contas" className={s.segmento} style={{ gridTemplateColumns: `repeat(${itens.length}, minmax(0, 1fr))` }}>
      {itens.map(([txt, href, on]) => <Link key={txt} href={href} aria-current={on ? "page" : undefined}>{txt}</Link>)}
    </nav>
  );
}

export const estilos = s;
