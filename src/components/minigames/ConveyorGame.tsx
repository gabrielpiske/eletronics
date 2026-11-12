"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ELECTRONIC_COMPONENTS,
  ElectronicComponentItem,
} from "@/data/electronicsData";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import {
  usePenaltySystem,
  PenaltyBanner,
} from "@/components/minigames/PenaltySystem";
import { AlertTriangle, Lock } from "lucide-react";

interface ConveyorGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

interface BinOption {
  id: string;
  title: string;
  subtitle: string;
  accentBorder: string;
}

export const ConveyorGame: React.FC<ConveyorGameProps> = ({ onScoreAction }) => {
  const [currentComp, setCurrentComp] = useState<ElectronicComponentItem>(
    () => ELECTRONIC_COMPONENTS[0]
  );
  const [mode, setMode] = useState<"category" | "direct">("category");
  const [bins, setBins] = useState<BinOption[]>([]);
  const [beltProgress, setBeltProgress] = useState<number>(8);
  const [streak, setStreak] = useState<number>(0);
  const [sortedCount, setSortedCount] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
    detail: string;
  } | null>(null);

  const lockRef = useRef(false);

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
    setStreak(0);
    setFeedback(null);
  });

  const spawnNextItem = useCallback((nextCount: number) => {
    lockRef.current = false;
    const randomComp =
      ELECTRONIC_COMPONENTS[
        Math.floor(Math.random() * ELECTRONIC_COMPONENTS.length)
      ];
    setCurrentComp(randomComp);
    setBeltProgress(6);

    const nextMode = nextCount % 2 === 0 ? "direct" : "category";
    setMode(nextMode);

    if (nextMode === "category") {
      setBins([
        {
          id: "passivo",
          title: "PASSIVOS",
          subtitle: "R, C, L, LDR, Termistor",
          accentBorder: "border-l-[#0052CC]",
        },
        {
          id: "semicondutor",
          title: "SEMICONDUTORES",
          subtitle: "Diodo, LED, Zener, Transistor, CI",
          accentBorder: "border-l-amber-400",
        },
        {
          id: "protecao_energia",
          title: "PROTEÇÃO & ENERGIA",
          subtitle: "Fusível, Chave, Terra, Trafo, Fonte",
          accentBorder: "border-l-emerald-500",
        },
      ]);
    } else {
      const others = ELECTRONIC_COMPONENTS.filter(
        (c) => c.id !== randomComp.id
      ).sort(() => Math.random() - 0.5);
      const choices = [randomComp, others[0], others[1]].sort(
        () => Math.random() - 0.5
      );
      const borders = [
        "border-l-[#0052CC]",
        "border-l-amber-400",
        "border-l-emerald-500",
      ];
      setBins(
        choices.map((c, idx) => ({
          id: c.id,
          title: c.shortName,
          subtitle: `Designador: [${c.boardLetter}]`,
          accentBorder: borders[idx],
        }))
      );
    }
  }, []);

  useEffect(() => {
    spawnNextItem(0);
  }, [spawnNextItem]);

  useEffect(() => {
    const speedStep = Math.min(2.6, 1.15 + Math.floor(streak / 3) * 0.25);
    const timer = setInterval(() => {
      if (lockRef.current || isLocked) return;
      setBeltProgress((prev) => {
        if (prev >= 96) {
          lockRef.current = true;
          setStreak(0);
          setFeedback(null);
          const nextCount = sortedCount + 1;
          setSortedCount(nextCount);
          const { delayMs } = triggerErrorPenalty(
            `Deixou ${currentComp.shortName} cair da esteira`,
            `Fim de curso atingido — Era ${currentComp.name} [${currentComp.boardLetter}]`,
            `${currentComp.categoryLabel}: ${currentComp.basicFunction}`
          );
          setTimeout(() => {
            spawnNextItem(nextCount);
          }, delayMs);
          return 98;
        }
        return prev + speedStep;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [
    streak,
    currentComp,
    sortedCount,
    isLocked,
    triggerErrorPenalty,
    spawnNextItem,
  ]);

  const handleSelectBin = (binId: string) => {
    if (!guardClick() || isLocked || lockRef.current) return;
    lockRef.current = true;

    const isCorrect =
      mode === "category"
        ? binId === currentComp.category
        : binId === currentComp.id;

    const nextCount = sortedCount + 1;
    setSortedCount(nextCount);
    const newLevel = Math.floor(nextCount / 5) + 1;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const multiplier = Math.min(4, 1 + Math.floor(newStreak / 3));
      const speedBonus = Math.round((100 - beltProgress) * 1.2);
      const points = (120 + speedBonus) * multiplier;

      setFeedback({
        ok: true,
        text: `+${points} pts (${multiplier}x) • ${currentComp.name} [${currentComp.boardLetter}]`,
        detail: currentComp.basicFunction,
      });

      registerHit(
        points,
        `Classificou ${currentComp.shortName} (${multiplier}x)`,
        newLevel
      );

      setTimeout(() => {
        setFeedback(null);
        spawnNextItem(nextCount);
      }, 750);
    } else {
      setStreak(0);
      setFeedback(null);

      const { delayMs } = triggerErrorPenalty(
        `Falha ao classificar ${currentComp.shortName}`,
        `Classificação incorreta — Era ${currentComp.name} [${currentComp.boardLetter}]`,
        `${currentComp.categoryLabel}: ${currentComp.basicFunction}`,
        newLevel
      );

      setTimeout(() => {
        spawnNextItem(nextCount);
      }, delayMs);
    }
  };

  const multiplier = Math.min(4, 1 + Math.floor(streak / 3));

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-2xl mx-auto flex flex-col gap-3.5 select-none"
    >
      {/* Barra Técnica Superior */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            TRIAGEM DE COMPONENTES • PEÇA #{sortedCount + 1}
          </span>
          <h3 className="text-sm sm:text-base font-bold text-white">
            {mode === "direct"
              ? "Selecione o nome e designador do símbolo"
              : "Selecione a família tecnológica do componente"}
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-amber-400 font-bold">
            {multiplier}x • Combo {streak}
          </span>
        </div>
      </div>

      {/* Visor da Esteira Industrial */}
      <div className="relative bg-[#0C0E12] border border-[#2A303C] rounded-lg p-5 overflow-hidden min-h-[200px] flex flex-col justify-between">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-red-950/30 border-l border-red-500/30 flex items-center justify-center pointer-events-none">
          <AlertTriangle className="w-4 h-4 text-red-400" />
        </div>

        <div className="relative w-full h-32 flex items-center">
          <div
            style={{
              left: `${Math.min(72, Math.max(2, beltProgress * 0.72))}%`,
              transition: "left 95ms linear",
            }}
            className={`absolute bg-[#181B20] border rounded-md px-4 py-2.5 flex flex-col items-center justify-center ${
              isLocked ? "border-red-500 opacity-75" : "border-[#384152]"
            }`}
          >
            <ElectronicSymbolSVG
              symbolId={currentComp.id}
              className="w-24 h-16"
              strokeColor={isLocked ? "#F87171" : "#38BDF8"}
            />
            <span className="text-[10px] font-mono uppercase text-zinc-400 mt-1">
              Unidade: {currentComp.unit}
            </span>
          </div>
        </div>

        {/* Trilho Técnico */}
        <div className="w-full h-3 bg-[#181B20] border border-[#2A303C] rounded-sm flex items-center justify-around px-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
          ))}
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

      {feedback && !isLocked && (
        <div className="rounded-md px-3.5 py-2.5 border-l-4 border-l-emerald-400 bg-[#121F1A] border border-emerald-500/30 text-emerald-200">
          <p className="font-mono font-bold text-xs sm:text-sm">
            {feedback.text}
          </p>
          <p className="text-xs text-zinc-300 mt-0.5">{feedback.detail}</p>
        </div>
      )}

      {/* 3 Coletores Industriais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {bins.map((bin, idx) => (
          <button
            key={bin.id}
            type="button"
            aria-disabled={isLocked}
            onClick={() => handleSelectBin(bin.id)}
            className={`bg-[#181B20] border border-[#2A303C] border-l-4 ${bin.accentBorder} rounded-md p-3.5 text-left transition-colors flex flex-col justify-between min-h-[88px] ${
              isLocked
                ? "opacity-45 cursor-not-allowed"
                : "hover:bg-[#1E2229] hover:border-zinc-500 active:bg-[#252A34]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                {isLocked ? "BLOQUEADO" : `COLETOR 0${idx + 1}`}
              </span>
              {isLocked && <Lock className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <div className="mt-1.5">
              <p className="text-sm sm:text-base font-bold text-white leading-tight">
                {bin.title}
              </p>
              <p className="text-xs font-mono text-zinc-400 mt-0.5">
                {bin.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
