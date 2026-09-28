"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useDemo } from "./useDemo";

type Demo = ReturnType<typeof useDemo>;
const Ctx = createContext<Demo | null>(null);

/** Um único leitor da blockchain por área do site (inquilino, imobiliária...), compartilhado pelas telas. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const demo = useDemo();
  return <Ctx.Provider value={demo}>{children}</Ctx.Provider>;
}

export function useD() {
  const d = useContext(Ctx);
  if (!d) throw new Error("useD precisa de <DemoProvider>");
  return d;
}

/** Re-renderiza a cada segundo, para contagens regressivas. */
export function useTick(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => {
    const t = setInterval(() => set((x) => x + 1), ms);
    return () => clearInterval(t);
  }, [ms]);
}
