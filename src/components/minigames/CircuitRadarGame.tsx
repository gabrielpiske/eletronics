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
import { Radar, HelpCircle, CheckCircle2, XCircle, Lock } from "lucide-react";

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
        `Localizou ${node.nodeId} no esquema elétrico!`,
        newLevel
      );

      setTimeout(() => {
        setSelectedNode(null);
        setShowHint(false);
        setMissionIdx((prev) => prev + 1);
      }, 650);
    } else {
      const { delayMs } = triggerErrorPenalty(
        `Tocou em ${node.nodeId} procurando ${currentMission.targetNodeId}`,
        `⚡ Nó incorreto! Você tocou em ${node.nodeId} (${node.stageLabel})`,
        `Dica de inspeção: ${currentMission.promptHint}`
      );
      setTimeout(() => {
        setSelectedNode(null);
      }, delayMs);
    }
  };

  return (
    <div
      onPointerDownCapture={handleContainerPointerDown}
      className="w-full max-w-3xl mx-auto flex flex-col gap-4 select-none"
    >
      {/* Barra de Missão do Radar */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border-2 border-emerald-500/70 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center">
              <Radar
                className="w-5 h-5 text-emerald-400 animate-spin"
                style={{ animationDuration: "4s" }}
              />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 block">
                MISSÃO DO RADAR #{foundCount + 1}
              </span>
              <h3 className="text-base sm:text-xl font-extrabold text-white">
                {currentMission.promptTitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 flex items-center gap-1.5"
          >
            <HelpCircle className="w-4 h-4" />
            {showHint ? "Dica Ativa (-90 pts)" : "Pedir Dica"}
          </button>
        </div>

        {showHint && (
          <p className="mt-2 text-xs sm:text-sm text-amber-200 bg-amber-950/50 border border-amber-500/30 rounded-xl px-3 py-2">
            💡 <strong>Dica de Bancada:</strong> {currentMission.promptHint}
          </p>
        )}
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

      {/* Placa / Esquema Elétrico Interativo */}
      <div className="relative bg-[#071318] border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 shadow-2xl overflow-hidden">
        {/* Grade de fundo estilo folha de esquemático */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(#10B981 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />

        <div className="relative z-10 flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/20">
          <span className="text-xs font-mono text-emerald-400 font-bold">
            ESQUEMA ELÉTRICO: FONTE REGULADA + SENSOR DE LUZ
          </span>
          <span className="text-xs font-mono text-slate-400">
            Toque com precisão! Erros tiram pontos e travam o circuito.
          </span>
        </div>

        {/* Malha de Componentes Conectados */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                className={`group relative rounded-2xl p-2.5 border-2 transition-all flex flex-col items-center justify-between min-h-[118px] ${
                  isRight
                    ? "bg-emerald-900/80 border-emerald-400 scale-105 shadow-lg shadow-emerald-500/30"
                    : isWrong
                    ? "bg-red-900/80 border-red-400 scale-95"
                    : isLocked
                    ? "bg-slate-950/80 border-red-900/40 opacity-45 cursor-not-allowed"
                    : "bg-slate-900/90 border-slate-700 hover:border-emerald-400/80 hover:bg-slate-800/90 active:scale-95"
                }`}
              >
                {/* Conector de Trilha */}
                <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 font-bold">
                    Nó #{index + 1}
                  </span>
                  <span>{node.stageLabel}</span>
                </div>

                {/* Símbolo Esquemático */}
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
                        ? "#64748B"
                        : "#38BDF8"
                    }
                  />
                </div>

                {/* Feedback no Nó */}
                {isRight && (
                  <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {node.nodeId} OK!
                  </span>
                )}
                {isWrong && (
                  <span className="text-[11px] font-bold text-red-300 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5" /> Peça Errada!
                  </span>
                )}
                {!isSelected && isLocked && (
                  <span className="text-[11px] font-mono text-red-400/80 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Bloqueado
                  </span>
                )}
                {!isSelected && !isLocked && (
                  <span className="text-[11px] font-mono text-slate-400 group-hover:text-emerald-300">
                    [ Tocar para Inspecionar ]
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
