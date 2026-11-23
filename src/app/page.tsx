"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { checkRoomExists, joinRoom } from "@/lib/roomService";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  UserProfile,
  subscribeToActiveProfile,
  getEffectiveAvatarString,
} from "@/lib/profileService";
import {
  ACHIEVEMENTS_CATALOG,
  SENAI_PATENTS,
  getRankInfoByXp,
} from "@/data/achievementsData";
import Navbar from "@/components/Navbar";
import {
  UserAvatar,
  isImageAvatarString,
  processAvatarFileToDataUrl,
} from "@/components/UserAvatar";
import { Footer } from "@/components/Footer";
import { ArrowRight, Award, Camera, Trophy } from "lucide-react";

const AVATARS = ["⚡", "🔧", "🤖", "🔋", "💡", "🛠️", "📟", "🚀"];

export default function HomePage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const unsub = subscribeToActiveProfile((prof) => {
      setProfile(prof);
      if (prof) {
        setNickname((prev) => (prev ? prev : prof.displayName));
        setAvatar(getEffectiveAvatarString(prof));
      }
    });
    return () => unsub();
  }, []);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const dataUrl = await processAvatarFileToDataUrl(file);
      setAvatar(dataUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao processar a foto."
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleJoinWithPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const cleanPin = pin.replace(/\s+/g, "");

    if (cleanPin.length !== 6) {
      setError("Informe o PIN de 6 dígitos da sala.");
      return;
    }
    if (!nickname.trim()) {
      setError("Informe seu nome ou apelido.");
      return;
    }

    setLoading(true);
    try {
      const exists = await checkRoomExists(cleanPin);
      if (!exists) {
        setError("Sala não localizada. Confira o PIN no projetor.");
        setLoading(false);
        return;
      }

      sessionStorage.setItem("senai_arena_nickname", nickname.trim());
      sessionStorage.setItem("senai_arena_avatar", avatar);
      await joinRoom(cleanPin, nickname.trim(), avatar);
      router.push(`/play/${cleanPin}`);
    } catch {
      setError("Falha de conexão com a sala. Tente novamente.");
      setLoading(false);
    }
  };

  const rankInfo = profile ? getRankInfoByXp(profile.totalXp) : null;

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#111317] text-zinc-100">
      <Navbar />

      {/* Área Central: Terminal Direto de Entrada por PIN */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 gap-4">
        <div className="w-full max-w-md bg-[#181B20] border border-[#2A303C] rounded-lg shadow-2xl overflow-hidden">
          {/* Topo do Módulo estilo Instrumento */}
          <div className="bg-[#13161A] border-b border-[#242933] px-5 py-3 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              TERMINAL DE BANCADA • ACESSO PIN
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {isFirebaseConfigured ? "ONLINE" : "SYNC LOCAL"}
            </span>
          </div>

          {/* Status de Vínculo Google / XP */}
          <div className="px-6 pt-4">
            {profile && rankInfo ? (
              <Link
                href="/profile"
                className="flex items-center justify-between px-3 py-2 rounded-md bg-[#0C0E12] hover:bg-[#14181F] border border-[#0057E0]/50 text-xs transition-colors"
                title="Clique para gerenciar seu perfil ou trocar de foto"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <UserAvatar profile={profile} size="xs" />
                  <span className="truncate text-zinc-200 font-semibold">
                    {profile.displayName} ({rankInfo.currentPatent.icon}{" "}
                    {rankInfo.currentPatent.title})
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-[#F59E0B] shrink-0">
                  NV {rankInfo.currentTier.level} •{" "}
                  {profile.totalXp.toLocaleString("pt-BR")} XP
                </span>
              </Link>
            ) : (
              <Link
                href="/profile"
                className="flex items-center justify-between px-3 py-2 rounded-md bg-[#0C0E12] hover:bg-[#14181F] border border-[#2A303C] text-xs transition-colors"
              >
                <span className="text-zinc-300 font-medium">
                  Vincular Conta Google (Salvar XP & Conquistas)
                </span>
                <span className="font-mono text-[11px] font-bold text-[#F59E0B]">
                  Conectar →
                </span>
              </Link>
            )}
          </div>

          <form onSubmit={handleJoinWithPin} className="p-6 flex flex-col gap-5">
            {/* Visor Digital do PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                  PIN da Sala
                </label>
                <span className="text-[11px] font-mono text-zinc-500">
                  6 dígitos
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="000000"
                className="w-full text-center text-3xl font-mono font-bold tracking-[0.3em] py-3.5 px-4 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-amber-400 focus:outline-none text-amber-400 placeholder:text-zinc-800 transition-colors"
              />
            </div>

            {/* Identificação do Aluno */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-zinc-300 font-semibold block mb-1.5">
                Identificação / Apelido
              </label>
              <input
                type="text"
                maxLength={18}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full text-sm font-semibold py-3 px-3.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-amber-400 focus:outline-none text-zinc-100 placeholder:text-zinc-600 transition-colors"
              />
            </div>

            {/* Seletor Compacto de Foto ou Ícone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                  Foto ou Marcador
                </label>
                <div className="flex items-center gap-1.5">
                  {profile?.photoURL && (
                    <button
                      type="button"
                      onClick={() => setAvatar(profile.photoURL)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border transition-colors ${
                        avatar === profile.photoURL
                          ? "bg-amber-500/20 border-amber-400 text-amber-300"
                          : "bg-[#0C0E12] border-[#2A303C] text-zinc-400 hover:text-white"
                      }`}
                    >
                      Foto do Perfil
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border inline-flex items-center gap-1 transition-colors ${
                      isImageAvatarString(avatar) &&
                      avatar !== profile?.photoURL
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-[#0C0E12] border-[#2A303C] text-zinc-300 hover:text-white"
                    }`}
                  >
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Enviar Foto</span>
                  </button>
                </div>
              </div>

              {isImageAvatarString(avatar) && (
                <div className="mb-2 px-3 py-2 rounded-md bg-[#0C0E12] border border-amber-400/60 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar
                      avatar={avatar}
                      name={nickname || "Aluno"}
                      size="sm"
                      className="border border-amber-400"
                    />
                    <span className="text-xs font-semibold text-amber-300">
                      Foto própria selecionada para a bancada
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvatar(profile?.avatar || AVATARS[0])}
                    className="text-[10px] font-mono text-zinc-400 hover:text-white"
                  >
                    Usar Emoji
                  </button>
                </div>
              )}

              <div className="grid grid-cols-8 gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`py-2 rounded-md text-base flex items-center justify-center border transition-colors ${
                      avatar === av
                        ? "bg-amber-500/15 border-amber-400 text-white"
                        : "bg-[#0C0E12] border-[#242933] hover:border-zinc-600"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-950/60 border-l-4 border-red-500 px-3.5 py-2.5 text-xs font-medium text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-bold text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
            >
              <span>{loading ? "Conectando..." : "Conectar à Bancada"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Atalhos Rápidos V2.0 */}
        <div className="w-full max-w-md grid grid-cols-2 gap-3">
          <Link
            href="/leaderboard"
            className="bg-[#181B20] hover:bg-[#1E2229] border border-[#2A303C] rounded-md px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <span>Ranking Global</span>
            </span>
            <span className="font-mono text-[10px] text-zinc-400">VER →</span>
          </Link>
          <Link
            href="/profile"
            className="bg-[#181B20] hover:bg-[#1E2229] border border-[#2A303C] rounded-md px-3.5 py-2.5 flex items-center justify-between text-xs font-semibold text-zinc-200 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0057E0]" />
              <span>Perfil & Patentes</span>
            </span>
            <span className="font-mono text-[10px] text-zinc-400">
              {SENAI_PATENTS.length} PAT / {ACHIEVEMENTS_CATALOG.length} ACH →
            </span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
