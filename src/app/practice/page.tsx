"use client";

import React, { useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ELECTRONIC_COMPONENTS,
  MINIGAMES_CATALOG,
  MinigameId,
  ComponentCategory,
  ElectronicComponentItem,
} from "@/data/electronicsData";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import {
  WorkbenchCalculatorPanel,
  ComponentDatasheetModal,
} from "@/components/CatalogToolsModal";
import { ConveyorGame } from "@/components/minigames/ConveyorGame";
import { CircuitRadarGame } from "@/components/minigames/CircuitRadarGame";
import { ResistorBuilderGame } from "@/components/minigames/ResistorBuilderGame";
import { BenchMatchGame } from "@/components/minigames/BenchMatchGame";
import { SmokeDetectiveGame } from "@/components/minigames/SmokeDetectiveGame";
import { IndustrialRepairGame } from "@/components/minigames/IndustrialRepairGame";
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
  Search,
  X,
  Eye,
} from "lucide-react";

const QUESTIONS_PER_SOLO_ROUND = 5;

type SoloRegime = "quick" | "standard" | "extended" | "marathon";

function getSoloTargetActions(
  gameId: MinigameId,
  regime: SoloRegime
): number {
  if (regime === "marathon") return Number.POSITIVE_INFINITY;
  if (regime === "standard") {
    if (gameId === "match") return 18; // 3 placas completas
    if (gameId === "industrial_repair") return 12; // 4 OS completas
    return 15;
  }
  if (regime === "extended") {
    if (gameId === "match") return 30; // 5 placas completas
    if (gameId === "industrial_repair") return 24; // 8 OS completas
    return 30;
  }
  if (gameId === "match") return 6;
  if (gameId === "industrial_repair") return 3;
  return QUESTIONS_PER_SOLO_ROUND;
}

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
  const [soloRegime, setSoloRegime] = useState<SoloRegime>("standard");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | ComponentCategory
  >("all");
  const [catalogSearch, setCatalogSearch] = useState<string>("");
  const [selectedCatalogComponent, setSelectedCatalogComponent] =
    useState<ElectronicComponentItem | null>(null);
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

    // Preserva o combo ativo se a rodada foi concluída com 0 erros!
    const carryStreak = snapMisses === 0 ? statsRef.current.streak : 0;

    // Reseta os contadores da rodada atual imediatamente para a próxima jogatina
    statsRef.current = {
      score: 0,
      streak: carryStreak,
      maxStreak: carryStreak,
      hits: 0,
      misses: 0,
    };
    setSoloScore(0);
    setSoloStreak(carryStreak);
    setSoloMaxStreak(carryStreak);
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

    const targetActions = getSoloTargetActions(selectedGame, soloRegime);

    if (
      Number.isFinite(targetActions) &&
      nextHits + nextMisses >= targetActions
    ) {
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

  const filteredComponents = ELECTRONIC_COMPONENTS.filter((c) => {
    if (categoryFilter !== "all" && c.category !== categoryFilter) {
      return false;
    }
    const q = catalogSearch.trim().toLowerCase();
    if (q) {
      return (
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        c.boardLetter.toLowerCase().includes(q) ||
        c.basicFunction.toLowerCase().includes(q) ||
        c.unit.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const targetActions = getSoloTargetActions(selectedGame, soloRegime);
  const currentActions = soloHits + soloMisses;

  return (
    <div className="min-h-screen bg-[#111317] text-zinc-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 space-y-5">
        {/* Sub-barra de Alternância Catálogo vs Bancada Solo */}
        <div className="bg-[#181B20] border border-[#2A303C] rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-amber-400 font-bold block">
              MÓDULO DE ESTUDO E TREINAMENTO INDIVIDUAL
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              Catálogo Interativo (35 Peças) &amp; Bancada Solo
            </h2>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => handleSwitchTab("catalog")}
              className={`px-4 py-2.5 rounded-lg text-sm font-extrabold flex items-center gap-2 border transition-colors ${
                activeTab === "catalog"
                  ? "bg-amber-500 text-zinc-950 border-amber-400 shadow"
                  : "bg-[#0C0E12] text-zinc-200 border-[#2A303C] hover:text-white hover:border-zinc-500"
              }`}
            >
              <BookOpen className="w-4 h-4" /> Catálogo (35)
            </button>
            <button
              type="button"
              onClick={() => handleSwitchTab("solo")}
              className={`px-4 py-2.5 rounded-lg text-sm font-extrabold flex items-center gap-2 border transition-colors ${
                activeTab === "solo"
                  ? "bg-[#0047B6] text-white border-[#0057E0] shadow"
                  : "bg-[#0C0E12] text-zinc-200 border-[#2A303C] hover:text-white hover:border-zinc-500"
              }`}
            >
              <Gamepad2 className="w-4 h-4" /> Treino Solo (+XP Automático)
            </button>
          </div>
        </div>

        {/* ABA 1: CATÁLOGO DE SÍMBOLOS (35 COMPONENTES) */}
        {activeTab === "catalog" && (
          <div className="flex flex-col gap-4">
            <WorkbenchCalculatorPanel />

            <div className="flex items-center justify-between flex-wrap gap-3 bg-[#181B20] border border-[#2A303C] rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-2 flex-wrap">
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
                    className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-mono font-bold border transition-colors ${
                      categoryFilter === f.id
                        ? "bg-amber-500/20 border-2 border-amber-400 text-amber-300 shadow-sm"
                        : "bg-[#0C0E12] border-[#262B35] text-zinc-300 hover:text-white hover:border-zinc-500"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar peça ou letra (R, Q, U)..."
                  className="w-full pl-10 pr-8 py-2 rounded-lg bg-[#0C0E12] border border-[#2A303C] focus:border-amber-400 focus:outline-none text-sm font-semibold text-white"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch("")}
                    aria-label="Limpar busca"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredComponents.map((comp) => (
                <button
                  key={comp.id}
                  type="button"
                  onClick={() => setSelectedCatalogComponent(comp)}
                  className="bg-[#181B20] hover:bg-[#1E232B] border-2 border-[#2A303C] hover:border-amber-400 rounded-xl p-4 flex flex-col justify-between text-left transition-all group shadow-md"
                >
                  <div className="w-full">
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="text-base font-mono font-black px-3 py-1 rounded-md bg-[#0C0E12] text-amber-400 border border-amber-500/40 shadow-sm">
                        [{comp.boardLetter}]
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-bold px-2.5 py-1 rounded-md bg-[#0C0E12] border border-[#242933] text-emerald-400">
                        {comp.unit}
                      </span>
                    </div>

                    <div className="lcd-readout rounded-lg py-4 flex items-center justify-center my-2 group-hover:border-amber-400/50 transition-colors">
                      <ElectronicSymbolSVG
                        symbolId={comp.id}
                        className="w-36 h-24"
                      />
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold uppercase px-2 py-0.5 rounded bg-[#0047B6]/25 border border-[#0057E0]/40 text-sky-300">
                        {comp.categoryLabel}
                      </span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-white mt-1.5 group-hover:text-amber-300 transition-colors leading-snug">
                      {comp.name}
                    </h3>
                    <p className="text-sm text-zinc-300 mt-1.5 leading-snug line-clamp-2">
                      {comp.basicFunction}
                    </p>
                  </div>

                  <div className="w-full mt-4 pt-3 border-t border-[#262C36] flex items-center justify-between text-xs sm:text-sm font-mono font-bold text-amber-400 group-hover:text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-4 h-4" /> Abrir Visor &amp; Multímetro
                    </span>
                    <span className="text-base">→</span>
                  </div>
                </button>
              ))}
            </div>

            <ComponentDatasheetModal
              component={selectedCatalogComponent}
              onClose={() => setSelectedCatalogComponent(null)}
              onStartSoloPractice={() => {
                setSelectedCatalogComponent(null);
                handleSwitchTab("solo");
              }}
            />
          </div>
        )}

        {/* ABA 2: TREINO INDIVIDUAL COM ATUALIZAÇÃO AUTOMÁTICA DE XP A CADA JOGATINA */}
        {activeTab === "solo" && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#181B20] border border-[#2A303C] rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 shadow-md">
              <div className="flex items-center gap-2 flex-wrap">
                {MINIGAMES_CATALOG.map((mg) => {
                  const isIndustrial = mg.track === "industrial";
                  return (
                    <button
                      key={mg.id}
                      type="button"
                      onClick={() => handleSwitchGame(mg.id)}
                      className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold border transition-colors flex items-center gap-2 ${
                        selectedGame === mg.id
                          ? isIndustrial
                            ? "bg-amber-500 text-zinc-950 border-amber-400 font-black shadow"
                            : "bg-[#0047B6] text-white border-[#0056DB] font-extrabold shadow"
                          : isIndustrial
                          ? "bg-[#0C0E12] text-amber-300 border-amber-500/40 hover:border-amber-400"
                          : "bg-[#0C0E12] text-zinc-300 border-[#262B35] hover:text-white"
                      }`}
                    >
                      {isIndustrial && (
                        <span
                          className={`font-mono text-[11px] font-black uppercase px-1.5 py-0.5 rounded ${
                            selectedGame === mg.id
                              ? "bg-zinc-950/20 text-zinc-950"
                              : "bg-amber-500/15 text-amber-400"
                          }`}
                        >
                          OS
                        </span>
                      )}
                      <span>{mg.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-[#0C0E12] border border-[#2A303C] rounded-lg p-1">
                  <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-bold px-2">
                    Turno:
                  </span>
                  {(
                    [
                      { id: "quick" as const, label: "Rápido" },
                      { id: "standard" as const, label: "15 Ações" },
                      { id: "extended" as const, label: "30 Ações" },
                      { id: "marathon" as const, label: "Maratona ∞" },
                    ] as const
                  ).map((rg) => (
                    <button
                      key={rg.id}
                      type="button"
                      onClick={() => setSoloRegime(rg.id)}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-colors ${
                        soloRegime === rg.id
                          ? "bg-[#0047B6] text-white"
                          : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      {rg.label}
                    </button>
                  ))}
                </div>

                <span className="px-3 py-1.5 rounded-lg bg-[#0C0E12] border border-[#0057E0]/60 text-blue-300 text-xs sm:text-sm font-mono font-extrabold">
                  Jogatina:{" "}
                  {Number.isFinite(targetActions)
                    ? `${currentActions}/${targetActions}`
                    : `${currentActions} (Livre)`}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#0C0E12] border border-[#2A303C] text-emerald-400 text-xs sm:text-sm font-mono font-extrabold">
                  OK: {soloHits}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#0C0E12] border border-[#2A303C] text-red-400 text-xs sm:text-sm font-mono font-extrabold">
                  Erros: {soloMisses}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#0C0E12] border border-[#2A303C] text-amber-400 text-xs sm:text-sm font-mono font-extrabold">
                  Combo {soloStreak}x
                </span>
                <span
                  className={`px-3.5 py-1.5 rounded-lg border font-mono font-black text-sm sm:text-base flex items-center gap-1.5 ${
                    lastSoloDelta !== null && lastSoloDelta < 0
                      ? "bg-red-950/80 border-red-500 text-red-200"
                      : "bg-[#0C0E12] border-amber-500/40 text-amber-400"
                  }`}
                >
                  <Trophy className="w-4 h-4 text-amber-400" /> {soloScore} pts
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
                    className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 transition-colors shadow"
                    title="Encerrar jogatina atual e salvar XP imediatamente"
                  >
                    <Save className="w-4 h-4" />
                    <span>
                      {savingXp ? "Salvando..." : "Salvar XP"}
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
                  className="p-2 rounded-lg bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-zinc-200"
                  title="Zerar sessão atual"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {savedReport && (
              <div className="bg-[#12241D] border border-emerald-500/50 border-l-4 border-l-emerald-400 rounded-lg px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-emerald-300 font-mono text-sm font-extrabold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>
                      FIM DA JOGATINA: +{savedReport.xpEarned} XP SALVOS NO PERFIL
                      {savedReport.newTotalXp
                        ? ` (TOTAL: ${savedReport.newTotalXp.toLocaleString("pt-BR")} XP)`
                        : "!"}
                    </span>
                  </div>
                  {savedReport.unlockedIds.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-xs sm:text-sm font-extrabold text-[#F59E0B] flex items-center gap-1">
                        <Award className="w-4 h-4" /> Nova(s) Conquista(s):
                      </span>
                      {savedReport.unlockedIds.map((id) => {
                        const ach = ACHIEVEMENTS_CATALOG.find(
                          (a) => a.id === id
                        );
                        return (
                          <span
                            key={id}
                            className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0C0E12] border border-[#F59E0B] text-white"
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
                    className="px-3.5 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#181B20] border border-[#2A303C] text-xs sm:text-sm font-mono font-bold text-white"
                  >
                    Ver Perfil
                  </Link>
                  <Link
                    href="/leaderboard"
                    className="px-3.5 py-2 rounded-lg bg-[#0047B6] hover:bg-[#0057E0] text-xs sm:text-sm font-mono font-bold text-white"
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
              {selectedGame === "industrial_repair" && (
                <IndustrialRepairGame onScoreAction={handleSoloScore} />
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
