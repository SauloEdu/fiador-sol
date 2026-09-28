"use client";

import { useState } from "react";
import { lerSenha, salvarSenha } from "@/lib/api";

/**
 * Campo da senha de apresentação. Só aparece quando a demo publicada pede senha
 * (DEMO_TOKEN no servidor). Quem visita sem a senha só consegue ler.
 */
export function SenhaDemo({ protegida }: { protegida: boolean }) {
  const [senha, setSenha] = useState(() => (typeof window === "undefined" ? "" : lerSenha()));
  const [salva, setSalva] = useState(false);
  if (!protegida) return null;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        salvarSenha(senha.trim());
        setSalva(true);
      }}
      style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", fontSize: 14 }}
    >
      <label htmlFor="senha-demo" style={{ fontWeight: 650 }}>Senha de apresentação</label>
      <input
        id="senha-demo"
        type="password"
        autoComplete="off"
        value={senha}
        onChange={(e) => { setSenha(e.target.value); setSalva(false); }}
        style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #8A94A6", font: "inherit" }}
      />
      <button type="submit" style={{ padding: "8px 14px", borderRadius: 8, border: 0, background: "#1F3FBF", color: "#fff", font: "inherit", fontWeight: 650, cursor: "pointer" }}>
        {salva ? "Salva neste navegador" : "Salvar"}
      </button>
    </form>
  );
}
