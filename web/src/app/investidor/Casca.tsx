"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Abas, Cartao, COR, Estado, Icone } from "@/ui";
import { MENU } from "./dados";
import s from "./investidor.module.css";

const OcultoCtx = createContext(false);
/** As telas perguntam aqui se os valores estão ocultos (botão do olho na barra de cima). */
export const useOculto = () => useContext(OcultoCtx);

const CHAVE = "fiador-oculto-investidor";

/**
 * Moldura da área de investimentos, como no site de um banco:
 * barra lateral escura no computador, abas embaixo no celular e barra de cima clara.
 */
export function Casca({ children }: { children: ReactNode }) {
  const caminho = usePathname();
  const [oculto, setOculto] = useState(false);
  const [acesso, setAcesso] = useState("");

  useEffect(() => {
    try { setOculto(localStorage.getItem(CHAVE) === "1"); } catch { /* sem armazenamento */ }
    setAcesso(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  function alternar() {
    setOculto((v) => {
      try { localStorage.setItem(CHAVE, v ? "0" : "1"); } catch { /* sem armazenamento */ }
      return !v;
    });
  }

  // A aba ativa é a mais específica que combina com o endereço atual.
  const ativa = [...MENU].reverse().find(([, , href]) => caminho === href || caminho.startsWith(href + "/"))?.[1] ?? "Posição";

  return (
    <div className={s.casca}>
      <aside className={s.lateral}>
        <Link href="/investidor" className={s.logo}>Fiador<span>.sol</span></Link>
        <span className={s.logoSub}>Investimentos</span>
        <nav aria-label="Área de investimentos" className={s.menu}>
          {MENU.map(([ic, lab, href]) => (
            <Link key={lab} href={href} aria-current={lab === ativa ? "page" : undefined}>
              <Icone n={ic} t={22} e={lab === ativa ? 2.1 : 1.8} />{lab}
            </Link>
          ))}
        </nav>
        <p className={s.lateralRodape}>Demonstração em rede de teste da Solana. Nenhum valor é real.</p>
      </aside>

      <div className={s.principal}>
        <header className={s.topo}>
          <Link href="/investidor" className={`${s.logo} ${s.logoCelular}`}>Fiador<span>.sol</span></Link>
          <span className={s.rede}><span aria-hidden="true" className={s.pontoRede} />Rede de teste · valores de exemplo</span>
          {acesso && <span className={s.acesso}>Último acesso hoje, {acesso}</span>}
          <span className={s.topoDireita}>
            <button type="button" className={s.olho} onClick={alternar} aria-pressed={oculto} aria-label={oculto ? "Mostrar valores" : "Ocultar valores"}>
              <Icone n={oculto ? "olhoOff" : "olho"} t={22} />
            </button>
            <span className={s.perfil}>
              <span className={s.avatar} aria-hidden="true">RV</span>
              <span className={s.perfilTxt}><b>Rafael Viana</b><span>Perfil arrojado</span></span>
            </span>
          </span>
        </header>
        <OcultoCtx.Provider value={oculto}>
          <main className={s.conteudo}>{children}</main>
        </OcultoCtx.Provider>
      </div>

      <div className={s.soCelular}>
        <Abas itens={MENU} ativa={ativa} />
      </div>
    </div>
  );
}

/** Tela de espera enquanto a Solana responde (ou aviso se a rede estiver desligada). Mostra o h1 da tela. */
export function Conectando({ erro, texto }: { erro?: string | null; texto?: string | null }) {
  return (
    <Cartao pad="28px 20px">
      {erro ? (
        <Estado ic="alerta" cor={COR.verm} fundo="#FBEAE8" titulo="Sem conexão com a Solana" texto={`${erro}. Confira se a rede da demonstração está ligada.`} />
      ) : (
        <Estado girando titulo="Conectando à Solana" texto={texto ?? "Lendo o fundo na rede de teste…"} />
      )}
    </Cartao>
  );
}
