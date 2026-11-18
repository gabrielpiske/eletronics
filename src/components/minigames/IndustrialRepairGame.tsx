"use client";

import React, { useState, useRef, useMemo } from "react";
import {
  REPAIR_CASES,
  RepairCase,
  RepairHotspot,
  RepairChoiceOption,
  pickNextShuffledCase,
} from "@/data/industrialChallengesData";
import {
  usePenaltySystem,
  PenaltyBanner,
  ScoreActionHandler,
} from "@/components/minigames/PenaltySystem";
import { IndustrialOSHeader } from "@/components/minigames/industrial/IndustrialOSHeader";
import { IndustrialClosingReport } from "@/components/minigames/industrial/IndustrialClosingReport";
import {
  IndustrialBoardViewport,
  BoardComponentGraphic,
} from "@/components/minigames/industrial/IndustrialBoardViewport";
import {
  CheckCircle2,
  Wrench,
  Lock,
  ShieldCheck,
  SearchCheck,
  Sparkles,
} from "lucide-react";

interface IndustrialRepairGameProps {
  onScoreAction: ScoreActionHandler;
}

type RepairStep = "triage" | "inspect" | "repair" | "quality" | "closed";

function shuffleArray<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

export const IndustrialRepairGame: React.FC<IndustrialRepairGameProps> = ({
  onScoreAction,
}) => {
  const queueRef = useRef<RepairCase[]>([]);
  const [currentCase, setCurrentCase] = useState<RepairCase>(() => {
    const { next, remaining } = pickNextShuffledCase(REPAIR_CASES, []);
    queueRef.current = remaining;
    return next;
  });

  const [caseCount, setCaseCount] = useState<number>(0);
  const [step, setStep] = useState<RepairStep>("triage");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(
    null
  );
  const [inspectedIds, setInspectedIds] = useState<string[]>([]);
  const [defectConfirmed, setDefectConfirmed] = useState<boolean>(false);
  const [procedureConfirmed, setProcedureConfirmed] = useState<boolean>(false);
  const [hadSafetyMistake, setHadSafetyMistake] = useState<boolean>(false);
  const [hadTechMistake, setHadTechMistake] = useState<boolean>(false);
  const [closingPoints, setClosingPoints] = useState<number>(0);
  const [stepBanner, setStepBanner] = useState<string | null>(null);

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
    setStepBanner(null);
  });

  const shuffledDefects = useMemo(
    () => shuffleArray(currentCase.defectOptions),
    [currentCase]
  );
  const shuffledProcedures = useMemo(
    () => shuffleArray(currentCase.procedureOptions),
    [currentCase]
  );
  const shuffledQualityChecks = useMemo(
    () => shuffleArray(currentCase.qualityCheckOptions),
    [currentCase]
  );

  const defectiveHotspot = useMemo(
    () =>
      currentCase.hotspots.find((h) => h.isDefective) ||
      currentCase.hotspots[0],
    [currentCase]
  );

  const loadNextCase = () => {
    const { next, remaining } = pickNextShuffledCase(
      REPAIR_CASES,
      queueRef.current,
      currentCase.id
    );
    queueRef.current = remaining;
    setCurrentCase(next);
    setCaseCount((c) => c + 1);
    setStep("triage");
    setSelectedHotspotId(null);
    setInspectedIds([]);
    setDefectConfirmed(false);
    setProcedureConfirmed(false);
    setHadSafetyMistake(false);
    setHadTechMistake(false);
    setClosingPoints(0);
    setStepBanner(null);
  };

  const handleConfirmMounting = (chosen: "PTH" | "SMD") => {
    if (!guardClick() || isLocked) return;
    if (chosen === currentCase.mountingType) {
      setStepBanner(
        `Montagem ${chosen} confirmada! Agora inspecione a PCI com a lupa e localize o componente com defeito.`
      );
      setStep("inspect");
    } else {
      setHadTechMistake(true);
      triggerErrorPenalty(
        `Classificou ${currentCase.serviceOrder.code} como ${chosen} (era ${currentCase.mountingType})`,
        `Tecnologia de montagem incorreta: esta placa é ${currentCase.mountingType}`,
        currentCase.mountingType === "PTH"
          ? "Componentes PTH (Pin Through-Hole) atravessam furos metalizados na placa com terminais axiais/radiais."
          : "Componentes SMD (Surface Mount Device) são soldados diretamente sobre pads na superfície da PCI."
      );
    }
  };

  const handleSelectHotspot = (hs: RepairHotspot) => {
    setSelectedHotspotId(hs.id);
    setInspectedIds((prev) => (prev.includes(hs.id) ? prev : [...prev, hs.id]));
  };

  const handleConfirmDefectiveHotspot = () => {
    if (!guardClick() || isLocked || !selectedHotspotId) return;
    const chosen = currentCase.hotspots.find((h) => h.id === selectedHotspotId);
    if (!chosen) return;

    if (chosen.isDefective) {
      const nextLevel = Math.floor((caseCount + 1) / 2) + 1;
      registerHit(
        45,
        `${currentCase.serviceOrder.code}: localizou defeito em ${chosen.designator}`,
        nextLevel
      );
      setStepBanner(
        `Evidência localizada em [${chosen.designator}] (+45 pts)! Agora classifique o defeito e escolha o procedimento de reparo.`
      );
      setStep("repair");
    } else {
      setHadTechMistake(true);
      triggerErrorPenalty(
        `${currentCase.serviceOrder.code}: apontou ${chosen.designator} íntegro`,
        `[${chosen.designator}] está conforme na inspeção visual`,
        `${chosen.inspectionNote} Continue inspecionando os demais componentes com zoom/lupa.`
      );
    }
  };

  const handleChooseDefect = (opt: RepairChoiceOption) => {
    if (!guardClick() || isLocked || defectConfirmed) return;
    if (opt.isCorrect) {
      setDefectConfirmed(true);
      setStepBanner(
        "Defeito identificado corretamente! Agora selecione o procedimento seguro de bancada."
      );
    } else {
      setHadTechMistake(true);
      triggerErrorPenalty(
        `${currentCase.serviceOrder.code}: classificou defeito incorretamente`,
        "Diagnóstico visual incorreto",
        opt.mistakeFeedback
      );
    }
  };

  const handleChooseProcedure = (opt: RepairChoiceOption) => {
    if (!guardClick() || isLocked || !defectConfirmed || procedureConfirmed)
      return;
    if (opt.isCorrect) {
      setProcedureConfirmed(true);
      const nextLevel = Math.floor((caseCount + 1) / 2) + 1;
      registerHit(
        50,
        `${currentCase.serviceOrder.code}: definiu reparo ${currentCase.mountingType} seguro`,
        nextLevel
      );
      setStepBanner(
        "Procedimento de reparo aprovado (+50 pts)! Execute a validação final de qualidade pós-reparo."
      );
      setStep("quality");
    } else {
      if (opt.isUnsafe) {
        setHadSafetyMistake(true);
      } else {
        setHadTechMistake(true);
      }
      triggerErrorPenalty(
        `${currentCase.serviceOrder.code}: procedimento ${
          opt.isUnsafe ? "inseguro" : "inadequado"
        }`,
        opt.isUnsafe
          ? "Procedimento inseguro ou destrutivo na bancada"
          : "Procedimento de retrabalho inadequado",
        opt.mistakeFeedback,
        undefined,
        opt.isUnsafe ? "safety" : "error"
      );
    }
  };

  const handleChooseQualityCheck = (opt: RepairChoiceOption) => {
    if (!guardClick() || isLocked) return;
    if (opt.isCorrect) {
      const bonusClean = !hadSafetyMistake && !hadTechMistake ? 35 : 0;
      const pts = 95 + bonusClean;
      const nextLevel = Math.floor((caseCount + 1) / 2) + 1;
      setClosingPoints(pts);
      setStepBanner(null);
      setStep("closed");
      registerHit(
        pts,
        `Concluiu ${currentCase.serviceOrder.code} (${currentCase.mountingType}) com validação final`,
        nextLevel
      );
    } else {
      if (opt.isUnsafe) {
        setHadSafetyMistake(true);
      } else {
        setHadTechMistake(true);
      }
      triggerErrorPenalty(
        `${currentCase.serviceOrder.code}: falha na inspeção final`,
        opt.isUnsafe
          ? "Risco de segurança na liberação da placa"
          : "Critério de qualidade insuficiente",
        opt.mistakeFeedback,
        undefined,
        opt.isUnsafe ? "safety" : "error"
      );
    }
  };

  const stepIndexMap: Record<RepairStep, number> = {
    triage: 0,
    inspect: 1,
    repair: 2,
    quality: 3,
    closed: 4,
  };

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-4xl mx-auto flex flex-col gap-3.5 select-none"
    >
      <IndustrialOSHeader
        serviceOrder={currentCase.serviceOrder}
        difficulty={currentCase.difficulty}
        caseIndex={caseCount}
        accentBadge={`REPARO PCI • ${currentCase.mountingType}`}
        stepLabels={[
          "Triagem PTH/SMD",
          "Inspeção com Lupa",
          "Defeito & Reparo",
          "Qualidade Final",
        ]}
        currentStepIndex={stepIndexMap[step]}
      />

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

      {stepBanner && !isLocked && step !== "closed" && (
        <div className="rounded-md px-3.5 py-2.5 border-l-4 border-l-emerald-400 bg-[#121F1A] border border-emerald-500/30 text-emerald-200 text-xs font-mono font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{stepBanner}</span>
        </div>
      )}

      {/* Viewport interativo da PCI (visível durante inspeção, reparo e qualidade) */}
      {step !== "closed" && (
        <IndustrialBoardViewport
          boardAssetPath={currentCase.boardAssetPath}
          boardTitle={currentCase.boardTitle}
          mountingType={currentCase.mountingType}
          hotspots={currentCase.hotspots}
          selectedHotspotId={selectedHotspotId}
          inspectedIds={inspectedIds}
          repaired={step === "quality"}
          disabled={isLocked}
          onSelectHotspot={handleSelectHotspot}
        />
      )}

      {/* ETAPA 1: TRIAGEM PTH vs SMD */}
      {step === "triage" && (
        <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4 space-y-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
              ETAPA 1 • AVALIAÇÃO INICIAL DA PLACA
            </span>
            <h4 className="text-sm font-bold text-white mt-0.5">
              Observe a placa na bancada acima: qual tecnologia de montagem predomina nesta OS?
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(
              [
                {
                  id: "PTH" as const,
                  title: "Montagem PTH (Pin Through-Hole)",
                  desc: "Componentes com terminais passantes em furos metalizados (conectores, axiais, radiais).",
                },
                {
                  id: "SMD" as const,
                  title: "Montagem SMD (Surface Mount Device)",
                  desc: "Componentes de montagem superficial soldados sobre pads de passo fino (SOIC, 0805, SMA).",
                },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-disabled={isLocked}
                onClick={() => handleConfirmMounting(opt.id)}
                className={`p-3.5 rounded-md border text-left transition-colors ${
                  isLocked
                    ? "bg-[#121519] border-[#222730] opacity-45 cursor-not-allowed"
                    : "bg-[#0C0E12] border-[#2A303C] hover:border-amber-400 hover:bg-[#14181F]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white">
                    {opt.title}
                  </span>
                  {isLocked && <Lock className="w-3.5 h-3.5 text-red-400" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ETAPA 2: LOCALIZAR HOTSPOT DEFEITUOSO */}
      {step === "inspect" && (
        <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1">
              <SearchCheck className="w-3.5 h-3.5" /> ETAPA 2 • LOCALIZAÇÃO POR INSPEÇÃO VISUAL
            </span>
            <p className="text-xs sm:text-sm text-zinc-200 mt-1">
              Use o zoom/lupa e selecione na placa o componente que apresenta anomalia física coerente com o sintoma da OS.
            </p>
            <p className="text-[11px] font-mono text-zinc-400 mt-1">
              Inspecionados: {inspectedIds.length}/{currentCase.hotspots.length} •{" "}
              Selecionado:{" "}
              <strong className="text-amber-400">
                {selectedHotspotId
                  ? currentCase.hotspots.find((h) => h.id === selectedHotspotId)
                      ?.designator
                  : "nenhum"}
              </strong>
            </p>
          </div>

          <button
            type="button"
            disabled={!selectedHotspotId || isLocked}
            onClick={handleConfirmDefectiveHotspot}
            className="px-5 py-3 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 font-bold text-xs uppercase tracking-wider shrink-0 transition-colors"
          >
            Confirmar Ponto com Defeito
          </button>
        </div>
      )}

      {/* ETAPA 3: CLASSIFICAR DEFEITO E PROCEDIMENTO */}
      {step === "repair" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
          {/* 3A: Defeito */}
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                3A • CLASSIFICAR DEFEITO EM [{defectiveHotspot.designator}]
              </span>
              {defectConfirmed && (
                <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {shuffledDefects.map((opt) => {
                const chosenRight = defectConfirmed && opt.isCorrect;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    aria-disabled={isLocked || defectConfirmed}
                    onClick={() => handleChooseDefect(opt)}
                    className={`p-3 rounded-md border text-left text-xs transition-colors ${
                      chosenRight
                        ? "bg-emerald-950/50 border-emerald-400 text-emerald-100 font-semibold"
                        : defectConfirmed || isLocked
                        ? "bg-[#121519] border-[#222730] text-zinc-500 opacity-55 cursor-not-allowed"
                        : "bg-[#0C0E12] border-[#2A303C] text-zinc-200 hover:border-amber-400 hover:bg-[#14181F]"
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3B: Procedimento de bancada */}
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400 font-bold flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              3B • SELECIONAR PROCEDIMENTO DE REPARO SEGURO
            </span>

            {!defectConfirmed && (
              <p className="text-xs font-mono text-zinc-500 py-4 text-center border border-dashed border-[#2A303C] rounded-md bg-[#0C0E12]">
                Confirme primeiro o defeito observado no bloco 3A.
              </p>
            )}

            {defectConfirmed && (
              <div className="flex flex-col gap-2">
                {shuffledProcedures.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    aria-disabled={isLocked}
                    onClick={() => handleChooseProcedure(opt)}
                    className={`p-3 rounded-md border text-left text-xs transition-colors ${
                      isLocked
                        ? "bg-[#121519] border-[#222730] text-zinc-500 opacity-45 cursor-not-allowed"
                        : "bg-[#0C0E12] border-[#2A303C] text-zinc-200 hover:border-sky-400 hover:bg-[#14181F]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ETAPA 4: VALIDAÇÃO DE QUALIDADE PÓS-REPARO */}
      {step === "quality" && (
        <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4 space-y-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> ETAPA 4 • INSPEÇÃO FINAL E CRITÉRIO DE QUALIDADE
            </span>
            <h4 className="text-sm font-bold text-white mt-0.5">
              O reparo foi simulado na PCI acima. Qual verificação final garante a liberação segura da OS?
            </h4>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {shuffledQualityChecks.map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-disabled={isLocked}
                onClick={() => handleChooseQualityCheck(opt)}
                className={`p-3 rounded-md border text-left text-xs transition-colors ${
                  isLocked
                    ? "bg-[#121519] border-[#222730] text-zinc-500 opacity-45 cursor-not-allowed"
                    : "bg-[#0C0E12] border-[#2A303C] text-zinc-200 hover:border-emerald-400 hover:bg-[#14181F]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* FECHAMENTO DA OS: COMPARAÇÃO ANTES vs DEPOIS + DEVOLUTIVA */}
      {step === "closed" && (
        <IndustrialClosingReport
          osCode={currentCase.serviceOrder.code}
          pointsAwarded={closingPoints}
          dimensions={{
            safety: !hadSafetyMistake,
            evidence: true,
            decision: !hadTechMistake,
            quality: true,
            inTime: true,
          }}
          closing={currentCase.closing}
          onNextCase={loadNextCase}
          extraContent={
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Estado Inicial (Com Defeito) */}
              <div className="rounded-md bg-[#0C0E12] border border-red-500/40 overflow-hidden">
                <div className="px-3 py-1.5 bg-red-950/40 border-b border-red-500/30 flex items-center justify-between text-[10px] font-mono font-bold text-red-300 uppercase">
                  <span>Estado Inicial (Defeito)</span>
                  <span>[{defectiveHotspot.designator}]</span>
                </div>
                <div
                  style={{
                    backgroundImage: `url('${currentCase.boardAssetPath}')`,
                    backgroundSize: "cover",
                  }}
                  className="h-32 flex items-center justify-center relative"
                >
                  <svg viewBox="-75 -60 150 115" className="w-44 h-28">
                    <BoardComponentGraphic
                      visualType={defectiveHotspot.visualType}
                      defectVisual={defectiveHotspot.defectVisual}
                      repaired={false}
                      designator={defectiveHotspot.designator}
                    />
                  </svg>
                </div>
                <p className="px-3 py-2 text-[11px] text-zinc-300 font-mono">
                  {currentCase.beforeLabel}
                </p>
              </div>

              {/* Estado Corrigido */}
              <div className="rounded-md bg-[#0C0E12] border border-emerald-500/40 overflow-hidden">
                <div className="px-3 py-1.5 bg-emerald-950/40 border-b border-emerald-500/30 flex items-center justify-between text-[10px] font-mono font-bold text-emerald-300 uppercase">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Estado Corrigido (Aprovado)
                  </span>
                  <span>[{defectiveHotspot.designator}]</span>
                </div>
                <div
                  style={{
                    backgroundImage: `url('${currentCase.boardAssetPath}')`,
                    backgroundSize: "cover",
                  }}
                  className="h-32 flex items-center justify-center relative"
                >
                  <svg viewBox="-75 -60 150 115" className="w-44 h-28">
                    <BoardComponentGraphic
                      visualType={defectiveHotspot.visualType}
                      defectVisual={defectiveHotspot.defectVisual}
                      repaired={true}
                      designator={defectiveHotspot.designator}
                    />
                  </svg>
                </div>
                <p className="px-3 py-2 text-[11px] text-emerald-200 font-mono">
                  {currentCase.afterLabel}
                </p>
              </div>
            </div>
          }
        />
      )}
    </div>
  );
};
