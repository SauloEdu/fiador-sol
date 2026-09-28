import type { Metadata } from "next";
import { Historico } from "./Historico";

export const metadata: Metadata = { title: "Fiador.sol · Histórico de inquilino" };

/** Página pública: qualquer pessoa com o link vê o histórico gravado na Solana para esta carteira. */
export default async function Reputacao({ params }: { params: Promise<{ carteira: string }> }) {
  const { carteira } = await params;
  return <Historico carteira={carteira} />;
}
