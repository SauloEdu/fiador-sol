/**
 * Teste de ponta a ponta contra a Solana local (ou devnet), usando as mesmas
 * funções do site. Um contrato de 4 "meses" de 60 s: 3 pagos adiantados (selo),
 * o 4º atrasa e o keeper cobra; depois o acerto final devolve a caução.
 * Uso: npx tsx scripts/e2e.ts   (leva ~5 min por causa do relógio real)
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_CLOCK_PUBKEY } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import * as A from "../src/lib/actions";
import { getProgram, keypairWallet } from "../src/lib/program";
import { agencyPda, configPda, leasePda, profilePda } from "../src/lib/pdas";
import { brl } from "../src/lib/format";

const demo = JSON.parse(fs.readFileSync(path.join(__dirname, "..", ".demo.json"), "utf8"));
const connection = new Connection(demo.rpc, "confirmed");
const admin = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync(path.join(os.homedir(), ".config/solana/id.json"), "utf8")))
);
const a = { mint: new PublicKey(demo.mint), badgeMint: new PublicKey(demo.badgeMint) };
const log = (...x: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...x);
const sleep = (s: number) => new Promise((r) => setTimeout(r, s * 1000));

async function keeper() {
  // Mesmo código da rota /api/keeper, chamado direto.
  const mod = await import("../src/app/api/keeper/route");
  const r = await mod.POST();
  return r.json();
}

async function main() {
  const [agency, landlord, tenant] = [Keypair.generate(), Keypair.generate(), Keypair.generate()];
  for (const k of [agency, landlord, tenant]) {
    await connection.confirmTransaction(await connection.requestAirdrop(k.publicKey, 2 * LAMPORTS_PER_SOL), "confirmed");
  }
  const adminProgram = getProgram(connection, keypairWallet(admin));
  await adminProgram.methods
    .registerAgency(agency.publicKey)
    .accountsPartial({ admin: admin.publicKey, config: configPda(), agency: agencyPda(agency.publicKey) })
    .rpc();
  const tAta = await getOrCreateAssociatedTokenAccount(connection, admin, a.mint, tenant.publicKey);
  await mintTo(connection, admin, a.mint, tAta.address, admin, 20_000n * 1_000_000n); // "Pix"
  log("carteiras prontas; inquilino com", brl(await A.tokenBalance(connection, a.mint, tenant.publicKey)));

  await A.createLease(connection, agency, landlord, tenant.publicKey, 1, 2000, 4, 60);
  const lease = leasePda(landlord.publicKey, tenant.publicKey, 1);
  await A.acceptLease(connection, tenant, lease, agencyPda(agency.publicKey), a);
  log("contrato aceito; caução no cofre");

  // O programa só aceita pagar um mês depois que ele começa (B-A09). O relógio
  // da rede anda alguns segundos atrás do relógio do computador: usa o da rede.
  const relogioDaRede = async () => {
    const info = await connection.getAccountInfo(SYSVAR_CLOCK_PUBKEY);
    return Number(info!.data.readBigInt64LE(32));
  };
  const inicio = (await getProgram(connection, keypairWallet(admin)).account.lease.fetch(lease)).startTs.toNumber();
  for (let i = 0; i < 3; i++) {
    while ((await relogioDaRede()) < inicio + i * 60) await sleep(2);
    await A.payRent(connection, tenant, lease, landlord.publicKey, a);
  }
  log("3 meses pagos em dia; proprietário recebeu", brl(await A.tokenBalance(connection, a.mint, landlord.publicKey)));
  log("selos na carteira:", await A.tokenBalance(connection, a.badgeMint, tenant.publicKey, true));

  const program = getProgram(connection, keypairWallet(admin));
  const l = await program.account.lease.fetch(lease);
  const alvo = l.startTs.toNumber() + 4 * 60 + 20 + 3;
  log(`esperando o mês 4 vencer + carência (~${alvo - Math.floor(Date.now() / 1000)} s)…`);
  while ((await relogioDaRede()) < alvo) await sleep(5);
  let k = await keeper();
  log("keeper:", JSON.stringify(k.feitas.map((f: { acao: string; mes?: number }) => f.acao + (f.mes ? " mês " + f.mes : ""))), k.erros);
  log("proprietário agora tem", brl(await A.tokenBalance(connection, a.mint, landlord.publicKey)));

  log("esperando a janela de contestação (35 s)…");
  await sleep(35);
  k = await keeper();
  log("keeper:", JSON.stringify(k.feitas.map((f: { acao: string }) => f.acao)), k.erros);
  const fim = await program.account.lease.fetch(lease);
  const perfil = await program.account.tenantProfile.fetch(profilePda(tenant.publicKey));
  log("status final:", Object.keys(fim.status)[0], "| perfil:", perfil.onTime, "em dia,", perfil.defaults, "calote(s)");
  log("inquilino terminou com", brl(await A.tokenBalance(connection, a.mint, tenant.publicKey)));
}

main().catch((e) => {
  console.error(A.readableError(e), e?.logs ?? "");
  process.exit(1);
});
