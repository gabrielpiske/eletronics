"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ELECTRONIC_COMPONENTS,
  ElectronicComponentItem,
} from "@/data/electronicsData";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import { Zap, Flame, AlertTriangle, PackageCheck } from "lucide-react";

interface ConveyorGameProps {
  onScoreAction: (
    deltaScore: number,
    isHit: boolean,
    actionMessage: string,
    newLevel?: number
  ) => void;
}

interface BinOption {
  id: string;
  title: string;
  subtitle: string;
  colorClass: string;
}

export const ConveyorGame: React.FC<ConveyorGameProps> = ({ onScoreAction }) => {
  const [currentComp, setCurrentComp] = useState<ElectronicComponentItem>(
    () => ELECTRONIC_COMPONENTS[0]
  );
  const [mode, setMode] = useState<"category" | "direct">("category");
  const [bins, setBins] = useState<BinOption[]>([]);
  const [beltProgress, setBeltProgress] = useState<number>(8); // 0 to 100%
  const [streak, setStreak] = useState<number>(0);
  const [sortedCount, setSortedCount] = useState<number>(0);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
    detail: string;
  } | null>(null);

  const lockRef = useRef(false);

  const spawnNextItem = useCallback((nextCount: number) => {
    lockRef.current = false;
    const randomComp =
      ELECTRONIC_COMPONENTS[
        Math.floor(Math.random() * ELECTRONIC_COMPONENTS.length)
      ];
    setCurrentComp(randomComp);
    setBeltProgress(6);

    // Alterna entre classificar a Família do Componente e identificar Nome + Letra na Placa
    const nextMode = nextCount % 2 === 0 ? "direct" : "category";
    setMode(nextMode);

    if (nextMode === "category") {
      setBins([
        {
          id: "passivo",
          title: "PASSIVOS",
          subtitle: "R, C, L, LDR, Termistor",
          colorClass:
            "from-sky-600 to-blue-700 border-sky-400 hover:from-sky-500 hover:to-blue-600",
        },
        {
          id: "semicondutor",
          title: "SEMICONDUTORES",
          subtitle: "Diodo, LED, Zener, Transistor, CI",
          colorClass:
            "from-amber-600 to-orange-700 border-amber-400 hover:from-amber-500 hover:to-orange-600",
        },
        {
          id: "protecao_energia",
          title: "PROTEÇÃO & ENERGIA",
          subtitle: "Fusível, Chave, Terra, Trafo, Fonte",
          colorClass:
            "from-emerald-600 to-teal-700 border-emerald-400 hover:from-emerald-500 hover:to-teal-600",
        },
      ]);
    } else {
      // Escolhe 2 distratores diferentes
      const others = ELECTRONIC_COMPONENTS.filter(
        (c) => c.id !== randomComp.id
      ).sort(() => Math.random() - 0.5);
      const choices = [randomComp, others[0], others[1]].sort(
        () => Math.random() - 0.5
      );
      const colors = [
        "from-indigo-600 to-blue-700 border-indigo-400",
        "from-purple-600 to-fuchsia-700 border-purple-400",
        "from-cyan-600 to-teal-700 border-cyan-400",
      ];
      setBins(
        choices.map((c, idx) => ({
          id: c.id,
          title: c.shortName,
          subtitle: `Letra na Placa: [ ${c.boardLetter} ]`,
          colorClass: colors[idx],
        }))
      );
    }
  }, []);

  useEffect(() => {
    spawnNextItem(0);
  }, [spawnNextItem]);

  // Movimento da esteira
  useEffect(() => {
    const speedStep = Math.min(2.6, 1.15 + Math.floor(streak / 3) * 0.25);
    const timer = setInterval(() => {
      if (lockRef.current) return;
      setBeltProgress((prev) => {
        if (prev >= 96) {
          // Peça caiu da esteira!
          lockRef.current = true;
          setStreak(0);
          setFeedback({
            ok: false,
            text: "⚠️ Peça caiu da esteira!",
            detail: `Era: ${currentComp.name} (${currentComp.boardLetter})`,
          });
          onScoreAction(
            -40,
            false,
            `Deixou ${currentComp.shortName} cair da esteira!`
          );
          setTimeout(() => {
            setFeedback(null);
            spawnNextItem(sortedCount + 1);
          }, 950);
          return 98;
        }
        return prev + speedStep;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [streak, currentComp, sortedCount, onScoreAction, spawnNextItem]);

  const handleSelectBin = (binId: string) => {
    if (lockRef.current) return;
    lockRef.current = true;

    const isCorrect =
      mode === "category"
        ? binId === currentComp.category
        : binId === currentComp.id;

    const nextCount = sortedCount + 1;
    setSortedCount(nextCount);
    const newLevel = Math.floor(nextCount / 5) + 1;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      const multiplier = Math.min(4, 1 + Math.floor(newStreak / 3));
      const speedBonus = Math.round((100 - beltProgress) * 1.2);
      const points = (120 + speedBonus) * multiplier;

      setFeedback({
        ok: true,
        text: `✅ +${points} pts (${multiplier}x)! ${currentComp.name} [${currentComp.boardLetter}]`,
        detail: currentComp.basicFunction,
      });

      onScoreAction(
        points,
        true,
        `Classificou ${currentComp.shortName} (${multiplier}x Combo!)`,
        newLevel
      );
    } else {
      setStreak(0);
      setFeedback({
        ok: false,
        text: `⚡ CURTO! Era ${currentComp.name} [${currentComp.boardLetter}]`,
        detail: `${currentComp.categoryLabel}: ${currentComp.basicFunction}`,
      });

      onScoreAction(
        -50,
        false,
        `Curto ao classificar ${currentComp.shortName}!`,
        newLevel
      );
    }

    setTimeout(() => {
      setFeedback(null);
      spawnNextItem(nextCount);
    }, 850);
  };

  const multiplier = Math.min(4, 1 + Math.floor(streak / 3));

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4 select-none">
      {/* Cabeçalho da Esteira */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-700/80 rounded-2xl px-4 py-3">
        <div className="flex items-center gap-2">
          <PackageCheck className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-bold text-slate-200">
            Peças na Bancada: <span className="text-sky-400">{sortedCount}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-bold flex items-center gap-1">
            <Flame className="w-4 h-4 text-amber-400" />
            Velocidade {multiplier}x (Combo: {streak})
          </span>
        </div>
      </div>

      {/* Instrução da Rodada */}
      <div className="text-center bg-slate-800/70 border border-slate-700 rounded-xl py-2 px-3">
        <p className="text-xs uppercase tracking-widest text-sky-400 font-bold">
          {mode === "direct"
            ? "🎯 IDENTIFIQUE O SÍMBOLO E SUA LETRA NA PLACA"
            : "🏭 CLASSIFIQUE A FAMÍLIA DESTE COMPONENTE"}
        </p>
        <p className="text-xs text-slate-300 mt-0.5">
          Toque na caixa coletora certa antes que o componente caia no fim da esteira!
        </p>
      </div>

      {/* Pista da Esteira Industrial */}
      <div className="relative bg-slate-950 border-2 border-slate-700 rounded-3xl p-5 overflow-hidden shadow-2xl min-h-[215px] flex flex-col justify-between">
        {/* Alerta de Fim de Esteira */}
        <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-red-600/35 to-transparent flex items-center justify-center pointer-events-none">
          <AlertTriangle className="w-5 h-5 text-red-400 animate-bounce" />
        </div>

        {/* Caixa com o Símbolo se movendo na esteira */}
        <div className="relative w-full h-36 flex items-center">
          <div
            style={{
              left: `${Math.min(72, Math.max(2, beltProgress * 0.72))}%`,
              transition: "left 95ms linear",
            }}
            className="absolute bg-slate-900 border-2 border-sky-400/80 shadow-lg shadow-sky-500/20 rounded-2xl px-5 py-3 flex flex-col items-center justify-center"
          >
            <ElectronicSymbolSVG
              symbolId={currentComp.id}
              className="w-28 h-20"
            />
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mt-1">
              Unidade: {currentComp.unit}
            </span>
          </div>
        </div>

        {/* Rolos da Esteira */}
        <div className="w-full h-5 bg-slate-800 border-t-2 border-b-2 border-slate-600 rounded-full flex items-center justify-around px-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-slate-500 animate-spin"
              style={{ animationDuration: `${1.2 / multiplier}s` }}
            />
          ))}
        </div>
      </div>

      {/* Feedback Rápido */}
      {feedback && (
        <div
          className={`rounded-2xl px-4 py-3 border text-center transition-all ${
            feedback.ok
              ? "bg-emerald-950/90 border-emerald-400 text-emerald-200"
              : "bg-red-950/90 border-red-400 text-red-200"
          }`}
        >
          <p className="font-extrabold text-sm sm:text-base">{feedback.text}</p>
          <p className="text-xs opacity-90 mt-0.5">{feedback.detail}</p>
        </div>
      )}

      {/* 3 Caixas Coletoras (Bins) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {bins.map((bin) => (
          <button
            key={bin.id}
            onClick={() => handleSelectBin(bin.id)}
            className={`bg-gradient-to-br ${bin.colorClass} border-2 rounded-2xl p-4 text-left shadow-lg active:scale-95 transition-transform flex flex-col justify-between min-h-[96px]`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider bg-black/30 px-2 py-0.5 rounded text-white/90">
                COLETOR
              </span>
              <Zap className="w-4 h-4 text-white/80" />
            </div>
            <div className="mt-2">
              <p className="text-base sm:text-lg font-extrabold text-white leading-tight">
                {bin.title}
              </p>
              <p className="text-xs text-white/85 mt-0.5 font-medium">
                {bin.subtitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
