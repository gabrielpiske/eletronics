"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  UserProfile,
  subscribeToGlobalLeaderboard,
  subscribeToActiveProfile,
} from "@/lib/profileService";
import { getRankInfoByXp, ACHIEVEMENTS_CATALOG } from "@/data/achievementsData";
import {
  Award,
  Flame,
  Medal,
  Percent,
  Trophy,
  UserCheck,
  Zap,
} from "lucide-react";

type SortCriteria = "xp" | "accuracy" | "streak";

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [sortBy, setSortBy] = useState<SortCriteria>("xp");

  useEffect(() => {
    const unsubLb = subscribeToGlobalLeaderboard((list) => {
      setPlayers(list);
    });
    const unsubProf = subscribeToActiveProfile((prof) => {
      setActiveProfile(prof);
    });
    return () => {
      unsubLb();
      unsubProf();
    };
  }, []);

  const getPlayerAccuracy = (p: UserProfile) => {
    const total = p.totalHits + p.totalMisses;
    return total > 0 ? Math.round((p.totalHits / total) * 100) : 0;
  };

  const sortedPlayers = [...players].sort((a, b) => {
    if (sortBy === "accuracy") {
      const diff = getPlayerAccuracy(b) - getPlayerAccuracy(a);
      return diff !== 0 ? diff : b.totalXp - a.totalXp;
    }
    if (sortBy === "streak") {
      const diff = b.bestStreak - a.bestStreak;
      return diff !== 0 ? diff : b.totalXp - a.totalXp;
    }
    return b.totalXp - a.totalXp;
  });

  const topThree = sortedPlayers.slice(0, 3);

  return (
    <main className="min-h-screen flex flex-col bg-[#111317] text-[#F1F5F9]">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {/* Header & Sorting Controls */}
        <section className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
          <div className="h-1 w-full bg-[#F59E0B]" />
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                <span className="font-mono text-xs uppercase tracking-widest text-[#94A3B8] font-semibold">
                  TELEMETRIA UNIFICADA // SALA DE AULA + TREINO INDIVIDUAL
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                Ranking Global da Plataforma SENAI
              </h2>
              <p className="text-xs text-[#94A3B8] mt-1">
                Classificação geral somando XP de partidas com PIN em sala, sessões
                individuais de bancada e bônus de conquistas.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setSortBy("xp")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold border transition-all ${
                  sortBy === "xp"
                    ? "bg-[#0047B6] border-[#0057E0] text-white"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>XP Total</span>
              </button>
              <button
                onClick={() => setSortBy("accuracy")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold border transition-all ${
                  sortBy === "accuracy"
                    ? "bg-[#0047B6] border-[#0057E0] text-white"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Percent className="w-3.5 h-3.5 text-emerald-400" />
                <span>Maior Precisão (%)</span>
              </button>
              <button
                onClick={() => setSortBy("streak")}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-bold border transition-all ${
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
        </section>

        {/* Top 3 Highlight Podium */}
        {topThree.length > 0 && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topThree.map((player, idx) => {
              const rankInfo = getRankInfoByXp(player.totalXp);
              const acc = getPlayerAccuracy(player);
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
                      {rankInfo.currentTier.badgeCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-3.5 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[#0C0E12] border border-[#2A303C] flex items-center justify-center text-2xl">
                      {player.avatar}
                    </div>
                    <div className="min-w-0">
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
                      <p className="text-xs text-[#94A3B8] truncate">
                        {rankInfo.currentTier.title}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#2A303C] font-mono">
                    <div className="bg-[#0C0E12] p-2 rounded border border-[#2A303C] text-center">
                      <div className="text-[9px] uppercase text-[#94A3B8]">
                        XP TOTAL
                      </div>
                      <div className="text-xs font-bold text-[#F59E0B]">
                        {player.totalXp.toLocaleString("pt-BR")}
                      </div>
                    </div>
                    <div className="bg-[#0C0E12] p-2 rounded border border-[#2A303C] text-center">
                      <div className="text-[9px] uppercase text-[#94A3B8]">
                        PRECISÃO
                      </div>
                      <div className="text-xs font-bold text-emerald-400">
                        {acc}%
                      </div>
                    </div>
                    <div className="bg-[#0C0E12] p-2 rounded border border-[#2A303C] text-center">
                      <div className="text-[9px] uppercase text-[#94A3B8]">
                        COMBO MÁX
                      </div>
                      <div className="text-xs font-bold text-amber-400">
                        {player.bestStreak}x
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
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Classificação Geral de Alunos ({sortedPlayers.length})
            </h3>
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
                  <th className="py-3.5 px-4 text-right">XP Acumulado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A303C] text-xs">
                {sortedPlayers.map((player, index) => {
                  const rankInfo = getRankInfoByXp(player.totalXp);
                  const acc = getPlayerAccuracy(player);
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
                          <span className="text-xl">{player.avatar}</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">
                                {player.displayName}
                              </span>
                              {isMe && (
                                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#0047B6] text-white font-bold">
                                  VOCÊ
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-[#94A3B8]">
                              {rankInfo.currentTier.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="px-2 py-0.5 rounded bg-[#0C0E12] text-[#F59E0B] border border-[#2A303C] font-bold">
                          NV {rankInfo.currentTier.level}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-white">
                        {player.matchesPlayed}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            acc >= 80
                              ? "bg-emerald-950/60 text-emerald-400"
                              : acc >= 50
                              ? "bg-amber-950/60 text-amber-400"
                              : "bg-red-950/60 text-red-400"
                          }`}
                        >
                          {acc}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">
                        {player.bestStreak}x
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
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-[#F59E0B]">
                        {player.totalXp.toLocaleString("pt-BR")} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
