import type { Metadata } from "next";
import { DemoProvider } from "@/components/DemoProvider";

export const metadata: Metadata = { title: "Fiador.sol · Central de risco" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
