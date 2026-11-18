"use client";

import React from "react";
import {
  IndustrialClosingFeedback,
  IndustrialScoreDimensions,
} from "@/data/industrialChallengesData";
import {
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  SearchCheck,
  Wrench,
  Award,
  Clock,
  AlertTriangle,
  GraduationCap,
} from "lucide-react";

interface IndustrialClosingReportProps {
  osCode: string;
  pointsAwarded: number;
  dimensions: IndustrialScoreDimensions;
  closing: IndustrialClosingFeedback;
  onNextCase: () => void;
  extraContent?: React.ReactNode;
}

export const IndustrialClosingReport: React.FC<
  IndustrialClosingReportProps
> = ({
  osCode,
  pointsAwarded,
  dimensions,
  closing,
  onNextCase,
  extraContent,
}) => {
  const dimensionItems = [
    { key: "safety", label: "Segurança", ok: dimensions.safety, Icon: ShieldCheck },
    { key: "evidence", label: "Evidência", ok: dimensions.evidence, Icon: SearchCheck },
    { key: "decision", label: "Decisão Técnica", ok: dimensions.decision, Icon: Wrench },
    { key: "quality", label: "Qualidade", ok: dimensions.quality, Icon: Award },
    { key: "inTime", label: "Tempo da OS", ok: dimensions.inTime, Icon: Clock },
  ];

  return (
    <div className="bg-[#181B20] border border-emerald-500/50 border-l-4 border-l-emerald-400 rounded-lg p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-[#242933]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-md bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
              ORDEM DE SERVIÇO CONCLUÍDA • {osCode}
            </span>
            <h4 className="text-sm sm:text-base font-bold text-white">
              Relatório Técnico e Devolutiva Pedagógica
            </h4>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-md bg-[#0C0E12] border border-amber-400/50 font-mono text-sm font-bold text-amber-400">
          +{pointsAwarded} pts nesta etapa
        </span>
      </div>

      {/* Composição de resultado nas 5 dimensões */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {dimensionItems.map(({ key, label, ok, Icon }) => (
          <div
            key={key}
            className={`rounded-md px-2.5 py-2 border flex items-center gap-2 ${
              ok
                ? "bg-emerald-950/35 border-emerald-500/40 text-emerald-200"
                : "bg-amber-950/30 border-amber-500/40 text-amber-200"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] font-mono uppercase block truncate">
                {label}
              </span>
              <span className="text-[11px] font-bold">
                {ok ? "Atendido" : "Revisado"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {extraContent}

      {/* Devolutiva técnica estruturada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3 space-y-2">
          <div>
            <span className="font-mono text-[10px] uppercase text-emerald-400 font-bold block">
              Decisão / Causa Esperada
            </span>
            <p className="text-zinc-200 mt-0.5 leading-relaxed">
              {closing.expectedDecision}
            </p>
          </div>
          <div className="pt-2 border-t border-[#1E232D]">
            <span className="font-mono text-[10px] uppercase text-sky-400 font-bold block">
              Evidência Decisiva
            </span>
            <p className="text-zinc-300 mt-0.5 leading-relaxed">
              {closing.decisiveEvidence}
            </p>
          </div>
        </div>

        <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3 space-y-2">
          <div>
            <span className="font-mono text-[10px] uppercase text-amber-400 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Erro Mais Comum na Bancada
            </span>
            <p className="text-zinc-300 mt-0.5 leading-relaxed">
              {closing.commonMistake}
            </p>
          </div>
          <div className="pt-2 border-t border-[#1E232D]">
            <span className="font-mono text-[10px] uppercase text-purple-300 font-bold flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Capacidade Técnica &amp; Próximo Passo Seguro
            </span>
            <p className="text-zinc-300 mt-0.5 leading-relaxed">
              <strong className="text-zinc-100">{closing.competency}</strong>{" "}
              {closing.labNextStep}
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onNextCase}
        className="w-full py-3 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
      >
        <span>Próxima Ordem de Serviço</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
