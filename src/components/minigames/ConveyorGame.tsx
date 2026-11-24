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
  const recentIdsRef = useRef<string[]>([]);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeout = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

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

    const pool = ELECTRONIC_COMPONENTS.filter(
      (c) => !recentIdsRef.current.includes(c.id)
    );
    const source = pool.length > 0 ? pool : ELECTRONIC_COMPONENTS;
    const randomComp = source[Math.floor(Math.random() * source.length)];

    recentIdsRef.current = [randomComp.id, ...recentIdsRef.current].slice(0, 6);

    setCurrentComp(randomComp);
    setBeltProgress(6);

    const nextMode = nextCount % 2 === 0 ? "direct" : "category";
    setMode(nextMode);

    if (nextMode === "category") {
      setBins([
        {
          id: "passivo",
          title: "PASSIVOS",
          subtitle: "R, Potenciômetro, C, L, LDR, Termistor",
          accentBorder: "border-l-[#0052CC]",
        },
        {
          id: "semicondutor",
          title: "SEMICONDUTORES",
          subtitle: "Diodos, LED, Transistores, Ponte, TRIAC",
          accentBorder: "border-l-amber-400",
        },
        {
          id: "protecao_energia",
          title: "PROTEÇÃO & ENERGIA",
          subtitle: "Fusível, Relé, Varistor, Trafo, Fonte",
          accentBorder: "border-l-emerald-500",
        },
        {
          id: "digital_logica",
          title: "DIGITAL & LÓGICA",
          subtitle: "Portas AND/OR/NOT/NAND/XOR, Cristal, 7-Seg, Opto",
          accentBorder: "border-l-purple-400",
        },
      ]);
    } else {
      const others = ELECTRONIC_COMPONENTS.filter(
        (c) => c.id !== randomComp.id
      ).sort(() => Math.random() - 0.5);
      const choices = [randomComp, others[0], others[1], others[2]].sort(
        () => Math.random() - 0.5
      );
      const borders = [
        "border-l-[#0052CC]",
        "border-l-amber-400",
        "border-l-emerald-500",
        "border-l-purple-400",
      ];
      setBins(
        choices.map((c, idx) => ({
          id: c.id,
          title: c.shortName,
          subtitle: `Designador: [${c.boardLetter}] • ${c.categoryLabel.split(" ")[0]}`,
          accentBorder: borders[idx],
        }))
      );
    }
  }, []);

  useEffect(() => {
    spawnNextItem(0);
    return () => clearPendingTimeout();
  }, [spawnNextItem, clearPendingTimeout]);

  useEffect(() => {
    const speedStep = Math.min(2.6, 1.15 + Math.floor(streak / 3) * 0.25);
    const timer = setInterval(() => {
      if (lockRef.current || isLocked) return;
      setBeltProgress((prev) => Math.min(98, prev + speedStep));
    }, 100);

    return () => clearInterval(timer);
  }, [streak, isLocked]);

  useEffect(() => {
    if (beltProgress < 96 || lockRef.current || isLocked) return;

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
    clearPendingTimeout();
    nextTimerRef.current = setTimeout(() => {
      spawnNextItem(nextCount);
    }, delayMs);
  }, [
    beltProgress,
    isLocked,
    sortedCount,
    currentComp,
    triggerErrorPenalty,
    spawnNextItem,
    clearPendingTimeout,
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
    const newLevel = Math.floor(nextCount / 8) + 1;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const multiplier =
        newStreak >= 12 ? 2 : newStreak >= 8 ? 1.5 : newStreak >= 4 ? 1.25 : 1;
      const speedBonus = Math.round((100 - beltProgress) * 0.35);
      const points = Math.round((45 + speedBonus) * multiplier);

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

      clearPendingTimeout();
      nextTimerRef.current = setTimeout(() => {
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

      clearPendingTimeout();
      nextTimerRef.current = setTimeout(() => {
        spawnNextItem(nextCount);
      }, delayMs);
    }
  };

  const multiplier =
    streak >= 12 ? 2 : streak >= 8 ? 1.5 : streak >= 4 ? 1.25 : 1;

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-3xl mx-auto flex flex-col gap-4 select-none"
    >
      {/* Barra Técnica Superior */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-2 shadow-md">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
            ESTEIRA DE 35 COMPONENTES • PEÇA #{sortedCount + 1}
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            {mode === "direct"
              ? "Qual é o nome e a letra deste símbolo?"
              : "Qual é a família tecnológica deste símbolo?"}
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-sm">
          <span className="px-3.5 py-1.5 rounded-lg bg-[#0C0E12] border border-amber-500/40 text-amber-400 font-black">
            {multiplier}x • Combo {streak}
          </span>
        </div>
      </div>

      {/* Visor da Esteira Industrial */}
      <div className="relative lcd-readout rounded-xl p-5 overflow-hidden min-h-[225px] flex flex-col justify-between">
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-red-950/35 border-l border-red-500/40 flex items-center justify-center pointer-events-none">
          <AlertTriangle className="w-5 h-5 text-red-400" />
        </div>

        <div className="relative w-full h-36 flex items-center">
          <div
            style={{
              left: `${Math.min(70, Math.max(2, beltProgress * 0.7))}%`,
              transition: "left 95ms linear",
            }}
            className={`absolute bg-[#181B20] border-2 rounded-xl px-5 py-3 flex flex-col items-center justify-center shadow-xl ${
              isLocked ? "border-red-500 opacity-75" : "border-[#384152]"
            }`}
          >
            <ElectronicSymbolSVG
              symbolId={currentComp.id}
              className="w-28 h-20"
              strokeColor={isLocked ? "#F87171" : "#38BDF8"}
            />
            <span className="text-xs font-mono uppercase font-bold text-amber-400 mt-1.5">
              Unidade: {currentComp.unit}
            </span>
          </div>
        </div>

        {/* Trilho Técnico */}
        <div className="w-full h-3.5 bg-[#181B20] border border-[#2A303C] rounded flex items-center justify-around px-2">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full bg-zinc-600" />
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
        <div className="rounded-lg px-4 py-3 border-l-4 border-l-emerald-400 bg-[#121F1A] border border-emerald-500/40 text-emerald-200">
          <p className="font-mono font-extrabold text-sm sm:text-base">
            {feedback.text}
          </p>
          <p className="text-xs sm:text-sm text-zinc-200 mt-0.5 line-clamp-1">
            {feedback.detail}
          </p>
        </div>
      )}

      {/* 4 Coletores Industriais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {bins.map((bin, idx) => (
          <button
            key={bin.id}
            type="button"
            aria-disabled={isLocked}
            onClick={() => handleSelectBin(bin.id)}
            className={`bg-[#181B20] border-2 border-[#2A303C] border-l-4 ${bin.accentBorder} rounded-xl p-4 text-left transition-colors flex flex-col justify-between min-h-[96px] shadow-md ${
              isLocked
                ? "opacity-45 cursor-not-allowed"
                : "hover:bg-[#1E232B] hover:border-amber-400/70 active:bg-[#252A34]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-400">
                {isLocked ? "BLOQUEADO" : `COLETOR 0${idx + 1}`}
              </span>
              {isLocked && <Lock className="w-4 h-4 text-red-400" />}
            </div>
            <div className="mt-1">
              <p className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {bin.title}
              </p>
              <p className="text-xs sm:text-sm font-mono text-zinc-300 mt-1">
                {bin.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
