import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arena SENAI | Técnicas de Manutenção Eletrônica",
  description:
    "Plataforma gamificada interativa com acesso via PIN para identificação rápida de simbologia e conceitos básicos de manutenção eletrônica.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-[#060B16] text-slate-100 antialiased selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
