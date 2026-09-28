import { loadDemo, json } from "@/lib/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const d = loadDemo();
    return json({ rpc: d.rpc, programId: d.programId, mint: d.mint, badgeMint: d.badgeMint });
  } catch (e) {
    return json({ erro: (e as Error).message }, 500);
  }
}
