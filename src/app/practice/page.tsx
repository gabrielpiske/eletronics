"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ELECTRONIC_COMPONENTS,
  MINIGAMES_CATALOG,
  MinigameId,
  ComponentCategory,
} from "@/data/electronicsData";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import { ConveyorGame } from "@/components/minigames/ConveyorGame";
import { CircuitRadarGame } from "@/components/minigames/CircuitRadarGame";
import { ResistorBuilderGame } from "@/components/minigames/ResistorBuilderGame";
import { BenchMatchGame } from "@/components/minigames/BenchMatchGame";
import { SmokeDetectiveGame } from "@/components/minigames/SmokeDetectiveGame";
import { Footer } from "@/components/Footer";
import {
  ArrowLeft,
  BookOpen,
  Gamepad2,
  Flame,
  Trophy,
  RotateCcw,
} from "lucide-react";

function PracticeContent() {
  const searchParams = useSearchParams();
  const initialGame = searchParams.get("game") as MinigameId | null;

  const [activeTab, setActiveTab] = useState<"catalog" | "solo">(
    initialGame ? "solo" : "catalog"
  );
  const [selectedGame, setSelectedGame] = useState<MinigameId>(
    initialGame && MINIGAMES_CATALOG.some((g) => g.id === initialGame)
      ? initialGame
      : "conveyor"
  );
  const [categoryFilter, setCategoryFilter] = useState<"all" | ComponentCategory>(
    "all"
  );
  const [soloScore, setSoloScore] = useState<number>(0);
  const [soloStreak, setSoloStreak] = useState<number>(0);
  const [soloMisses, setSoloMisses] = useState<number>(0);
  const [lastSoloDelta, setLastSoloDelta] = useState<number | null>(null);

  const handleSoloScore = (deltaScore: number, isHit: boolean) => {
    setSoloScore((prev) => Math.max(0, prev + deltaScore));
    setSoloStreak((prev) => (isHit ? prev + 1 : 0));
    if (!isHit) {
      setSoloMisses((prev) => prev + 1);
    }
    setLastSoloDelta(deltaScore);
  };

  const filteredComponents =
    categoryFilter === "all"
      ? ELECTRONIC_COMPONENTS
      : ELECTRONIC_COMPONENTS.filter((c) => c.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#060B16] text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-950/85 backdrop-blur px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
                REVISÃO RÁPIDA & TREINO LIVRE
              </span>
              <h1 className="text-lg font-extrabold text-white">
                Guia de Simbologia e Bancada Solo
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 border transition-all ${
                activeTab === "catalog"
                  ? "bg-amber-400 text-slate-950 border-amber-300"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Catálogo de Símbolos (20)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("solo")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold flex items-center gap-1.5 border transition-all ${
                activeTab === "solo"
                  ? "bg-sky-500 text-slate-950 border-sky-400"
                  : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800"
              }`}
            >
              <Gamepad2 className="w-4 h-4" /> Treinar Minigames Solo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 py-6 flex-1">
        {/* ABA 1: GUIA VISUAL DE SÍMBOLOS E CONCEITOS BÁSICOS */}
        {activeTab === "catalog" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between flex-wrap gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div>
                <h2 className="text-xl font-black text-white">
                  Simbologia Essencial de Manutenção Eletrônica
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Revise os símbolos, letras na placa (PCI), unidades de medida
                  e função básica antes de entrar na competição!
                </p>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "all" as const, label: "Todos (20)" },
                  { id: "passivo" as const, label: "Passivos" },
                  { id: "semicondutor" as const, label: "Semicondutores" },
                  {
                    id: "protecao_energia" as const,
                    label: "Proteção & Energia",
                  },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCategoryFilter(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
                      categoryFilter === f.id
                        ? "bg-sky-500/20 border-sky-400 text-sky-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-2xl p-4 flex flex-col justify-between transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        Placa: [{comp.boardLetter}]
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {comp.unit}
                      </span>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 rounded-xl py-3 flex items-center justify-center my-2">
                      <ElectronicSymbolSVG
                        symbolId={comp.id}
                        className="w-32 h-22"
                      />
                    </div>

                    <h3 className="text-base font-extrabold text-white mt-2">
                      {comp.name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase text-sky-400 block">
                      {comp.categoryLabel}
                    </span>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {comp.basicFunction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 2: TREINO INDIVIDUAL DOS 5 MINIGAMES */}
        {activeTab === "solo" && (
          <div className="flex flex-col gap-5">
            {/* Seletor de Minigame + Placar Solo */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                {MINIGAMES_CATALOG.map((mg) => (
                  <button
                    key={mg.id}
                    type="button"
                    onClick={() => setSelectedGame(mg.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                      selectedGame === mg.id
                        ? "bg-sky-500 text-slate-950 border-sky-400"
                        : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600"
                    }`}
                  >
                    {mg.title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold flex items-center gap-1">
                  <Flame className="w-4 h-4" /> Combo {soloStreak}x
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-extrabold">
                  Curtos: {soloMisses}
                </span>
                <span
                  className={`px-3.5 py-1.5 rounded-xl border font-mono font-black text-sm flex items-center gap-1.5 transition-colors ${
                    lastSoloDelta !== null && lastSoloDelta < 0
                      ? "bg-red-950/80 border-red-400 text-red-200"
                      : "bg-slate-950 border-slate-700 text-amber-300"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400" /> {soloScore} pts
                  {lastSoloDelta !== null && (
                    <span
                      className={`text-xs ${
                        lastSoloDelta >= 0 ? "text-emerald-400" : "text-red-400"
                      }`}
                    >
                      ({lastSoloDelta >= 0 ? `+${lastSoloDelta}` : lastSoloDelta})
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSoloScore(0);
                    setSoloStreak(0);
                    setSoloMisses(0);
                    setLastSoloDelta(null);
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Zerar pontuação de treino"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Minigame Selecionado */}
            <div className="py-2">
              {selectedGame === "conveyor" && (
                <ConveyorGame onScoreAction={handleSoloScore} />
              )}
              {selectedGame === "radar" && (
                <CircuitRadarGame onScoreAction={handleSoloScore} />
              )}
              {selectedGame === "resistor" && (
                <ResistorBuilderGame onScoreAction={handleSoloScore} />
              )}
              {selectedGame === "match" && (
                <BenchMatchGame onScoreAction={handleSoloScore} />
              )}
              {selectedGame === "detective" && (
                <SmokeDetectiveGame onScoreAction={handleSoloScore} />
              )}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function PracticePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#060B16] text-white flex items-center justify-center">
          Carregando Bancada de Treino...
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
