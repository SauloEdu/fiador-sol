/**
 * Prepara o ambiente da demo (localnet ou devnet):
 *  1. mint tBRL (stablecoin de teste, 6 casas) e saldo do admin
 *  2. mint do selo "Bom Pagador" (Token-2022, intransferível, com nome e símbolo)
 *  3. initialize em modo demonstração ("mês" = 60 s) com R$ 50.000 no pool
 *  4. set_badge_mint e R$ 5.000 na reserva de rendimento
 * Grava os endereços em web/.demo.json. Pode rodar de novo: pula o que já existe.
 *
 * Uso: npm run setup            (localnet)
 *      RPC_URL=https://api.devnet.solana.com npm run setup
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import BN from "bn.js";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  AuthorityType,
  ExtensionType,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  TYPE_SIZE,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  createMint,
  createSetAuthorityInstruction,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";
import { createInitializeInstruction, pack, type TokenMetadata } from "@solana/spl-token-metadata";
import { getProgram, keypairWallet } from "../src/lib/program";
import { configPda, poolPda, poolVaultPda, yieldReservePda } from "../src/lib/pdas";

const RPC = process.env.RPC_URL ?? "http://127.0.0.1:8899";
const KEYPAIR = process.env.ADMIN_KEYPAIR ?? path.join(os.homedir(), ".config/solana/id.json");
// DEMO_FILE permite guardar a devnet num arquivo separado (ex.: .demo.devnet.json).
const OUT = path.join(__dirname, "..", process.env.DEMO_FILE ?? ".demo.json");
const UNIT = 1_000_000;
const brl = (reais: number) => new BN(reais).mul(new BN(UNIT));

type DemoFile = { rpc: string; programId: string; admin: string; mint?: string; badgeMint?: string };

async function main() {
  const connection = new Connection(RPC, "confirmed");
  const admin = Keypair.fromSecretKey(Uint8Array.from(JSON.parse(fs.readFileSync(KEYPAIR, "utf8"))));
  const program = getProgram(connection, keypairWallet(admin));
  const prev: Partial<DemoFile> = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  const sameNetwork = prev.rpc === RPC && prev.programId === program.programId.toBase58();
  const out: DemoFile = { rpc: RPC, programId: program.programId.toBase58(), admin: admin.publicKey.toBase58() };
  console.log(`RPC ${RPC}\nadmin ${out.admin}\nprograma ${out.programId}`);

  // SOL para taxas (só funciona sozinho na localnet)
  if ((await connection.getBalance(admin.publicKey)) < 5 * LAMPORTS_PER_SOL) {
    try {
      const sig = await connection.requestAirdrop(admin.publicKey, 100 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
    } catch {
      console.warn("Airdrop recusado — garanta SOL de teste na carteira do admin.");
    }
  }

  const config = configPda();
  const configInfo = await connection.getAccountInfo(config);

  // 1) tBRL
  let mint: PublicKey;
  if (configInfo) {
    const cfg = await program.account.config.fetch(config);
    mint = cfg.mint;
    console.log("Protocolo já inicializado; reaproveitando tBRL", mint.toBase58());
  } else if (sameNetwork && prev.mint && (await connection.getAccountInfo(new PublicKey(prev.mint)))) {
    mint = new PublicKey(prev.mint);
  } else {
    mint = await createMint(connection, admin, admin.publicKey, null, 6);
    console.log("tBRL criado", mint.toBase58());
  }
  out.mint = mint.toBase58();
  const adminToken = await getOrCreateAssociatedTokenAccount(connection, admin, mint, admin.publicKey);

  // 3) initialize
  if (!configInfo) {
    await mintTo(connection, admin, mint, adminToken.address, admin, BigInt(brl(1_000_000).toString()));
    const params = {
      demoMode: true,
      minPeriodSecs: new BN(60),
      maxPeriodSecs: new BN(600), // "mês" máximo de 10 min na demo (B-A26)
      minRentAmount: brl(100), // aluguel mínimo de R$ 100 (B-A23)
      graceSecs: new BN(20),
      premiumBps: 800,
      apyBps: 1000,
      coverageMonths: 3,
      maxCoverageAmount: brl(15_000),
      coverageWaitingPeriods: 2,
      coverageGrowthBps: 2500, // ¼ de aluguel de cobertura por mês pago (antifraude)
      landlordDeductibleBps: 2000, // franquia de 20% do proprietário (antifraude)
      agencyMaxPoolBps: 5000,
      withdrawCooldownSecs: new BN(30),
      disputeWindowSecs: new BN(30),
      poolQuarantineSecs: new BN(30), // pagamento do fundo retido 30 s na demo (7 dias em produção)
    };
    await program.methods
      .initialize(params, brl(50_000))
      .accountsPartial({
        admin: admin.publicKey,
        config,
        pool: poolPda(),
        mint,
        poolVault: poolVaultPda(),
        yieldReserve: yieldReservePda(),
        adminToken: adminToken.address,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
    console.log("Protocolo inicializado (modo demonstração, pool com R$ 50.000)");
    await mintTo(connection, admin, mint, yieldReservePda(), admin, BigInt(brl(5_000).toString()));
    console.log("Reserva de rendimento abastecida com R$ 5.000");
  }

  // 2 + 4) selo
  const cfg = await program.account.config.fetch(config);
  if (cfg.badgeMint.equals(PublicKey.default)) {
    const badge = await createBadgeMint(connection, admin, config);
    await program.methods
      .setBadgeMint()
      .accountsPartial({
        admin: admin.publicKey,
        config,
        badgeMint: badge,
        badgeTokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .rpc();
    out.badgeMint = badge.toBase58();
    console.log("Selo Bom Pagador registrado", out.badgeMint);
  } else {
    out.badgeMint = cfg.badgeMint.toBase58();
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log(`\nPronto. Endereços em ${OUT}`);
  // Para hospedar o site: a mesma informação vai numa variável de ambiente (não há arquivo no servidor).
  console.log(`\nDEMO_CONFIG=${JSON.stringify(out)}`);
}

/** Token-2022 com NonTransferable + nome/símbolo; depois a autoridade passa ao PDA config. */
async function createBadgeMint(connection: Connection, admin: Keypair, config: PublicKey) {
  const mint = Keypair.generate();
  const metadata: TokenMetadata = {
    mint: mint.publicKey,
    name: "Selo Bom Pagador",
    symbol: "BOMPAG",
    uri: "https://raw.githubusercontent.com/SauloEdu/fiador-sol/main/web/public/selo.json",
    additionalMetadata: [["emissor", "Fiador.sol"]],
  };
  const mintLen = getMintLen([ExtensionType.NonTransferable, ExtensionType.MetadataPointer]);
  const metaLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen + metaLen);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: admin.publicKey,
      newAccountPubkey: mint.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeNonTransferableMintInstruction(mint.publicKey, TOKEN_2022_PROGRAM_ID),
    createInitializeMetadataPointerInstruction(mint.publicKey, admin.publicKey, mint.publicKey, TOKEN_2022_PROGRAM_ID),
    createInitializeMintInstruction(mint.publicKey, 0, admin.publicKey, null, TOKEN_2022_PROGRAM_ID),
    createInitializeInstruction({
      programId: TOKEN_2022_PROGRAM_ID,
      metadata: mint.publicKey,
      updateAuthority: admin.publicKey,
      mint: mint.publicKey,
      mintAuthority: admin.publicKey,
      name: metadata.name,
      symbol: metadata.symbol,
      uri: metadata.uri,
    }),
    // Só o programa emite selos a partir daqui.
    createSetAuthorityInstruction(mint.publicKey, admin.publicKey, AuthorityType.MintTokens, config, [], TOKEN_2022_PROGRAM_ID)
  );
  await sendAndConfirmTransaction(connection, tx, [admin, mint], { commitment: "confirmed" });
  return mint.publicKey;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
