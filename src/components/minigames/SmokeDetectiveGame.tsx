"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { ElectronicComponentItem } from "@/data/electronicsData";
import {
  DetectiveCase,
  generateProceduralDetectiveCase,
} from "@/lib/challengeGenerator";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import {
  usePenaltySystem,
  PenaltyBanner,
} from "@/components/minigames/PenaltySystem";
import { Eye, CheckCircle2, Lock, Cpu } from "lucide-react";

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
  const [detectiveCase, setDetectiveCase] = useState<DetectiveCase>(() =>
    generateProceduralDetectiveCase()
  );
  const [clueStage, setClueStage] = useState<1 | 2 | 3>(1);
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [resultFeedback, setResultFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const recentTargetIdsRef = useRef<string[]>([]);

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

  const nextMystery = useCallback(async (preferAi = false) => {
    const baseCase = generateProceduralDetectiveCase(recentTargetIdsRef.current);
    recentTargetIdsRef.current = [
      baseCase.target.id,
      ...recentTargetIdsRef.current,
    ].slice(0, 6);

    setDetectiveCase(baseCase);
    setClueStage(1);
    setResultFeedback(null);

    if (preferAi) {
      setAiLoading(true);
      try {
        const res = await fetch("/api/ai-challenge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "detective",
            recentTargetIds: recentTargetIdsRef.current.slice(1),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.caseData?.target) {
            setDetectiveCase(data.caseData);
          }
        }
      } catch {
        // Keep procedural fallback seamlessly
      } finally {
        setAiLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    nextMystery(false);
  }, [nextMystery]);

  useEffect(() => {
    if (resultFeedback || isLocked || clueStage >= 3) return;
    const timer = setTimeout(() => {
      setClueStage((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : 3));
    }, 4500);
    return () => clearTimeout(timer);
  }, [clueStage, resultFeedback, isLocked]);

  const potentialPoints = clueStage === 1 ? 300 : clueStage === 2 ? 200 : 120;
  const target = detectiveCase.target;

  const handleGuess = (chosen: ElectronicComponentItem) => {
    if (!guardClick() || isLocked || resultFeedback) return;

    if (chosen.id === target.id) {
      const nextSolved = solvedCount + 1;
      setSolvedCount(nextSolved);
      const newLevel = Math.floor(nextSolved / 3) + 1;
      setClueStage(3);
      setResultFeedback({
        ok: true,
        message: `+${potentialPoints} pts • Componente confirmado: ${target.name} [${target.boardLetter}]`,
      });

      registerHit(
        potentialPoints,
        `Identificou ${target.shortName} na ${clueStage}ª pista (+${potentialPoints} pts)`,
        newLevel
      );

      setTimeout(() => {
        nextMystery(nextSolved % 2 === 1);
      }, 950);
    } else {
      setClueStage(3);
      const { delayMs } = triggerErrorPenalty(
        `Selecionou ${chosen.shortName} em vez de ${target.shortName}`,
        `Diagnóstico incorreto: era ${target.name} [${target.boardLetter}]`,
        `${target.categoryLabel}: ${target.basicFunction}`
      );

      setTimeout(() => {
        nextMystery(false);
      }, delayMs);
    }
  };

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-2xl mx-auto flex flex-col gap-3.5 select-none"
    >
      {/* Cabeçalho Técnico */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              LAUDO DE BANCADA • CASO #{solvedCount + 1}
            </span>
            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#0C0E12] border border-[#2A303C] text-[#38BDF8]">
              {aiLoading
                ? "SINCRONIZANDO IA..."
                : detectiveCase.source === "ai"
                ? "MOTOR GEMINI IA"
                : "MOTOR PROCEDURAL V2"}
            </span>
          </div>
          <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
            {detectiveCase.contextHeader}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-amber-400">
            Valor: {potentialPoints} pts
          </span>
          {clueStage < 3 && !resultFeedback && !isLocked && (
            <button
              type="button"
              onClick={() =>
                setClueStage((prev) => (prev < 3 ? ((prev + 1) as 2 | 3) : 3))
              }
              className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#0C0E12] hover:bg-[#14181F] text-zinc-300 border border-[#2A303C] flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400" /> +Pista
            </button>
          )}
          <button
            type="button"
            disabled={isLocked || aiLoading}
            onClick={() => nextMystery(true)}
            title="Solicitar novo caso dinâmico via IA / Motor Procedural"
            className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-[#0047B6]/30 hover:bg-[#0047B6]/50 text-blue-200 border border-[#0057E0]/50 flex items-center gap-1"
          >
            <Cpu className="w-3.5 h-3.5 text-[#F59E0B]" /> Novo Laudo IA
          </button>
        </div>
      </div>

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

      {/* Visor de Inspeção + Pistas */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5 bg-[#181B20] border border-[#2A303C] rounded-lg p-3.5 items-center">
        <div className="sm:col-span-2 flex flex-col items-center justify-center bg-[#0C0E12] border border-[#242933] rounded-md p-4 min-h-[152px]">
          <div
            className={`transition-all duration-700 ${
              clueStage === 1
                ? "blur-[6px] scale-90 opacity-60"
                : clueStage === 2
                ? "blur-[2px] scale-95 opacity-85"
                : "blur-0 scale-100 opacity-100"
            }`}
          >
            <ElectronicSymbolSVG
              symbolId={target.id}
              className="w-32 h-24"
              strokeColor={isLocked ? "#F87171" : "#38BDF8"}
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 mt-2">
            Foco óptico:{" "}
            {clueStage === 1 ? "35%" : clueStage === 2 ? "70%" : "100%"}
          </span>
        </div>

        <div className="sm:col-span-3 flex flex-col gap-2">
          {[0, 1, 2].map((idx) => {
            const unlocked = clueStage >= idx + 1;
            return (
              <div
                key={idx}
                className={`rounded-md px-3 py-2 border text-xs transition-colors ${
                  unlocked
                    ? "bg-[#0C0E12] border-[#2E3540] text-zinc-200"
                    : "bg-[#121519] border-[#222730] text-zinc-600 font-mono"
                }`}
              >
                <span className="font-mono font-bold text-amber-400 mr-1.5">
                  #{idx + 1}:
                </span>
                {unlocked
                  ? detectiveCase.clues[idx]
                  : "Aguardando leitura de telemetria..."}
              </div>
            );
          })}
        </div>
      </div>

      {resultFeedback && !isLocked && (
        <div className="rounded-md px-3.5 py-2.5 border-l-4 border-l-emerald-400 bg-[#121F1A] border border-emerald-500/30 text-emerald-200 font-mono font-bold text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{resultFeedback.message}</span>
        </div>
      )}

      {/* Candidatos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {detectiveCase.candidates.map((cand) => (
          <button
            key={cand.id}
            type="button"
            aria-disabled={isLocked}
            onClick={() => handleGuess(cand)}
            className={`rounded-md p-3 text-left transition-colors flex flex-col justify-between border ${
              isLocked
                ? "bg-[#121519] border-[#222730] opacity-40 cursor-not-allowed"
                : "bg-[#181B20] hover:bg-[#1E2229] border-[#2A303C] hover:border-amber-400"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-[#0C0E12] text-amber-400 border border-[#2A303C]">
                [{cand.boardLetter}]
              </span>
              {isLocked ? (
                <Lock className="w-3.5 h-3.5 text-red-400/80" />
              ) : (
                <span className="text-[10px] font-mono text-zinc-500">
                  {cand.unit}
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-white mt-2">
              {cand.shortName}
            </p>
            <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
              {cand.categoryLabel}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
};
