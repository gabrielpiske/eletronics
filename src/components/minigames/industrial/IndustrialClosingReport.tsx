"use client";

import React, { useState } from "react";
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
  ChevronDown,
  ChevronUp,
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
  const [showFullDebrief, setShowFullDebrief] = useState<boolean>(false);

  const dimensionItems = [
    { key: "safety", label: "Segurança", ok: dimensions.safety, Icon: ShieldCheck },
    { key: "evidence", label: "Evidência", ok: dimensions.evidence, Icon: SearchCheck },
    { key: "decision", label: "Decisão", ok: dimensions.decision, Icon: Wrench },
    { key: "quality", label: "Qualidade", ok: dimensions.quality, Icon: Award },
    { key: "inTime", label: "Tempo OS", ok: dimensions.inTime, Icon: Clock },
  ];

  return (
    <div className="bg-[#181B20] border-2 border-emerald-500/60 border-l-4 border-l-emerald-400 rounded-xl p-5 space-y-4 shadow-xl">
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3.5 border-b border-[#242933]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-extrabold block">
              ORDEM DE SERVIÇO CONCLUÍDA • {osCode}
            </span>
            <h4 className="text-lg sm:text-xl font-extrabold text-white">
              Placa Reparada &amp; Validada na Bancada!
            </h4>
          </div>
        </div>

        <span className="px-4 py-2 rounded-lg bg-[#0C0E12] border-2 border-amber-400 font-mono text-base sm:text-lg font-black text-amber-400 shadow">
          +{pointsAwarded} pts
        </span>
      </div>

      {/* Composição de resultado nas 5 dimensões */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {dimensionItems.map(({ key, label, ok, Icon }) => (
          <div
            key={key}
            className={`rounded-lg px-3 py-2.5 border flex items-center gap-2.5 ${
              ok
                ? "bg-emerald-950/45 border-emerald-500/50 text-emerald-200"
                : "bg-amber-950/40 border-amber-500/50 text-amber-200"
            }`}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <div className="min-w-0">
              <span className="text-xs font-mono uppercase block truncate">
                {label}
              </span>
              <span className="text-xs sm:text-sm font-extrabold">
                {ok ? "100% OK" : "Revisado"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {extraContent}

      {/* Resumo Direto da Decisão + Botão Expansível para Detalhes Técnicos */}
      <div className="bg-[#0C0E12] border border-[#242933] rounded-xl p-4 space-y-3">
        <div>
          <span className="font-mono text-xs uppercase text-emerald-400 font-extrabold block">
            ✅ DIAGNÓSTICO &amp; REPARO CONFIRMADO
          </span>
          <p className="text-sm sm:text-base font-bold text-zinc-100 mt-1 leading-snug">
            {closing.expectedDecision}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowFullDebrief((v) => !v)}
          className="w-full pt-2.5 border-t border-[#1E232D] flex items-center justify-between text-left font-mono text-xs sm:text-sm font-bold text-amber-300 hover:text-amber-200"
        >
          <span>
            {showFullDebrief
              ? "Ocultar detalhes técnicos da OS"
              : "📋 Ver Evidência, Erro Comum e Dica de Laboratório"}
          </span>
          {showFullDebrief ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showFullDebrief && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-sm">
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-3">
              <span className="font-mono text-xs uppercase text-sky-400 font-extrabold block">
                Evidência Decisiva
              </span>
              <p className="text-zinc-200 mt-1 leading-relaxed">
                {closing.decisiveEvidence}
              </p>
            </div>
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-3">
              <span className="font-mono text-xs uppercase text-amber-400 font-extrabold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Erro Comum
              </span>
              <p className="text-zinc-200 mt-1 leading-relaxed">
                {closing.commonMistake}
              </p>
            </div>
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-3">
              <span className="font-mono text-xs uppercase text-purple-300 font-extrabold flex items-center gap-1">
                <GraduationCap className="w-4 h-4" /> Na Prática Real
              </span>
              <p className="text-zinc-200 mt-1 leading-relaxed">
                {closing.labNextStep}
              </p>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onNextCase}
        className="w-full py-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm sm:text-base uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-lg"
      >
        <span>Próxima Ordem de Serviço</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
