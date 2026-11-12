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
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | ComponentCategory
  >("all");
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
    <div className="min-h-screen bg-[#111317] text-zinc-100 flex flex-col">
      <header className="border-b border-[#242933] bg-[#16191E] px-4 h-16 sticky top-0 z-30 flex items-center">
        <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-md bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-zinc-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-sm sm:text-base font-bold text-white">
              Catálogo Técnico & Bancada Solo
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                activeTab === "catalog"
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                  : "bg-[#1E2229] text-zinc-300 border-[#2E3540] hover:bg-[#262B34]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Catálogo (20)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("solo")}
              className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                activeTab === "solo"
                  ? "bg-[#0047B6] text-white border-[#0056DB] font-bold"
                  : "bg-[#1E2229] text-zinc-300 border-[#2E3540] hover:bg-[#262B34]"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" /> Treino Solo
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto w-full px-4 py-5 flex-1">
        {/* ABA 1: CATÁLOGO DE SÍMBOLOS */}
        {activeTab === "catalog" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2 bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Simbologia Normalizada (PCI)
              </span>

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
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-colors ${
                      categoryFilter === f.id
                        ? "bg-amber-500/15 border-amber-400 text-amber-300"
                        : "bg-[#0C0E12] border-[#262B35] text-zinc-400 hover:text-white"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {filteredComponents.map((comp) => (
                <div
                  key={comp.id}
                  className="bg-[#181B20] border border-[#2A303C] rounded-lg p-3.5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#0C0E12] text-amber-400 border border-[#2A303C]">
                        [{comp.boardLetter}]
                      </span>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {comp.unit}
                      </span>
                    </div>

                    <div className="bg-[#0C0E12] border border-[#222730] rounded-md py-3 flex items-center justify-center my-1.5">
                      <ElectronicSymbolSVG
                        symbolId={comp.id}
                        className="w-28 h-20"
                      />
                    </div>

                    <h3 className="text-sm font-bold text-white mt-2">
                      {comp.name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                      {comp.categoryLabel}
                    </span>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      {comp.basicFunction}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA 2: TREINO INDIVIDUAL */}
        {activeTab === "solo" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {MINIGAMES_CATALOG.map((mg) => (
                  <button
                    key={mg.id}
                    type="button"
                    onClick={() => setSelectedGame(mg.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                      selectedGame === mg.id
                        ? "bg-[#0047B6] text-white border-[#0056DB]"
                        : "bg-[#0C0E12] text-zinc-400 border-[#262B35] hover:text-zinc-200"
                    }`}
                  >
                    {mg.title}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-amber-400 text-xs font-mono font-bold">
                  Combo {soloStreak}x
                </span>
                <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-red-400 text-xs font-mono font-bold">
                  Falhas: {soloMisses}
                </span>
                <span
                  className={`px-3 py-1 rounded border font-mono font-bold text-xs flex items-center gap-1.5 ${
                    lastSoloDelta !== null && lastSoloDelta < 0
                      ? "bg-red-950/80 border-red-500 text-red-200"
                      : "bg-[#0C0E12] border-[#2A303C] text-amber-400"
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" /> {soloScore}{" "}
                  pts
                  {lastSoloDelta !== null && (
                    <span
                      className={
                        lastSoloDelta >= 0 ? "text-emerald-400" : "text-red-400"
                      }
                    >
                      ({lastSoloDelta >= 0 ? `+${lastSoloDelta}` : lastSoloDelta}
                      )
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
                  className="p-1.5 rounded bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-zinc-300"
                  title="Zerar placar"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div>
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
        <div className="min-h-screen bg-[#111317] text-zinc-400 font-mono text-xs flex items-center justify-center">
          Carregando bancada...
        </div>
      }
    >
      <PracticeContent />
    </Suspense>
  );
}
