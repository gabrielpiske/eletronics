import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Arena Eletrônica SENAI | Manutenção Eletrônica",
  description:
    "Bancada interativa para identificação de simbologia e análise de circuitos eletrônicos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-[#111317] text-zinc-100 font-sans antialiased selection:bg-[#0047B6] selection:text-white">
        {children}
      </body>
    </html>
  );
}
