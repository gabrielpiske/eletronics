"use client";

import React, { useState, useCallback } from "react";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import {
  usePenaltySystem,
  PenaltyBanner,
} from "@/components/minigames/PenaltySystem";
import {
  RADAR_TOPOLOGIES,
  CircuitNodeSpot,
  DynamicRadarChallenge,
  generateProceduralRadarChallenge,
} from "@/lib/challengeGenerator";
import { HelpCircle, CheckCircle2, XCircle, Lock, Layers } from "lucide-react";

interface CircuitRadarGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

export const CircuitRadarGame: React.FC<CircuitRadarGameProps> = ({
  onScoreAction,
}) => {
  const [topologyIdx, setTopologyIdx] = useState<number>(0);
  const [challenge, setChallenge] = useState<DynamicRadarChallenge>(() =>
    generateProceduralRadarChallenge(0)
  );
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

  const handleSwitchTopology = useCallback(
    (newIndex: number, prevNodeId?: string) => {
      setTopologyIdx(newIndex);
      setSelectedNode(null);
      setShowHint(false);
      setChallenge(generateProceduralRadarChallenge(newIndex, prevNodeId));
    },
    []
  );

  const handleNodeClick = (node: CircuitNodeSpot) => {
    if (!guardClick() || isLocked || selectedNode) return;

    const isCorrect = node.nodeId === challenge.targetNode.nodeId;
    setSelectedNode({ nodeId: node.nodeId, correct: isCorrect });

    if (isCorrect) {
      const nextFound = foundCount + 1;
      setFoundCount(nextFound);
      const pts = showHint ? 130 : 220;
      const newLevel = Math.floor(nextFound / 3) + 1;
      registerHit(
        pts,
        `Localizou ${node.nodeId} (${node.stageLabel})`,
        newLevel
      );

      setTimeout(() => {
        setSelectedNode(null);
        setShowHint(false);
        // Rotate topology every 3 hits so students inspect all 35 components across Analog, Digital & Power boards
        const nextTopo =
          nextFound % 3 === 0
            ? (topologyIdx + 1) % RADAR_TOPOLOGIES.length
            : topologyIdx;
        setTopologyIdx(nextTopo);
        setChallenge(
          generateProceduralRadarChallenge(nextTopo, node.nodeId)
        );
      }, 650);
    } else {
      const { delayMs } = triggerErrorPenalty(
        `Selecionou ${node.nodeId} buscando ${challenge.targetNode.nodeId}`,
        `Nó incorreto: ${node.nodeId} (${node.stageLabel})`,
        `Referência: ${challenge.promptHint}`
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
      {/* Seletor de Topologia Esquemática */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#181B20] border border-[#2A303C] rounded-lg px-3.5 py-2">
        <div className="flex items-center gap-1.5 text-xs font-mono text-[#94A3B8]">
          <Layers className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>PLACA EM INSPEÇÃO:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {RADAR_TOPOLOGIES.map((topo, idx) => (
            <button
              key={topo.id}
              type="button"
              onClick={() =>
                handleSwitchTopology(idx, challenge.targetNode.nodeId)
              }
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                topologyIdx === idx
                  ? "bg-[#0047B6] border-[#0057E0] text-white"
                  : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
              }`}
            >
              0{idx + 1}. {topo.title.split("&")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Inspeção Procedural */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 block">
              ORDEM DE INSPEÇÃO #{foundCount + 1} • MODO:{" "}
              {challenge.promptType === "symptom"
                ? "DIAGNÓSTICO DE FALHA"
                : challenge.promptType === "function"
                ? "FUNÇÃO NO ESTÁGIO"
                : "BUSCA POR DESIGNADOR"}
            </span>
            <h3 className="text-sm sm:text-base font-bold text-amber-400 mt-0.5 leading-snug">
              {challenge.promptTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowHint(true)}
            className="text-xs font-mono font-semibold px-3 py-1.5 rounded bg-[#0C0E12] hover:bg-[#14181F] text-zinc-300 border border-[#2A303C] flex items-center gap-1.5 shrink-0"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            {showHint ? "Dica ativa (-90 pts)" : "Consultar Dica"}
          </button>
        </div>

        {showHint && (
          <p className="mt-2 text-xs text-zinc-300 bg-[#0C0E12] border border-[#2A303C] rounded px-3 py-1.5 font-mono">
            Nota técnica: {challenge.promptHint}
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
          <span className="text-[11px] font-mono text-zinc-400 font-semibold uppercase">
            DIAGRAMA: {challenge.topology.title} — {challenge.topology.subtitle}
          </span>
          <span className="text-[11px] font-mono text-zinc-500">
            {challenge.topology.nodes.length} nós ativos
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {challenge.topology.nodes.map((node, index) => {
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
                  <span className="truncate max-w-[95px]">
                    {node.stageLabel}
                  </span>
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
