"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { ConveyorGame } from "@/components/minigames/ConveyorGame";
import { CircuitRadarGame } from "@/components/minigames/CircuitRadarGame";
import { ResistorBuilderGame } from "@/components/minigames/ResistorBuilderGame";
import { BenchMatchGame } from "@/components/minigames/BenchMatchGame";
import { SmokeDetectiveGame } from "@/components/minigames/SmokeDetectiveGame";
import { Footer } from "@/components/Footer";
import {
  Trophy,
  Clock,
  Flame,
  Sparkles,
  ArrowLeft,
  Play,
  Radio,
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
    const tick = () => {
      const diff = Math.max(0, Math.ceil((room.endsAt! - Date.now()) / 1000));
      setRemainingSec(diff);
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [room]);

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
      <div className="min-h-screen bg-[#060B16] text-white flex flex-col items-center justify-center p-4 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full">
          <h1 className="text-2xl font-black text-red-400">
            Sala #{pin} não encontrada
          </h1>
          <p className="text-sm text-slate-300 mt-2">
            Verifique se o PIN digitado está igual ao projetado pelo professor
            no quadro.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-sky-500 text-slate-950 font-black text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar para o Início
          </Link>
        </div>
      </div>
    );
  }

  // Se o aluno abriu pelo QR Code e ainda não escolheu apelido
  if (!hasJoined) {
    return (
      <div className="min-h-screen bg-[#060B16] text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border-2 border-sky-500/60 rounded-3xl p-6 max-w-md w-full shadow-2xl">
          <span className="text-xs font-mono uppercase text-sky-400 font-bold">
            SALA PIN #{pin}
          </span>
          <h1 className="text-2xl font-black text-white mt-1">
            Identifique-se na Bancada
          </h1>
          <form onSubmit={handleManualJoin} className="mt-4 flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                Seu Apelido
              </label>
              <input
                type="text"
                maxLength={18}
                required
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Ex: Joao_SENAI"
                className="w-full py-3 px-4 rounded-2xl bg-slate-950 border-2 border-slate-700 text-white font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate-300 block mb-1">
                Escolha um Ícone
              </label>
              <div className="grid grid-cols-8 gap-1.5">
                {AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setAvatar(av)}
                    className={`py-2 rounded-xl text-lg border ${
                      avatar === av
                        ? "bg-sky-500/30 border-sky-400"
                        : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-base flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-current" /> ENTRAR NA SALA
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#060B16] text-white flex items-center justify-center">
        Sincronizando com a bancada #{pin}...
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
    <div className="min-h-screen bg-[#060B16] text-slate-100 flex flex-col">
      {/* HUD Superior do Aluno */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur sticky top-0 z-30 px-3 py-2.5">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xl">{myPlayer?.avatar || avatar}</span>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-white leading-tight">
                {myPlayer?.name || nickname}
              </p>
              <span className="text-[10px] font-mono text-sky-400">
                PIN: {room.pin} • Posição #{myRank}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {myPlayer && myPlayer.streak >= 2 && (
              <span className="px-2 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" /> {myPlayer.streak}x
              </span>
            )}

            <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-700 text-right">
              <span className="text-[10px] font-mono text-slate-400 block leading-none">
                PONTOS
              </span>
              <span className="text-sm sm:text-base font-mono font-black text-amber-300">
                {myPlayer?.score || 0}
              </span>
            </div>

            {room.status === "PLAYING" && (
              <div
                className={`px-3 py-1.5 rounded-xl font-mono font-black text-sm flex items-center gap-1 border ${
                  remainingSec <= 15
                    ? "bg-red-950 border-red-400 text-red-300 animate-pulse"
                    : "bg-slate-900 border-sky-500/50 text-sky-300"
                }`}
              >
                <Clock className="w-4 h-4" />
                {formatTime(remainingSec)}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-3 py-5 flex flex-col justify-center">
        {/* ESTADO 1: AGUARDANDO O PROFESSOR NO LOBBY */}
        {room.status === "LOBBY" && (
          <div className="bg-slate-900 border-2 border-sky-500/60 rounded-3xl p-6 text-center shadow-2xl max-w-lg mx-auto w-full">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center mx-auto mb-3">
              <Radio className="w-8 h-8 text-sky-400 animate-pulse" />
            </div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              VOCÊ ESTÁ CONECTADO NA BANCADA!
            </span>
            <h2 className="text-2xl font-black text-white mt-1">
              Prepare-se para: {currentMeta.title}
            </h2>
            <p className="text-xs sm:text-sm text-amber-300 font-semibold mt-1">
              {currentMeta.subtitle}
            </p>

            <div className="mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 text-left">
              <span className="text-[11px] font-mono uppercase text-sky-400 font-bold">
                COMO JOGAR ESTA RODADA:
              </span>
              <p className="text-xs sm:text-sm text-slate-200 mt-1 leading-relaxed">
                {currentMeta.howToPlay}
              </p>
            </div>

            <p className="text-xs text-slate-400 mt-5 animate-pulse">
              Olhe para o telão! O jogo começará assim que o professor apertar
              Iniciar...
            </p>
          </div>
        )}

        {/* ESTADO 2: JOGANDO O MINIGAME ATIVO */}
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

        {/* ESTADO 3: FIM DA RODADA / POSIÇÃO NO RANKING */}
        {room.status === "FINISHED" && (
          <div className="bg-slate-900 border-2 border-amber-400/70 rounded-3xl p-6 text-center shadow-2xl max-w-lg mx-auto w-full">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-9 h-9 text-amber-400" />
            </div>

            <span className="text-xs font-mono uppercase tracking-widest text-amber-300 font-bold">
              RODADA FINALIZADA!
            </span>
            <h2 className="text-3xl font-black text-white mt-1">
              Você ficou em #{myRank}º Lugar!
            </h2>
            <p className="text-2xl font-mono font-black text-amber-300 mt-2">
              {myPlayer?.score || 0} pontos
            </p>

            <div className="grid grid-cols-3 gap-2 mt-5 bg-slate-950 border border-slate-800 rounded-2xl p-3">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  ACERTOS
                </span>
                <span className="text-lg font-black text-emerald-400">
                  {myPlayer?.hits || 0}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  MAIOR COMBO
                </span>
                <span className="text-lg font-black text-amber-400">
                  {myPlayer?.maxStreak || 0}x
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">
                  NÍVEL
                </span>
                <span className="text-lg font-black text-sky-400">
                  {myPlayer?.level || 1}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 mt-5 flex items-center justify-center gap-1.5">
              <Sparkles className="w-4 h-4 text-sky-400" /> Fique nesta tela! Se
              o professor escolher outro minigame, ele abrirá automaticamente.
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
