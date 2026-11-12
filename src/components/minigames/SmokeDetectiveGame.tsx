"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ELECTRONIC_COMPONENTS,
  ElectronicComponentItem,
} from "@/data/electronicsData";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import {
  usePenaltySystem,
  PenaltyBanner,
} from "@/components/minigames/PenaltySystem";
import { Eye, Sparkles, Search, CheckCircle2, Lock } from "lucide-react";

interface SmokeDetectiveGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

export const SmokeDetectiveGame: React.FC<SmokeDetectiveGameProps> = ({
  onScoreAction,
}) => {
  const [target, setTarget] = useState<ElectronicComponentItem>(
    () => ELECTRONIC_COMPONENTS[0]
  );
  const [candidates, setCandidates] = useState<ElectronicComponentItem[]>([]);
  const [clueStage, setClueStage] = useState<1 | 2 | 3>(1);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [resultFeedback, setResultFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const {
    isLocked,
    lockRemainingMs,
    totalLockMs,
    lockReason,
    consecutiveErrors,
    lastPenaltyPts,
    lastBadge,
    lastErrorTitle,
    lastErrorDetail,
    handleContainerPointerDown,
    guardClick,
    registerHit,
    triggerErrorPenalty,
  } = usePenaltySystem(onScoreAction, () => {
    setResultFeedback(null);
  });

  const nextMystery = useCallback(() => {
    const pickedTarget =
      ELECTRONIC_COMPONENTS[
        Math.floor(Math.random() * ELECTRONIC_COMPONENTS.length)
      ];
    const distractors = ELECTRONIC_COMPONENTS.filter(
      (c) => c.id !== pickedTarget.id
    )
      .sort(() => Math.random() - 0.5)
      .slice(0, 5);

    setTarget(pickedTarget);
    setCandidates(
      [pickedTarget, ...distractors].sort(() => Math.random() - 0.5)
    );
    setClueStage(1);
    setResultFeedback(null);
  }, []);

  useEffect(() => {
    nextMystery();
  }, [nextMystery]);

  // Revela pistas automaticamente a cada 4,5 segundos se o aluno ainda não respondeu e não estiver bloqueado
  useEffect(() => {
    if (resultFeedback || isLocked || clueStage >= 3) return;
    const timer = setTimeout(() => {
      setClueStage((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : 3));
    }, 4500);
    return () => clearTimeout(timer);
  }, [clueStage, resultFeedback, isLocked]);

  const potentialPoints = clueStage === 1 ? 300 : clueStage === 2 ? 200 : 120;

  const handleGuess = (chosen: ElectronicComponentItem) => {
    if (!guardClick() || isLocked || resultFeedback) return;

    if (chosen.id === target.id) {
      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);
      const newLevel = Math.floor(nextSolved / 3) + 1;
      setClueStage(3);
      setResultFeedback({
        ok: true,
        message: `🎯 Na mosca (+${potentialPoints} pts)! Era ${target.name} [${target.boardLetter}]!`,
      });

      registerHit(
        potentialPoints,
        `Descobriu ${target.shortName} na ${clueStage}ª pista (+${potentialPoints} pts)!`,
        newLevel
      );

      setTimeout(() => {
        nextMystery();
      }, 950);
    } else {
      setClueStage(3);
      const { delayMs } = triggerErrorPenalty(
        `Confundiu ${target.shortName} com ${chosen.shortName}`,
        `❌ Ops! Você escolheu ${chosen.shortName}, mas o mistério era ${target.name} [${target.boardLetter}]!`,
        `${target.categoryLabel}: ${target.basicFunction}`
      );

      setTimeout(() => {
        nextMystery();
      }, delayMs);
    }
  };

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-2xl mx-auto flex flex-col gap-4 select-none"
    >
      {/* Cabeçalho Detetive */}
      <div className="bg-gradient-to-r from-pink-950 via-slate-900 to-rose-950 border-2 border-pink-500/70 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/50 flex items-center justify-center">
            <Search className="w-5 h-5 text-pink-300" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-pink-300 block">
              CASO DE BANCADA #{solvedCount + 1}
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Que componente está saindo da fumaça?
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            Valendo {potentialPoints} pts
          </span>
          {clueStage < 3 && !resultFeedback && !isLocked && (
            <button
              type="button"
              onClick={() =>
                setClueStage((prev) => (prev < 3 ? ((prev + 1) as 2 | 3) : 3))
              }
              className="text-xs font-bold px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-pink-300 border border-pink-400/40 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" /> +Pista
            </button>
          )}
        </div>
      </div>

      {/* Banner de Penalidade / Bloqueio Anti-Autoclique */}
      <PenaltyBanner
        isLocked={isLocked}
        lockRemainingMs={lockRemainingMs}
        totalLockMs={totalLockMs}
        lockReason={lockReason}
        consecutiveErrors={consecutiveErrors}
        lastPenaltyPts={lastPenaltyPts}
        lastBadge={lastBadge}
        lastErrorTitle={lastErrorTitle}
        lastErrorDetail={lastErrorDetail}
      />

      {/* Cápsula de Fumaça + Pistas Progressivas */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-4 shadow-2xl items-center">
        {/* Visor do Símbolo com Desfoque Progressivo */}
        <div className="sm:col-span-2 flex flex-col items-center justify-center bg-slate-950 border border-slate-800 rounded-2xl p-4 min-h-[160px] relative overflow-hidden">
          <div
            className={`transition-all duration-700 ${
              clueStage === 1
                ? "blur-[6px] scale-90 opacity-65"
                : clueStage === 2
                ? "blur-[2px] scale-95 opacity-85"
                : "blur-0 scale-100 opacity-100"
            }`}
          >
            <ElectronicSymbolSVG
              symbolId={target.id}
              className="w-36 h-28"
              strokeColor={isLocked ? "#F87171" : "#38BDF8"}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-400 mt-2">
            Nitidez:{" "}
            {clueStage === 1 ? "35%" : clueStage === 2 ? "70%" : "100%"}
          </span>
        </div>

        {/* Lista das 3 Pistas */}
        <div className="sm:col-span-3 flex flex-col gap-2">
          {[0, 1, 2].map((idx) => {
            const unlocked = clueStage >= idx + 1;
            return (
              <div
                key={idx}
                className={`rounded-xl px-3.5 py-2.5 border text-xs sm:text-sm transition-all ${
                  unlocked
                    ? "bg-slate-800/90 border-pink-500/40 text-slate-100"
                    : "bg-slate-950/50 border-slate-800 text-slate-500 italic"
                }`}
              >
                <span className="font-mono font-bold text-pink-400 mr-1.5">
                  Pista {idx + 1}:
                </span>
                {unlocked
                  ? target.clues[idx]
                  : "Revelando automaticamente em instantes..."}
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback de Acerto */}
      {resultFeedback && !isLocked && (
        <div className="rounded-2xl px-4 py-3 border text-center font-bold text-sm flex items-center justify-center gap-2 bg-emerald-950/90 border-emerald-400 text-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{resultFeedback.message}</span>
        </div>
      )}

      {/* Prateleira de Peças Candidatas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {candidates.map((cand) => (
          <button
            key={cand.id}
            type="button"
            aria-disabled={isLocked}
            onClick={() => handleGuess(cand)}
            className={`rounded-2xl p-3 text-left transition-all flex flex-col justify-between border-2 ${
              isLocked
                ? "bg-slate-950/80 border-red-900/40 opacity-45 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-pink-400 active:scale-95"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-400/30">
                [{cand.boardLetter}]
              </span>
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-red-400/80" />
              ) : (
                <span className="text-[11px] font-mono text-slate-400">
                  {cand.unit}
                </span>
              )}
            </div>
            <p className="text-sm sm:text-base font-extrabold text-white mt-2">
              {cand.shortName}
            </p>
            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
              {cand.categoryLabel}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
