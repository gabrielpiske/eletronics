"use client";

import React, { useState } from "react";
import {
  RESISTOR_COLORS,
  ResistorOrder,
} from "@/data/electronicsData";
import {
  generateProceduralResistorOrder,
  formatOhmsLabel,
} from "@/lib/challengeGenerator";
import {
  usePenaltySystem,
  PenaltyBanner,
} from "@/components/minigames/PenaltySystem";
import { Wrench, HelpCircle, Lock } from "lucide-react";

interface ResistorBuilderGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

export const ResistorBuilderGame: React.FC<ResistorBuilderGameProps> = ({
  onScoreAction,
}) => {
  const [currentOrder, setCurrentOrder] = useState<ResistorOrder>(() =>
    generateProceduralResistorOrder()
  );
  const [activeBand, setActiveBand] = useState<0 | 1 | 2>(0);
  const [bands, setBands] = useState<[number, number, number]>([0, 0, 0]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [builtCount, setBuiltCount] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<{
    ok: boolean;
    text: string;
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
    setStatusMsg(null);
  });

  const color1 = RESISTOR_COLORS[bands[0]];
  const color2 = RESISTOR_COLORS[bands[1]];
  const color3 = RESISTOR_COLORS[bands[2]];

  const currentOhms =
    (color1.digit * 10 + color2.digit) * color3.multiplier;

  const handlePickColor = (colorIndex: number) => {
    if (!guardClick() || isLocked || statusMsg) return;
    const nextBands: [number, number, number] = [...bands] as [
      number,
      number,
      number
    ];
    nextBands[activeBand] = colorIndex;
    setBands(nextBands);

    if (activeBand === 0) setActiveBand(1);
    else if (activeBand === 1) setActiveBand(2);
  };

  const handleSolder = () => {
    if (!guardClick() || isLocked || statusMsg) return;

    const isExactMatch = currentOhms === currentOrder.targetOhms;

    if (isExactMatch) {
      const nextBuilt = builtCount + 1;
      setBuiltCount(nextBuilt);
      const pts = showTable ? 55 : 110;
      const newLevel = Math.floor(nextBuilt / 6) + 1;

      setStatusMsg({
        ok: true,
        text: `Resistor comercial ${currentOrder.displayLabel} aferido (+${pts} pts)`,
      });

      registerHit(
        pts,
        `Soldou resistor E24 de ${currentOrder.displayLabel} (${color1.name}-${color2.name}-${color3.name})`,
        newLevel
      );

      setTimeout(() => {
        setStatusMsg(null);
        setActiveBand(0);
        setBands([0, 0, 0]);
        setCurrentOrder((prev) =>
          generateProceduralResistorOrder(prev.targetOhms)
        );
      }, 900);
    } else {
      triggerErrorPenalty(
        `Mediu ${formatOhmsLabel(currentOhms)} (pedido: ${currentOrder.displayLabel})`,
        `Leitura incorreta no multímetro: ${formatOhmsLabel(currentOhms)}`,
        `Especificação exigida: ${currentOrder.displayLabel}. Configurado: ${color1.name} (${color1.digit}), ${color2.name} (${color2.digit}), ${color3.name} (${color3.multiplierLabel}).`
      );
    }
  };

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-2xl mx-auto flex flex-col gap-3.5 select-none"
    >
      {/* Ordem de Bancada Procedural */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3 flex items-center justify-between flex-wrap gap-3">
        <div className="flex-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
            GERADOR E12/E24 + LEI DE OHM • ORDEM #{builtCount + 1}
          </span>
          <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
            <h3 className="text-lg sm:text-xl font-mono font-bold text-amber-400">
              {currentOrder.displayLabel}
            </h3>
            <span className="text-xs text-zinc-300">
              — {currentOrder.usageHint}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-mono font-semibold px-3 py-1.5 rounded bg-[#0C0E12] hover:bg-[#14181F] text-zinc-300 border border-[#2A303C] flex items-center gap-1.5 shrink-0"
        >
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          {showTable ? "Ocultar Tabela" : "Tabela de Cores"}
        </button>
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

      {/* Bancada do Resistor */}
      <div className="bg-[#0C0E12] border border-[#2A303C] rounded-lg p-4 flex flex-col items-center">
        <svg viewBox="0 0 420 130" className="w-full max-w-md h-24 sm:h-28">
          <line
            x1="10"
            y1="65"
            x2="95"
            y2="65"
            stroke="#94A3B8"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <line
            x1="325"
            y1="65"
            x2="410"
            y2="65"
            stroke="#94A3B8"
            strokeWidth="10"
            strokeLinecap="round"
          />

          <rect
            x="85"
            y="25"
            width="250"
            height="80"
            rx="20"
            fill="#FDE68A"
            stroke="#B45309"
            strokeWidth="3"
          />

          {/* 1ª Faixa */}
          <g
            onClick={() => !isLocked && setActiveBand(0)}
            className="cursor-pointer"
          >
            <rect
              x="125"
              y="25"
              width="26"
              height="80"
              fill={color1.hex}
              stroke={activeBand === 0 ? "#F59E0B" : "transparent"}
              strokeWidth="4"
            />
            <text
              x="138"
              y="17"
              textAnchor="middle"
              fill={activeBand === 0 ? "#F59E0B" : "#71717A"}
              fontSize="11"
              fontWeight="bold"
            >
              1ª FAIXA
            </text>
          </g>

          {/* 2ª Faixa */}
          <g
            onClick={() => !isLocked && setActiveBand(1)}
            className="cursor-pointer"
          >
            <rect
              x="175"
              y="25"
              width="26"
              height="80"
              fill={color2.hex}
              stroke={activeBand === 1 ? "#F59E0B" : "transparent"}
              strokeWidth="4"
            />
            <text
              x="188"
              y="17"
              textAnchor="middle"
              fill={activeBand === 1 ? "#F59E0B" : "#71717A"}
              fontSize="11"
              fontWeight="bold"
            >
              2ª FAIXA
            </text>
          </g>

          {/* 3ª Faixa */}
          <g
            onClick={() => !isLocked && setActiveBand(2)}
            className="cursor-pointer"
          >
            <rect
              x="225"
              y="25"
              width="26"
              height="80"
              fill={color3.hex}
              stroke={activeBand === 2 ? "#F59E0B" : "transparent"}
              strokeWidth="4"
            />
            <text
              x="238"
              y="17"
              textAnchor="middle"
              fill={activeBand === 2 ? "#F59E0B" : "#71717A"}
              fontSize="11"
              fontWeight="bold"
            >
              MULT.
            </text>
          </g>

          {/* 4ª Faixa (±5%) */}
          <rect x="285" y="25" width="16" height="80" fill="#EAB308" />
          <text
            x="293"
            y="17"
            textAnchor="middle"
            fill="#A1A1AA"
            fontSize="10"
          >
            ±5%
          </text>
        </svg>

        <div className="grid grid-cols-3 gap-2 w-full mt-2">
          {[
            { idx: 0 as const, label: `1ª: ${color1.name} (${color1.digit})` },
            { idx: 1 as const, label: `2ª: ${color2.name} (${color2.digit})` },
            {
              idx: 2 as const,
              label: `3ª: ${color3.name} (${color3.multiplierLabel})`,
            },
          ].map((b) => (
            <button
              key={b.idx}
              type="button"
              onClick={() => !isLocked && setActiveBand(b.idx)}
              className={`py-2 px-2 rounded text-xs font-mono font-semibold border transition-colors ${
                activeBand === b.idx
                  ? "bg-amber-500/15 border-amber-400 text-amber-300"
                  : "bg-[#181B20] border-[#2A303C] text-zinc-400"
              } ${isLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {statusMsg && !isLocked && (
        <div className="rounded-md px-3.5 py-2.5 border-l-4 border-l-emerald-400 bg-[#121F1A] border border-emerald-500/30 text-emerald-200 font-mono font-bold text-xs sm:text-sm">
          {statusMsg.text}
        </div>
      )}

      {/* Seletor de Cores */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-mono uppercase text-zinc-400">
            Selecionando:{" "}
            <strong className="text-amber-400">
              {activeBand === 0
                ? "1ª Faixa (1º Dígito)"
                : activeBand === 1
                ? "2ª Faixa (2º Dígito)"
                : "3ª Faixa (Multiplicador)"}
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {RESISTOR_COLORS.map((c, idx) => {
            const disabledBand = activeBand === 2 && idx >= 7;
            const disabled = disabledBand || isLocked;
            return (
              <button
                key={c.id}
                type="button"
                aria-disabled={disabled}
                onClick={() => !disabledBand && handlePickColor(idx)}
                style={{ backgroundColor: c.hex }}
                className={`rounded-md py-2.5 px-1.5 border transition-opacity flex flex-col items-center justify-center ${
                  disabled
                    ? "opacity-20 cursor-not-allowed border-transparent"
                    : "border-white/25 hover:border-white"
                } ${c.textLight ? "text-white" : "text-zinc-950"}`}
              >
                <span className="text-xs font-bold leading-tight">
                  {c.name}
                </span>
                {showTable && (
                  <span className="text-[10px] font-mono opacity-90">
                    {activeBand === 2 ? c.multiplierLabel : c.digit}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-disabled={isLocked}
        onClick={handleSolder}
        className={`w-full py-3.5 rounded-md font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${
          isLocked
            ? "bg-[#181B20] border border-red-500/40 text-red-300 opacity-65 cursor-not-allowed"
            : "bg-amber-500 hover:bg-amber-400 text-zinc-950"
        }`}
      >
        {isLocked ? (
          <>
            <Lock className="w-4 h-4" />
            Disjuntor Bloqueado — Aguarde
          </>
        ) : (
          <>
            <Wrench className="w-4 h-4" />
            Aferir no Multímetro e Confirmar
          </>
        )}
      </button>
    </div>
  );
};
