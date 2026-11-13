"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  UserProfile,
  subscribeToActiveProfile,
  signInWithGoogleAccount,
  signInWithQuickGoogleSimulation,
  signOutCurrentProfile,
  formatGoogleAuthError,
  getAchievementProgressForProfile,
} from "@/lib/profileService";
import {
  ACHIEVEMENTS_CATALOG,
  AchievementDifficulty,
  MAX_PLATFORM_LEVEL,
  MAX_PLATFORM_XP,
  PatentDivision,
  SENAI_PATENTS,
  SENAI_RANK_TIERS,
  getRankInfoByXp,
} from "@/data/achievementsData";
import { AVATARS } from "@/data/electronicsData";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  Flame,
  Layers,
  Lock,
  LogOut,
  Percent,
  Play,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  UserCheck,
  Zap,
} from "lucide-react";

type ProfileTab = "patents" | "achievements" | "history";
type PatentFilter = "all" | "unlocked" | "locked";
type DifficultyFilter = "all" | AchievementDifficulty;

function getDivisionStyle(division: PatentDivision): {
  badge: string;
  border: string;
  glow: string;
} {
  switch (division) {
    case "bronze":
      return {
        badge: "bg-amber-950/70 text-amber-300 border-amber-700/50",
        border: "border-amber-700/50",
        glow: "from-amber-900/20 to-transparent",
      };
    case "prata":
      return {
        badge: "bg-slate-800 text-slate-200 border-slate-500/50",
        border: "border-slate-500/50",
        glow: "from-slate-500/15 to-transparent",
      };
    case "ouro":
      return {
        badge: "bg-yellow-950/70 text-yellow-300 border-yellow-500/50",
        border: "border-yellow-500/50",
        glow: "from-yellow-500/15 to-transparent",
      };
    case "platina":
      return {
        badge: "bg-cyan-950/70 text-cyan-300 border-cyan-500/50",
        border: "border-cyan-500/50",
        glow: "from-cyan-500/15 to-transparent",
      };
    case "esmeralda":
      return {
        badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/50",
        border: "border-emerald-500/50",
        glow: "from-emerald-500/15 to-transparent",
      };
    case "diamante":
      return {
        badge: "bg-blue-950/70 text-blue-300 border-blue-400/60",
        border: "border-blue-400/60",
        glow: "from-blue-500/20 to-transparent",
      };
    case "mestre":
      return {
        badge: "bg-purple-950/70 text-purple-300 border-purple-500/60",
        border: "border-purple-500/60",
        glow: "from-purple-500/20 to-transparent",
      };
    case "lendario":
      return {
        badge: "bg-amber-500/20 text-[#F59E0B] border-[#F59E0B]",
        border: "border-[#F59E0B]",
        glow: "from-amber-500/25 to-transparent",
      };
  }
}

