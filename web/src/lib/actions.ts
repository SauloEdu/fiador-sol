/**
 * Ações da demo executadas no navegador, cada uma assinada pela carteira do papel
 * (imobiliária, proprietário, inquilino, investidor). Mesmas instruções do programa.
 */
import BN from "bn.js";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { getProgram, keypairWallet } from "./program";
import {
  agencyPda,
  configPda,
  leasePda,
  poolPda,
  poolVaultPda,
  positionPda,
  profilePda,
  vaultPda,
} from "./pdas";
import { toUnits } from "./format";

export type Addrs = { mint: PublicKey; badgeMint: PublicKey };

const ata = (mint: PublicKey, owner: PublicKey) => getAssociatedTokenAddressSync(mint, owner);
const badgeAta = (badge: PublicKey, owner: PublicKey) =>
  getAssociatedTokenAddressSync(badge, owner, false, TOKEN_2022_PROGRAM_ID);

function prog(connection: Connection, kp: Keypair) {
  return getProgram(connection, keypairWallet(kp));
}

/** SHA-256 do texto do contrato (na vida real, o PDF assinado). Só o hash vai on-chain. */
async function contractHash(text: string): Promise<number[]> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf));
}

export async function createLease(
  connection: Connection,
  agency: Keypair,
  landlord: Keypair,
  tenant: PublicKey,
  id: number,
  rentReais: number,
  periods: number,
  periodSecs: number
) {
  const program = prog(connection, agency);
  const hash = await contractHash(
    `Contrato de locação demo #${id} · aluguel ${rentReais} · ${periods} meses · ${tenant.toBase58()}`
  );
  return program.methods
    .createLease(new BN(id), {
      rentAmount: toUnits(rentReais),
      periodSecs: new BN(periodSecs),
      totalPeriods: periods,
      contractHash: hash,
    })
    .accountsPartial({
      agencyAuthority: agency.publicKey,
      landlord: landlord.publicKey,
      tenant,
      config: configPda(),
      agency: agencyPda(agency.publicKey),
      lease: leasePda(landlord.publicKey, tenant, id),
    })
    .signers([landlord])
    .rpc();
}

