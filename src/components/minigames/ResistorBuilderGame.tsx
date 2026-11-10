"use client";

import React, { useState } from "react";
import {
  RESISTOR_COLORS,
  RESISTOR_ORDERS,
  ResistorOrder,
} from "@/data/electronicsData";
import { Wrench, CheckCircle2, Sparkles, HelpCircle } from "lucide-react";

interface ResistorBuilderGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

function formatOhms(ohms: number): string {
  if (ohms >= 1000000) {
    return `${(ohms / 1000000).toLocaleString("pt-BR")} MΩ`;
  }
  if (ohms >= 1000) {
    return `${(ohms / 1000).toLocaleString("pt-BR")} kΩ`;
  }
  return `${ohms} Ω`;
}

export const ResistorBuilderGame: React.FC<ResistorBuilderGameProps> = ({
  onScoreAction,
}) => {
  const [orders] = useState<ResistorOrder[]>(() =>
    [...RESISTOR_ORDERS].sort(() => Math.random() - 0.5)
  );
  const [orderIdx, setOrderIdx] = useState<number>(0);
  const [activeBand, setActiveBand] = useState<0 | 1 | 2>(0);
  const [bands, setBands] = useState<[number, number, number]>([0, 0, 0]);
  const [showTable, setShowTable] = useState<boolean>(false);
  const [builtCount, setBuiltCount] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const currentOrder = orders[orderIdx % orders.length];

  const color1 = RESISTOR_COLORS[bands[0]];
  const color2 = RESISTOR_COLORS[bands[1]];
  const color3 = RESISTOR_COLORS[bands[2]];

  const currentOhms =
    (color1.digit * 10 + color2.digit) * color3.multiplier;

  const handlePickColor = (colorIndex: number) => {
    const nextBands: [number, number, number] = [...bands] as [
      number,
      number,
      number
    ];
    nextBands[activeBand] = colorIndex;
    setBands(nextBands);

    // Avança automaticamente para a próxima faixa
    if (activeBand === 0) setActiveBand(1);
    else if (activeBand === 1) setActiveBand(2);
  };

  const handleSolder = () => {
    if (statusMsg) return;

    const isExactMatch = currentOhms === currentOrder.targetOhms;

    if (isExactMatch) {
      const nextBuilt = builtCount + 1;
      setBuiltCount(nextBuilt);
      const pts = showTable ? 180 : 280;
      const newLevel = Math.floor(nextBuilt / 3) + 1;

      setStatusMsg({
        ok: true,
        text: `🔥 Perfeito! Resistor de ${currentOrder.displayLabel} soldado (+${pts} pts)!`,
      });

      onScoreAction(
        pts,
        true,
        `Soldou resistor de ${currentOrder.displayLabel} (${color1.name}-${color2.name}-${color3.name})!`,
        newLevel
      );

      setTimeout(() => {
        setStatusMsg(null);
        setActiveBand(0);
        setBands([0, 0, 0]);
        setOrderIdx((prev) => prev + 1);
      }, 900);
    } else {
      setStatusMsg({
        ok: false,
        text: `⚠️ O multímetro mediu ${formatOhms(
          currentOhms
        )}, mas o pedido é ${currentOrder.displayLabel}!`,
      });

      onScoreAction(
        -40,
        false,
        `Montou ${formatOhms(currentOhms)} em vez de ${currentOrder.displayLabel}`
      );

      setTimeout(() => {
        setStatusMsg(null);
      }, 1100);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 select-none">
      {/* Ordem de Serviço */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-orange-950 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl flex items-center justify-between flex-wrap gap-3">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            ORDEM DE BANCADA #{builtCount + 1}
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-0.5">
            Monte um Resistor de:{" "}
            <span className="text-amber-300 underline decoration-amber-500">
              {currentOrder.displayLabel}
            </span>
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Aplicação: {currentOrder.usageHint}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-bold px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 flex items-center gap-1.5"
        >
          <HelpCircle className="w-4 h-4" />
          {showTable ? "Ocultar Tabela" : "Ver Tabela de Cores"}
        </button>
      </div>

      {/* Desenho Interativo do Resistor */}
      <div className="bg-slate-900/95 border-2 border-slate-700 rounded-3xl p-4 sm:p-5 flex flex-col items-center shadow-2xl">
        <p className="text-xs text-slate-400 mb-2">
          Toque na faixa que deseja pintar (1ª, 2ª ou 3ª) e escolha a cor abaixo:
        </p>

        <svg viewBox="0 0 420 130" className="w-full max-w-md h-28 sm:h-32">
          {/* Terminais Metálicos */}
          <line x1="10" y1="65" x2="95" y2="65" stroke="#94A3B8" strokeWidth="10" strokeLinecap="round" />
          <line x1="325" y1="65" x2="410" y2="65" stroke="#94A3B8" strokeWidth="10" strokeLinecap="round" />

          {/* Corpo Bege do Resistor PTH */}
          <rect
            x="85"
            y="25"
            width="250"
            height="80"
            rx="28"
            fill="#FDE68A"
            stroke="#D97706"
            strokeWidth="4"
          />

          {/* 1ª Faixa (1º Dígito) */}
          <g
            onClick={() => setActiveBand(0)}
            className="cursor-pointer"
          >
            <rect
              x="125"
              y="25"
              width="26"
              height="80"
              fill={color1.hex}
              stroke={activeBand === 0 ? "#38BDF8" : "transparent"}
              strokeWidth="4"
            />
            <text
              x="138"
              y="18"
              textAnchor="middle"
              fill={activeBand === 0 ? "#38BDF8" : "#94A3B8"}
              fontSize="12"
              fontWeight="bold"
            >
              1ª Faixa
            </text>
          </g>

          {/* 2ª Faixa (2º Dígito) */}
          <g
            onClick={() => setActiveBand(1)}
            className="cursor-pointer"
          >
            <rect
              x="175"
              y="25"
              width="26"
              height="80"
              fill={color2.hex}
              stroke={activeBand === 1 ? "#38BDF8" : "transparent"}
              strokeWidth="4"
            />
            <text
              x="188"
              y="18"
              textAnchor="middle"
              fill={activeBand === 1 ? "#38BDF8" : "#94A3B8"}
              fontSize="12"
              fontWeight="bold"
            >
              2ª Faixa
            </text>
          </g>

          {/* 3ª Faixa (Multiplicador) */}
          <g
            onClick={() => setActiveBand(2)}
            className="cursor-pointer"
          >
            <rect
              x="225"
              y="25"
              width="26"
              height="80"
              fill={color3.hex}
              stroke={activeBand === 2 ? "#38BDF8" : "transparent"}
              strokeWidth="4"
            />
            <text
              x="238"
              y="18"
              textAnchor="middle"
              fill={activeBand === 2 ? "#38BDF8" : "#94A3B8"}
              fontSize="12"
              fontWeight="bold"
            >
              3ª (Mult.)
            </text>
          </g>

          {/* 4ª Faixa Fixa (Dourado ±5%) */}
          <rect x="285" y="25" width="18" height="80" fill="#EAB308" />
          <text x="294" y="18" textAnchor="middle" fill="#EAB308" fontSize="11">
            ±5%
          </text>
        </svg>

        {/* Seletor Rápido de Faixa Ativa */}
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
              onClick={() => setActiveBand(b.idx)}
              className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all ${
                activeBand === b.idx
                  ? "bg-sky-500/20 border-sky-400 text-sky-300 shadow"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Feedback */}
      {statusMsg && (
        <div
          className={`rounded-2xl px-4 py-3 border text-center font-bold text-sm ${
            statusMsg.ok
              ? "bg-emerald-950/90 border-emerald-400 text-emerald-200"
              : "bg-red-950/90 border-red-400 text-red-200"
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* Paleta de Cores */}
      <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-sky-400 uppercase">
            Pintando agora:{" "}
            {activeBand === 0
              ? "1ª Faixa (1º Dígito)"
              : activeBand === 1
              ? "2ª Faixa (2º Dígito)"
              : "3ª Faixa (Multiplicador de Zeros)"}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {RESISTOR_COLORS.map((c, idx) => {
            // Na 3ª faixa (multiplicador), Cinza e Branco não são usados para nossos resistores básicos
            const disabled = activeBand === 2 && idx >= 7;
            return (
              <button
                key={c.id}
                disabled={disabled}
                onClick={() => handlePickColor(idx)}
                style={{ backgroundColor: c.hex }}
                className={`rounded-xl py-2.5 px-1.5 border-2 transition-transform active:scale-95 flex flex-col items-center justify-center ${
                  disabled
                    ? "opacity-25 cursor-not-allowed border-transparent"
                    : "border-white/30 hover:border-white shadow"
                } ${c.textLight ? "text-white" : "text-slate-950"}`}
              >
                <span className="text-xs font-extrabold leading-tight">
                  {c.name}
                </span>
                {showTable && (
                  <span className="text-[10px] font-mono opacity-90">
                    {activeBand === 2 ? c.multiplierLabel : `Dígito ${c.digit}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Botão Soldar na Placa */}
      <button
        type="button"
        onClick={handleSolder}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-500/20 active:scale-98 flex items-center justify-center gap-2"
      >
        <Wrench className="w-5 h-5" />
        TESTAR NO MULTÍMETRO E SOLDAR NA PLACA!
        <Sparkles className="w-5 h-5" />
      </button>
    </div>
  );
};