function getDifficultyBadgeStyle(diff: AchievementDifficulty): string {
  switch (diff) {
    case "facil":
      return "bg-emerald-950/60 text-emerald-300 border-emerald-500/40";
    case "medio":
      return "bg-blue-950/60 text-blue-300 border-blue-500/40";
    case "dificil":
      return "bg-amber-950/60 text-amber-300 border-amber-500/40";
    case "extremo":
      return "bg-red-950/60 text-red-300 border-red-500/40";
    case "lendario":
      return "bg-purple-950/70 text-purple-300 border-purple-400/50";
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simAvatar, setSimAvatar] = useState(AVATARS[0]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  // Estado das abas e filtros dentro do perfil
  const [activeTab, setActiveTab] = useState<ProfileTab>("patents");
  const [patentFilter, setPatentFilter] = useState<PatentFilter>("all");
  const [levelRangeIdx, setLevelRangeIdx] = useState<number>(0);
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");

  useEffect(() => {
    const unsub = subscribeToActiveProfile((prof) => {
      setProfile(prof);
      if (prof) {
        const r = getRankInfoByXp(prof.totalXp);
        const bucket = Math.min(
          4,
          Math.floor((r.currentTier.level - 1) / 20)
        );
        setLevelRangeIdx(bucket);
      }
    });
    return () => unsub();
  }, []);

  const handleGoogleOAuthClick = async () => {
    setAuthLoading(true);
    setAuthErrorMsg(null);
    try {
      await signInWithGoogleAccount();
    } catch (err) {
      setAuthErrorMsg(formatGoogleAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;
    setAuthLoading(true);
    setAuthErrorMsg(null);
    try {
      await signInWithQuickGoogleSimulation(simName, simEmail, simAvatar);
    } finally {
      setAuthLoading(false);
    }
  };

  const rankInfo = profile ? getRankInfoByXp(profile.totalXp) : null;
  const totalAttempts = profile ? profile.totalHits + profile.totalMisses : 0;
  const overallAccuracy =
    totalAttempts > 0 && profile
      ? Math.round((profile.totalHits / totalAttempts) * 100)
      : 0;

  const unlockedPatentsCount = rankInfo
    ? SENAI_PATENTS.filter((p) => rankInfo.currentTier.level >= p.minLevel)
        .length
    : 0;

  const filteredPatents = SENAI_PATENTS.filter((pat) => {
    if (!rankInfo) return true;
    const isReached = rankInfo.currentTier.level >= pat.minLevel;
    if (patentFilter === "unlocked") return isReached;
    if (patentFilter === "locked") return !isReached;
    return true;
  });

  const filteredAchievements = ACHIEVEMENTS_CATALOG.filter((ach) => {
    if (difficultyFilter === "all") return true;
    return ach.difficulty === difficultyFilter;
  });

  const levelRanges = [
    { label: "NV 01 – 20", min: 1, max: 20 },
    { label: "NV 21 – 40", min: 21, max: 40 },
    { label: "NV 41 – 60", min: 41, max: 60 },
    { label: "NV 61 – 80", min: 61, max: 80 },
    { label: "NV 81 – 100 (1M)", min: 81, max: 100 },
  ];
  const activeRange = levelRanges[levelRangeIdx] || levelRanges[0];
  const visibleLevels = SENAI_RANK_TIERS.filter(
    (t) => t.level >= activeRange.min && t.level <= activeRange.max
  );

  return (
    <main className="min-h-screen flex flex-col bg-[#111317] text-[#F1F5F9]">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {!profile ? (
          /* Unauthenticated State: Prompt to Sign In + Preview of 21 Patents */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden shadow-xl">
              <div className="h-1 w-full bg-[#0047B6]" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-[#F59E0B]" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[#94A3B8] font-semibold">
                    Credencial Google // Perfil do Aluno
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Conecte sua Conta Google
                </h2>
                <p className="text-xs text-[#94A3B8] mb-5 leading-relaxed">
                  Ao entrar com sua conta Google, todas as partidas em{" "}
                  <strong className="text-white">Sala de Aula (PIN)</strong> ou no{" "}
                  <strong className="text-white">Treino Individual</strong> acumulam XP
                  para evoluir pelos{" "}
                  <strong className="text-[#F59E0B]">
                    100 Níveis (até 1.000.000 XP)
                  </strong>
                  , conquistar as{" "}
                  <strong className="text-emerald-400">
                    21 Patentes Técnicas (a cada 5 níveis)
                  </strong>{" "}
                  e desbloquear as 24 conquistas.
                </p>

                {authErrorMsg && (
                  <div className="mb-4 p-3 rounded-md bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{authErrorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleOAuthClick}
                  className="w-full py-3 px-4 rounded-md bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors mb-4 shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>
                    {authLoading
                      ? "Conectando ao Google..."
                      : "Entrar com Google (OAuth Popup)"}
                  </span>
                </button>

                <div className="relative flex py-2 items-center mb-4">
                  <div className="flex-grow border-t border-[#2A303C]" />
                  <span className="shrink mx-3 font-mono text-[10px] uppercase tracking-widest text-[#94A3B8]">
                    ou Conta Google Educacional Rápida
                  </span>
                  <div className="flex-grow border-t border-[#2A303C]" />
                </div>

                <form onSubmit={handleQuickLogin} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                      Nome Completo ou Apelido Técnico
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={24}
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      placeholder="Ex: Lucas Almeida"
                      className="w-full px-3 py-2.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0047B6] focus:outline-none text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                      E-mail Google (@gmail.com / @aluno.senai.br)
                    </label>
                    <input
                      type="email"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      placeholder="lucas.almeida@aluno.senai.br"
                      className="w-full px-3 py-2.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0047B6] focus:outline-none text-xs text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                      Insígnia Técnica
                    </label>
                    <div className="grid grid-cols-6 gap-1.5">
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setSimAvatar(av)}
                          className={`h-9 rounded flex items-center justify-center text-base border ${
                            simAvatar === av
                              ? "bg-[#0047B6]/25 border-[#F59E0B]"
                              : "bg-[#0C0E12] border-[#2A303C]"
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Criar / Acessar Perfil Técnico
                  </button>
                </form>
              </div>
            </div>

            {/* Preview of 21 Career Patents (Every 5 Levels up to Level 100 / 1M XP) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                    <span>
                      Hierarquia de Patentes SENAI (Nova Patente a cada 5 Níveis)
                    </span>
                  </h3>
                  <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded bg-[#0C0E12] text-[#F59E0B] border border-[#2A303C]">
                    NV 1 AO 100 • MÁX 1.000.000 XP
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mb-4">
                  Cada nível exige progressivamente mais pontos que o anterior. A
                  cada 5 níveis conquistados, você sobe de patente até atingir a
                  Lenda Suprema em 1.000.000 XP.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {SENAI_PATENTS.map((pat) => {
                    const divStyle = getDivisionStyle(pat.division);
                    return (
                      <div
                        key={pat.id}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-md bg-[#0C0E12] border ${divStyle.border}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{pat.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0047B6]/25 text-[#F59E0B] border border-[#0057E0]/40">
                                {pat.minLevel === pat.maxLevel
                                  ? `NV ${pat.minLevel}`
                                  : `NV ${pat.minLevel}–${pat.maxLevel}`}
                              </span>
                              <span className="font-mono text-[10px] text-[#94A3B8]">
                                {pat.badgeCode}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white truncate mt-0.5">
                              {pat.title}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-[#F59E0B] font-semibold shrink-0 ml-2">
                          {pat.minXp.toLocaleString("pt-BR")} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Student Profile View */
          <>
            {/* Top Dossier Banner */}
            <section className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden shadow-lg">
              <div className="h-1 w-full bg-gradient-to-r from-[#0047B6] via-[#F59E0B] to-emerald-500" />
              <div className="p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#0C0E12] border-2 border-[#0057E0] flex items-center justify-center text-3xl shrink-0 relative">
                    {profile.avatar}
                    {rankInfo && (
                      <span
                        title={rankInfo.currentPatent.title}
                        className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#181B20] border border-[#F59E0B] flex items-center justify-center text-sm shadow"
                      >
                        {rankInfo.currentPatent.icon}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40">
                        NÍVEL {rankInfo?.currentTier.level} / {MAX_PLATFORM_LEVEL}
                      </span>
                      <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#0047B6]/25 text-blue-300 border border-[#0057E0]/50">
                        {rankInfo?.currentPatent.badgeCode} •{" "}
                        {rankInfo?.currentPatent.divisionLabel}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                      <span>{profile.displayName}</span>
                      <span className="text-sm font-mono font-bold text-emerald-400">
                        // {rankInfo?.currentPatent.title}
                      </span>
                    </h2>
                    <p className="font-mono text-xs text-[#94A3B8]">
                      {profile.email} • {unlockedPatentsCount} de{" "}
                      {SENAI_PATENTS.length} Patentes Alcançadas
                    </p>
                  </div>
                </div>

                {/* Dual Progress: Level & Next Patent */}
                {rankInfo && (
                  <div className="flex-1 max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Box 1: Progresso do Nível Atual */}
                    <div className="bg-[#0C0E12] border border-[#2A303C] rounded-md p-3.5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono uppercase text-[#94A3B8] text-[10px]">
                          Progresso Nível {rankInfo.currentTier.level}
                        </span>
                        <span className="font-mono font-bold text-[#F59E0B] text-[11px]">
                          {rankInfo.nextTier
                            ? `Faltam ${rankInfo.xpToNext.toLocaleString("pt-BR")} XP`
                            : "NÍVEL MÁXIMO (1M XP)"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#181B20] rounded-sm overflow-hidden border border-[#2A303C]">
                        <div
                          className="h-full bg-[#0047B6] transition-all duration-500"
                          style={{ width: `${rankInfo.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-[#94A3B8]">
                        <span>{profile.totalXp.toLocaleString("pt-BR")} XP</span>
                        {rankInfo.nextTier ? (
                          <span>
                            NV {rankInfo.nextTier.level}:{" "}
                            {rankInfo.nextTier.minXp.toLocaleString("pt-BR")} XP
                          </span>
                        ) : (
                          <span>1.000.000 XP</span>
                        )}
                      </div>
                    </div>

                    {/* Box 2: Progresso para a Próxima Patente (a cada 5 níveis) */}
                    <div className="bg-[#0C0E12] border border-[#2A303C] rounded-md p-3.5">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-mono uppercase text-[#94A3B8] text-[10px]">
                          Próxima Patente (5 em 5 NV)
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-[11px]">
                          {rankInfo.nextPatent
                            ? `No NV ${rankInfo.nextPatent.minLevel} (-${rankInfo.levelsToNextPatent} NV)`
                            : "PATENTE SUPREMA"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#181B20] rounded-sm overflow-hidden border border-[#2A303C]">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${rankInfo.patentProgressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1.5 text-[10px] font-mono text-[#94A3B8] truncate">
                        <span className="truncate">
                          {rankInfo.nextPatent
                            ? `Próx: ${rankInfo.nextPatent.icon} ${rankInfo.nextPatent.title}`
                            : "Você zerou todas as patentes!"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/practice"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white text-xs font-bold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5 text-[#F59E0B]" />
                    <span>Treinar & Ganhar XP</span>
                  </Link>
                  <button
                    onClick={() => signOutCurrentProfile()}
                    className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md bg-[#111317] hover:bg-red-950/40 text-[#94A3B8] hover:text-red-400 border border-[#2A303C] text-xs font-semibold transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Trocar Conta</span>
                  </button>
                </div>
              </div>
            </section>

            {/* 4 Telemetry Metrics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    XP Acumulado / Meta 1M
                  </span>
                  <Zap className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {profile.totalXp.toLocaleString("pt-BR")}{" "}
                  <span className="text-xs font-normal text-[#F59E0B]">XP</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1 font-mono">
                  {rankInfo?.overallProgressPct}% de{" "}
                  {MAX_PLATFORM_XP.toLocaleString("pt-BR")} XP (NV 100)
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Patentes Alcançadas
                  </span>
                  <Crown className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {unlockedPatentsCount}{" "}
                  <span className="text-sm text-[#94A3B8]">
                    / {SENAI_PATENTS.length}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 truncate">
                  {rankInfo?.currentPatent.icon} {rankInfo?.currentPatent.title}
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Precisão & Volume
                  </span>
                  <Percent className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-emerald-400">
                  {overallAccuracy}%
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  {profile.totalHits} acertos em {profile.matchesPlayed} partidas
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Maior Sequência & Recorde
                  </span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-amber-400">
                  {profile.bestStreak}x
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Melhor partida:{" "}
                  {(profile.highScoreMatch || 0).toLocaleString("pt-BR")} pts
                </p>
              </div>
            </section>

            {/* Navigation Tabs Bar */}
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("patents")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border transition-all ${
                  activeTab === "patents"
                    ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                <span>Patentes & Carreira</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#F59E0B]">
                  {unlockedPatentsCount}/{SENAI_PATENTS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("achievements")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border transition-all ${
                  activeTab === "achievements"
                    ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <span>Conquistas & Desafios</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-emerald-400">
                  {profile.unlockedAchievements.length}/
                  {ACHIEVEMENTS_CATALOG.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border transition-all ${
                  activeTab === "history"
                    ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Clock className="w-4 h-4 text-[#38BDF8]" />
                <span>Histórico de Partidas</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-300">
                  {profile.recentMatches.length}
                </span>
              </button>
            </div>

            {/* ABA 1: PATENTES & PROGRESSÃO DE NÍVEIS (NOVA ABA) */}
            {activeTab === "patents" && rankInfo && (
              <div className="space-y-6">
                {/* Galeria das 21 Patentes Técnicas (a cada 5 níveis) */}
                <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
                        <h3 className="text-base font-bold text-white">
                          Quadro de Patentes Técnicas SENAI (Nova Patente a cada 5 Níveis)
                        </h3>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Acompanhe todas as patentes que você já alcançou e veja
                        quais são as próximas insígnias até atingir o Nível 100
                        (1.000.000 XP).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        {
                          id: "all" as const,
                          label: `Todas (${SENAI_PATENTS.length})`,
                        },
                        {
                          id: "unlocked" as const,
                          label: `Alcançadas (${unlockedPatentsCount})`,
                        },
                        {
                          id: "locked" as const,
                          label: `Bloqueadas (${
                            SENAI_PATENTS.length - unlockedPatentsCount
                          })`,
                        },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setPatentFilter(f.id)}
                          className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                            patentFilter === f.id
                              ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]"
                              : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatents.map((patent) => {
                      const isReached =
                        rankInfo.currentTier.level >= patent.minLevel;
                      const isCurrent =
                        rankInfo.currentPatent.id === patent.id;
                      const divStyle = getDivisionStyle(patent.division);
                      const xpMissing = Math.max(
                        0,
                        patent.minXp - profile.totalXp
                      );
                      const levelsMissing = Math.max(
                        0,
                        patent.minLevel - rankInfo.currentTier.level
                      );

                      return (
                        <div
                          key={patent.id}
                          className={`rounded-lg p-4 border transition-all flex flex-col justify-between bg-gradient-to-br ${
                            isCurrent
                              ? `${divStyle.glow} bg-[#0C0E12] border-2 border-[#F59E0B] shadow-lg`
                              : isReached
                              ? `${divStyle.glow} bg-[#0C0E12] border-emerald-500/50`
                              : "bg-[#111317]/60 border-[#2A303C] opacity-75"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span
                                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${divStyle.badge}`}
                              >
                                {patent.badgeCode} • {patent.divisionLabel}
                              </span>
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#181B20] text-[#F59E0B] border border-[#2A303C]">
                                {patent.minLevel === patent.maxLevel
                                  ? `NV ${patent.minLevel}`
                                  : `NV ${patent.minLevel} a ${patent.maxLevel}`}
                              </span>
                            </div>

                            <div className="flex items-start gap-3 mb-2">
                              <div
                                className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 border ${
                                  isReached
                                    ? "bg-[#181B20] border-[#F59E0B]/50"
                                    : "bg-[#181B20] border-[#2A303C] grayscale"
                                }`}
                              >
                                {patent.icon}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <span>{patent.title}</span>
                                </h4>
                                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                                  {patent.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#2A303C] space-y-2">
                            {isCurrent && rankInfo.nextPatent && (
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] mb-1">
                                  <span>Progresso na Patente</span>
                                  <span className="text-[#F59E0B] font-bold">
                                    {rankInfo.patentProgressPct}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-[#181B20] rounded-sm overflow-hidden">
                                  <div
                                    className="h-full bg-[#F59E0B]"
                                    style={{
                                      width: `${rankInfo.patentProgressPct}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-[#94A3B8]">
                                Requisito:{" "}
                                <strong className="text-white">
                                  {patent.minXp.toLocaleString("pt-BR")} XP
                                </strong>
                              </span>

                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold border border-[#F59E0B]/40">
                                  <Sparkles className="w-3 h-3" /> ATUAL
                                </span>
                              ) : isReached ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                  ALCANÇADA
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[#94A3B8]">
                                  <Lock className="w-3 h-3" /> Faltam{" "}
                                  {levelsMissing} NV (
                                  {xpMissing.toLocaleString("pt-BR")} XP)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Explorador da Curva Progressiva de 100 Níveis (0 a 1.000.000 XP) */}
                <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#0057E0]" />
                        <h3 className="text-base font-bold text-white">
                          Tabela Progressiva dos 100 Níveis (0 XP até 1.000.000 XP)
                        </h3>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Cada nível exige mais pontos adicionales (+Δ XP) que o
                        nível anterior. Novos marcos de patente são destacados a
                        cada 5 níveis.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {levelRanges.map((rng, idx) => (
                        <button
                          key={rng.label}
                          type="button"
                          onClick={() => setLevelRangeIdx(idx)}
                          className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                            levelRangeIdx === idx
                              ? "bg-[#0047B6] border-[#0057E0] text-white"
                              : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {rng.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {visibleLevels.map((tier) => {
                      const unlocked =
                        rankInfo.currentTier.level >= tier.level;
                      const isCurrentLevel =
                        rankInfo.currentTier.level === tier.level;
                      const isNewPatentMilestone =
                        tier.level === 1 || tier.level % 5 === 0;

                      return (
                        <div
                          key={tier.level}
                          className={`px-3.5 py-2.5 rounded-md border flex flex-col justify-between transition-colors ${
                            isCurrentLevel
                              ? "bg-[#0047B6]/20 border-[#F59E0B] shadow"
                              : unlocked
                              ? "bg-[#0C0E12] border-emerald-500/40"
                              : "bg-[#0C0E12]/60 border-[#2A303C] opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                                  isCurrentLevel
                                    ? "bg-[#F59E0B] text-slate-950 border-[#F59E0B]"
                                    : unlocked
                                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                    : "bg-[#181B20] text-[#94A3B8] border-[#2A303C]"
                                }`}
                              >
                                NV {tier.level}
                              </span>
                              {isNewPatentMilestone && (
                                <span
                                  title="Marco de Nova Patente"
                                  className="text-xs px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-mono font-bold"
                                >
                                  {tier.patentIcon} {tier.patentCode}
                                </span>
                              )}
                            </div>

                            <span className="font-mono text-xs font-bold text-white">
                              {tier.minXp.toLocaleString("pt-BR")} XP
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-[#94A3B8] truncate pr-2">
                              {tier.title}
                            </span>
                            <span className="font-mono text-[10px] text-[#F59E0B] shrink-0">
                              {tier.level === 1
                                ? "Início"
                                : `+${tier.deltaXpRequired.toLocaleString("pt-BR")} XP`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ABA 2: CONQUISTAS & DESAFIOS TÉCNICOS (24 CONQUISTAS MAIS DIFÍCEIS) */}
            {activeTab === "achievements" && (
              <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-[#F59E0B]" />
                      <h3 className="text-base font-bold text-white">
                        Insígnias & Desafios Técnicos SENAI ({ACHIEVEMENTS_CATALOG.length})
                      </h3>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      Desafios de precisão, combos de alta frequência, maestria
                      por bancada e maratonas de carreira.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: "all" as const, label: "Todas (24)" },
                      { id: "facil" as const, label: "Fácil" },
                      { id: "medio" as const, label: "Médio" },
                      { id: "dificil" as const, label: "Difícil" },
                      { id: "extremo" as const, label: "Extremo" },
                      { id: "lendario" as const, label: "Lendário" },
                    ].map((df) => (
                      <button
                        key={df.id}
                        type="button"
                        onClick={() => setDifficultyFilter(df.id)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                          difficultyFilter === df.id
                            ? "bg-[#0047B6] border-[#0057E0] text-white"
                            : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        {df.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {filteredAchievements.map((ach) => {
                    const unlocked = profile.unlockedAchievements.includes(
                      ach.id
                    );
                    const prog = getAchievementProgressForProfile(ach, profile);
                    const diffClass = getDifficultyBadgeStyle(ach.difficulty);

                    return (
                      <div
                        key={ach.id}
                        className={`p-4 rounded-md border transition-all flex flex-col justify-between ${
                          unlocked
                            ? "bg-[#0C0E12] border-emerald-500/50 shadow-sm"
                            : "bg-[#111317]/70 border-[#2A303C]"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                                  unlocked
                                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                    : "bg-[#181B20] text-[#94A3B8] border-[#2A303C]"
                                }`}
                              >
                                {ach.code}
                              </span>
                              <span
                                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${diffClass}`}
                              >
                                {ach.difficultyLabel}
                              </span>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#F59E0B]">
                              +{ach.xpReward.toLocaleString("pt-BR")} XP
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                            {unlocked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                            )}
                            <span>{ach.title}</span>
                          </h4>
                          <p className="text-xs text-[#94A3B8] leading-relaxed">
                            {ach.description}
                          </p>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-[#2A303C] space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] font-mono">
                            <span className="text-[#94A3B8]">
                              Progresso:{" "}
                              <strong className="text-white">
                                {prog.current.toLocaleString("pt-BR")} /{" "}
                                {prog.target.toLocaleString("pt-BR")}{" "}
                                {ach.unitLabel}
                              </strong>
                            </span>
                            <span
                              className={
                                unlocked
                                  ? "text-emerald-400 font-bold"
                                  : "text-[#F59E0B] font-bold"
                              }
                            >
                              {unlocked ? "CONQUISTADA" : `${prog.pct}%`}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-[#181B20] rounded-sm overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                unlocked ? "bg-emerald-500" : "bg-[#0047B6]"
                              }`}
                              style={{ width: `${prog.pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ABA 3: HISTÓRICO DE PARTIDAS */}
            {activeTab === "history" && (
              <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0057E0]" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Histórico de Partidas ({profile.recentMatches.length})
                      </h3>
                      <p className="text-xs text-[#94A3B8]">
                        Registro cronológico das suas últimas partidas em Sala
                        (PIN) e Treino Individual.
                      </p>
                    </div>
                  </div>
                </div>

                {profile.recentMatches.length === 0 ? (
                  <div className="p-8 rounded-md bg-[#0C0E12] border border-[#2A303C] text-center">
                    <Target className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-sm font-bold text-white mb-1">
                      Nenhuma partida registrada ainda
                    </p>
                    <p className="text-xs text-[#94A3B8] mb-4">
                      Jogue uma partida em Sala de Aula usando um PIN ou conclua
                      uma sessão no Treino Individual para registrar seu
                      histórico e ganhar XP!
                    </p>
                    <Link
                      href="/practice"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white text-xs font-bold"
                    >
                      Iniciar Treino Individual Agora
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#2A303C] font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                          <th className="py-3 px-3">Data / Hora</th>
                          <th className="py-3 px-3">Modalidade</th>
                          <th className="py-3 px-3">Prova / Minigame</th>
                          <th className="py-3 px-3 text-center">
                            Acertos / Erros
                          </th>
                          <th className="py-3 px-3 text-center">Precisão</th>
                          <th className="py-3 px-3 text-right">Pontos</th>
                          <th className="py-3 px-3 text-right">XP Ganho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A303C] text-xs">
                        {profile.recentMatches.map((match) => {
                          const dateStr = new Date(
                            match.playedAt
                          ).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          return (
                            <tr
                              key={match.id}
                              className="hover:bg-[#111317]/60 transition-colors"
                            >
                              <td className="py-3 px-3 font-mono text-[#94A3B8]">
                                {dateStr}
                              </td>
                              <td className="py-3 px-3">
                                {match.mode === "room" ? (
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0047B6]/25 text-blue-300 border border-[#0057E0]/40">
                                    SALA #{match.roomPin || "PIN"}
                                  </span>
                                ) : (
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0C0E12] text-[#94A3B8] border border-[#2A303C]">
                                    TREINO SOLO
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-semibold text-white">
                                {match.gameTitle}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className="text-emerald-400 font-bold">
                                  {match.hits}C
                                </span>{" "}
                                /{" "}
                                <span className="text-red-400 font-bold">
                                  {match.misses}E
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold ${
                                    match.accuracy >= 80
                                      ? "bg-emerald-950/60 text-emerald-400"
                                      : match.accuracy >= 50
                                      ? "bg-amber-950/60 text-amber-400"
                                      : "bg-red-950/60 text-red-400"
                                  }`}
                                >
                                  {match.accuracy}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-white">
                                {match.score.toLocaleString("pt-BR")} pts
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-[#F59E0B]">
                                +{match.xpEarned} XP
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
