import type { Metadata } from "next";
import { DemoProvider } from "@/components/DemoProvider";
import { Casca } from "./casca";

export const metadata: Metadata = { title: "Fiador.sol · Imobiliária Sol" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <Casca>{children}</Casca>
    </DemoProvider>
  );
}
