"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ShieldAlert,
  ZapOff,
  Timer,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  playMultimeterBeep,
  playBreakerTrip,
  playSafetyAlert,
} from "@/lib/soundEffects";

export type ScoreActionHandler = (
  deltaScore: number,
  isHit: boolean,
  actionMessage: string,
  newLevel?: number
) => void;

export interface ProgressivePenaltyInfo {
  points: number;
  delayMs: number;
  badge: string;
}

export function getProgressivePenalty(
  consecutiveErrors: number
): ProgressivePenaltyInfo {
  if (consecutiveErrors <= 1) {
    return {
      points: -40,
      delayMs: 2500,
      badge: "FALHA 1 • DISJUNTOR (-40 PTS)",
    };
  }
  if (consecutiveErrors === 2) {
    return {
      points: -70,
      delayMs: 4000,
      badge: "FALHA 2 SEGUIDA • PENALIDADE ELEVADA (-70 PTS)",
    };
  }
  return {
    points: -110,
    delayMs: 6000,
    badge: `FALHA ${consecutiveErrors} SEGUIDA • BLOQUEIO CRÍTICO (-110 PTS)`,
  };
}

const AUTOCLICK_WINDOW_MS = 480;
const AUTOCLICK_MIN_CLICKS = 4;
const AUTOCLICK_LOCK_MS = 5000;
const AUTOCLICK_PENALTY_PTS = -90;

