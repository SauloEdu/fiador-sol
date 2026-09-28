import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { serverContext, json, withinLimit, errorMessage } from "@/lib/server";
import { buscarCobranca } from "@/lib/pix";

export const dynamic = "force-dynamic";

/** "Já paguei": o servidor (dono da emissão do tBRL) credita a carteira. Só em rede de teste. */
export async function POST(req: Request) {
  const { id } = (await req.json()) as { id: string };
  const c = buscarCobranca(id);
  if (!c) return json({ erro: "Cobrança não encontrada" }, 404);
  if (c.paga) return json({ erro: "Esta cobrança já foi paga" }, 409);
  if (!withinLimit(c.carteira, c.valor, 500_000)) return json({ erro: "Limite de R$ 500.000 por hora nesta carteira" }, 429);
  try {
    const { connection, admin, mint } = serverContext();
    const owner = new PublicKey(c.carteira);
    const ata = await getOrCreateAssociatedTokenAccount(connection, admin, mint, owner);
    const sig = await mintTo(connection, admin, mint, ata.address, admin, BigInt(Math.round(c.valor * 1_000_000)));
    c.paga = true;
    return json({ ok: true, assinatura: sig });
  } catch (e) {
    return json({ erro: errorMessage(e) }, 500);
  }
}
