"use client";

import React from "react";
import { ServiceOrderMeta } from "@/data/industrialChallengesData";
import {
  ClipboardList,
  ShieldAlert,
  AlertTriangle,
  Factory,
  Info,
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
  return (
    <div className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
      {/* Faixa superior da OS */}
      <div className="bg-[#13161A] border-b border-[#242933] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#0047B6] text-white font-mono text-[11px] font-bold tracking-wider">
            <ClipboardList className="w-3.5 h-3.5" />
            {serviceOrder.code}
          </span>
          <span className="font-mono text-[11px] text-zinc-400">
            ATENDIMENTO #{caseIndex + 1}
          </span>
          {accentBadge && (
            <span className="px-2 py-0.5 rounded bg-[#0C0E12] border border-[#2A303C] font-mono text-[10px] font-bold text-amber-400 uppercase">
              {accentBadge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#0C0E12] border border-[#2A303C] font-mono text-[10px] text-sky-300 font-semibold">
            NV {difficulty}
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 font-mono text-[10px] text-emerald-300 font-bold">
            {serviceOrder.powerStateLabel}
          </span>
        </div>
      </div>

      {/* Dados da OS: Equipamento, Setor, Sintoma e Impacto */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
              <Factory className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{serviceOrder.sector}</span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
              {serviceOrder.equipment}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="rounded-md bg-[#0C0E12] border border-[#242933] px-3 py-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
              Sintoma Reportado
            </span>
            <p className="text-xs text-zinc-200 mt-0.5 leading-relaxed">
              {serviceOrder.symptom}
            </p>
          </div>
          <div className="rounded-md bg-[#0C0E12] border border-[#242933] px-3 py-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Impacto Operacional
            </span>
            <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed">
              {serviceOrder.impact}
            </p>
          </div>
        </div>

        {/* Condição de Trabalho e Aviso Pedagógico */}
        <div className="rounded-md bg-[#1A1610] border border-amber-500/35 border-l-4 border-l-amber-400 px-3 py-2 flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-100/90 leading-relaxed">
            <span className="font-mono font-bold text-amber-300 uppercase text-[10px] mr-1.5">
              Condição de Trabalho:
            </span>
            {serviceOrder.safetyNotice}
            <span className="block text-[10px] font-mono text-zinc-400 mt-1 flex items-center gap-1">
              <Info className="w-3 h-3 text-zinc-500 shrink-0" />
              Simulação pedagógica SENAI — não substitui normas de segurança nem prática supervisionada.
            </span>
          </div>
        </div>

        {/* Trilha de Etapas da OS */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          {stepLabels.map((lbl, idx) => {
            const done = idx < currentStepIndex;
            const active = idx === currentStepIndex;
            return (
              <div
                key={lbl}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold border transition-colors ${
                  done
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : active
                    ? "bg-[#0047B6]/30 border-[#0057E0] text-white font-bold"
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
