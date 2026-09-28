import BN from "bn.js";
import { UNIT } from "./constants";

export function toUnits(reais: number): BN {
  return new BN(Math.round(reais * 100)).mul(new BN(UNIT / 100));
}

export function fromUnits(v: BN | number | bigint | null | undefined): number {
  if (v == null) return 0;
  const n = typeof v === "number" ? v : Number(v.toString());
  return n / UNIT;
}

const fmt = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
export function brl(v: BN | number | bigint | null | undefined, alreadyReais = false): string {
  const reais = alreadyReais ? Number(v ?? 0) : fromUnits(v);
  return fmt.format(reais);
}

export function short(addr: string, n = 4) {
  return addr.length > 2 * n + 1 ? `${addr.slice(0, n)}…${addr.slice(-n)}` : addr;
}
