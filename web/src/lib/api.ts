"use client";

/**
 * Chamadas às rotas do servidor que usam a chave do admin. Quando a demo está
 * publicada, essas rotas exigem a senha da demo (DEMO_TOKEN, B-A08); ela fica só
 * no navegador de quem apresenta (localStorage) e vai no cabeçalho x-demo-token.
 */
export const CHAVE_SENHA = "fiador-demo-token";

export function lerSenha(): string {
  try {
    return localStorage.getItem(CHAVE_SENHA) ?? "";
  } catch {
    return "";
  }
}

export function salvarSenha(senha: string) {
  try {
    if (senha) localStorage.setItem(CHAVE_SENHA, senha);
    else localStorage.removeItem(CHAVE_SENHA);
  } catch {
    /* navegador sem armazenamento: a senha vale só nesta página */
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiPost<T = any>(url: string, body?: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-demo-token": lerSenha() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.status === 401) throw new Error("Esta demo pede a senha de apresentação. Digite a senha na página inicial ou no Palco.");
  return r.json() as Promise<T>;
}
