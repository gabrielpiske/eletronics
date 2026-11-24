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
import { CheckCircle2, Lock } from "lucide-react";

interface BenchMatchGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

export const BenchMatchGame: React.FC<BenchMatchGameProps> = ({
  onScoreAction,
}) => {
  const [boardLevel, setBoardLevel] = useState<number>(1);
  const [symbolCards, setSymbolCards] = useState<ElectronicComponentItem[]>([]);
  const [textCards, setTextCards] = useState<ElectronicComponentItem[]>([]);
  const [selectedSymbolId, setSelectedSymbolId] = useState<string | null>(null);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [wrongPair, setWrongPair] = useState<boolean>(false);

  const lastBoardIdsRef = useRef<string[]>([]);

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
    setSelectedSymbolId(null);
    setSelectedTextId(null);
    setWrongPair(false);
  });

  const generateBoard = useCallback(() => {
    const freshPool = ELECTRONIC_COMPONENTS.filter(
      (c) => !lastBoardIdsRef.current.includes(c.id)
    );
    const source =
      freshPool.length >= 6 ? freshPool : [...ELECTRONIC_COMPONENTS];

    const picked = [...source]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);

    lastBoardIdsRef.current = picked.map((p) => p.id);

    setSymbolCards([...picked].sort(() => Math.random() - 0.5));
    setTextCards([...picked].sort(() => Math.random() - 0.5));
    setSelectedSymbolId(null);
    setSelectedTextId(null);
    setMatchedIds([]);
    setWrongPair(false);
  }, []);

  useEffect(() => {
    generateBoard();
  }, [generateBoard]);

  const checkMatch = useCallback(
    (symId: string, txtId: string) => {
      if (symId === txtId) {
        const comp = ELECTRONIC_COMPONENTS.find((c) => c.id === symId);
        const nextMatched = [...matchedIds, symId];
        setMatchedIds(nextMatched);
        setSelectedSymbolId(null);
        setSelectedTextId(null);

        if (nextMatched.length === 6) {
          const nextLevel = boardLevel + 1;
          registerHit(
            120,
            `Concluiu Placa Nível ${boardLevel}`,
            nextLevel
          );
          setTimeout(() => {
            setBoardLevel(nextLevel);
            generateBoard();
          }, 550);
        } else {
          registerHit(
            50,
            `Associou ${comp?.shortName || symId} [${comp?.boardLetter}]`,
            boardLevel
          );
        }
      } else {
        setWrongPair(true);
        const txtComp = ELECTRONIC_COMPONENTS.find((c) => c.id === txtId);
        const { delayMs } = triggerErrorPenalty(
          "Associação incorreta de terminais",
          "Curto na associação entre Símbolo e Especificação",
          `O símbolo selecionado não corresponde a ${
            txtComp?.shortName || txtId
          } [${txtComp?.boardLetter}].`
        );
        setTimeout(() => {
          setSelectedSymbolId(null);
          setSelectedTextId(null);
          setWrongPair(false);
        }, delayMs);
      }
    },
    [matchedIds, boardLevel, registerHit, triggerErrorPenalty, generateBoard]
  );

  const handleSelectSymbol = (id: string) => {
    if (!guardClick() || isLocked || matchedIds.includes(id) || wrongPair)
      return;
    setSelectedSymbolId(id);
    if (selectedTextId) {
      checkMatch(id, selectedTextId);
    }
  };

  const handleSelectText = (id: string) => {
    if (!guardClick() || isLocked || matchedIds.includes(id) || wrongPair)
      return;
    setSelectedTextId(id);
    if (selectedSymbolId) {
      checkMatch(selectedSymbolId, id);
    }
  };

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-4xl mx-auto flex flex-col gap-4 select-none"
    >
      {/* Barra Superior */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-2 shadow-md">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
            ASSOCIAÇÃO DE BANCADA (35 PEÇAS) • PLACA NÍVEL {boardLevel}
          </span>
          <h3 className="text-base sm:text-lg font-extrabold text-white">
            Conecte cada Símbolo à sua Peça ({matchedIds.length}/6)
          </h3>
        </div>

        <span className="text-xs sm:text-sm font-mono text-amber-400 bg-[#0C0E12] px-3.5 py-1.5 rounded-lg border border-amber-500/40 font-black">
          Par: +50 pts • Placa: +120 pts
        </span>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna 1: Símbolos */}
        <div className="bg-[#181B20] border border-[#2A303C] rounded-xl p-4">
          <p className="text-xs sm:text-sm font-mono uppercase tracking-wider text-sky-400 font-extrabold mb-3">
            1. Símbolo Esquemático
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-2.5">
            {symbolCards.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedSymbolId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-disabled={isMatched || isLocked}
                  onClick={() => handleSelectSymbol(item.id)}
                  className={`rounded-xl p-3 border-2 transition-colors flex flex-col items-center justify-center min-h-[108px] ${
                    isMatched
                      ? "bg-[#0C0E12] border-emerald-500/30 opacity-40 cursor-default"
                      : isSelected
                      ? wrongPair || isLocked
                        ? "bg-[#241316] border-red-500"
                        : "bg-[#142033] border-[#0057E0]"
                      : isLocked
                      ? "bg-[#0C0E12] border-[#222730] opacity-40 cursor-not-allowed"
                      : "bg-[#0C0E12] border-[#262B35] hover:border-amber-400"
                  }`}
                >
                  <ElectronicSymbolSVG
                    symbolId={item.id}
                    className="w-28 h-20"
                    strokeColor={
                      isMatched
                        ? "#34D399"
                        : isLocked && !isSelected
                        ? "#52525B"
                        : "#38BDF8"
                    }
                  />
                  {isMatched && (
                    <span className="text-xs font-mono font-extrabold text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> OK
                    </span>
                  )}
                  {!isMatched && isLocked && (
                    <span className="text-xs font-mono text-red-400/80 flex items-center gap-1 mt-1">
                      <Lock className="w-3.5 h-3.5" /> Bloqueado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna 2: Especificações */}
        <div className="bg-[#181B20] border border-[#2A303C] rounded-xl p-4">
          <p className="text-xs sm:text-sm font-mono uppercase tracking-wider text-amber-400 font-extrabold mb-3">
            2. Letra na Placa &amp; Função
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            {textCards.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedTextId === item.id;
              const descText =
                boardLevel % 2 === 1
                  ? item.basicFunction
                  : item.clues[boardLevel % item.clues.length] ||
                    item.basicFunction;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-disabled={isMatched || isLocked}
                  onClick={() => handleSelectText(item.id)}
                  className={`rounded-xl px-4 py-3 border-2 text-left transition-colors flex items-center justify-between gap-2.5 ${
                    isMatched
                      ? "bg-[#0C0E12] border-emerald-500/30 opacity-40 cursor-default"
                      : isSelected
                      ? wrongPair || isLocked
                        ? "bg-[#241316] border-red-500"
                        : "bg-amber-500/15 border-amber-400"
                      : isLocked
                      ? "bg-[#0C0E12] border-[#222730] opacity-40 cursor-not-allowed"
                      : "bg-[#0C0E12] border-[#262B35] hover:border-amber-400"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-black px-2 py-0.5 rounded bg-[#181B20] text-amber-400 border border-amber-500/40">
                        [{item.boardLetter}]
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-white">
                        {item.shortName}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-300 mt-1 line-clamp-2 leading-snug">
                      {descText}
                    </p>
                  </div>

                  {isMatched && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  )}
                  {!isMatched && isLocked && (
                    <Lock className="w-4 h-4 text-red-400/70 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
