import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { TOKEN_PROGRAM_ID, createAssociatedTokenAccountIdempotentInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token";
import { serverContext, chainNow, json, errorMessage, exigirSenha } from "@/lib/server";
import { configPda, poolPda, poolVaultPda, profilePda, vaultPda, yieldReservePda } from "@/lib/pdas";

export const dynamic = "force-dynamic";

type Acao = {
  contrato: string;
  acao: "cobrou_atraso" | "liberou_fundo" | "encerrou_prazo" | "acertou_final";
  mes?: number;
  assinatura: string;
  /** Na cobrança: quanto saiu da caução e do fundo (em unidades de tBRL) e se o do fundo ficou em quarentena. */
  caucao?: number;
  fundo?: number;
  quarentena?: boolean;
  valor?: number;
};

/**
 * Keeper: percorre os contratos e aperta os botões que o programa permite.
 * O programa confere relógio e estado; o keeper não tem poder nenhum além disso.
 */
export async function POST(req: Request) {
  const bloqueio = exigirSenha(req);
  if (bloqueio) return bloqueio;
  try {
    const { connection, admin, program, mint } = serverContext();
    const now = await chainNow(connection);
    const leases = await program.account.lease.all();
    const feitas: Acao[] = [];
    const erros: string[] = [];

    for (const { publicKey: lease, account: l } of leases) {
      const status = Object.keys(l.status)[0];
      const landlordToken = getAssociatedTokenAddressSync(mint, l.landlord);
      const agency = l.agency as PublicKey;
      try {
        // Fim da quarentena: libera ao proprietário o pagamento do fundo (se ninguém congelou).
        if (l.poolPending.toNumber() > 0 && !l.poolFrozen && now >= l.poolReleaseTs.toNumber()) {
          const sig = await program.methods
            .releasePoolPayment()
            .accountsPartial({
              caller: admin.publicKey,
              config: configPda(),
              pool: poolPda(),
              poolVault: poolVaultPda(),
              lease,
              mint,
              landlordToken,
              tokenProgram: TOKEN_PROGRAM_ID,
            })
            .preInstructions([
              createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, landlordToken, l.landlord, mint),
            ])
            .rpc();
          feitas.push({ contrato: lease.toBase58(), acao: "liberou_fundo", assinatura: sig, valor: l.poolPending.toNumber() });
          l.poolPending = new BN(0);
        }
        if (status === "active" || status === "defaulted") {
          const n = l.totalPeriods;
          const due = (i: number) => l.startTs.toNumber() + l.periodSecs.toNumber() * (i + 1);
          // Cobra todos os meses vencidos além da carência, um por vez.
          for (let i = 0; i < n; i++) {
            const st = Object.keys(l.periods[i])[0];
            if (st !== "open") continue;
            if (now <= due(i) + l.graceSecs.toNumber()) break;
            const antes = await program.account.lease.fetch(lease);
            const sig = await program.methods
              .claimDefault()
              .accountsPartial({
                caller: admin.publicKey,
                pool: poolPda(),
                poolVault: poolVaultPda(),
                agency,
                lease,
                vault: vaultPda(lease),
                config: configPda(),
                mint,
                landlordToken,
                tokenProgram: TOKEN_PROGRAM_ID,
              })
              .preInstructions([
                createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, landlordToken, l.landlord, mint),
              ])
              .rpc();
            const depois = await program.account.lease.fetch(lease);
            feitas.push({
              contrato: lease.toBase58(),
              acao: "cobrou_atraso",
              mes: i + 1,
              assinatura: sig,
              caucao: antes.depositBalance.sub(depois.depositBalance).toNumber(),
              fundo: depois.poolCoveredTotal.sub(antes.poolCoveredTotal).toNumber(),
              quarentena: depois.poolPending.gt(antes.poolPending),
            });
          }
          const fresh = await program.account.lease.fetch(lease);
          const aberto = fresh.periods.slice(0, n).some((p) => Object.keys(p)[0] === "open");
          if (!aberto && now >= due(n - 1)) {
            const sig = await program.methods.endLease().accountsPartial({ caller: admin.publicKey, lease }).rpc();
            feitas.push({ contrato: lease.toBase58(), acao: "encerrou_prazo", assinatura: sig });
          }
        } else if (status === "ending") {
          const fim = l.endTs.toNumber() + l.disputeWindowSecs.toNumber();
          if ((l.disputeResolved || now > fim) && l.poolPending.toNumber() === 0) {
            const tenantToken = getAssociatedTokenAddressSync(mint, l.tenant);
            const sig = await program.methods
              .closeLease()
              .accountsPartial({
                caller: admin.publicKey,
                config: configPda(),
                pool: poolPda(),
                poolVault: poolVaultPda(),
                yieldReserve: yieldReservePda(),
                agency,
                lease,
                vault: vaultPda(lease),
                profile: profilePda(l.tenant),
                mint,
                tenantToken,
                tokenProgram: TOKEN_PROGRAM_ID,
              })
              .preInstructions([
                createAssociatedTokenAccountIdempotentInstruction(admin.publicKey, tenantToken, l.tenant, mint),
              ])
              .rpc();
            feitas.push({ contrato: lease.toBase58(), acao: "acertou_final", assinatura: sig });
          }
        }
      } catch (e) {
        erros.push(`${lease.toBase58().slice(0, 6)}: ${errorMessage(e)}`);
      }
    }
    return json({ agora: now, feitas, erros });
  } catch (e) {
    return json({ erro: errorMessage(e) }, 500);
  }
}
