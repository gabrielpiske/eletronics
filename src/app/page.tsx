"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MINIGAMES_CATALOG } from "@/data/electronicsData";
import { checkRoomExists, joinRoom } from "@/lib/roomService";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Footer } from "@/components/Footer";
import {
  Cpu,
  Play,
  Tv,
  BookOpen,
  Sparkles,
  ArrowRight,
  Wifi,
  Gamepad2,
} from "lucide-react";

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
      setError("Digite o PIN de 6 dígitos projetado pelo professor!");
      return;
    }
    if (!nickname.trim()) {
      setError("Escolha um apelido para aparecer no Ranking!");
      return;
    }

    setLoading(true);
    try {
      const exists = await checkRoomExists(cleanPin);
      if (!exists) {
        setError(
          "Sala não encontrada! Verifique o PIN no telão do professor."
        );
        setLoading(false);
        return;
      }

      sessionStorage.setItem("senai_arena_nickname", nickname.trim());
      sessionStorage.setItem("senai_arena_avatar", avatar);
      await joinRoom(cleanPin, nickname.trim(), avatar);
      router.push(`/play/${cleanPin}`);
    } catch {
      setError("Não foi possível entrar na sala. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#060B16] to-[#04070F]">
      {/* Barra Superior */}
      <header className="w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-blue-700 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Cpu className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold tracking-widest uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  SENAI
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Técnicas de Manutenção Eletrônica
                </span>
              </div>
              <h1 className="text-lg font-extrabold text-white tracking-tight">
                Arena Eletrônica — Simbologia & Bancada
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/practice"
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs sm:text-sm font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              Guia de Símbolos & Treino
            </Link>
            <Link
              href="/host"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-transform active:scale-95"
            >
              <Tv className="w-4 h-4" />
              Painel do Professor (Host)
            </Link>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl mx-auto w-full px-4 py-8 flex flex-col gap-12">
        {/* Hero Grid: Entrada por PIN (Estilo Kahoot) + Destaque */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Caixa de Entrada do Aluno por PIN */}
          <div className="lg:col-span-5 bg-slate-900/95 border-2 border-sky-500/60 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-sky-500/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Acesso Rápido do Aluno
              </span>
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                {isFirebaseConfigured ? "Cloud Sync" : "Sync Local Ativo"}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Entrar com PIN da Sala
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Digite o código projetado pelo professor, escolha seu apelido e
              entre na competição ao vivo!
            </p>

            <form onSubmit={handleJoinWithPin} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  PIN do Jogo (6 dígitos)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={7}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="000000"
                  className="w-full text-center text-3xl font-mono font-black tracking-[0.28em] py-3.5 px-4 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-sky-400 focus:outline-none text-amber-300 placeholder:text-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-1.5">
                  Seu Apelido no Ranking
                </label>
                <input
                  type="text"
                  maxLength={18}
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ex: Gabriel_SENAI"
                  className="w-full text-base font-bold py-3 px-4 rounded-2xl bg-slate-950 border-2 border-slate-700 focus:border-sky-400 focus:outline-none text-white placeholder:text-slate-600"
                />
              </div>

              {/* Escolha de Ícone */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                  Seu Ícone de Bancada
                </label>
                <div className="grid grid-cols-8 gap-1.5">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`py-2 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        avatar === av
                          ? "bg-sky-500/30 border-sky-400 scale-110"
                          : "bg-slate-950 border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl bg-red-950/90 border border-red-400 px-3.5 py-2.5 text-xs font-bold text-red-200 text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-lg shadow-xl shadow-amber-500/20 transition-transform active:scale-98 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                {loading ? "CONECTANDO À BANCADA..." : "ENTRAR NO JOGO!"}
              </button>
            </form>
          </div>

          {/* Apresentação dos 5 Minigames */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold w-fit">
              <Gamepad2 className="w-4 h-4" />5 Minigames Interativos Independentes
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
              Aprenda Simbologia e Conceitos Básicos de Forma{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">
                100% Prática e Competitiva
              </span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Esqueça quizzes repetitivos! Aqui cada atividade é um{" "}
              <strong>minigame diferente</strong> pensado para a unidade
              curricular de <strong>Técnicas de Manutenção Eletrônica</strong>.
              O professor pode hospedar qualquer um dos 5 jogos isoladamente com
              PIN e acompanhar o ranking da turma ao vivo no telão!
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {MINIGAMES_CATALOG.map((mg, idx) => (
                <div
                  key={mg.id}
                  className="bg-slate-900/80 border border-slate-800 hover:border-slate-600 rounded-2xl p-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-bold">
                        Minigame #{idx + 1} • {mg.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-white mt-2">
                      {mg.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {mg.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <Link
                      href={`/host?game=${mg.id}`}
                      className="text-xs font-extrabold text-sky-400 hover:text-sky-300 flex items-center gap-1"
                    >
                      Hospedar com PIN <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <Link
                      href={`/practice?game=${mg.id}`}
                      className="text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Testar Solo
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Rodapé */}
      <Footer />
    </div>
  );
}
