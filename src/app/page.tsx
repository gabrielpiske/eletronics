"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkRoomExists, joinRoom } from "@/lib/roomService";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Footer } from "@/components/Footer";
import { Cpu, Tv, BookOpen, ArrowRight } from "lucide-react";

const AVATARS = ["⚡", "🔧", "🤖", "🔋", "💡", "🛠️", "📟", "🚀"];

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoinWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanPin = pin.replace(/\s+/g, "");

    if (cleanPin.length !== 6) {
      setError("Informe o PIN de 6 dígitos da sala.");
      return;
    }
    if (!nickname.trim()) {
      setError("Informe seu nome ou apelido.");
      return;
    }

    setLoading(true);
    try {
      const exists = await checkRoomExists(cleanPin);
      if (!exists) {
        setError("Sala não localizada. Confira o PIN no projetor.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("senai_arena_nickname", nickname.trim());
      sessionStorage.setItem("senai_arena_avatar", avatar);
      await joinRoom(cleanPin, nickname.trim(), avatar);
      router.push(`/play/${cleanPin}`);
    } catch {
      setError("Falha de conexão com a sala. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#111317] text-zinc-100">
      {/* Barra Superior Institucional & Técnica */}
      <header className="w-full border-b border-[#242933] bg-[#16191E]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="px-2.5 py-1 rounded bg-[#0047B6] text-white font-mono font-extrabold text-xs tracking-widest flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              SENAI
            </div>
            <div className="h-4 w-px bg-[#2A303C] hidden sm:block" />
            <span className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">
              Arena Eletrônica
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/practice"
              className="px-3 py-2 rounded-md bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-xs font-semibold text-zinc-200 flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span>Catálogo & Treino</span>
            </Link>
            <Link
              href="/host"
              className="px-3.5 py-2 rounded-md bg-[#0047B6] hover:bg-[#0056DB] text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Professor (Host)</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Área Central: Terminal Direto de Entrada por PIN */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-[#181B20] border border-[#2A303C] rounded-lg shadow-2xl overflow-hidden">
          {/* Topo do Módulo estilo Instrumento */}
          <div className="bg-[#13161A] border-b border-[#242933] px-5 py-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              TERMINAL DE BANCADA • ACESSO
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isFirebaseConfigured ? "ONLINE" : "SYNC LOCAL"}
            </span>
          </div>

          <form onSubmit={handleJoinWithPin} className="p-6 flex flex-col gap-5">
            {/* Visor Digital do PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                  PIN da Sala
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  6 dígitos
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] py-3.5 px-4 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-amber-400 focus:outline-none text-amber-400 placeholder:text-zinc-800 transition-colors"
              />
            </div>

            {/* Identificação do Aluno */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block mb-1.5">
                Identificação / Apelido
              </label>
              <input
                type="text"
                maxLength={18}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full text-sm font-semibold py-3 px-3.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-amber-400 focus:outline-none text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>

            {/* Seletor Compacto de Ícone */}
            <div>
              <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 block mb-1.5">
                Marcador
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`py-2 rounded-md text-base flex items-center justify-center border transition-colors ${
                      avatar === av
                        ? "bg-amber-500/15 border-amber-400 text-white"
                        : "bg-[#0C0E12] border-[#242933] hover:border-zinc-600"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-950/60 border-l-4 border-red-500 px-3.5 py-2.5 text-xs font-medium text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <span>{loading ? "Conectando..." : "Conectar à Bancada"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
