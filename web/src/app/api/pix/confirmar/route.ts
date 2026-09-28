import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { serverContext, json, withinLimit, errorMessage, exigirSenha } from "@/lib/server";
import { buscarCobranca } from "@/lib/pix";

export const dynamic = "force-dynamic";

/** "Já paguei": o servidor (dono da emissão do tBRL) credita a carteira. Só em rede de teste. */
export async function POST(req: Request) {
  const bloqueio = exigirSenha(req);
  if (bloqueio) return bloqueio;
  const { id } = (await req.json()) as { id: string };
  const c = buscarCobranca(id);
  if (!c) return json({ erro: "Cobrança não encontrada" }, 404);
  if (c.estado === "paga") return json({ erro: "Esta cobrança já foi paga" }, 409);
  if (c.estado === "emitindo") return json({ erro: "Esta cobrança já está sendo processada" }, 409);
  if (c.estado === "falhou") return json({ erro: "Esta cobrança falhou. Gere um novo Pix para não correr o risco de pagar duas vezes." }, 409);
  if (!withinLimit(c.carteira, c.valor, 500_000)) return json({ erro: "Limite de R$ 500.000 por hora nesta carteira" }, 429);
  // Teto global da demo: ninguém lota o fundo de tBRL falso trocando de carteira (B-A19).
  if (!withinLimit("__global__", c.valor, 3_000_000)) return json({ erro: "Limite geral da demo atingido nesta hora" }, 429);
  c.estado = "emitindo"; // antes do primeiro await
  try {
    const { connection, admin, mint } = serverContext();
    const owner = new PublicKey(c.carteira);
    const ata = await getOrCreateAssociatedTokenAccount(connection, admin, mint, owner);
    const sig = await mintTo(connection, admin, mint, ata.address, admin, BigInt(Math.round(c.valor * 1_000_000)));
    c.paga = true;
    c.estado = "paga";
    return json({ ok: true, assinatura: sig });
  } catch (e) {
    c.estado = "falhou";
    return json({ erro: errorMessage(e) }, 500);
  }
}
