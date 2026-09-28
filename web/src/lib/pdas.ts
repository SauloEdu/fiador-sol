import { PublicKey } from "@solana/web3.js";
import BN from "bn.js";
import { PROGRAM_ID } from "./constants";

const pda = (...seeds: (Buffer | Uint8Array)[]) =>
  PublicKey.findProgramAddressSync(seeds, PROGRAM_ID)[0];

export const configPda = () => pda(Buffer.from("config"));
export const poolPda = () => pda(Buffer.from("pool"));
export const poolVaultPda = () => pda(Buffer.from("pool_vault"));
export const yieldReservePda = () => pda(Buffer.from("yield_reserve"));
export const agencyPda = (authority: PublicKey) => pda(Buffer.from("agency"), authority.toBuffer());
export const profilePda = (tenant: PublicKey) => pda(Buffer.from("profile"), tenant.toBuffer());
export const positionPda = (owner: PublicKey) => pda(Buffer.from("position"), owner.toBuffer());
export const leasePda = (landlord: PublicKey, tenant: PublicKey, id: BN | number) =>
  pda(
    Buffer.from("lease"),
    landlord.toBuffer(),
    tenant.toBuffer(),
    new BN(id).toArrayLike(Buffer, "le", 8)
  );
export const vaultPda = (lease: PublicKey) => pda(Buffer.from("vault"), lease.toBuffer());
