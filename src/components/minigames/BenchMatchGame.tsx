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
import { Cpu, CheckCircle2, Sparkles, Lock } from "lucide-react";

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
    const picked = [...ELECTRONIC_COMPONENTS]
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
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
            350,
            `Limpou a Placa Nível ${boardLevel} completa!`,
            nextLevel
          );
          setTimeout(() => {
            setBoardLevel(nextLevel);
            generateBoard();
          }, 550);
        } else {
          registerHit(
            140,
            `Conectou ${comp?.shortName || symId} [${comp?.boardLetter}]`,
            boardLevel
          );
        }
      } else {
        setWrongPair(true);
        const txtComp = ELECTRONIC_COMPONENTS.find((c) => c.id === txtId);
        const { delayMs } = triggerErrorPenalty(
          "Curto na conexão de pares!",
          "⚡ Curto-Circuito! Conexão de par incorreta na placa",
          `O símbolo escolhido não corresponde a ${
            txtComp?.shortName || txtId
          } [${txtComp?.boardLetter}]. Analise o desenho esquemático antes de reconectar!`
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
      className="w-full max-w-3xl mx-auto flex flex-col gap-4 select-none"
    >
      {/* Barra de Progresso da Placa */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-purple-950 border-2 border-violet-500/70 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-2 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/50 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-violet-300 block">
              PLACA DE BANCADA — NÍVEL {boardLevel}
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Conecte cada Símbolo ao seu Componente ({matchedIds.length}/6)
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-violet-400/30">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-200">
            Placa Limpa = +350 pts
          </span>
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

      {/* Painel de Conexão: Coluna de Símbolos vs. Coluna de Descrições */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Coluna 1: Símbolos Esquemáticos */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3">
          <p className="text-xs font-mono uppercase tracking-wider text-sky-400 font-bold mb-2.5 text-center">
            1. Toque em um Símbolo Esquemático
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
                  className={`rounded-2xl p-2.5 border-2 transition-all flex flex-col items-center justify-center min-h-[96px] ${
                    isMatched
                      ? "bg-emerald-950/40 border-emerald-500/40 opacity-45 cursor-default"
                      : isSelected
                      ? wrongPair || isLocked
                        ? "bg-red-900/70 border-red-400 scale-95"
                        : "bg-sky-900/70 border-sky-400 scale-105 shadow-lg shadow-sky-500/20"
                      : isLocked
                      ? "bg-slate-950/70 border-red-900/40 opacity-45 cursor-not-allowed"
                      : "bg-slate-950 border-slate-700 hover:border-sky-400/70 active:scale-95"
                  }`}
                >
                  <ElectronicSymbolSVG
                    symbolId={item.id}
                    className="w-24 h-16"
                    strokeColor={
                      isMatched
                        ? "#34D399"
                        : isLocked && !isSelected
                        ? "#64748B"
                        : "#38BDF8"
                    }
                  />
                  {isMatched && (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1 mt-1">
                      <CheckCircle2 className="w-3 h-3" /> Conectado
                    </span>
                  )}
                  {!isMatched && isLocked && (
                    <span className="text-[10px] font-mono text-red-400/80 flex items-center gap-1 mt-1">
                      <Lock className="w-3 h-3" /> Bloqueado
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Coluna 2: Nome, Letra na Placa e Função */}
        <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3">
          <p className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-2.5 text-center">
            2. Toque na Identificação Correspondente
          </p>
          <div className="grid grid-cols-1 gap-2">
            {textCards.map((item) => {
              const isMatched = matchedIds.includes(item.id);
              const isSelected = selectedTextId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-disabled={isMatched || isLocked}
                  onClick={() => handleSelectText(item.id)}
                  className={`rounded-xl px-3.5 py-2.5 border-2 text-left transition-all flex items-center justify-between gap-2 ${
                    isMatched
                      ? "bg-emerald-950/40 border-emerald-500/40 opacity-45 cursor-default"
                      : isSelected
                      ? wrongPair || isLocked
                        ? "bg-red-900/70 border-red-400 scale-95"
                        : "bg-amber-900/60 border-amber-400 scale-[1.02] shadow-lg"
                      : isLocked
                      ? "bg-slate-950/70 border-red-900/40 opacity-45 cursor-not-allowed"
                      : "bg-slate-950 border-slate-700 hover:border-amber-400/70 active:scale-98"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-extrabold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        [{item.boardLetter}]
                      </span>
                      <span className="text-sm font-extrabold text-white">
                        {item.shortName}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-1">
                      {item.basicFunction}
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