export function usePenaltySystem(
  onScoreAction: ScoreActionHandler,
  onAutoclickDetected?: () => void
) {
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [lockRemainingMs, setLockRemainingMs] = useState<number>(0);
  const [totalLockMs, setTotalLockMs] = useState<number>(2500);
  const [lockReason, setLockReason] = useState<
    "error" | "autoclick" | "safety" | null
  >(null);
  const [lastPenaltyPts, setLastPenaltyPts] = useState<number>(-80);
  const [lastBadge, setLastBadge] = useState<string>("");
  const [lastErrorTitle, setLastErrorTitle] = useState<string>("");
  const [lastErrorDetail, setLastErrorDetail] = useState<string>("");

  const consecutiveErrorsRef = useRef<number>(0);
  const lockEndsAtRef = useRef<number>(0);
  const clickTimestampsRef = useRef<number[]>([]);
  const lastAutoclickAtRef = useRef<number>(0);

  const isLocked = lockRemainingMs > 0;

  useEffect(() => {
    if (lockRemainingMs <= 0) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, lockEndsAtRef.current - Date.now());
      setLockRemainingMs(remaining);
      if (remaining <= 0) {
        setLockReason(null);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [lockRemainingMs > 0]);

  const triggerAutoclickLock = useCallback(() => {
    const now = Date.now();
    const shouldDeductScore = now - lastAutoclickAtRef.current > 1800;
    lastAutoclickAtRef.current = now;
    clickTimestampsRef.current = [];

    const nextErr = consecutiveErrorsRef.current + 1;
    consecutiveErrorsRef.current = nextErr;
    setConsecutiveErrors(nextErr);

    lockEndsAtRef.current = now + AUTOCLICK_LOCK_MS;
    setTotalLockMs(AUTOCLICK_LOCK_MS);
    setLockRemainingMs(AUTOCLICK_LOCK_MS);
    setLockReason("autoclick");
    setLastPenaltyPts(AUTOCLICK_PENALTY_PTS);
    setLastBadge("PROTEÇÃO ANTI-AUTOCLIQUE ATIVADA");
    setLastErrorTitle(
      `Sobrecarga por cliques repetitivos (${AUTOCLICK_PENALTY_PTS} pts)`
    );
    setLastErrorDetail(
      "Frequência de cliques incompatível detectada. Aguarde o rearme do disjuntor."
    );

    if (shouldDeductScore) {
      playSafetyAlert();
      onScoreAction(
        AUTOCLICK_PENALTY_PTS,
        false,
        `Sobrecarga por autoclique (${AUTOCLICK_PENALTY_PTS} pts)`
      );
    }

    if (onAutoclickDetected) {
      onAutoclickDetected();
    }
  }, [onScoreAction, onAutoclickDetected]);

  const handleContainerPointerDown = useCallback(() => {
    const now = Date.now();
    const recent = clickTimestampsRef.current.filter(
      (ts) => now - ts < AUTOCLICK_WINDOW_MS
    );
    recent.push(now);
    clickTimestampsRef.current = recent;

    if (recent.length >= AUTOCLICK_MIN_CLICKS) {
      triggerAutoclickLock();
    }
  }, [triggerAutoclickLock]);

  const guardClick = useCallback((): boolean => {
    const now = Date.now();
    if (lockEndsAtRef.current > now) {
      return false;
    }
    return true;
  }, []);

  const registerHit = useCallback(
    (points: number, actionMessage: string, newLevel?: number) => {
      consecutiveErrorsRef.current = 0;
      setConsecutiveErrors(0);
      playMultimeterBeep();
      onScoreAction(points, true, actionMessage, newLevel);
    },
    [onScoreAction]
  );

  const triggerErrorPenalty = useCallback(
    (
      actionMessage: string,
      errorTitle: string,
      errorDetail: string,
      newLevel?: number,
      severity: "error" | "safety" = "error"
    ): ProgressivePenaltyInfo & { consecutiveErrors: number } => {
      const nextErr = consecutiveErrorsRef.current + 1;
      consecutiveErrorsRef.current = nextErr;
      setConsecutiveErrors(nextErr);

      if (severity === "safety") {
        playSafetyAlert();
      } else {
        playBreakerTrip();
      }

      const penalty = getProgressivePenalty(nextErr);
      const now = Date.now();

      lockEndsAtRef.current = Math.max(
        lockEndsAtRef.current,
        now + penalty.delayMs
      );
      const effectiveDelay = lockEndsAtRef.current - now;

      setTotalLockMs(effectiveDelay);
      setLockRemainingMs(effectiveDelay);
      setLockReason(severity);
      setLastPenaltyPts(penalty.points);
      setLastBadge(
        severity === "safety"
          ? `ALERTA DE SEGURANÇA NA SIMULAÇÃO (${penalty.points} PTS)`
          : penalty.badge
      );
      setLastErrorTitle(errorTitle);
      setLastErrorDetail(errorDetail);

      onScoreAction(
        penalty.points,
        false,
        `${actionMessage} (${penalty.points} pts)`,
        newLevel
      );

      return {
        ...penalty,
        delayMs: effectiveDelay,
        consecutiveErrors: nextErr,
      };
    },
    [onScoreAction]
  );

  return {
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
  };
}

interface PenaltyBannerProps {
  isLocked: boolean;
  lockRemainingMs: number;
  totalLockMs: number;
  lockReason: "error" | "autoclick" | "safety" | null;
  consecutiveErrors: number;
  lastPenaltyPts: number;
  lastBadge: string;
  lastErrorTitle: string;
  lastErrorDetail: string;
}

export const PenaltyBanner: React.FC<PenaltyBannerProps> = ({
  isLocked,
  lockRemainingMs,
  totalLockMs,
  lockReason,
  consecutiveErrors,
  lastPenaltyPts,
  lastBadge,
  lastErrorTitle,
  lastErrorDetail,
}) => {
  const [showDetail, setShowDetail] = useState<boolean>(false);

  if (!isLocked) return null;

  const progressPct = Math.max(
    0,
    Math.min(100, (lockRemainingMs / Math.max(1, totalLockMs)) * 100)
  );
  const secondsText = (lockRemainingMs / 1000).toFixed(1).replace(".", ",");
  const isAutoclick = lockReason === "autoclick";
  const isSafety = lockReason === "safety";

  return (
    <div
      className={`rounded-xl border-2 border-l-4 p-4 text-zinc-100 shadow-lg ${
        isSafety
          ? "bg-[#22190D] border-amber-500/80 border-l-amber-400"
          : "bg-[#1C1113] border-red-500/80 border-l-red-500"
      }`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
              isSafety
                ? "bg-amber-500/20 border-amber-400/50 text-amber-300"
                : "bg-red-500/20 border-red-500/40 text-red-400"
            }`}
          >
            {isAutoclick ? (
              <AlertOctagon className="w-5 h-5" />
            ) : isSafety ? (
              <ShieldAlert className="w-5 h-5" />
            ) : (
              <ZapOff className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-[#0C0E12] border font-extrabold ${
                  isSafety
                    ? "border-amber-400/50 text-amber-300"
                    : "border-red-500/40 text-red-300"
                }`}
              >
                {lastBadge}
              </span>
              {consecutiveErrors >= 2 && !isAutoclick && (
                <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30 font-extrabold">
                  Reincidência {consecutiveErrors}x
                </span>
              )}
            </div>
            <p className="font-extrabold text-sm sm:text-base text-white mt-1">
              {lastErrorTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastErrorDetail && (
            <button
              type="button"
              onClick={() => setShowDetail((v) => !v)}
              className="px-2.5 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#181B20] border border-[#2A303C] text-xs font-mono font-bold text-amber-300 flex items-center gap-1"
            >
              <span>{showDetail ? "Ocultar dica" : "Ver dica"}</span>
              {showDetail ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}

          <div
            className={`flex items-center gap-2.5 bg-[#0C0E12] px-3.5 py-2 rounded-lg border font-mono ${
              isSafety ? "border-amber-400/60" : "border-red-500/50"
            }`}
          >
            <span
              className={`text-sm sm:text-base font-black ${
                isSafety ? "text-amber-300" : "text-red-400"
              }`}
            >
              {lastPenaltyPts} pts
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-1">
              <Timer className="w-4 h-4" />
              {secondsText}s
            </span>
          </div>
        </div>
      </div>

      {lastErrorDetail && showDetail && (
        <p className="text-sm text-zinc-200 mt-2.5 bg-[#0C0E12] rounded-lg px-3.5 py-2.5 border border-[#2A303C] leading-snug">
          {lastErrorDetail}
        </p>
      )}

      {/* Barra de Progresso do Delay */}
      <div className="w-full h-2.5 bg-[#0C0E12] rounded-sm overflow-hidden mt-3">
        <div
          style={{ width: `${progressPct}%` }}
          className={`h-full transition-all duration-75 ${
            isSafety ? "bg-amber-400" : "bg-red-500"
          }`}
        />
      </div>
    </div>
  );
};
