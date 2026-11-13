"use client";

import React, { useState, useRef, Suspense } from "react";
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

const QUESTIONS_PER_SOLO_ROUND = 5;

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
  const [savingXp, setSavingXp] = useState<boolean>(false);
  const [savedReport, setSavedReport] = useState<{
    xpEarned: number;
    newTotalXp?: number;
    unlockedIds: string[];
  } | null>(null);

  // Refs para ter os valores exatos no auto-save ao fim de cada jogatina
  const statsRef = useRef({
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
  });

  const commitCurrentRoundToDatabase = async (
    snapScore: number,
    snapHits: number,
    snapMisses: number,
    snapMaxStreak: number,
    gameId: MinigameId
  ) => {
    if (snapHits + snapMisses === 0) return;

    // Reseta os contadores da rodada atual imediatamente para a próxima jogatina
    statsRef.current = {
      score: 0,
      streak: 0,
      maxStreak: 0,
      hits: 0,
      misses: 0,
    };
    setSoloScore(0);
    setSoloStreak(0);
    setSoloMaxStreak(0);
    setSoloHits(0);
    setSoloMisses(0);
    setLastSoloDelta(null);

    setSavingXp(true);
    try {
      const gameMeta = MINIGAMES_CATALOG.find((g) => g.id === gameId);
      const result = await recordCompletedMatch({
        mode: "solo",
        gameId,
        gameTitle: gameMeta ? gameMeta.title : gameId,
        score: snapScore,
        hits: snapHits,
        misses: snapMisses,
        maxStreak: snapMaxStreak,
      });

      if (result.xpEarned > 0) {
        setSavedReport({
          xpEarned: result.xpEarned,
          newTotalXp: result.profile?.totalXp,
          unlockedIds: result.newlyUnlockedAchievements,
        });
      }
    } finally {
      setSavingXp(false);
    }
  };

  const handleSoloScore = (deltaScore: number, isHit: boolean) => {
    const nextScore = Math.max(0, statsRef.current.score + deltaScore);
    const nextHits = isHit ? statsRef.current.hits + 1 : statsRef.current.hits;
    const nextMisses = !isHit
      ? statsRef.current.misses + 1
      : statsRef.current.misses;
    const nextStreak = isHit ? statsRef.current.streak + 1 : 0;
    const nextMaxStreak = Math.max(statsRef.current.maxStreak, nextStreak);

    statsRef.current = {
      score: nextScore,
      streak: nextStreak,
      maxStreak: nextMaxStreak,
      hits: nextHits,
      misses: nextMisses,
    };

    setSoloScore(nextScore);
    setSoloHits(nextHits);
    setSoloMisses(nextMisses);
    setSoloStreak(nextStreak);
    setSoloMaxStreak(nextMaxStreak);
    setLastSoloDelta(deltaScore);

    // Ao completar uma jogatina (6 pares no Jogo da Bancada ou 5 desafios nos demais),
    // salva automaticamente o XP no banco de dados e atualiza o perfil do usuário!
    const targetActions =
      selectedGame === "match" ? 6 : QUESTIONS_PER_SOLO_ROUND;

    if (nextHits + nextMisses >= targetActions) {
      setTimeout(() => {
        commitCurrentRoundToDatabase(
          nextScore,
          nextHits,
          nextMisses,
          nextMaxStreak,
          selectedGame
        );
      }, 600);
    }
  };

  const handleSaveSessionToProfile = async () => {
    const { score, hits, misses, maxStreak } = statsRef.current;
    if (hits + misses === 0) return;
    await commitCurrentRoundToDatabase(
      score,
      hits,
      misses,
      maxStreak,
      selectedGame
    );
  };

  const handleSwitchGame = async (newGameId: MinigameId) => {
    const { score, hits, misses, maxStreak } = statsRef.current;
    if (hits + misses > 0) {
      await commitCurrentRoundToDatabase(
        score,
        hits,
        misses,
        maxStreak,
        selectedGame
      );
    }
    setSelectedGame(newGameId);
  };

  const handleSwitchTab = async (newTab: "catalog" | "solo") => {
    const { score, hits, misses, maxStreak } = statsRef.current;
    if (activeTab === "solo" && newTab === "catalog" && hits + misses > 0) {
      await commitCurrentRoundToDatabase(
        score,
        hits,
        misses,
        maxStreak,
        selectedGame
      );
    }
    setActiveTab(newTab);
  };

  const filteredComponents =
    categoryFilter === "all"
      ? ELECTRONIC_COMPONENTS
      : ELECTRONIC_COMPONENTS.filter((c) => c.category === categoryFilter);

  const targetActions =
    selectedGame === "match" ? 6 : QUESTIONS_PER_SOLO_ROUND;
  const currentActions = soloHits + soloMisses;

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
              onClick={() => handleSwitchTab("catalog")}
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
              onClick={() => handleSwitchTab("solo")}
              className={`px-3.5 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                activeTab === "solo"
                  ? "bg-[#0047B6] text-white border-[#0057E0] font-bold"
                  : "bg-[#0C0E12] text-zinc-300 border-[#2A303C] hover:text-white"
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" /> Treino Solo (+XP Automático)
            </button>
          </div>
        </div>

        {/* ABA 1: CATÁLOGO DE SÍMBOLOS (35 COMPONENTES) */}
        {activeTab === "catalog" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-2 bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3">
              <span className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold">
                Simbologia Normalizada (PCI / IEC / ANSI) —{" "}
                {filteredComponents.length} itens
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

        {/* ABA 2: TREINO INDIVIDUAL COM ATUALIZAÇÃO AUTOMÁTICA DE XP A CADA JOGATINA */}
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
                <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-[#0057E0]/60 text-blue-300 text-xs font-mono font-bold">
                  Jogatina: {currentActions}/{targetActions}
                </span>
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

                {currentActions > 0 && (
                  <button
                    type="button"
                    disabled={savingXp}
                    onClick={handleSaveSessionToProfile}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    title="Encerrar jogatina atual e salvar XP imediatamente"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>
                      {savingXp ? "Salvando..." : "Finalizar & Salvar XP"}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    statsRef.current = {
                      score: 0,
                      streak: 0,
                      maxStreak: 0,
                      hits: 0,
                      misses: 0,
                    };
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
                      FIM DA JOGATINA: +{savedReport.xpEarned} XP SALVOS NO
                      BANCO DE DADOS E NO PERFIL
                      {savedReport.newTotalXp
                        ? ` (TOTAL: ${savedReport.newTotalXp.toLocaleString("pt-BR")} XP)`
                        : "!"}
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
