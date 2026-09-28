import { PublicKey } from "@solana/web3.js";
import { json, exigirSenha } from "@/lib/server";
import { criarCobranca } from "@/lib/pix";

export const dynamic = "force-dynamic";

/** Gera um "Pix copia e cola" fictício. Nada é cobrado de verdade. */
export async function POST(req: Request) {
  const bloqueio = exigirSenha(req);
  if (bloqueio) return bloqueio;
  const { carteira, valor } = (await req.json()) as { carteira: string; valor: number };
  try {
    new PublicKey(carteira);
  } catch {
    return json({ erro: "Carteira inválida" }, 400);
  }
  if (!(valor > 0 && valor <= 200_000)) return json({ erro: "Valor entre R$ 0,01 e R$ 200.000" }, 400);
  return json(criarCobranca(carteira, valor));
}
