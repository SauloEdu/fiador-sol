import type { Metadata } from "next";
import { DemoProvider } from "@/components/DemoProvider";

export const metadata: Metadata = { title: "Fiador.sol · Carlos" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
