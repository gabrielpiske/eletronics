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
import { recordCompletedMatch } from "@/lib/profileService";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievementsData";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  BookOpen,
  Gamepad2,
  Trophy,
  RotateCcw,
  Save,
  Award,
  CheckCircle2,
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
  const [soloMaxStreak, setSoloMaxStreak] = useState<number>(0);
  const [soloHits, setSoloHits] = useState<number>(0);
  const [soloMisses, setSoloMisses] = useState<number>(0);
  const [lastSoloDelta, setLastSoloDelta] = useState<number | null>(null);
  const [savedReport, setSavedReport] = useState<{
    xpEarned: number;
    unlockedIds: string[];
  } | null>(null);

  const handleSoloScore = (deltaScore: number, isHit: boolean) => {
    setSavedReport(null);
    setSoloScore((prev) => Math.max(0, prev + deltaScore));
    if (isHit) {
      setSoloHits((prev) => prev + 1);
      setSoloStreak((prev) => {
        const next = prev + 1;
        setSoloMaxStreak((maxPrev) => Math.max(maxPrev, next));
        return next;
      });
    } else {
      setSoloStreak(0);
      setSoloMisses((prev) => prev + 1);
    }
    setLastSoloDelta(deltaScore);
  };

  const handleSaveSessionToProfile = async () => {
    if (soloHits + soloMisses === 0) return;
    const gameMeta = MINIGAMES_CATALOG.find((g) => g.id === selectedGame);
    const result = await recordCompletedMatch({
      mode: "solo",
      gameId: selectedGame,
      gameTitle: gameMeta ? gameMeta.title : selectedGame,
      score: soloScore,
      hits: soloHits,
      misses: soloMisses,
      maxStreak: soloMaxStreak,
    });

    setSavedReport({
      xpEarned: result.xpEarned,
      unlockedIds: result.newlyUnlockedAchievements,
    });

    setSoloScore(0);
    setSoloStreak(0);
    setSoloMaxStreak(0);
    setSoloHits(0);
    setSoloMisses(0);
    setLastSoloDelta(null);
  };

  const handleSwitchGame = async (newGameId: MinigameId) => {
    if (soloHits >= 2) {
      await handleSaveSessionToProfile();
    } else {
      setSoloScore(0);
      setSoloStreak(0);
      setSoloMaxStreak(0);
      setSoloHits(0);
      setSoloMisses(0);
      setLastSoloDelta(null);
    }
    setSelectedGame(newGameId);
  };

  const filteredComponents =
    categoryFilter === "all"
      ? ELECTRONIC_COMPONENTS
      : ELECTRONIC_COMPONENTS.filter((c) => c.category === categoryFilter);

  return (
    <div className="min-h-screen bg-[#111317] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-5">
        {/* Sub-barra de Alternância Catálogo vs Bancada Solo */}
        <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#94A3B8] block">
              MÓDULO DE ESTUDO E TREINAMENTO INDIVIDUAL
            </span>
            <h2 className="text-base font-bold text-white">
              Catálogo Normalizado (35 Peças + Portas Lógicas) & Bancada Solo
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("catalog")}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                activeTab === "catalog"
                  ? "bg-amber-500 text-zinc-950 border-amber-400 font-bold"
                  : "bg-[#0C0E12] text-zinc-300 border-[#2A303C] hover:text-white"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Catálogo (35)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("solo")}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                activeTab === "solo"
                  ? "bg-[#0047B6] text-white border-[#0057E0] font-bold"
                  : "bg-[#0C0E12] text-zinc-300 border-[#2A303C] hover:text-white"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" /> Treino Solo (+XP)
            </button>
          </div>
        </div>

        {/* ABA 1: CATÁLOGO DE SÍMBOLOS (35 COMPONENTES) */}
        {activeTab === "catalog" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2 bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Simbologia Normalizada (PCI / IEC / ANSI) — {filteredComponents.length} itens
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                {[
                  { id: "all" as const, label: "Todos (35)" },
                  { id: "passivo" as const, label: "Passivos" },
                  { id: "semicondutor" as const, label: "Semicondutores" },
                  {
                    id: "protecao_energia" as const,
                    label: "Proteção & Energia",
                  },
                  {
                    id: "digital_logica" as const,
                    label: "Digital & Portas Lógicas",
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
                    <span className="text-[10px] font-mono uppercase text-[#38BDF8] block mt-0.5">
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

        {/* ABA 2: TREINO INDIVIDUAL COM REGISTRO DE XP E CONQUISTAS */}
        {activeTab === "solo" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-3 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                {MINIGAMES_CATALOG.map((mg) => (
                  <button
                    key={mg.id}
                    type="button"
                    onClick={() => handleSwitchGame(mg.id)}
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
                <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-emerald-400 text-xs font-mono font-bold">
                  Acertos: {soloHits}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-red-400 text-xs font-mono font-bold">
                  Erros: {soloMisses}
                </span>
                <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-amber-400 text-xs font-mono font-bold">
                  Combo {soloStreak}x
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

                {soloHits + soloMisses > 0 && (
                  <button
                    type="button"
                    onClick={handleSaveSessionToProfile}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Registrar pontuação desta sessão no seu Perfil e Ranking Global"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar XP no Perfil</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSoloScore(0);
                    setSoloStreak(0);
                    setSoloMaxStreak(0);
                    setSoloHits(0);
                    setSoloMisses(0);
                    setLastSoloDelta(null);
                  }}
                  className="p-1.5 rounded bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-zinc-300"
                  title="Zerar sessão atual"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {savedReport && (
              <div className="bg-[#12241D] border border-emerald-500/50 border-l-4 border-l-emerald-400 rounded-md px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      SESSÃO REGISTRADA NO PERFIL E RANKING GLOBAL: +
                      {savedReport.xpEarned} XP ACUMULADOS!
                    </span>
                  </div>
                  {savedReport.unlockedIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      <span className="text-xs font-bold text-[#F59E0B] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Nova(s) Conquista(s):
                      </span>
                      {savedReport.unlockedIds.map((id) => {
                        const ach = ACHIEVEMENTS_CATALOG.find(
                          (a) => a.id === id
                        );
                        return (
                          <span
                            key={id}
                            className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#0C0E12] border border-[#F59E0B] text-white"
                          >
                            {ach ? `${ach.title} (+${ach.xpReward} XP)` : id}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/profile"
                    className="px-3 py-1.5 rounded bg-[#0C0E12] hover:bg-[#181B20] border border-[#2A303C] text-xs font-mono font-bold text-white"
                  >
                    Ver Perfil
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="px-3 py-1.5 rounded bg-[#0047B6] hover:bg-[#0057E0] text-xs font-mono font-bold text-white"
                  >
                    Ver Ranking
                  </Link>
                </div>
              </div>
            )}

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
