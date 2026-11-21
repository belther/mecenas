import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { BackendStatus } from "./backend-status";

export const metadata: Metadata = {
  title: "Mecenas — você encomenda, o artista recebe",
  description: "Encomendas de ilustração que valorizam quem cria. Demo do Hack Brasil 2026.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body>{children}<footer><span>Mecenas · Hack Brasil 2026</span><BackendStatus /></footer></body></html>;
}
