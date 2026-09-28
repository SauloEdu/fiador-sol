import { AnchorProvider, Program } from "@anchor-lang/core";
import { Connection, Keypair, PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";
import idl from "@/idl/fiador.json";
import type { Fiador } from "@/idl/fiador";

/** Carteira mínima a partir de um Keypair (carteiras de demonstração e servidor). */
export function keypairWallet(kp: Keypair) {
  return {
    publicKey: kp.publicKey,
    payer: kp,
    async signTransaction<T extends Transaction | VersionedTransaction>(tx: T): Promise<T> {
      if (tx instanceof VersionedTransaction) tx.sign([kp]);
      else tx.partialSign(kp);
      return tx;
    },
    async signAllTransactions<T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> {
      for (const tx of txs) await this.signTransaction(tx);
      return txs;
    },
  };
}

export type WalletLike = ReturnType<typeof keypairWallet>;

export function getProgram(connection: Connection, wallet: WalletLike | { publicKey: PublicKey }) {
  const provider = new AnchorProvider(connection, wallet as never, { commitment: "confirmed" });
  return new Program<Fiador>(idl as Fiador, provider);
}
