"use client";

import React, { useState } from "react";
import { ServiceOrderMeta } from "@/data/industrialChallengesData";
import {
  ClipboardList,
  ShieldAlert,
  AlertTriangle,
  Factory,
  Info,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface IndustrialOSHeaderProps {
  serviceOrder: ServiceOrderMeta;
  difficulty: 1 | 2 | 3 | 4;
  caseIndex: number;
  stepLabels: string[];
  currentStepIndex: number;
  accentBadge?: string;
}

export const IndustrialOSHeader: React.FC<IndustrialOSHeaderProps> = ({
  serviceOrder,
  difficulty,
  caseIndex,
  stepLabels,
  currentStepIndex,
  accentBadge,
}) => {
  const [showSafetyDetails, setShowSafetyDetails] = useState<boolean>(false);

  return (
    <div className="bg-[#181B20] border border-[#2A303C] rounded-xl overflow-hidden shadow-md">
      {/* Faixa superior da OS */}
      <div className="bg-[#13161A] border-b border-[#242933] px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#0047B6] text-white font-mono text-xs sm:text-sm font-black tracking-wider">
            <ClipboardList className="w-4 h-4" />
            {serviceOrder.code}
          </span>
          <span className="font-mono text-xs sm:text-sm font-bold text-zinc-300">
            OS #{caseIndex + 1}
          </span>
          {accentBadge && (
            <span className="px-2.5 py-1 rounded-md bg-[#0C0E12] border border-amber-500/40 font-mono text-xs font-extrabold text-amber-400 uppercase">
              {accentBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-[#0C0E12] border border-[#2A303C] font-mono text-xs text-sky-300 font-extrabold">
            NV {difficulty}
          </span>
          <span className="px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-500/50 font-mono text-xs text-emerald-300 font-extrabold">
            {serviceOrder.powerStateLabel}
          </span>
        </div>
      </div>

      {/* Dados da OS: Equipamento, Sintoma em Destaque e Botão de Detalhes/Segurança */}
      <div className="p-5 space-y-3.5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs sm:text-sm font-mono font-bold text-amber-400">
              <Factory className="w-4 h-4 shrink-0" />
              <span>{serviceOrder.sector}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
              {serviceOrder.equipment}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowSafetyDetails((v) => !v)}
            className="px-3.5 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#14181F] border border-amber-500/40 text-xs sm:text-sm font-mono font-bold text-amber-300 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>
              {showSafetyDetails
                ? "Ocultar Impacto & Segurança"
                : "Ver Impacto & Segurança"}
            </span>
            {showSafetyDetails ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Visor Principal do Sintoma Reportado */}
        <div className="rounded-lg bg-[#0C0E12] border-l-4 border-l-amber-400 border border-[#242933] px-4 py-3">
          <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-extrabold block">
            ⚡ SINTOMA NA BANCADA
          </span>
          <p className="text-sm sm:text-base font-bold text-zinc-100 mt-1 leading-snug">
            {serviceOrder.symptom}
          </p>
        </div>

        {/* Detalhes Opcionais (Impacto Operacional + Condição de Trabalho) */}
        {showSafetyDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="rounded-lg bg-[#0C0E12] border border-red-500/35 px-3.5 py-3">
              <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-extrabold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Impacto na Linha
              </span>
              <p className="text-sm text-zinc-200 mt-1 leading-relaxed">
                {serviceOrder.impact}
              </p>
            </div>

            <div className="rounded-lg bg-[#1A1610] border border-amber-500/40 px-3.5 py-3 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-100 leading-relaxed">
                <span className="font-mono font-extrabold text-amber-300 uppercase text-xs block">
                  Condição de Trabalho &amp; NR:
                </span>
                {serviceOrder.safetyNotice}
                <span className="block text-xs font-mono text-zinc-400 mt-1.5 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  Simulação pedagógica SENAI.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Trilha de Etapas da OS */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          {stepLabels.map((lbl, idx) => {
            const done = idx < currentStepIndex;
            const active = idx === currentStepIndex;
            return (
              <div
                key={lbl}
                className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold border transition-colors ${
                  done
                    ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-300"
                    : active
                    ? "bg-[#0047B6] border-[#0057E0] text-white font-extrabold shadow-sm"
                    : "bg-[#0C0E12] border-[#242933] text-zinc-500"
                }`}
              >
                {idx + 1}. {lbl}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
