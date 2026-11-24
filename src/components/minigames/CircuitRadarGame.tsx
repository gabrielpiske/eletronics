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
      const pts = showHint ? 45 : 95;
      const newLevel = Math.floor(nextFound / 6) + 1;
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
      className="w-full max-w-4xl mx-auto flex flex-col gap-4 select-none"
    >
      {/* Seletor de Topologia Esquemática */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-[#181B20] border border-[#2A303C] rounded-xl px-4 py-3">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-mono font-bold text-zinc-300">
          <Layers className="w-4 h-4 text-[#F59E0B]" />
          <span>PLACA EM INSPEÇÃO:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {RADAR_TOPOLOGIES.map((topo, idx) => (
            <button
              key={topo.id}
              type="button"
              onClick={() =>
                handleSwitchTopology(idx, challenge.targetNode.nodeId)
              }
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold border transition-colors ${
                topologyIdx === idx
                  ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                  : "bg-[#0C0E12] border-[#2A303C] text-zinc-300 hover:text-white"
              }`}
            >
              0{idx + 1}. {topo.title.split("&")[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Barra de Inspeção Procedural */}
      <div className="bg-[#181B20] border border-[#2A303C] rounded-xl px-5 py-4 shadow-md">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex-1">
            <span className="text-xs font-mono uppercase tracking-wider text-sky-400 font-extrabold block">
              ORDEM DE INSPEÇÃO #{foundCount + 1} •{" "}
              {challenge.promptType === "symptom"
                ? "DIAGNÓSTICO DE FALHA"
                : challenge.promptType === "function"
                ? "FUNÇÃO NO ESTÁGIO"
                : "BUSCA POR DESIGNADOR"}
            </span>
            <h3 className="text-base sm:text-lg font-extrabold text-amber-400 mt-1 leading-snug">
              {challenge.promptTitle}
            </h3>
          </div>

          <button
            type="button"
            onClick={() => setShowHint((v) => !v)}
            className="text-xs sm:text-sm font-mono font-bold px-3.5 py-2 rounded-lg bg-[#0C0E12] hover:bg-[#14181F] text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shrink-0"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            {showHint ? "Ocultar Dica (-50 pts)" : "Ver Dica (-50 pts)"}
          </button>
        </div>

        {showHint && (
          <p className="mt-3 text-sm text-zinc-100 bg-[#0C0E12] border border-amber-500/35 rounded-lg px-3.5 py-2.5 font-mono">
            💡 {challenge.promptHint}
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
      <div className="bg-[#0C0E12] border border-[#2A303C] rounded-xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-[#222730]">
          <span className="text-xs sm:text-sm font-mono text-zinc-200 font-extrabold uppercase">
            DIAGRAMA: {challenge.topology.title}
          </span>
          <span className="text-xs font-mono text-amber-400 font-bold">
            {challenge.topology.nodes.length} NÓS ATIVOS
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
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
                className={`rounded-xl p-3 border-2 transition-colors flex flex-col items-center justify-between min-h-[128px] ${
                  isRight
                    ? "bg-[#12241D] border-emerald-400"
                    : isWrong
                    ? "bg-[#241316] border-red-500"
                    : isLocked
                    ? "bg-[#121519] border-[#222730] opacity-45 cursor-not-allowed"
                    : "bg-[#16191F] border-[#262B35] hover:border-amber-400"
                }`}
              >
                <div className="w-full flex items-center justify-between text-xs font-mono text-zinc-300">
                  <span className="px-2 py-0.5 rounded bg-[#0C0E12] text-amber-400 font-extrabold">
                    #{index + 1}
                  </span>
                  <span className="truncate max-w-[105px] font-semibold">
                    {node.stageLabel}
                  </span>
                </div>

                <div className="my-1.5">
                  <ElectronicSymbolSVG
                    symbolId={node.symbol}
                    className="w-28 h-20"
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
                  <span className="text-xs font-mono font-extrabold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {node.nodeId} OK
                  </span>
                )}
                {isWrong && (
                  <span className="text-xs font-mono font-extrabold text-red-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Incorreto
                  </span>
                )}
                {!isSelected && isLocked && (
                  <span className="text-xs font-mono text-red-400/80 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Bloqueado
                  </span>
                )}
                {!isSelected && !isLocked && (
                  <span className="text-xs font-mono font-bold text-zinc-400">
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
