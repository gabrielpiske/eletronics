"use client";

import React, { useState } from "react";
import { RADAR_MISSIONS, RadarMission } from "@/data/electronicsData";
import {
  ElectronicSymbolSVG,
  SymbolId,
} from "@/components/ElectronicSymbolSVG";
import {
  usePenaltySystem,
  PenaltyBanner,
} from "@/components/minigames/PenaltySystem";
import { HelpCircle, CheckCircle2, XCircle, Lock } from "lucide-react";

interface CircuitRadarGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

interface CircuitNodeSpot {
  nodeId: string;
  symbol: SymbolId;
  stageLabel: string;
}

const CIRCUIT_NODES: CircuitNodeSpot[] = [
  { nodeId: "F1", symbol: "fuse", stageLabel: "Entrada Rede" },
  { nodeId: "T1", symbol: "transformer", stageLabel: "Rebaixamento" },
  { nodeId: "D1", symbol: "diode", stageLabel: "Retificação" },
  { nodeId: "C1", symbol: "electrolytic_cap", stageLabel: "Filtro DC" },
  { nodeId: "ZD1", symbol: "zener", stageLabel: "Regulação" },
  { nodeId: "SW1", symbol: "switch", stageLabel: "Comando" },
  { nodeId: "LDR1", symbol: "ldr", stageLabel: "Sensor" },
  { nodeId: "Q1", symbol: "transistor_npn", stageLabel: "Chaveamento" },
  { nodeId: "R1", symbol: "resistor", stageLabel: "Proteção Carga" },
  { nodeId: "LED1", symbol: "led", stageLabel: "Saída Visual" },
  { nodeId: "GND1", symbol: "gnd", stageLabel: "Referência 0V" },
];

export const CircuitRadarGame: React.FC<CircuitRadarGameProps> = ({
  onScoreAction,
}) => {
  const [missions] = useState<RadarMission[]>(() =>
    [...RADAR_MISSIONS].sort(() => Math.random() - 0.5)
  );
  const [missionIdx, setMissionIdx] = useState<number>(0);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [selectedNode, setSelectedNode] = useState<{
    nodeId: string;
    correct: boolean;
  } | null>(null);
  const [foundCount, setFoundCount] = useState<number>(0);

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
    setSelectedNode(null);
  });

  const currentMission = missions[missionIdx % missions.length];

  const handleNodeClick = (node: CircuitNodeSpot) => {
    if (!guardClick() || isLocked || selectedNode) return;

    const isCorrect = node.nodeId === currentMission.targetNodeId;
    setSelectedNode({ nodeId: node.nodeId, correct: isCorrect });

    if (isCorrect) {
      const nextFound = foundCount + 1;
      setFoundCount(nextFound);
      const pts = showHint ? 130 : 220;
      const newLevel = Math.floor(nextFound / 4) + 1;
      registerHit(
        pts,
        `Localizou ${node.nodeId} no esquema elétrico`,
        newLevel
      );

      setTimeout(() => {
        setSelectedNode(null);
        setShowHint(false);
        setMissionIdx((prev) => prev + 1);
      }, 650);
    } else {
      const { delayMs } = triggerErrorPenalty(
        `Selecionou ${node.nodeId} buscando ${currentMission.targetNodeId}`,
        `Nó incorreto: ${node.nodeId} (${node.stageLabel})`,
        `Referência: ${currentMission.promptHint}`
      );
      setTimeout(() => {
        setSelectedNode(null);
      }, delayMs);
    }
  };

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-3xl mx-auto flex flex-col gap-3.5 select-none"
    >
      {/* Barra de Inspeção */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              INSPEÇÃO DE ESQUEMA • ORDEM #{foundCount + 1}
            </span>
            <h3 className="text-sm sm:text-lg font-bold text-amber-400">
              {currentMission.promptTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="text-xs font-mono font-semibold px-3 py-1.5 rounded bg-[#0C0E12] hover:bg-[#14181F] text-zinc-300 border border-[#2A303C] flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            {showHint ? "Dica ativa (-90 pts)" : "Consultar Dica"}
          </button>
        </div>

        {showHint && (
          <p className="mt-2 text-xs text-zinc-300 bg-[#0C0E12] border border-[#2A303C] rounded px-3 py-1.5 font-mono">
            Nota técnica: {currentMission.promptHint}
          </p>
        )}
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

      {/* Diagrama Esquemático */}
      <div className="bg-[#0C0E12] border border-[#2A303C] rounded-lg p-4">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222730]">
          <span className="text-[11px] font-mono text-zinc-400 font-semibold">
            DIAGRAMA: FONTE REGULADA + SENSOR FOTOELÉTRICO
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            11 nós ativos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {CIRCUIT_NODES.map((node, index) => {
            const isSelected = selectedNode?.nodeId === node.nodeId;
            const isRight = isSelected && selectedNode?.correct;
            const isWrong = isSelected && !selectedNode?.correct;

            return (
              <button
                key={node.nodeId}
                type="button"
                aria-disabled={isLocked}
                onClick={() => handleNodeClick(node)}
                className={`rounded-md p-2.5 border transition-colors flex flex-col items-center justify-between min-h-[112px] ${
                  isRight
                    ? "bg-[#12241D] border-emerald-400"
                    : isWrong
                    ? "bg-[#241316] border-red-500"
                    : isLocked
                    ? "bg-[#121519] border-[#222730] opacity-45 cursor-not-allowed"
                    : "bg-[#16191F] border-[#262B35] hover:border-amber-400/80"
                }`}
              >
                <div className="w-full flex items-center justify-between text-[10px] font-mono text-zinc-400">
                  <span className="px-1.5 py-0.5 rounded bg-[#0C0E12] text-zinc-300 font-bold">
                    #{index + 1}
                  </span>
                  <span>{node.stageLabel}</span>
                </div>

                <div className="my-1">
                  <ElectronicSymbolSVG
                    symbolId={node.symbol}
                    className="w-24 h-16"
                    strokeColor={
                      isRight
                        ? "#34D399"
                        : isWrong
                        ? "#F87171"
                        : isLocked
                        ? "#52525B"
                        : "#38BDF8"
                    }
                  />
                </div>

                {isRight && (
                  <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {node.nodeId} OK
                  </span>
                )}
                {isWrong && (
                  <span className="text-[11px] font-mono font-bold text-red-400 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Incorreto
                  </span>
                )}
                {!isSelected && isLocked && (
                  <span className="text-[10px] font-mono text-red-400/80 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Bloqueado
                  </span>
                )}
                {!isSelected && !isLocked && (
                  <span className="text-[10px] font-mono text-zinc-500">
                    Inspecionar
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
