"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { UserAvatar } from "@/components/UserAvatar";
import {
  UserProfile,
  LeaderboardPeriod,
  LeaderboardMeta,
  subscribeToGlobalLeaderboard,
  subscribeToActiveProfile,
  subscribeToLeaderboardMeta,
  getProfilePeriodStats,
  getNextWeekResetTs,
  verifyAdminPin,
  adminTriggerPeriodReset,
  adminAdjustUserXp,
  adminDeleteUserProfile,
} from "@/lib/profileService";
import { getRankInfoByXp, ACHIEVEMENTS_CATALOG } from "@/data/achievementsData";
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  History,
  Lock,
  Medal,
  MinusCircle,
  Percent,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Trophy,
  Unlock,
  UserCheck,
  X,
  Zap,
} from "lucide-react";

type SortCriteria = "xp" | "accuracy" | "streak";

const ADMIN_SESSION_KEY = "senai_arena_admin_unlocked";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [meta, setMeta] = useState<LeaderboardMeta>({
    periodResetAt: 0,
    seasonNumber: 1,
    updatedAt: 0,
  });
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [sortBy, setSortBy] = useState<SortCriteria>("xp");

  // Estados do Modo Admin (Cadeado por PIN)
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>("");
  const [pinError, setPinError] = useState<string>("");
  const [adminFeedback, setAdminFeedback] = useState<string | null>(null);
  const [adminBusy, setAdminBusy] = useState<boolean>(false);
  const [confirmResetModal, setConfirmResetModal] = useState<boolean>(false);

  // Modal de edição/remoção de XP de um aluno específico
  const [selectedPlayerForAdmin, setSelectedPlayerForAdmin] =
    useState<UserProfile | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<"both" | "weekly" | "total">(
    "both"
  );
  const [customXpAmount, setCustomXpAmount] = useState<string>("500");
  const [exactXpInput, setExactXpInput] = useState<string>("");
  const [confirmDeleteUid, setConfirmDeleteUid] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem(ADMIN_SESSION_KEY) === "1") {
        setIsAdmin(true);
      }
    }

    const unsubLb = subscribeToGlobalLeaderboard((list) => {
      setPlayers(list);
    });
    const unsubProf = subscribeToActiveProfile((prof) => {
      setActiveProfile(prof);
    });
    const unsubMeta = subscribeToLeaderboardMeta((m) => {
      setMeta(m);
    });

    return () => {
      unsubLb();
      unsubProf();
      unsubMeta();
    };
  }, []);

  // Mantém o jogador selecionado no modal sincronizado com a lista atualizada
  useEffect(() => {
    if (!selectedPlayerForAdmin) return;
    const updated = players.find((p) => p.uid === selectedPlayerForAdmin.uid);
    if (updated) {
      setSelectedPlayerForAdmin(updated);
    }
  }, [players, selectedPlayerForAdmin]);

  const showTempFeedback = (msg: string) => {
    setAdminFeedback(msg);
    setTimeout(() => {
      setAdminFeedback((prev) => (prev === msg ? null : prev));
    }, 4500);
  };

  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pinInput)) {
      setIsAdmin(true);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      }
      setShowPinModal(false);
      setPinInput("");
      setPinError("");
      showTempFeedback("Modo Admin desbloqueado com sucesso.");
    } else {
      setPinError("PIN de Administrador incorreto.");
    }
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    setSelectedPlayerForAdmin(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    }
  };

  const handlePeriodReset = async () => {
    setAdminBusy(true);
    try {
      const nextMeta = await adminTriggerPeriodReset();
      setConfirmResetModal(false);
      showTempFeedback(
        `Placar do período zerado! Temporada #${nextMeta.seasonNumber} iniciada.`
      );
    } finally {
      setAdminBusy(false);
    }
  };

  const handleQuickAdjustXp = async (uid: string, deltaXp: number) => {
    setAdminBusy(true);
    try {
      const updated = await adminAdjustUserXp(uid, {
        deltaXp,
        target: adjustTarget,
      });
      if (updated) {
        showTempFeedback(
          `XP de ${updated.displayName} ajustado (${
            deltaXp >= 0 ? `+${deltaXp}` : deltaXp
          } XP).`
        );
      }
    } finally {
      setAdminBusy(false);
    }
  };

  const handleSetExactXp = async (uid: string, exactVal: number) => {
    if (Number.isNaN(exactVal) || exactVal < 0) return;
    setAdminBusy(true);
    try {
      const updated = await adminAdjustUserXp(uid, {
        setExactXp: exactVal,
        target: adjustTarget,
      });
      if (updated) {
        setExactXpInput("");
        showTempFeedback(
          `XP de ${updated.displayName} definido para ${exactVal.toLocaleString(
            "pt-BR"
          )} XP.`
        );
      }
    } finally {
      setAdminBusy(false);
    }
  };

  const handleDeleteUser = async (player: UserProfile) => {
    setAdminBusy(true);
    try {
      await adminDeleteUserProfile(player.uid);
      setConfirmDeleteUid(null);
      if (selectedPlayerForAdmin?.uid === player.uid) {
        setSelectedPlayerForAdmin(null);
      }
      showTempFeedback(
        `Perfil de ${player.displayName} removido do ranking.`
      );
    } finally {
      setAdminBusy(false);
    }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    const statsA = getProfilePeriodStats(a, period, meta);
    const statsB = getProfilePeriodStats(b, period, meta);

    if (sortBy === "accuracy") {
      const diff = statsB.accuracyPct - statsA.accuracyPct;
      if (diff !== 0) return diff;
      if (statsB.xp !== statsA.xp) return statsB.xp - statsA.xp;
      return b.totalXp - a.totalXp;
    }
    if (sortBy === "streak") {
      const diff = statsB.bestStreak - statsA.bestStreak;
      if (diff !== 0) return diff;
      if (statsB.xp !== statsA.xp) return statsB.xp - statsA.xp;
      return b.totalXp - a.totalXp;
    }
    if (statsB.xp !== statsA.xp) {
      return statsB.xp - statsA.xp;
    }
    return b.totalXp - a.totalXp;
  });

  const topThree = sortedPlayers.slice(0, 3);
  const nextResetDate = new Date(getNextWeekResetTs());
  const nextResetFormatted = nextResetDate.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });

  const periodLabel =
    period === "weekly"
      ? "XP na Semana"
      : period === "monthly"
      ? "XP no Mês"
      : "XP Acumulado";

  return (
    <main className="min-h-screen flex flex-col bg-[#111317] text-[#F1F5F9]">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Header, Period Tabs & Admin Lock */}
        <section className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
          <div className="h-1 w-full bg-[#F59E0B]" />
          <div className="p-6 flex flex-col gap-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Trophy className="w-4 h-4 text-[#F59E0B]" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[#94A3B8] font-semibold">
                    TELEMETRIA UNIFICADA // TEMPORADA #{meta.seasonNumber || 1}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0C0E12] border border-[#2A303C] text-emerald-400">
                    Reset automático: Seg 00:00 ({nextResetFormatted})
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Ranking da Plataforma SENAI
                </h2>
                <p className="text-xs text-[#94A3B8] mt-1">
                  O Ranking Semanal renova automaticamente toda segunda-feira,
                  mantendo suas Patentes e Níveis de carreira salvos no perfil.
                </p>
              </div>

              {/* Botão Cadeado Admin */}
              <div className="flex flex-wrap items-center gap-2">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={handleLockAdmin}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-mono font-bold bg-amber-500/15 border border-[#F59E0B] text-[#F59E0B] hover:bg-amber-500/25 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Admin Ativo (Bloquear)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setPinError("");
                      setPinInput("");
                      setShowPinModal(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-mono font-semibold bg-[#0C0E12] border border-[#2A303C] text-[#94A3B8] hover:text-white hover:border-slate-500 transition-colors"
                    title="Desbloquear controles de professor/administrador"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Admin</span>
                  </button>
                )}
              </div>
            </div>

            {/* Abas de Período + Filtros de Ordenação */}
            <div className="pt-4 border-t border-[#2A303C] flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Seletor de Período: Semanal (Padrão) | Mensal | Geral */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPeriod("weekly")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold border transition-all ${
                    period === "weekly"
                      ? "bg-[#F59E0B] border-[#F59E0B] text-slate-950 shadow"
                      : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Ranking da Semana</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("monthly")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold border transition-all ${
                    period === "monthly"
                      ? "bg-[#F59E0B] border-[#F59E0B] text-slate-950 shadow"
                      : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ranking do Mês</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPeriod("all")}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold border transition-all ${
                    period === "all"
                      ? "bg-[#F59E0B] border-[#F59E0B] text-slate-950 shadow"
                      : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Histórico Geral (Carreira)</span>
                </button>
              </div>

              {/* Critério de Ordenação */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSortBy("xp")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                    sortBy === "xp"
                      ? "bg-[#0047B6] border-[#0057E0] text-white"
                      : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>{periodLabel}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("accuracy")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                    sortBy === "accuracy"
                      ? "bg-[#0047B6] border-[#0057E0] text-white"
                      : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Maior Precisão (%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy("streak")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-all ${
                    sortBy === "streak"
                      ? "bg-[#0047B6] border-[#0057E0] text-white"
                      : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Maior Sequência</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Barra de Ferramentas do Admin (Quando Desbloqueado) */}
        {isAdmin && (
          <section className="bg-[#1C1610] border border-[#F59E0B]/60 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-md bg-[#F59E0B]/20 border border-[#F59E0B]/50 flex items-center justify-center shrink-0 text-[#F59E0B]">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-[#F59E0B]">
                  PAINEL DE CONTROLE DO PROFESSOR / ADMIN
                </h3>
                <p className="text-xs text-zinc-300 mt-0.5">
                  Use o botão <strong>Gerenciar XP</strong> em qualquer linha da
                  tabela abaixo para remover XP, zerar pontuação de quem usou
                  autoclique ou excluir contas. Você também pode iniciar um novo
                  ciclo semanal a qualquer momento.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={adminBusy}
                onClick={() => setConfirmResetModal(true)}
                className="px-3.5 py-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-mono font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Resetar Placar do Período</span>
              </button>
            </div>
          </section>
        )}

        {/* Banner de Confirmação de Ação Admin */}
        {adminFeedback && (
          <div className="bg-[#12241D] border border-emerald-500/50 border-l-4 border-l-emerald-400 rounded-md px-4 py-3 flex items-center justify-between gap-3 text-xs font-mono text-emerald-200">
            <span className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {adminFeedback}
            </span>
            <button
              type="button"
              onClick={() => setAdminFeedback(null)}
              className="text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Top 3 Highlight Podium */}
        {topThree.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((player, idx) => {
              const rankInfo = getRankInfoByXp(player.totalXp);
              const pStats = getProfilePeriodStats(player, period, meta);
              const isMe = activeProfile?.uid === player.uid;
              const medalColors = [
                "border-[#F59E0B] bg-[#F59E0B]/10 text-[#F59E0B]",
                "border-slate-400 bg-slate-400/10 text-slate-300",
                "border-amber-700 bg-amber-700/15 text-amber-500",
              ];

              return (
                <div
                  key={player.uid}
                  className={`bg-[#181B20] rounded-lg p-5 border transition-all ${
                    idx === 0
                      ? "border-[#F59E0B]/70 shadow-lg"
                      : isMe
                      ? "border-[#0057E0]"
                      : "border-[#2A303C]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`font-mono text-xs font-bold px-2.5 py-1 rounded border flex items-center gap-1.5 ${medalColors[idx]}`}
                    >
                      <Medal className="w-3.5 h-3.5" />
                      <span>#{idx + 1} LUGAR</span>
                    </span>
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#0C0E12] text-[#F59E0B] border border-[#2A303C]">
                      NV {rankInfo.currentTier.level} •{" "}
                      {rankInfo.currentPatent.badgeCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="relative shrink-0">
                      <UserAvatar
                        profile={player}
                        size="lg"
                        roundedClassName="rounded-lg"
                        className="border border-[#2A303C]"
                      />
                      <span
                        title={rankInfo.currentPatent.title}
                        className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#181B20] border border-[#F59E0B] flex items-center justify-center text-[11px]"
                      >
                        {rankInfo.currentPatent.icon}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white truncate">
                          {player.displayName}
                        </h3>
                        {isMe && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#0047B6] text-white font-bold">
                            VOCÊ
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-emerald-400 font-semibold truncate">
                        {rankInfo.currentPatent.icon}{" "}
                        {rankInfo.currentPatent.title}
                      </p>
                      <p className="text-[10px] font-mono text-[#94A3B8] truncate">
                        Carreira: {player.totalXp.toLocaleString("pt-BR")} XP
                        {player.classGroup ? ` • ${player.classGroup}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2A303C] font-mono">
                    <div className="bg-[#0C0E12] p-2 rounded border border-[#2A303C] text-center">
                      <div className="text-[9px] uppercase text-[#94A3B8]">
                        {period === "weekly"
                          ? "XP SEMANA"
                          : period === "monthly"
                          ? "XP MÊS"
                          : "XP TOTAL"}
                      </div>
                      <div className="text-xs font-bold text-[#F59E0B]">
                        {pStats.xp.toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="bg-[#0C0E12] p-2 rounded border border-[#2A303C] text-center">
                      <div className="text-[9px] uppercase text-[#94A3B8]">
                        PRECISÃO
                      </div>
                      <div className="text-xs font-bold text-emerald-400">
                        {pStats.accuracyPct}%
                      </div>
                    </div>
                    <div className="bg-[#0C0E12] p-2 rounded border border-[#2A303C] text-center">
                      <div className="text-[9px] uppercase text-[#94A3B8]">
                        COMBO MÁX
                      </div>
                      <div className="text-xs font-bold text-amber-400">
                        {pStats.bestStreak}x
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Full Leaderboard Table */}
        <section className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#2A303C] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {period === "weekly"
                  ? "Classificação da Semana Atual"
                  : period === "monthly"
                  ? "Classificação do Mês Atual"
                  : "Classificação Geral de Carreira"}{" "}
                ({sortedPlayers.length})
              </h3>
              {meta.periodResetAt > 0 && period !== "all" && (
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0C0E12] border border-[#2A303C] text-amber-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Ciclo iniciado em{" "}
                  {new Date(meta.periodResetAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
            {!activeProfile && (
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F59E0B] hover:underline"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Entre com sua conta Google para aparecer no ranking →</span>
              </Link>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#2A303C] bg-[#0C0E12] font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                  <th className="py-3.5 px-4">Pos</th>
                  <th className="py-3.5 px-4">Aluno / Patente Técnica</th>
                  <th className="py-3.5 px-4 text-center">Nível</th>
                  <th className="py-3.5 px-4 text-center">Partidas</th>
                  <th className="py-3.5 px-4 text-center">Média Acerto</th>
                  <th className="py-3.5 px-4 text-center">Maior Combo</th>
                  <th className="py-3.5 px-4 text-center">Conquistas</th>
                  {period !== "all" && (
                    <th className="py-3.5 px-4 text-right">XP Carreira</th>
                  )}
                  <th className="py-3.5 px-4 text-right">{periodLabel}</th>
                  {isAdmin && (
                    <th className="py-3.5 px-4 text-right text-[#F59E0B]">
                      Ações Admin
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A303C] text-xs">
                {sortedPlayers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isAdmin ? 10 : 9}
                      className="py-10 px-4 text-center font-mono text-xs text-[#94A3B8]"
                    >
                      Nenhum aluno registrado no ranking ainda. Entre com sua
                      conta Google e jogue uma partida para inaugurar o placar!
                    </td>
                  </tr>
                ) : (
                  sortedPlayers.map((player, index) => {
                    const rankInfo = getRankInfoByXp(player.totalXp);
                    const pStats = getProfilePeriodStats(player, period, meta);
                    const isMe = activeProfile?.uid === player.uid;

                    return (
                      <tr
                        key={player.uid}
                        className={`transition-colors ${
                          isMe
                            ? "bg-[#0047B6]/15 hover:bg-[#0047B6]/25"
                            : "hover:bg-[#111317]/60"
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs ${
                              index === 0
                                ? "bg-[#F59E0B] text-slate-950 font-black"
                                : index === 1
                                ? "bg-slate-300 text-slate-950 font-black"
                                : index === 2
                                ? "bg-amber-700 text-white font-black"
                                : "bg-[#0C0E12] text-[#94A3B8] border border-[#2A303C]"
                            }`}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              profile={player}
                              size="sm"
                              className="border border-[#2A303C]"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white">
                                  {player.displayName}
                                </span>
                                {isMe && (
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#0047B6] text-white font-bold">
                                    VOCÊ
                                  </span>
                                )}
                                {player.classGroup && (
                                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#0C0E12] text-[#94A3B8] border border-[#2A303C]">
                                    {player.classGroup}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0C0E12] text-emerald-400 border border-[#2A303C]">
                                  {rankInfo.currentPatent.icon}{" "}
                                  {rankInfo.currentPatent.badgeCode}
                                </span>
                                <span className="text-[11px] text-[#94A3B8]">
                                  {rankInfo.currentPatent.title}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="px-2 py-0.5 rounded bg-[#0C0E12] text-[#F59E0B] border border-[#2A303C] font-bold">
                            NV {rankInfo.currentTier.level}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-white">
                          {pStats.matches}
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              pStats.accuracyPct >= 80
                                ? "bg-emerald-950/60 text-emerald-400"
                                : pStats.accuracyPct >= 50
                                ? "bg-amber-950/60 text-amber-400"
                                : "bg-red-950/60 text-red-400"
                            }`}
                          >
                            {pStats.accuracyPct}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">
                          {pStats.bestStreak}x
                        </td>
                        <td className="py-3.5 px-4 text-center font-mono">
                          <span className="inline-flex items-center gap-1 text-[#94A3B8]">
                            <Award className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>
                              {player.unlockedAchievements.length}/
                              {ACHIEVEMENTS_CATALOG.length}
                            </span>
                          </span>
                        </td>
                        {period !== "all" && (
                          <td className="py-3.5 px-4 text-right font-mono text-xs text-[#94A3B8]">
                            {player.totalXp.toLocaleString("pt-BR")} XP
                          </td>
                        )}
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#F59E0B]">
                          {pStats.xp.toLocaleString("pt-BR")} XP
                        </td>
                        {isAdmin && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedPlayerForAdmin(player);
                                  setExactXpInput(String(player.totalXp));
                                  setConfirmDeleteUid(null);
                                }}
                                className="px-2.5 py-1 rounded bg-[#0C0E12] hover:bg-[#1E2229] border border-[#F59E0B]/50 text-[#F59E0B] font-mono text-[11px] font-bold inline-flex items-center gap-1"
                                title="Remover ou ajustar XP deste aluno"
                              >
                                <SlidersHorizontal className="w-3 h-3" />
                                <span>Gerenciar XP</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Modal 1: Desbloqueio do Cadeado Admin via PIN Fixo */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="h-1 w-full bg-[#F59E0B]" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Acesso Admin / Professor
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="p-1 rounded bg-[#0C0E12] text-[#94A3B8] hover:text-white border border-[#2A303C]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
                Informe o PIN de administrador para gerenciar pontuações,
                remover XP indevido ou reiniciar o período do ranking.
              </p>

              <form onSubmit={handleUnlockAdmin} className="space-y-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1.5">
                    PIN de Segurança
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    required
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value);
                      setPinError("");
                    }}
                    placeholder="••••••••"
                    className="w-full text-center font-mono text-lg tracking-[0.25em] py-2.5 px-3 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#F59E0B] focus:outline-none text-white"
                  />
                </div>

                {pinError && (
                  <p className="text-xs font-mono text-red-400 bg-red-950/50 border border-red-500/40 rounded px-3 py-2">
                    {pinError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-md bg-[#F59E0B] hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Desbloquear Painel Admin
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Confirmação de Reset de Período/Temporada */}
      {confirmResetModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg max-w-md w-full overflow-hidden shadow-2xl">
            <div className="h-1 w-full bg-[#F59E0B]" />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-[#F59E0B]" />
                  <span>Resetar Placar do Período?</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setConfirmResetModal(false)}
                  className="p-1 rounded bg-[#0C0E12] text-[#94A3B8] hover:text-white border border-[#2A303C]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-300 leading-relaxed">
                Esta ação iniciará imediatamente a{" "}
                <strong className="text-[#F59E0B]">
                  Temporada #{(meta.seasonNumber || 1) + 1}
                </strong>
                , zerando o placar de <strong>XP da Semana / Mês</strong> de
                todos os alunos para uma nova disputa. As Patentes e o XP de
                Carreira continuarão preservados no histórico.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetModal(false)}
                  className="px-4 py-2 rounded-md bg-[#0C0E12] border border-[#2A303C] text-xs font-semibold text-zinc-300 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={adminBusy}
                  onClick={handlePeriodReset}
                  className="px-4 py-2 rounded-md bg-[#F59E0B] hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider"
                >
                  {adminBusy ? "Resetando..." : "Confirmar Reset do Período"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Gerenciar / Remover XP de um Aluno Específico */}
      {isAdmin && selectedPlayerForAdmin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg max-w-lg w-full overflow-hidden shadow-2xl">
            <div className="h-1 w-full bg-[#F59E0B]" />
            <div className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    profile={selectedPlayerForAdmin}
                    size="lg"
                    roundedClassName="rounded-lg"
                    className="border border-[#2A303C]"
                  />
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#F59E0B] font-bold block">
                      GERENCIAMENTO DE XP // ADMIN
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {selectedPlayerForAdmin.displayName}
                    </h3>
                    <p className="text-[11px] font-mono text-[#94A3B8]">
                      {selectedPlayerForAdmin.email || selectedPlayerForAdmin.uid}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerForAdmin(null)}
                  className="p-1.5 rounded bg-[#0C0E12] text-[#94A3B8] hover:text-white border border-[#2A303C]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Resumo de XP Atual do Aluno */}
              <div className="grid grid-cols-2 gap-3 bg-[#0C0E12] border border-[#2A303C] rounded-md p-3 font-mono">
                <div>
                  <span className="text-[10px] uppercase text-[#94A3B8] block">
                    XP na Semana Atual
                  </span>
                  <span className="text-base font-bold text-emerald-400">
                    {getProfilePeriodStats(
                      selectedPlayerForAdmin,
                      "weekly",
                      meta
                    ).xp.toLocaleString("pt-BR")}{" "}
                    XP
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-[#94A3B8] block">
                    XP Total (Carreira / NV {selectedPlayerForAdmin.level})
                  </span>
                  <span className="text-base font-bold text-[#F59E0B]">
                    {selectedPlayerForAdmin.totalXp.toLocaleString("pt-BR")} XP
                  </span>
                </div>
              </div>

              {/* Onde aplicar a alteração */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Onde aplicar o ajuste de XP:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      id: "both" as const,
                      label: "Geral + Semana",
                    },
                    {
                      id: "weekly" as const,
                      label: "Só na Semana",
                    },
                    {
                      id: "total" as const,
                      label: "Só no Geral",
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAdjustTarget(opt.id)}
                      className={`py-2 px-2.5 rounded text-xs font-mono font-bold border transition-colors ${
                        adjustTarget === opt.id
                          ? "bg-[#0047B6] border-[#0057E0] text-white"
                          : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões Rápidos de Remoção de XP */}
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1.5">
                  Remoção Rápida de XP:
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[100, 500, 1000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      disabled={adminBusy}
                      onClick={() =>
                        handleQuickAdjustXp(selectedPlayerForAdmin.uid, -val)
                      }
                      className="py-2 px-2 rounded bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-200 font-mono text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <MinusCircle className="w-3 h-3 text-red-400" />
                      <span>{val}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Remover Quantia Personalizada ou Definir Valor Exato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#2A303C]">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                    Remover Valor Específico:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      value={customXpAmount}
                      onChange={(e) => setCustomXpAmount(e.target.value)}
                      className="w-full py-2 px-2.5 rounded bg-[#0C0E12] border border-[#2A303C] text-white font-mono text-xs"
                      placeholder="Ex: 2500"
                    />
                    <button
                      type="button"
                      disabled={adminBusy}
                      onClick={() => {
                        const n = Math.abs(Number(customXpAmount) || 0);
                        if (n > 0) {
                          handleQuickAdjustXp(selectedPlayerForAdmin.uid, -n);
                        }
                      }}
                      className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs shrink-0"
                    >
                      -XP
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                    Definir XP Exato:
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={exactXpInput}
                      onChange={(e) => setExactXpInput(e.target.value)}
                      className="w-full py-2 px-2.5 rounded bg-[#0C0E12] border border-[#2A303C] text-white font-mono text-xs"
                      placeholder="Ex: 0"
                    />
                    <button
                      type="button"
                      disabled={adminBusy}
                      onClick={() =>
                        handleSetExactXp(
                          selectedPlayerForAdmin.uid,
                          Number(exactXpInput)
                        )
                      }
                      className="px-3 py-2 rounded bg-[#0047B6] hover:bg-[#0057E0] text-white font-mono font-bold text-xs shrink-0"
                    >
                      Fixar
                    </button>
                  </div>
                </div>
              </div>

              {/* Ações Drásticas: Zerar XP ou Excluir Conta */}
              <div className="pt-3 border-t border-[#2A303C] flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={adminBusy}
                  onClick={() => handleSetExactXp(selectedPlayerForAdmin.uid, 0)}
                  className="px-3.5 py-2 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-[#F59E0B] text-[#F59E0B] font-mono font-bold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>
                    Zerar XP (
                    {adjustTarget === "weekly"
                      ? "Semana"
                      : adjustTarget === "total"
                      ? "Geral"
                      : "Completo"}
                    )
                  </span>
                </button>

                {confirmDeleteUid === selectedPlayerForAdmin.uid ? (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={adminBusy}
                      onClick={() => handleDeleteUser(selectedPlayerForAdmin)}
                      className="px-3 py-2 rounded bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs"
                    >
                      Confirmar Exclusão
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUid(null)}
                      className="px-2.5 py-2 rounded bg-[#0C0E12] border border-[#2A303C] text-zinc-400 text-xs"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={adminBusy}
                    onClick={() =>
                      setConfirmDeleteUid(selectedPlayerForAdmin.uid)
                    }
                    className="px-3 py-2 rounded bg-[#0C0E12] hover:bg-red-950/60 border border-[#2A303C] hover:border-red-500/50 text-zinc-400 hover:text-red-300 font-mono text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir do Ranking</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
