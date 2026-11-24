"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MINIGAMES_CATALOG } from "@/data/electronicsData";
import {
  GameRoom,
  formatDurationCompact,
  getOrCreatePlayerId,
  joinRoom,
  subscribeToRoom,
  recordPlayerAction,
  finishRoomGame,
} from "@/lib/roomService";
import {
  UserProfile,
  subscribeToActiveProfile,
  recordCompletedMatch,
  getEffectiveAvatarString,
} from "@/lib/profileService";
import {
  UserAvatar,
  isImageAvatarString,
  processAvatarFileToDataUrl,
} from "@/components/UserAvatar";
import { ACHIEVEMENTS_CATALOG, getRankInfoByXp } from "@/data/achievementsData";
import { ConveyorGame } from "@/components/minigames/ConveyorGame";
import { CircuitRadarGame } from "@/components/minigames/CircuitRadarGame";
import { ResistorBuilderGame } from "@/components/minigames/ResistorBuilderGame";
import { BenchMatchGame } from "@/components/minigames/BenchMatchGame";
import { SmokeDetectiveGame } from "@/components/minigames/SmokeDetectiveGame";
import { IndustrialRepairGame } from "@/components/minigames/IndustrialRepairGame";
import { Footer } from "@/components/Footer";
import {
  Trophy,
  Clock,
  ArrowLeft,
  Play,
  Radio,
  Award,
  CheckCircle2,
  Camera,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  subscribeToSoundMute,
  toggleSoundMuted,
} from "@/lib/soundEffects";

const AVATARS = ["⚡", "🔧", "🤖", "🔋", "💡", "🛠️", "📟", "🚀"];