export async function acceptLease(connection: Connection, tenant: Keypair, lease: PublicKey, agency: PublicKey, a: Addrs) {
  const program = prog(connection, tenant);
  const pre = [];
  if (!(await connection.getAccountInfo(profilePda(tenant.publicKey)))) {
    pre.push(
      await program.methods
        .initProfile()
        .accountsPartial({ tenant: tenant.publicKey, profile: profilePda(tenant.publicKey) })
        .instruction()
    );
  }
  return program.methods
    .acceptLease()
    .accountsPartial({
      tenant: tenant.publicKey,
      config: configPda(),
      pool: poolPda(),
      agency,
      lease,
      profile: profilePda(tenant.publicKey),
      mint: a.mint,
      vault: vaultPda(lease),
      tenantToken: ata(a.mint, tenant.publicKey),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(pre)
    .rpc();
}

export async function payRent(connection: Connection, tenant: Keypair, lease: PublicKey, landlord: PublicKey, a: Addrs) {
  const program = prog(connection, tenant);
  const tenantBadge = badgeAta(a.badgeMint, tenant.publicKey);
  const landlordToken = ata(a.mint, landlord);
  return program.methods
    .payRent()
    .accountsPartial({
      tenant: tenant.publicKey,
      pool: poolPda(),
      poolVault: poolVaultPda(),
      lease,
      vault: vaultPda(lease),
      profile: profilePda(tenant.publicKey),
      config: configPda(),
      mint: a.mint,
      tenantToken: ata(a.mint, tenant.publicKey),
      landlordToken,
      tokenProgram: TOKEN_PROGRAM_ID,
      badgeMint: a.badgeMint,
      tenantBadge,
      badgeTokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .preInstructions([
      createAssociatedTokenAccountIdempotentInstruction(tenant.publicKey, landlordToken, landlord, a.mint),
      createAssociatedTokenAccountIdempotentInstruction(
        tenant.publicKey,
        tenantBadge,
        tenant.publicKey,
        a.badgeMint,
        TOKEN_2022_PROGRAM_ID
      ),
    ])
    .rpc();
}

export async function openDispute(connection: Connection, landlord: Keypair, lease: PublicKey, reais: number) {
  return prog(connection, landlord)
    .methods.openDispute(toUnits(reais))
    .accountsPartial({ landlord: landlord.publicKey, lease })
    .rpc();
}

export async function resolveDispute(
  connection: Connection,
  agency: Keypair,
  lease: PublicKey,
  landlord: PublicKey,
  reais: number,
  a: Addrs
) {
  return prog(connection, agency)
    .methods.resolveDispute(toUnits(reais))
    .accountsPartial({
      agencyAuthority: agency.publicKey,
      agency: agencyPda(agency.publicKey),
      lease,
      vault: vaultPda(lease),
      config: configPda(),
      mint: a.mint,
      landlordToken: ata(a.mint, landlord),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

export async function poolDeposit(connection: Connection, investor: Keypair, reais: number, a: Addrs) {
  const program = prog(connection, investor);
  const pre = [];
  if (!(await connection.getAccountInfo(positionPda(investor.publicKey)))) {
    pre.push(
      await program.methods
        .openPosition()
        .accountsPartial({ owner: investor.publicKey, position: positionPda(investor.publicKey) })
        .instruction()
    );
  }
  return program.methods
    .poolDeposit(toUnits(reais))
    .accountsPartial({
      owner: investor.publicKey,
      position: positionPda(investor.publicKey),
      pool: poolPda(),
      poolVault: poolVaultPda(),
      config: configPda(),
      mint: a.mint,
      ownerToken: ata(a.mint, investor.publicKey),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .preInstructions(pre)
    .rpc();
}

export async function requestWithdraw(connection: Connection, investor: Keypair, shares: BN) {
  return prog(connection, investor)
    .methods.requestWithdraw(shares)
    .accountsPartial({ owner: investor.publicKey, position: positionPda(investor.publicKey) })
    .rpc();
}

export async function poolWithdraw(connection: Connection, investor: Keypair, a: Addrs) {
  return prog(connection, investor)
    .methods.poolWithdraw()
    .accountsPartial({
      owner: investor.publicKey,
      position: positionPda(investor.publicKey),
      pool: poolPda(),
      poolVault: poolVaultPda(),
      config: configPda(),
      mint: a.mint,
      ownerToken: ata(a.mint, investor.publicKey),
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();
}

/** Saldo de tBRL (0 se a conta ainda não existe). */
export async function tokenBalance(connection: Connection, mint: PublicKey, owner: PublicKey, program2022 = false) {
  const addr = getAssociatedTokenAddressSync(mint, owner, false, program2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID);
  try {
    const r = await connection.getTokenAccountBalance(addr);
    return Number(r.value.amount);
  } catch {
    return 0;
  }
}

/** Mensagem legível de um erro do programa (usa o texto em português do FiadorError). */
export function readableError(e: unknown): string {
  const anyE = e as { error?: { errorMessage?: string }; message?: string; transactionMessage?: string; logs?: string[] };
  if (anyE?.error?.errorMessage) return anyE.error.errorMessage;
  const log = anyE?.logs?.find((l) => l.includes("Error Message:"));
  if (log) return log.split("Error Message:")[1].trim();
  const raw = anyE?.transactionMessage ?? anyE?.message ?? String(e);
  const logs = (anyE?.logs ?? []).join("\n");
  // Erros do programa de tokens (SPL) mais comuns na demo
  if (/insufficient funds/i.test(logs) || /custom program error: 0x1\b/.test(raw)) return "Saldo de tBRL insuficiente. Compre mais com Pix.";
  if (/already in use/i.test(logs + raw)) return "Essa conta já existe (a ação já foi feita).";
  if (/0x7d[0-9a-f]/i.test(raw)) return "Uma conta não bate com o esperado pelo programa.";
  return raw.replace(/^Transaction simulation failed: /, "");
}
