import type { Metadata } from "next";
import { DemoConsole } from "@/components/DemoConsole";
import "./legacy.css";

export const metadata: Metadata = { title: "Console técnico · Fiador.sol" };

/** Console técnico antigo: útil para depurar. O produto de verdade fica em /inquilino, /imobiliaria etc. */
export default function DemoPage() {
  return <DemoConsole />;
}
