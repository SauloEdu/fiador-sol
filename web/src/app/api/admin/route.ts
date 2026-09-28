import { PublicKey } from "@solana/web3.js";
import { serverContext, json, errorMessage, exigirSenha } from "@/lib/server";
import { agencyPda, configPda, poolPda } from "@/lib/pdas";

export const dynamic = "force-dynamic";

/**
 * Resposta a golpe (Fiador Doc/08-RESPOSTA-A-GOLPE.md, passo 1 "Conter"), assinada
 * pelo admin no servidor. Em produção, o admin é um multisig e estas ações passam
 * por várias assinaturas; aqui ficam atrás da senha da demo.
 */
type Pedido =
  | { acao: "pausar" | "retomar" }
  | { acao: "suspender" | "reativar"; imobiliaria: string }
  | { acao: "congelar" | "descongelar" | "cancelar"; contrato: string };

export async function POST(req: Request) {
  const bloqueio = exigirSenha(req);
  if (bloqueio) return bloqueio;
  try {
    const pedido = (await req.json()) as Pedido;
    const { admin, program } = serverContext();
    let assinatura: string;
    switch (pedido.acao) {
      case "pausar":
      case "retomar":
        assinatura = await program.methods
          .setPaused(pedido.acao === "pausar")
          .accountsPartial({ admin: admin.publicKey, config: configPda() })
          .rpc();
        break;
      case "suspender":
      case "reativar": {
        const autoridade = new PublicKey(pedido.imobiliaria);
        assinatura = await program.methods
          .setAgencyActive(pedido.acao === "reativar")
          .accountsPartial({ admin: admin.publicKey, config: configPda(), agency: agencyPda(autoridade) })
          .rpc();
        break;
      }
      case "congelar":
      case "descongelar":
      case "cancelar": {
        const contas = { admin: admin.publicKey, config: configPda(), pool: poolPda(), lease: new PublicKey(pedido.contrato) };
        assinatura =
          pedido.acao === "cancelar"
            ? await program.methods.cancelPoolPayment().accountsPartial(contas).rpc()
            : await program.methods.freezePoolPayment(pedido.acao === "congelar").accountsPartial(contas).rpc();
        break;
      }
      default:
        return json({ erro: "Ação desconhecida." }, 400);
    }
    return json({ assinatura });
  } catch (e) {
    return json({ erro: errorMessage(e) }, 500);
  }
}
