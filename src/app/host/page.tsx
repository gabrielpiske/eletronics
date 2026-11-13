"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import {
  MINIGAMES_CATALOG,
  MinigameId,
  MinigameMeta,
} from "@/data/electronicsData";
import {
  GameRoom,
  PlayerState,
  createRoom,
  subscribeToRoom,
  startRoomGame,
  finishRoomGame,
  switchMinigameInRoom,
  recordPlayerAction,
} from "@/lib/roomService";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Footer } from "@/components/Footer";
import { ref, set } from "firebase/database";
import {
  Play,
  Trophy,
  Users,
  Clock,
  RefreshCw,
  Download,
  ArrowLeft,
  Bot,
  StopCircle,
  Check,
  Copy,
  Cpu,
} from "lucide-react";

function HostContent() {
  const searchParams = useSearchParams();
  const initialGameParam = searchParams.get("game") as MinigameId | null;

  const [selectedGame, setSelectedGame] = useState<MinigameId>(
    initialGameParam &&
      MINIGAMES_CATALOG.some((g) => g.id === initialGameParam)
      ? initialGameParam
      : "conveyor"
  );
  const [durationSec, setDurationSec] = useState<number>(120);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [originUrl, setOriginUrl] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  useEffect(() => {
    if (!room?.pin) return;
    const unsub = subscribeToRoom(room.pin, (updated) => {
      if (updated) {
        setRoom(updated);
      }
    });
    return () => unsub();
  }, [room?.pin]);

  useEffect(() => {
    if (!room || room.status !== "PLAYING" || !room.endsAt) return;

    const tick = () => {
      const diff = Math.max(0, Math.ceil((room.endsAt! - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) {
        finishRoomGame(room.pin);
      }
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [room]);

  useEffect(() => {
    if (room?.status === "FINISHED") {
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Ignora caso canvas não esteja pronto
      }
    }
  }, [room?.status]);

  const handleCreateRoom = async () => {
    const created = await createRoom(selectedGame, durationSec);
    setRoom(created);
  };

  const handleStartGame = async () => {
    if (!room) return;
    await startRoomGame(room.pin);
  };

  const handleStopGame = async () => {
    if (!room) return;
    await finishRoomGame(room.pin);
  };

  const handleSwitchMinigame = async (
    newGameId: MinigameId,
    resetScores: boolean
  ) => {
    if (!room) return;
    setSelectedGame(newGameId);
    await switchMinigameInRoom(room.pin, newGameId, durationSec, resetScores);
  };

  const handleAddDemoBots = async () => {
    if (!room) return;
    const botNames = [
      { name: "Ana_PTH", avatar: "⚡" },
      { name: "Carlos_SMD", avatar: "🔧" },
      { name: "Lucas_Ohm", avatar: "🤖" },
    ];

    for (const b of botNames) {
      const botId = "bot_" + Math.random().toString(36).substring(2, 7);
      const botPlayer: PlayerState = {
        id: botId,
        name: b.name,
        avatar: b.avatar,
        score: 0,
        streak: 0,
        maxStreak: 0,
        hits: 0,
        misses: 0,
        level: 1,
        lastAction: "Pronto na bancada",
        updatedAt: Date.now(),
      };

      if (isFirebaseConfigured && db) {
        await set(ref(db, `rooms/${room.pin}/players/${botId}`), botPlayer);
      } else {
        const raw = localStorage.getItem(`senai_arena_room_${room.pin}`);
        if (raw) {
          const parsed = JSON.parse(raw) as GameRoom;
          parsed.players = parsed.players || {};
          parsed.players[botId] = botPlayer;
          localStorage.setItem(
            `senai_arena_room_${room.pin}`,
            JSON.stringify(parsed)
          );
          setRoom({ ...parsed });
        }
      }
    }
  };

  useEffect(() => {
    if (!room || room.status !== "PLAYING") return;
    const playersList = Object.values(room.players || {});
    const bots = playersList.filter((p) => p.id.startsWith("bot_"));
    if (bots.length === 0) return;

    const timer = setInterval(() => {
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const isHit = Math.random() > 0.2;
      const pts = isHit ? Math.floor(50 + Math.random() * 65) : -40;
      const msg = isHit
        ? "Identificou componente com precisão"
        : "Curto-circuito na bancada (-40 pts)";
      recordPlayerAction(room.pin, randomBot.id, pts, isHit, msg);
    }, 2600);

    return () => clearInterval(timer);
  }, [room]);

  const handleExportCSV = () => {
    if (!room) return;
    const players = Object.values(room.players || {}).sort(
      (a, b) => b.score - a.score
    );
    const rows = [
      ["Posicao", "Aluno", "Pontos", "Acertos", "Erros", "Maior_Combo", "Nivel"],
      ...players.map((p, i) => [
        String(i + 1),
        p.name,
        String(p.score),
        String(p.hits),
        String(p.misses),
        String(p.maxStreak),
        String(p.level),
      ]),
    ];
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((e) => e.join(";")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ranking_senai_sala_${room.pin}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentGameMeta: MinigameMeta =
    MINIGAMES_CATALOG.find(
      (g) => g.id === (room ? room.minigameId : selectedGame)
    ) || MINIGAMES_CATALOG[0];

  const sortedPlayers = Object.values(room?.players || {}).sort(
    (a, b) => b.score - a.score
  );
  const maxScore = Math.max(1000, sortedPlayers[0]?.score || 1000);
  const recentEvents = Object.values(room?.events || {})
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 6);

  const joinUrl = room ? `${originUrl}/play/${room.pin}` : "";

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#111317] text-zinc-100 flex flex-col">
      {/* Barra Superior do Professor */}
      <header className="border-b border-[#242933] bg-[#16191E] px-4 h-16 flex items-center">
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-md bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-zinc-300"
              title="Voltar ao início"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="px-2 py-0.5 rounded bg-[#0047B6] text-white font-mono font-bold text-[11px] tracking-wider hidden sm:flex items-center gap-1">
              <Cpu className="w-3 h-3" /> HOST
            </div>
            <h1 className="text-sm sm:text-base font-bold text-zinc-100">
              {room
                ? `Sala #${room.pin} — ${currentGameMeta.title}`
                : "Configurar Sala de Bancada"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 rounded-md bg-[#0C0E12] hover:bg-[#14181F] border border-[#2A303C] text-xs font-mono font-bold text-[#F59E0B] flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Ranking Global</span>
            </Link>
            {room && (
              <>
                <span className="px-3 py-1.5 rounded-md bg-[#0C0E12] border border-[#2A303C] text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  {sortedPlayers.length} conectados
                </span>
                <button
                  onClick={() => setRoom(null)}
                  className="px-3 py-1.5 rounded-md bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-xs font-semibold text-zinc-300"
                >
                  Nova Sala
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {/* PASSO 1: CONFIGURAÇÃO DE MINIGAME E TEMPO */}
        {!room && (
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
            <div className="bg-[#13161A] border-b border-[#242933] px-5 py-3.5 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-300 font-semibold">
                SELEÇÃO DE ATIVIDADE PRÁTICA
              </span>
              <span className="font-mono text-[11px] text-zinc-500">
                5 módulos disponíveis
              </span>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {MINIGAMES_CATALOG.map((mg, idx) => {
                  const active = selectedGame === mg.id;
                  return (
                    <button
                      key={mg.id}
                      type="button"
                      onClick={() => setSelectedGame(mg.id)}
                      className={`rounded-md p-4 border text-left transition-colors flex flex-col justify-between ${
                        active
                          ? "bg-[#1F242D] border-amber-400"
                          : "bg-[#121519] border-[#262B35] hover:border-zinc-600"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-zinc-400 font-bold">
                            MÓDULO 0{idx + 1}
                          </span>
                          {active && (
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                          )}
                        </div>
                        <h3 className="text-sm font-bold text-white mt-2">
                          {mg.title}
                        </h3>
                        <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                          {mg.subtitle}
                        </p>
                      </div>

                      <div className="mt-4 pt-2.5 border-t border-[#222730] flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-500">{mg.badge}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Barra Inferior: Tempo + Botão Gerar Sala */}
              <div className="mt-5 pt-5 border-t border-[#242933] flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5 mr-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Tempo:
                  </span>
                  {[90, 120, 180, 240].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSec(sec)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                        durationSec === sec
                          ? "bg-amber-500 text-zinc-950 border-amber-400"
                          : "bg-[#0C0E12] text-zinc-300 border-[#2A303C] hover:border-zinc-500"
                      }`}
                    >
                      {sec}s ({sec / 60}m)
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="px-6 py-3 rounded-md bg-[#0047B6] hover:bg-[#0056DB] text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Gerar PIN e Abrir Sala
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2: LOBBY COM PIN E QR CODE */}
        {room && room.status === "LOBBY" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Painel Esquerdo: PIN e QR Code */}
            <div className="lg:col-span-5 bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
              <div className="bg-[#13161A] border-b border-[#242933] px-5 py-3 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                  CREDENCIAL DE ACESSO
                </span>
                <span className="font-mono text-xs text-amber-400 font-bold">
                  {room.durationSec}s
                </span>
              </div>

              <div className="p-6 flex flex-col items-center text-center">
                <span className="text-xs font-mono uppercase text-zinc-400">
                  PIN da Sala
                </span>
                <div className="w-full my-2 py-4 px-5 rounded-md bg-[#0C0E12] border border-[#2A303C]">
                  <span className="text-5xl font-mono font-bold tracking-[0.2em] text-amber-400">
                    {room.pin.slice(0, 3)} {room.pin.slice(3)}
                  </span>
                </div>

                {joinUrl && (
                  <div className="mt-3 bg-white p-3 rounded-md">
                    <QRCodeSVG value={joinUrl} size={156} />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(joinUrl);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-md bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-xs font-mono text-zinc-300 flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" /> Link
                      copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-400" /> Copiar URL
                      de acesso
                    </>
                  )}
                </button>

                <div className="w-full mt-5 pt-4 border-t border-[#242933] text-left">
                  <span className="text-[11px] font-mono uppercase text-zinc-500 block">
                    Módulo Ativo
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">
                    {currentGameMeta.title}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {currentGameMeta.howToPlay}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleStartGame}
                  className="w-full mt-5 py-3.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
                >
                  <Play className="w-4 h-4 fill-current" />
                  Iniciar Rodada
                </button>
              </div>
            </div>

            {/* Painel Direito: Alunos Conectados + Seletor Rápido */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-5">
                <div className="flex items-center justify-between flex-wrap gap-2 pb-3 mb-4 border-b border-[#242933]">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <h2 className="text-sm font-mono uppercase tracking-wider font-bold text-zinc-200">
                      Alunos Conectados ({sortedPlayers.length})
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDemoBots}
                    className="px-3 py-1.5 rounded-md bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-xs font-mono text-zinc-300 flex items-center gap-1.5"
                  >
                    <Bot className="w-3.5 h-3.5 text-amber-400" /> + Simular 3
                    Alunos
                  </button>
                </div>

                {sortedPlayers.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-[#2A303C] rounded-md bg-[#121519]">
                    <p className="text-sm font-mono text-zinc-400">
                      Aguardando conexões no PIN{" "}
                      <span className="text-amber-400 font-bold">
                        {room.pin}
                      </span>
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {sortedPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="bg-[#0C0E12] border border-[#262B35] rounded-md px-3 py-2.5 flex items-center gap-2.5"
                      >
                        <span className="text-lg">{p.avatar}</span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-zinc-100 truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-mono text-emerald-400">
                            {p.score > 0 ? `${p.score} pts` : "PRONTO"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Alternar módulo na mesma sala */}
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block mb-2.5">
                  Alternar Módulo (Mantém PIN {room.pin}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {MINIGAMES_CATALOG.map((mg) => (
                    <button
                      key={mg.id}
                      type="button"
                      onClick={() => handleSwitchMinigame(mg.id, false)}
                      className={`p-2 rounded-md border text-left text-xs font-semibold transition-colors ${
                        room.minigameId === mg.id
                          ? "bg-[#0047B6]/25 border-[#0047B6] text-white"
                          : "bg-[#0C0E12] border-[#262B35] text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {mg.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 3: PARTIDA EM ANDAMENTO */}
        {room && room.status === "PLAYING" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Ranking em Tempo Real */}
            <div className="lg:col-span-8 bg-[#181B20] border border-[#2A303C] rounded-lg p-5">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-4 border-b border-[#242933]">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold block">
                    RODADA EM EXECUÇÃO • PIN {room.pin}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-0.5">
                    {currentGameMeta.title}
                  </h2>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className={`px-4 py-2 rounded-md border font-mono font-bold text-2xl flex items-center gap-2 ${
                      remainingSec <= 15
                        ? "bg-red-950/80 border-red-500 text-red-300"
                        : "bg-[#0C0E12] border-[#2A303C] text-amber-400"
                    }`}
                  >
                    <Clock className="w-5 h-5" />
                    {formatTime(remainingSec)}
                  </div>

                  <button
                    type="button"
                    onClick={handleStopGame}
                    className="px-3.5 py-2.5 rounded-md bg-red-950/60 hover:bg-red-900/60 border border-red-500/50 text-red-200 text-xs font-mono uppercase font-semibold flex items-center gap-1.5"
                  >
                    <StopCircle className="w-4 h-4" /> Encerrar
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {sortedPlayers.length === 0 ? (
                  <p className="text-center text-zinc-500 py-12 font-mono text-sm">
                    Nenhum aluno conectado nesta rodada.
                  </p>
                ) : (
                  sortedPlayers.map((p, idx) => {
                    const widthPct = Math.max(
                      6,
                      Math.min(100, Math.round((p.score / maxScore) * 100))
                    );
                    return (
                      <div
                        key={p.id}
                        className="bg-[#0C0E12] border border-[#242933] rounded-md p-3"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-6 h-6 rounded font-mono font-bold text-xs flex items-center justify-center ${
                                idx === 0
                                  ? "bg-amber-400 text-zinc-950"
                                  : idx === 1
                                  ? "bg-zinc-300 text-zinc-950"
                                  : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-[#181B20] text-zinc-400 border border-[#2A303C]"
                              }`}
                            >
                              {idx + 1}
                            </span>
                            <span className="text-base">{p.avatar}</span>
                            <span className="font-bold text-zinc-100 text-sm">
                              {p.name}
                            </span>
                            {p.streak >= 3 && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-400/40 text-amber-300 text-[11px] font-mono font-bold">
                                {p.streak}x
                              </span>
                            )}
                            <span className="text-[11px] font-mono text-zinc-400 bg-[#181B20] px-2 py-0.5 rounded border border-[#2A303C]">
                              NV {p.level || 1}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-base font-mono font-bold text-amber-400">
                              {p.score} pts
                            </span>
                            <span className="text-[11px] font-mono text-zinc-500 block">
                              {p.hits} OK • {p.misses} falhas
                            </span>
                          </div>
                        </div>

                        <div className="w-full h-2 bg-[#181B20] rounded-sm overflow-hidden">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className="h-full bg-[#0052CC] transition-all duration-300"
                          />
                        </div>

                        {p.lastAction && (
                          <p className="text-[11px] text-zinc-500 mt-1 font-mono truncate">
                            {p.lastAction}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coluna Lateral: Log de Eventos */}
            <div className="lg:col-span-4">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-zinc-400 font-semibold pb-2.5 mb-3 border-b border-[#242933]">
                  Log de Eventos da Bancada
                </h3>
                <div className="flex flex-col gap-2">
                  {recentEvents.length === 0 ? (
                    <p className="text-xs font-mono text-zinc-500 py-8 text-center">
                      Aguardando telemetria...
                    </p>
                  ) : (
                    recentEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`rounded-md p-2.5 border-l-2 bg-[#0C0E12] text-xs ${
                          ev.type === "short_circuit"
                            ? "border-l-red-500 text-red-200"
                            : ev.type === "level"
                            ? "border-l-emerald-400 text-emerald-200"
                            : "border-l-[#0052CC] text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>{ev.avatar}</span>
                          <span>{ev.playerName}</span>
                        </div>
                        <p className="mt-0.5 text-[11px] font-mono opacity-85">
                          {ev.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 4: PÓDIO FINAL */}
        {room && room.status === "FINISHED" && (
          <div className="flex flex-col gap-5">
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6 text-center">
              <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold">
                RELATÓRIO FINAL • SALA {room.pin}
              </span>
              <h2 className="text-2xl font-bold text-white mt-1">
                Classificação — {currentGameMeta.title}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-6 items-end">
                {/* 2º Lugar */}
                {sortedPlayers[1] && (
                  <div className="bg-[#0C0E12] border border-zinc-500 rounded-lg p-4 flex flex-col items-center order-2 sm:order-1">
                    <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-300 text-zinc-950">
                      2º Lugar
                    </span>
                    <span className="text-3xl my-2">
                      {sortedPlayers[1].avatar}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {sortedPlayers[1].name}
                    </h3>
                    <p className="text-xl font-mono font-bold text-zinc-200 mt-1">
                      {sortedPlayers[1].score} pts
                    </p>
                    <span className="text-[11px] font-mono text-zinc-500 mt-1">
                      {sortedPlayers[1].hits} OK • {sortedPlayers[1].misses}{" "}
                      falhas
                    </span>
                  </div>
                )}

                {/* 1º Lugar */}
                {sortedPlayers[0] && (
                  <div className="bg-[#0C0E12] border-2 border-amber-400 rounded-lg p-5 flex flex-col items-center order-1 sm:order-2">
                    <span className="text-xs font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-amber-400 text-zinc-950 flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5" /> 1º Lugar
                    </span>
                    <span className="text-4xl my-2.5">
                      {sortedPlayers[0].avatar}
                    </span>
                    <h3 className="text-lg font-bold text-white">
                      {sortedPlayers[0].name}
                    </h3>
                    <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
                      {sortedPlayers[0].score} pts
                    </p>
                    <span className="text-[11px] font-mono text-zinc-400 mt-1">
                      {sortedPlayers[0].hits} OK • {sortedPlayers[0].misses}{" "}
                      falhas
                    </span>
                  </div>
                )}

                {/* 3º Lugar */}
                {sortedPlayers[2] && (
                  <div className="bg-[#0C0E12] border border-amber-700 rounded-lg p-4 flex flex-col items-center order-3">
                    <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-700 text-white">
                      3º Lugar
                    </span>
                    <span className="text-3xl my-2">
                      {sortedPlayers[2].avatar}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {sortedPlayers[2].name}
                    </h3>
                    <p className="text-xl font-mono font-bold text-amber-400 mt-1">
                      {sortedPlayers[2].score} pts
                    </p>
                    <span className="text-[11px] font-mono text-zinc-500 mt-1">
                      {sortedPlayers[2].hits} OK • {sortedPlayers[2].misses}{" "}
                      falhas
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-center gap-3 flex-wrap mt-6">
                <button
                  type="button"
                  onClick={() => handleSwitchMinigame(room.minigameId, false)}
                  className="px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Repetir Módulo
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-4 py-2.5 rounded-md bg-[#1E2229] hover:bg-[#262B34] border border-[#2E3540] text-zinc-200 font-semibold text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Exportar
                  CSV
                </button>
              </div>
            </div>

            {/* Selecionar próximo módulo */}
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
              <span className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-2.5">
                Iniciar próximo módulo na mesma sala (PIN {room.pin}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {MINIGAMES_CATALOG.map((mg) => (
                  <button
                    key={mg.id}
                    type="button"
                    onClick={() => handleSwitchMinigame(mg.id, false)}
                    className="p-3 rounded-md bg-[#0C0E12] hover:bg-[#14181F] border border-[#262B35] hover:border-amber-400 text-left transition-colors"
                  >
                    <span className="text-[10px] font-mono text-amber-400 uppercase font-semibold block">
                      {mg.badge}
                    </span>
                    <p className="text-xs font-bold text-white mt-1">
                      {mg.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#111317] text-zinc-300 font-mono text-sm flex items-center justify-center">
          Carregando painel...
        </div>
      }
    >
      <HostContent />
    </Suspense>
  );
}
