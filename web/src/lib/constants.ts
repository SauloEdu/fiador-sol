import { PublicKey } from "@solana/web3.js";
import idl from "@/idl/fiador.json";

export const PROGRAM_ID = new PublicKey(idl.address);
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8899";
export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER ?? "localnet";

/** tBRL tem 6 casas: 1 real = 1.000.000 unidades. */
export const DECIMALS = 6;
export const UNIT = 10 ** DECIMALS;

/** Mesmos parâmetros do deploy de demonstração (scripts/setup-demo.ts). */
export const DEMO = {
  periodSecs: 60,
  graceSecs: 20,
  premiumBps: 800,
  apyBps: 1000,
  disputeWindowSecs: 30,
  withdrawCooldownSecs: 30,
  /** Cada imobiliária trava no máximo esta fatia do fundo (agency_max_pool_bps). */
  agencyMaxPoolBps: 5000,
  poolQuarantineSecs: 30,
};

export function explorerTx(sig: string) {
  if (CLUSTER === "devnet") return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
  return `https://explorer.solana.com/tx/${sig}?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;
}

export function explorerAddress(addr: string) {
  if (CLUSTER === "devnet") return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
  return `https://explorer.solana.com/address/${addr}?cluster=custom&customUrl=${encodeURIComponent(RPC_URL)}`;
}
