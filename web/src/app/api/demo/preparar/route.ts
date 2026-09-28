import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction, sendAndConfirmTransaction } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { serverContext, isLocal, json, errorMessage } from "@/lib/server";
import { agencyPda, configPda } from "@/lib/pdas";

export const dynamic = "force-dynamic";

/**
 * Prepara as carteiras de demonstração: SOL para taxas, credenciamento da
 * imobiliária (assinado pelo admin) e conta de tBRL do proprietário.
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, string>;
    const { connection, admin, program, mint, demo } = serverContext();
    const wallets = ["imobiliaria", "proprietario", "inquilino", "investidor"].map((k) => new PublicKey(body[k]));

    for (const w of wallets) {
      const bal = await connection.getBalance(w);
      if (bal >= 0.05 * LAMPORTS_PER_SOL) continue;
      if (isLocal(demo.rpc)) {
        const sig = await connection.requestAirdrop(w, 2 * LAMPORTS_PER_SOL);
        await connection.confirmTransaction(sig, "confirmed");
      } else {
        const tx = new Transaction().add(
          SystemProgram.transfer({ fromPubkey: admin.publicKey, toPubkey: w, lamports: 0.05 * LAMPORTS_PER_SOL })
        );
        await sendAndConfirmTransaction(connection, tx, [admin], { commitment: "confirmed" });
      }
    }

    const [imobiliaria, proprietario] = wallets;
    if (!(await connection.getAccountInfo(agencyPda(imobiliaria)))) {
      await program.methods
        .registerAgency(imobiliaria)
        .accountsPartial({ admin: admin.publicKey, config: configPda(), agency: agencyPda(imobiliaria) })
        .rpc();
    }
    await getOrCreateAssociatedTokenAccount(connection, admin, mint, proprietario);
    return json({ ok: true });
  } catch (e) {
    return json({ erro: errorMessage(e) }, 500);
  }
}