export default function PlayRoomPage() {
  const params = useParams();
  const pin = String(params?.pin || "").trim();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [notFound, setNotFound] = useState<boolean>(false);
  const [playerId, setPlayerId] = useState<string>("");
  const [nickname, setNickname] = useState<string>("");
  const [avatar, setAvatar] = useState<string>(AVATARS[0]);
  const [hasJoined, setHasJoined] = useState<boolean>(false);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [lastScoreDelta, setLastScoreDelta] = useState<number | null>(null);
  const [activeProfile, setActiveProfile] = useState<UserProfile | null>(null);
  const [soundMuted, setSoundMutedState] = useState<boolean>(false);
  const [matchSummary, setMatchSummary] = useState<{
    xpEarned: number;
    newTotalXp?: number;
    unlockedIds: string[];
  } | null>(null);

  const recordedRoundRef = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const activeRoundStartedAtRef = useRef<number | null>(null);
  const localStatsRef = useRef<{
    roundStartedAt: number | null;
    score: number;
    hits: number;
    misses: number;
    streak: number;
    maxStreak: number;
  }>({
    roundStartedAt: null,
    score: 0,
    hits: 0,
    misses: 0,
    streak: 0,
    maxStreak: 0,
  });

  useEffect(() => {
    const pid = getOrCreatePlayerId();
    setPlayerId(pid);
    const savedName = sessionStorage.getItem("senai_arena_nickname");
    const savedAvatar = sessionStorage.getItem("senai_arena_avatar");
    if (savedName) {
      setNickname(savedName);
      setAvatar(savedAvatar || AVATARS[0]);
      joinRoom(pin, savedName, savedAvatar || AVATARS[0])
        .then(() => setHasJoined(true))
        .catch(() => {});
    }

    const unsub = subscribeToActiveProfile((prof) => {
      setActiveProfile(prof);
      if (prof && !sessionStorage.getItem("senai_arena_nickname")) {
        setNickname((prev) => prev || prof.displayName);
        setAvatar(getEffectiveAvatarString(prof));
      }
    });
    const unsubSound = subscribeToSoundMute((muted) => {
      setSoundMutedState(muted);
    });
    return () => {
      unsub();
      unsubSound();
    };
  }, [pin]);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processAvatarFileToDataUrl(file);
      setAvatar(dataUrl);
    } catch {
      // ignore
    } finally {
      e.target.value = "";
    }
  };

  useEffect(() => {
    if (!pin) return;
    const unsub = subscribeToRoom(pin, (updated) => {
      if (!updated) {
        setNotFound(true);
      } else {
        setNotFound(false);
        setRoom(updated);
      }
    });
    return () => unsub();
  }, [pin]);

  const roomPin = room?.pin;
  const roomStatus = room?.status;
  const roomEndsAt = room?.endsAt;

  useEffect(() => {
    if (!roomPin || roomStatus !== "PLAYING" || !roomEndsAt) return;
    setMatchSummary(null);
    let finishTriggered = false;
    const tick = () => {
      const diff = Math.max(0, Math.ceil((roomEndsAt - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0 && !finishTriggered) {
        finishTriggered = true;
        finishRoomGame(roomPin);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [roomPin, roomStatus, roomEndsAt]);

  // Reset local stats when a new round starts or returns to lobby
  useEffect(() => {
    if (room?.status === "PLAYING" && room.startedAt) {
      activeRoundStartedAtRef.current = room.startedAt;
      if (localStatsRef.current.roundStartedAt !== room.startedAt) {
        localStatsRef.current = {
          roundStartedAt: room.startedAt,
          score: 0,
          hits: 0,
          misses: 0,
          streak: 0,
          maxStreak: 0,
        };
      }
      setMatchSummary(null);
    } else if (room?.status === "LOBBY") {
      activeRoundStartedAtRef.current = null;
      localStatsRef.current = {
        roundStartedAt: null,
        score: 0,
        hits: 0,
        misses: 0,
        streak: 0,
        maxStreak: 0,
      };
      setMatchSummary(null);
    } else {
      activeRoundStartedAtRef.current = null;
    }
  }, [room?.status, room?.startedAt, room?.minigameId]);

  // Automatically record match XP, history & achievements when the round finishes
  useEffect(() => {
    if (!room || room.status !== "FINISHED" || !room.startedAt || !playerId) {
      return;
    }
    const myPlayer = room.players?.[playerId];

    const roundKey = `room_${room.pin}_${room.minigameId}_${room.startedAt}`;
    if (recordedRoundRef.current === roundKey) return;
    recordedRoundRef.current = roundKey;

    const isRemoteFromThisRound = myPlayer?.roundStartedAt === room.startedAt;
    const isLocalFromThisRound =
      localStatsRef.current.roundStartedAt === room.startedAt;

    const finalScore = Math.max(
      isRemoteFromThisRound ? myPlayer?.score || 0 : 0,
      isLocalFromThisRound ? localStatsRef.current.score : 0
    );
    const finalHits = Math.max(
      isRemoteFromThisRound ? myPlayer?.hits || 0 : 0,
      isLocalFromThisRound ? localStatsRef.current.hits : 0
    );
    const finalMisses = Math.max(
      isRemoteFromThisRound ? myPlayer?.misses || 0 : 0,
      isLocalFromThisRound ? localStatsRef.current.misses : 0
    );
    const finalMaxStreak = Math.max(
      isRemoteFromThisRound ? myPlayer?.maxStreak || 0 : 0,
      isLocalFromThisRound ? localStatsRef.current.maxStreak : 0
    );

    // Só registra partida e concede XP se o aluno realmente acertou questões nesta rodada
    if (finalHits <= 0 || finalScore <= 0) {
      setMatchSummary(null);
      return;
    }

    const currentMeta =
      MINIGAMES_CATALOG.find((g) => g.id === room.minigameId) ||
      MINIGAMES_CATALOG[0];

    recordCompletedMatch({
      mode: "room",
      roundKey,
      roomPin: room.pin,
      gameId: room.minigameId,
      gameTitle: currentMeta.title,
      score: finalScore,
      hits: finalHits,
      misses: finalMisses,
      maxStreak: finalMaxStreak,
    }).then((res) => {
      if (res.xpEarned > 0) {
        setMatchSummary({
          xpEarned: res.xpEarned,
          newTotalXp: res.profile?.totalXp,
          unlockedIds: res.newlyUnlockedAchievements,
        });
      }
    });
  }, [room, playerId]);

  const handleManualJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    sessionStorage.setItem("senai_arena_nickname", nickname.trim());
    sessionStorage.setItem("senai_arena_avatar", avatar);
    await joinRoom(pin, nickname.trim(), avatar);
    setHasJoined(true);
  };

  const handleScoreAction = useCallback(
    (
      deltaScore: number,
      isHit: boolean,
      actionMessage: string,
      newLevel?: number
    ) => {
      const roundTs = activeRoundStartedAtRef.current;
      if (!roundTs) return;

      setLastScoreDelta(deltaScore);
      setTimeout(() => {
        setLastScoreDelta((prev) => (prev === deltaScore ? null : prev));
      }, 1800);

      const cur =
        localStatsRef.current.roundStartedAt === roundTs
          ? localStatsRef.current
          : {
              roundStartedAt: roundTs,
              score: 0,
              hits: 0,
              misses: 0,
              streak: 0,
              maxStreak: 0,
            };
      const nextStreak = isHit ? cur.streak + 1 : 0;
      localStatsRef.current = {
        roundStartedAt: roundTs,
        score: Math.max(0, cur.score + deltaScore),
        hits: isHit ? cur.hits + 1 : cur.hits,
        misses: !isHit ? cur.misses + 1 : cur.misses,
        streak: nextStreak,
        maxStreak: Math.max(cur.maxStreak, nextStreak),
      };

      if (!pin || !playerId) return;
      recordPlayerAction(
        pin,
        playerId,
        deltaScore,
        isHit,
        actionMessage,
        newLevel
      );
    },
    [pin, playerId]
  );

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#111317] text-zinc-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6 max-w-md w-full">
          <h1 className="text-lg font-mono font-bold text-red-400">
            SALA #{pin} NÃO LOCALIZADA
          </h1>
          <p className="text-xs text-zinc-400 mt-2">
            Verifique o PIN exibido no projetor do laboratório.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-amber-500 text-zinc-950 font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#111317] text-zinc-100 flex items-center justify-center p-4">
        <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6 max-w-md w-full">
          <span className="text-xs font-mono uppercase text-amber-400 font-semibold">
            SALA PIN #{pin}
          </span>
          <h1 className="text-lg font-bold text-white mt-1">
            Identificação na Bancada
          </h1>
          <form onSubmit={handleManualJoin} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                Apelido
              </label>
              <input
                type="text"
                maxLength={18}
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Digite seu nome"
                className="w-full py-2.5 px-3.5 rounded-md bg-[#0C0E12] border border-[#2A303C] text-white font-semibold text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-mono uppercase text-zinc-400">
                  Foto ou Marcador
                </label>
                <div className="flex items-center gap-1.5">
                  {activeProfile?.photoURL && (
                    <button
                      type="button"
                      onClick={() => setAvatar(activeProfile.photoURL)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                        avatar === activeProfile.photoURL
                          ? "bg-amber-500/20 border-amber-400 text-amber-300"
                          : "bg-[#0C0E12] border-[#2A303C] text-zinc-400"
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
                    className="px-2 py-0.5 rounded text-[10px] font-mono font-bold border bg-[#0C0E12] border-[#2A303C] text-zinc-200 inline-flex items-center gap-1"
                  >
                    <Camera className="w-3 h-3 text-amber-400" />
                    <span>Enviar Foto</span>
                  </button>
                </div>
              </div>

              {isImageAvatarString(avatar) && (
                <div className="mb-2 px-3 py-2 rounded-md bg-[#0C0E12] border border-amber-400/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      avatar={avatar}
                      name={nickname || "Aluno"}
                      size="sm"
                      className="border border-amber-400"
                    />
                    <span className="text-xs font-semibold text-amber-300">
                      Foto própria selecionada
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setAvatar(activeProfile?.avatar || AVATARS[0])
                    }
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
                    className={`py-2 rounded-md text-base border ${
                      avatar === av
                        ? "bg-amber-500/15 border-amber-400"
                        : "bg-[#0C0E12] border-[#242933]"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" /> Conectar
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#111317] text-zinc-400 font-mono text-xs flex items-center justify-center">
        Sincronizando bancada #{pin}...
      </div>
    );
  }

  const currentMeta =
    MINIGAMES_CATALOG.find((g) => g.id === room.minigameId) ||
    MINIGAMES_CATALOG[0];

  const sortedPlayers = Object.values(room.players || {}).sort(
    (a, b) => b.score - a.score
  );
  const myPlayer = room.players?.[playerId];
  const isRemoteCurrentRound = Boolean(
    room.startedAt && myPlayer?.roundStartedAt === room.startedAt
  );
  const isLocalCurrentRound = Boolean(
    room.startedAt && localStatsRef.current.roundStartedAt === room.startedAt
  );
  const displayScore = Math.max(
    isRemoteCurrentRound ? myPlayer?.score || 0 : 0,
    isLocalCurrentRound ? localStatsRef.current.score : 0
  );
  const displayHits = Math.max(
    isRemoteCurrentRound ? myPlayer?.hits || 0 : 0,
    isLocalCurrentRound ? localStatsRef.current.hits : 0
  );
  const displayMisses = Math.max(
    isRemoteCurrentRound ? myPlayer?.misses || 0 : 0,
    isLocalCurrentRound ? localStatsRef.current.misses : 0
  );
  const displayMaxStreak = Math.max(
    isRemoteCurrentRound ? myPlayer?.maxStreak || 0 : 0,
    isLocalCurrentRound ? localStatsRef.current.maxStreak : 0
  );
  const myRankIndex = sortedPlayers.findIndex((p) => p.id === playerId);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : sortedPlayers.length;
  const rankInfo = activeProfile
    ? getRankInfoByXp(activeProfile.totalXp)
    : null;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#111317] text-zinc-100 flex flex-col">
      {/* HUD Superior do Aluno */}
      <header className="border-b border-[#242933] bg-[#16191E] sticky top-0 z-30 px-4 py-2.5">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <UserAvatar
              avatar={myPlayer?.avatar || avatar}
              name={myPlayer?.name || nickname}
              size="sm"
              className="border border-[#2A303C]"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm sm:text-base font-extrabold text-white leading-tight">
                  {myPlayer?.name || nickname}
                </p>
                {activeProfile && rankInfo && (
                  <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-[#0C0E12] text-[#F59E0B] border border-[#2A303C]">
                    {rankInfo.currentPatent.icon} NV{" "}
                    {rankInfo.currentTier.level} •{" "}
                    {rankInfo.currentPatent.badgeCode}
                  </span>
                )}
              </div>
              <span className="text-xs font-mono font-bold text-zinc-400">
                PIN {room.pin} • #{myRank}º LUGAR
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {myPlayer && myPlayer.streak >= 2 && (
              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs sm:text-sm font-mono font-black">
                {myPlayer.streak}x
              </span>
            )}

            <div
              className={`px-3 py-1.5 rounded-lg border text-right transition-colors ${
                lastScoreDelta !== null && lastScoreDelta < 0
                  ? "bg-red-950/90 border-red-500"
                  : "bg-[#0C0E12] border-[#2A303C]"
              }`}
            >
              <span className="text-[10px] font-mono text-zinc-400 font-bold block leading-none">
                PONTOS
              </span>
              <div className="flex items-center gap-1">
                <span className="text-sm sm:text-base font-mono font-black text-amber-400">
                  {displayScore}
                </span>
                {lastScoreDelta !== null && (
                  <span
                    className={`text-xs font-mono font-extrabold ${
                      lastScoreDelta >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    ({lastScoreDelta >= 0 ? `+${lastScoreDelta}` : lastScoreDelta})
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleSoundMuted()}
              title={
                soundMuted
                  ? "Ativar sons da bancada"
                  : "Silenciar sons da bancada"
              }
              aria-label="Alternar áudio da bancada"
              className={`p-2 rounded-lg border transition-colors ${
                soundMuted
                  ? "bg-[#111317] border-[#2A303C] text-zinc-500 hover:text-zinc-200"
                  : "bg-[#0C0E12] border-[#2A303C] text-amber-400 hover:border-amber-400/60"
              }`}
            >
              {soundMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            {room.status === "PLAYING" && (
              <div
                className={`px-3 py-1.5 rounded-lg font-mono font-black text-sm sm:text-base flex items-center gap-1.5 border ${
                  remainingSec <= 15
                    ? "bg-red-950 border-red-500 text-red-300"
                    : "bg-[#0C0E12] border-[#2A303C] text-zinc-100"
                }`}
              >
                <Clock className="w-4 h-4 text-amber-400" />
                {formatTime(remainingSec)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main
        className={`flex-1 w-full mx-auto px-3 py-5 flex flex-col justify-center ${
          currentMeta.track === "industrial" ? "max-w-5xl" : "max-w-3xl"
        }`}
      >
        {/* ESTADO 1: AGUARDANDO NO LOBBY */}
        {room.status === "LOBBY" && (
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6 text-center max-w-md mx-auto w-full">
            <div className="w-10 h-10 rounded-md bg-[#0C0E12] border border-[#2A303C] flex items-center justify-center mx-auto mb-3">
              <Radio className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              CONECTADO • AGUARDANDO INÍCIO
            </span>
            <h2 className="text-lg font-bold text-white mt-1">
              {currentMeta.title}
            </h2>
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-[11px] font-mono text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              Duração da rodada: {formatDurationCompact(room.durationSec)}
            </div>
            <p className="text-xs text-zinc-400 mt-2.5 leading-relaxed">
              {currentMeta.howToPlay}
            </p>
          </div>
        )}

        {/* ESTADO 2: JOGANDO */}
        {room.status === "PLAYING" && (
          <div className="w-full">
            {room.minigameId === "conveyor" && (
              <ConveyorGame onScoreAction={handleScoreAction} />
            )}
            {room.minigameId === "radar" && (
              <CircuitRadarGame onScoreAction={handleScoreAction} />
            )}
            {room.minigameId === "resistor" && (
              <ResistorBuilderGame onScoreAction={handleScoreAction} />
            )}
            {room.minigameId === "match" && (
              <BenchMatchGame onScoreAction={handleScoreAction} />
            )}
            {room.minigameId === "detective" && (
              <SmokeDetectiveGame onScoreAction={handleScoreAction} />
            )}
            {room.minigameId === "industrial_repair" && (
              <IndustrialRepairGame onScoreAction={handleScoreAction} />
            )}
          </div>
        )}

        {/* ESTADO 3: FIM DA RODADA */}
        {room.status === "FINISHED" && (
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6 text-center max-w-md mx-auto w-full">
            <div className="w-12 h-12 rounded-md bg-amber-500/15 border border-amber-400/40 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>

            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              RODADA ENCERRADA
            </span>
            <h2 className="text-2xl font-bold text-white mt-1">
              #{myRank}º Lugar
            </h2>
            <p className="text-xl font-mono font-bold text-amber-400 mt-1">
              {displayScore} pts
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4 bg-[#0C0E12] border border-[#242933] rounded-md p-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  ACERTOS
                </span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {displayHits}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  FALHAS
                </span>
                <span className="text-base font-mono font-bold text-red-400">
                  {displayMisses}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  COMBO MÁX
                </span>
                <span className="text-base font-mono font-bold text-amber-400">
                  {displayMaxStreak}x
                </span>
              </div>
            </div>

            {/* Resumo de XP e Conquistas Sincronizados no Perfil */}
            {matchSummary && (
              <div className="mt-4 p-3 rounded-md bg-[#12241D] border border-emerald-500/40 text-left">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    XP Salvo no Banco & Perfil:
                  </span>
                  <span className="text-[#F59E0B]">
                    +{matchSummary.xpEarned} XP
                  </span>
                </div>
                {matchSummary.newTotalXp !== undefined && (
                  <p className="text-[11px] font-mono text-zinc-300 mt-1">
                    Novo saldo acumulado:{" "}
                    <strong className="text-white">
                      {matchSummary.newTotalXp.toLocaleString("pt-BR")} XP
                    </strong>
                  </p>
                )}
                {matchSummary.unlockedIds.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-emerald-500/30 space-y-1">
                    <span className="text-[11px] font-bold text-[#F59E0B] flex items-center gap-1">
                      <Award className="w-3.5 h-3.5" /> Conquistas Desbloqueadas:
                    </span>
                    {matchSummary.unlockedIds.map((id) => {
                      const ach = ACHIEVEMENTS_CATALOG.find((a) => a.id === id);
                      return (
                        <div
                          key={id}
                          className="text-xs font-mono text-white bg-[#0C0E12] px-2 py-1 rounded border border-[#2A303C]"
                        >
                          {ach ? `${ach.title} (+${ach.xpReward} XP)` : id}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <Link
                href="/profile"
                className="py-2 px-3 rounded-md bg-[#0C0E12] hover:bg-[#14181F] border border-[#2A303C] text-xs font-mono font-bold text-zinc-200"
              >
                Meu Perfil & XP
              </Link>
              <Link
                href="/leaderboard"
                className="py-2 px-3 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-xs font-mono font-bold text-white"
              >
                Ranking Global
              </Link>
            </div>

            <p className="text-xs font-mono text-zinc-500 mt-4">
              Aguarde o professor iniciar a próxima atividade.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
