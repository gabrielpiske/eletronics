"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ShieldAlert, ZapOff, Timer, AlertOctagon } from "lucide-react";

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
      points: -80,
      delayMs: 2500,
      badge: "1º Curto-Circuito (-80 pts)",
    };
  }
  if (consecutiveErrors === 2) {
    return {
      points: -120,
      delayMs: 4000,
      badge: "2º Curto Seguido • Penalidade Aumentada (-120 pts)",
    };
  }
  return {
    points: -180,
    delayMs: 6000,
    badge: `${consecutiveErrors}º Curto Seguido • Disjuntor Crítico (-180 pts)`,
  };
}

const AUTOCLICK_WINDOW_MS = 480;
const AUTOCLICK_MIN_CLICKS = 4;
const AUTOCLICK_LOCK_MS = 5000;
const AUTOCLICK_PENALTY_PTS = -150;

export function usePenaltySystem(
  onScoreAction: ScoreActionHandler,
  onAutoclickDetected?: () => void
) {
  const [consecutiveErrors, setConsecutiveErrors] = useState<number>(0);
  const [lockRemainingMs, setLockRemainingMs] = useState<number>(0);
  const [totalLockMs, setTotalLockMs] = useState<number>(2500);
  const [lockReason, setLockReason] = useState<"error" | "autoclick" | null>(
    null
  );
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
    // Evita disparar múltiplas deduções no mesmo segundo se o autoclicker estiver em alta frequência
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
    setLastBadge("🚨 PROTEÇÃO ANTI-AUTOCLIQUE ATIVADA");
    setLastErrorTitle(
      `Sobrecarga por cliques ultrarrápidos (${AUTOCLICK_PENALTY_PTS} pts)!`
    );
    setLastErrorDetail(
      "Cliques em velocidade de autoclicker/spam desarmaram o disjuntor da bancada. Aguarde o rearme e jogue analisando cada questão."
    );

    if (shouldDeductScore) {
      onScoreAction(
        AUTOCLICK_PENALTY_PTS,
        false,
        `🚨 Sobrecarga por autoclique detectada! (${AUTOCLICK_PENALTY_PTS} pts)`
      );
    }

    if (onAutoclickDetected) {
      onAutoclickDetected();
    }
  }, [onScoreAction, onAutoclickDetected]);

  // Registra qualquer toque/clique na área do minigame (mesmo durante bloqueios) para detectar autoclique
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

  // Verifica se a ação do botão pode prosseguir
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
      onScoreAction(points, true, actionMessage, newLevel);
    },
    [onScoreAction]
  );

  const triggerErrorPenalty = useCallback(
    (
      actionMessage: string,
      errorTitle: string,
      errorDetail: string,
      newLevel?: number
    ): ProgressivePenaltyInfo & { consecutiveErrors: number } => {
      const nextErr = consecutiveErrorsRef.current + 1;
      consecutiveErrorsRef.current = nextErr;
      setConsecutiveErrors(nextErr);

      const penalty = getProgressivePenalty(nextErr);
      const now = Date.now();

      lockEndsAtRef.current = Math.max(
        lockEndsAtRef.current,
        now + penalty.delayMs
      );
      const effectiveDelay = lockEndsAtRef.current - now;

      setTotalLockMs(effectiveDelay);
      setLockRemainingMs(effectiveDelay);
      setLockReason("error");
      setLastPenaltyPts(penalty.points);
      setLastBadge(penalty.badge);
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
  lockReason: "error" | "autoclick" | null;
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
  if (!isLocked) return null;

  const progressPct = Math.max(
    0,
    Math.min(100, (lockRemainingMs / Math.max(1, totalLockMs)) * 100)
  );
  const secondsText = (lockRemainingMs / 1000).toFixed(1).replace(".", ",");
  const isAutoclick = lockReason === "autoclick";

  return (
    <div
      className={`rounded-2xl p-4 border-2 shadow-2xl transition-all animate-pulse ${
        isAutoclick
          ? "bg-gradient-to-r from-rose-950 via-red-950 to-orange-950 border-amber-400 text-amber-100"
          : "bg-gradient-to-r from-red-950 via-slate-950 to-rose-950 border-red-500 text-red-100"
      }`}
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isAutoclick
                ? "bg-amber-500/25 border border-amber-400 text-amber-300"
                : "bg-red-500/25 border border-red-400 text-red-300"
            }`}
          >
            {isAutoclick ? (
              <AlertOctagon className="w-5 h-5" />
            ) : (
              <ZapOff className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 border border-red-400/40 text-red-300 font-extrabold">
                {lastBadge}
              </span>
              {consecutiveErrors >= 2 && !isAutoclick && (
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold">
                  Erros Seguidos: {consecutiveErrors}x
                </span>
              )}
            </div>
            <p className="font-extrabold text-sm sm:text-base text-white mt-1">
              {lastErrorTitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-red-400/40">
          <span className="text-sm font-mono font-black text-red-400">
            {lastPenaltyPts} pts
          </span>
          <span className="text-slate-600">•</span>
          <span className="text-xs font-mono font-extrabold text-amber-300 flex items-center gap-1">
            <Timer className="w-3.5 h-3.5 animate-spin" />
            Rearmando: {secondsText}s
          </span>
        </div>
      </div>

      {lastErrorDetail && (
        <p className="text-xs text-red-200/90 mt-2 bg-black/25 rounded-xl px-3 py-1.5 border border-red-500/20">
          {lastErrorDetail}
        </p>
      )}

      {/* Barra de Progresso do Delay de Bloqueio */}
      <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden mt-3 border border-red-500/30">
        <div
          style={{ width: `${progressPct}%` }}
          className={`h-full transition-all duration-75 ${
            isAutoclick
              ? "bg-gradient-to-r from-amber-400 to-red-500"
              : "bg-gradient-to-r from-red-500 to-amber-400"
          }`}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] font-mono text-red-300/80 mt-1">
        <span className="flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> Controles temporariamente
          bloqueados por curto-circuito
        </span>
        <span>Acerte a próxima para resetar o disjuntor!</span>
      </div>
    </div>
  );
};
