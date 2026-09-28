import type { Metadata } from "next";
import { DemoProvider } from "@/components/DemoProvider";
import { Casca } from "./Casca";

export const metadata: Metadata = { title: "Fiador.sol · Investidor" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <DemoProvider>
      <Casca>{children}</Casca>
    </DemoProvider>
  );
}
