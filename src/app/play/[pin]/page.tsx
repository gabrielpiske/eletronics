"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { MINIGAMES_CATALOG } from "@/data/electronicsData";
import {
  GameRoom,
  getOrCreatePlayerId,
  joinRoom,
  subscribeToRoom,
  recordPlayerAction,
} from "@/lib/roomService";
import {
  subscribeToActiveProfile,
  recordCompletedMatch,
} from "@/lib/profileService";
import { ACHIEVEMENTS_CATALOG } from "@/data/achievementsData";
import { ConveyorGame } from "@/components/minigames/ConveyorGame";
import { CircuitRadarGame } from "@/components/minigames/CircuitRadarGame";
import { ResistorBuilderGame } from "@/components/minigames/ResistorBuilderGame";
import { BenchMatchGame } from "@/components/minigames/BenchMatchGame";
import { SmokeDetectiveGame } from "@/components/minigames/SmokeDetectiveGame";
import { Footer } from "@/components/Footer";
import {
  Trophy,
  Clock,
  ArrowLeft,
  Play,
  Radio,
  Award,
  CheckCircle2,
} from "lucide-react";

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
  const [matchSummary, setMatchSummary] = useState<{
    xpEarned: number;
    unlockedIds: string[];
  } | null>(null);

  const recordedRoundRef = useRef<string | null>(null);

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
    } else {
      const unsub = subscribeToActiveProfile((prof) => {
        if (prof) {
          setNickname((prev) => prev || prof.displayName);
          setAvatar(prof.avatar || AVATARS[0]);
        }
      });
      return () => unsub();
    }
  }, [pin]);

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

  useEffect(() => {
    if (!room || room.status !== "PLAYING" || !room.endsAt) return;
    setMatchSummary(null);
    const tick = () => {
      const diff = Math.max(0, Math.ceil((room.endsAt! - Date.now()) / 1000));
      setRemainingSec(diff);
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [room]);

  // Automatically record match XP, history & achievements when the round finishes
  useEffect(() => {
    if (!room || room.status !== "FINISHED" || !playerId) return;
    const myPlayer = room.players?.[playerId];
    if (!myPlayer) return;

    const roundKey = `${room.pin}_${room.minigameId}_${room.startedAt || 0}`;
    if (recordedRoundRef.current === roundKey) return;
    recordedRoundRef.current = roundKey;

    const currentMeta =
      MINIGAMES_CATALOG.find((g) => g.id === room.minigameId) ||
      MINIGAMES_CATALOG[0];

    recordCompletedMatch({
      mode: "room",
      roomPin: room.pin,
      gameId: room.minigameId,
      gameTitle: currentMeta.title,
      score: myPlayer.score || 0,
      hits: myPlayer.hits || 0,
      misses: myPlayer.misses || 0,
      maxStreak: myPlayer.maxStreak || 0,
    }).then((res) => {
      setMatchSummary({
        xpEarned: res.xpEarned,
        unlockedIds: res.newlyUnlockedAchievements,
      });
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
      setLastScoreDelta(deltaScore);
      setTimeout(() => {
        setLastScoreDelta((prev) => (prev === deltaScore ? null : prev));
      }, 1800);

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
              <label className="text-xs font-mono uppercase text-zinc-400 block mb-1">
                Marcador
              </label>
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
  const myRankIndex = sortedPlayers.findIndex((p) => p.id === playerId);
  const myRank = myRankIndex >= 0 ? myRankIndex + 1 : sortedPlayers.length;

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#111317] text-zinc-100 flex flex-col">
      {/* HUD Superior do Aluno */}
      <header className="border-b border-[#242933] bg-[#16191E] sticky top-0 z-30 px-3 py-2">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{myPlayer?.avatar || avatar}</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white leading-tight">
                {myPlayer?.name || nickname}
              </p>
              <span className="text-[10px] font-mono text-zinc-400">
                PIN {room.pin} • #{myRank}º
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {myPlayer && myPlayer.streak >= 2 && (
              <span className="px-2 py-1 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs font-mono font-bold">
                {myPlayer.streak}x
              </span>
            )}

            <div
              className={`px-2.5 py-1 rounded-md border text-right transition-colors ${
                lastScoreDelta !== null && lastScoreDelta < 0
                  ? "bg-red-950/90 border-red-500"
                  : "bg-[#0C0E12] border-[#2A303C]"
              }`}
            >
              <span className="text-[9px] font-mono text-zinc-500 block leading-none">
                PONTOS
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-mono font-bold text-amber-400">
                  {myPlayer?.score || 0}
                </span>
                {lastScoreDelta !== null && (
                  <span
                    className={`text-[11px] font-mono font-bold ${
                      lastScoreDelta >= 0 ? "text-emerald-400" : "text-red-400"
                    }`}
                  >
                    ({lastScoreDelta >= 0 ? `+${lastScoreDelta}` : lastScoreDelta})
                  </span>
                )}
              </div>
            </div>

            {room.status === "PLAYING" && (
              <div
                className={`px-2.5 py-1.5 rounded-md font-mono font-bold text-xs flex items-center gap-1 border ${
                  remainingSec <= 15
                    ? "bg-red-950 border-red-500 text-red-300"
                    : "bg-[#0C0E12] border-[#2A303C] text-zinc-200"
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                {formatTime(remainingSec)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-3 py-5 flex flex-col justify-center">
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
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
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
              {myPlayer?.score || 0} pts
            </p>

            <div className="grid grid-cols-3 gap-2 mt-4 bg-[#0C0E12] border border-[#242933] rounded-md p-3">
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  ACERTOS
                </span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {myPlayer?.hits || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  FALHAS
                </span>
                <span className="text-base font-mono font-bold text-red-400">
                  {myPlayer?.misses || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-zinc-500 block">
                  COMBO MÁX
                </span>
                <span className="text-base font-mono font-bold text-amber-400">
                  {myPlayer?.maxStreak || 0}x
                </span>
              </div>
            </div>

            {/* Resumo de XP e Conquistas Sincronizados no Perfil */}
            {matchSummary && (
              <div className="mt-4 p-3 rounded-md bg-[#12241D] border border-emerald-500/40 text-left">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    XP Sincronizado no Perfil:
                  </span>
                  <span className="text-[#F59E0B]">
                    +{matchSummary.xpEarned} XP
                  </span>
                </div>
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
