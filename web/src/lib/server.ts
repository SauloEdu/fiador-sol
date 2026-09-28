// Só é importado pelas rotas de API (servidor); nunca por componentes do navegador.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { timingSafeEqual } from "node:crypto";
import { Connection, Keypair, PublicKey, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { getProgram, keypairWallet } from "./program";

/**
 * Chaves do servidor: o admin (credencia imobiliárias, emite tBRL do Pix simulado)
 * também faz o papel de keeper. Nunca vão para o navegador.
 */
export function loadAdmin(): Keypair {
  // Em hospedagem: ADMIN_SECRET_KEY com o array JSON da chave. Localmente: arquivo do Solana CLI.
  if (process.env.ADMIN_SECRET_KEY) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(process.env.ADMIN_SECRET_KEY)));
  }
  const file = process.env.ADMIN_KEYPAIR ?? path.join(os.homedir(), ".config/solana/id.json");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(file, "utf8"))));
}

export type DemoInfo = { rpc: string; programId: string; admin: string; mint: string; badgeMint: string };

export function loadDemo(): DemoInfo {
  const file = path.join(process.cwd(), ".demo.json");
  if (!fs.existsSync(file)) throw new Error("Rode `npm run setup` antes: web/.demo.json não existe.");
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function serverContext() {
  const demo = loadDemo();
  const connection = new Connection(demo.rpc, "confirmed");
  const admin = loadAdmin();
  const program = getProgram(connection, keypairWallet(admin));
  return { demo, connection, admin, program, mint: new PublicKey(demo.mint), badgeMint: new PublicKey(demo.badgeMint) };
}

/** Relógio da própria blockchain (é ele que o programa usa para vencimentos). */
export async function chainNow(connection: Connection): Promise<number> {
  const info = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY);
  if (!info) return Math.floor(Date.now() / 1000);
  return Number(info.data.readBigInt64LE(32));
}

/**
 * Senha da demo (B-A08, B-A19, B-A33): se DEMO_TOKEN estiver definida no servidor,
 * as rotas que gastam a chave do admin exigem o cabeçalho x-demo-token igual a ela.
 * Sem DEMO_TOKEN (demonstração na máquina local), as rotas ficam abertas.
 * Devolve uma resposta 401 quando a senha falta, ou null quando pode seguir.
 */
export function exigirSenha(req: Request): Response | null {
  // Chamadas disparadas por outros sites (B-A33): o navegador marca Sec-Fetch-Site.
  if (req.headers.get("sec-fetch-site") === "cross-site") return json({ erro: "Chamada de outro site recusada." }, 403);
  const esperada = process.env.DEMO_TOKEN;
  if (!esperada) return null;
  const recebida = req.headers.get("x-demo-token") ?? "";
  if (recebida.length === esperada.length && timingSafeEqual(Buffer.from(recebida), Buffer.from(esperada))) return null;
  return json({ erro: "Senha da demo necessária." }, 401);
}

export const demoProtegida = () => !!process.env.DEMO_TOKEN;

export function isLocal(rpc: string) {
  return rpc.includes("127.0.0.1") || rpc.includes("localhost");
}

/** Limite simples em memória (por carteira) para o Pix simulado não virar torneira infinita. */
const buckets = new Map<string, { since: number; total: number }>();
export function withinLimit(key: string, amount: number, maxPerHour: number) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.since > 3_600_000) {
    buckets.set(key, { since: now, total: amount });
    return amount <= maxPerHour;
  }
  if (b.total + amount > maxPerHour) return false;
  b.total += amount;
  return true;
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export function errorMessage(e: unknown): string {
  const anyE = e as { error?: { errorMessage?: string }; message?: string; logs?: string[] };
  return anyE?.error?.errorMessage ?? anyE?.message ?? String(e);
}
