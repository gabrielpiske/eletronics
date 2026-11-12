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
} from "@/lib/profileService";
import {
  ACHIEVEMENTS_CATALOG,
  SENAI_RANK_TIERS,
  getRankInfoByXp,
} from "@/data/achievementsData";
import { AVATARS } from "@/data/electronicsData";
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Flame,
  Lock,
  LogOut,
  Percent,
  Play,
  ShieldCheck,
  Target,
  Trophy,
  UserCheck,
  Zap,
} from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simAvatar, setSimAvatar] = useState(AVATARS[0]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToActiveProfile((prof) => {
      setProfile(prof);
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

  return (
    <main className="min-h-screen flex flex-col bg-[#111317] text-[#F1F5F9]">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {!profile ? (
          /* Unauthenticated State: Prompt to Sign In with Google */
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
                  Ao entrar com sua conta Google, todas as partidas jogadas em{" "}
                  <strong className="text-white">Sala de Aula (PIN)</strong> ou no{" "}
                  <strong className="text-white">Treino Individual</strong> acumulam XP,
                  sobem o nível do seu perfil, desbloqueiam conquistas e registram seu
                  histórico completo.
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

            {/* Preview of Career Ranks & Achievements */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                  <span>Plano de Carreira Técnica SENAI (10 Níveis de XP)</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {SENAI_RANK_TIERS.map((tier) => (
                    <div
                      key={tier.level}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-md bg-[#0C0E12] border border-[#2A303C]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#0047B6]/25 text-[#F59E0B] border border-[#0057E0]/40">
                          NV {tier.level}
                        </span>
                        <span className="text-xs font-semibold text-white">
                          {tier.title}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#94A3B8]">
                        {tier.minXp.toLocaleString("pt-BR")} XP
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Student Profile View */
          <>
            {/* Top Dossier Banner */}
            <section className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden shadow-lg">
              <div className="h-1 w-full bg-[#0047B6]" />
              <div className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-[#0C0E12] border-2 border-[#0057E0] flex items-center justify-center text-3xl shrink-0">
                    {profile.avatar}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40">
                        NÍVEL {rankInfo?.currentTier.level} //{" "}
                        {rankInfo?.currentTier.badgeCode}
                      </span>
                      <span className="font-mono text-xs text-emerald-400 font-semibold">
                        {rankInfo?.currentTier.title}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {profile.displayName}
                    </h2>
                    <p className="font-mono text-xs text-[#94A3B8]">
                      {profile.email} • Conta Google Vinculada
                    </p>
                  </div>
                </div>

                {/* Level Progress Bar */}
                {rankInfo && (
                  <div className="flex-1 max-w-md bg-[#0C0E12] border border-[#2A303C] rounded-md p-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono uppercase text-[#94A3B8] text-[10px]">
                        Progresso de Nível
                      </span>
                      <span className="font-mono font-bold text-[#F59E0B]">
                        {profile.totalXp.toLocaleString("pt-BR")} XP
                        {rankInfo.nextTier
                          ? ` / ${rankInfo.nextTier.minXp.toLocaleString("pt-BR")} XP`
                          : " (NÍVEL MÁXIMO)"}
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-[#181B20] rounded-sm overflow-hidden border border-[#2A303C]">
                      <div
                        className="h-full bg-[#0047B6] transition-all duration-500"
                        style={{ width: `${rankInfo.progressPercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#94A3B8]">
                      <span>Atual: {rankInfo.currentTier.title}</span>
                      {rankInfo.nextTier && (
                        <span>Próximo: {rankInfo.nextTier.title}</span>
                      )}
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
                    XP Total Acumulado
                  </span>
                  <Zap className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {profile.totalXp.toLocaleString("pt-BR")}{" "}
                  <span className="text-xs font-normal text-[#F59E0B]">XP</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Soma de salas PIN, treinos solo e bônus de conquistas
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Partidas Jogadas
                  </span>
                  <Trophy className="w-4 h-4 text-[#0057E0]" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {profile.matchesPlayed}
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  {profile.totalHits} acertos • {profile.totalMisses} erros totais
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Média de Acerto
                  </span>
                  <Percent className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-emerald-400">
                  {overallAccuracy}%
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Precisão técnica acumulada nas bancadas
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Maior Sequência (Streak)
                  </span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-amber-400">
                  {profile.bestStreak}x
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Respostas corretas seguidas sem erro
                </p>
              </div>
            </section>

            {/* Achievements Grid (12 Achievements) */}
            <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#F59E0B]" />
                    <h3 className="text-base font-bold text-white">
                      Insígnias & Conquistas Técnicas SENAI
                    </h3>
                  </div>
                  <p className="text-xs text-[#94A3B8]">
                    Cada conquista desbloqueada concede bônus imediato de XP para o
                    seu perfil.
                  </p>
                </div>
                <div className="px-3 py-1.5 rounded-md bg-[#0C0E12] border border-[#2A303C] font-mono text-xs font-bold text-[#F59E0B]">
                  {profile.unlockedAchievements.length} /{" "}
                  {ACHIEVEMENTS_CATALOG.length} DESBLOQUEADAS
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {ACHIEVEMENTS_CATALOG.map((ach) => {
                  const unlocked = profile.unlockedAchievements.includes(ach.id);
                  return (
                    <div
                      key={ach.id}
                      className={`p-4 rounded-md border transition-all flex flex-col justify-between ${
                        unlocked
                          ? "bg-[#0C0E12] border-emerald-500/50 shadow-sm"
                          : "bg-[#111317]/60 border-[#2A303C] opacity-70"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                              unlocked
                                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                : "bg-[#181B20] text-[#94A3B8] border-[#2A303C]"
                            }`}
                          >
                            {ach.code}
                          </span>
                          <span className="font-mono text-xs font-bold text-[#F59E0B]">
                            +{ach.xpReward} XP
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
                      <div className="mt-3 pt-2 border-t border-[#2A303C] flex items-center justify-between text-[10px] font-mono">
                        <span className="uppercase text-[#94A3B8]">
                          Cat: {ach.category}
                        </span>
                        <span
                          className={
                            unlocked ? "text-emerald-400 font-bold" : "text-[#94A3B8]"
                          }
                        >
                          {unlocked ? "CONQUISTADA" : "BLOQUEADA"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Recent Match History Table */}
            <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#0057E0]" />
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Histórico de Partidas ({profile.recentMatches.length})
                    </h3>
                    <p className="text-xs text-[#94A3B8]">
                      Registro cronológico das suas últimas partidas em Sala (PIN) e
                      Treino Individual.
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
                    Jogue uma partida em Sala de Aula usando um PIN ou conclua uma
                    sessão no Treino Individual para registrar seu histórico e ganhar
                    XP!
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
                        <th className="py-3 px-3 text-center">Acertos / Erros</th>
                        <th className="py-3 px-3 text-center">Precisão</th>
                        <th className="py-3 px-3 text-right">Pontos</th>
                        <th className="py-3 px-3 text-right">XP Ganho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#2A303C] text-xs">
                      {profile.recentMatches.map((match) => {
                        const dateStr = new Date(match.playedAt).toLocaleString(
                          "pt-BR",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        );
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
          </>
        )}
      </div>
    </main>
  );
}
