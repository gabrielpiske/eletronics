"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
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
  SESSION_DURATION_OPTIONS,
  formatDurationCompact,
  formatDurationLabel,
  createRoom,
  subscribeToRoom,
  updateRoomDuration,
  startRoomGame,
  finishRoomGame,
  switchMinigameInRoom,
  recordPlayerAction,
  pruneRoomEvents,
} from "@/lib/roomService";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { UserAvatar } from "@/components/UserAvatar";
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
  AlertTriangle,
  CheckCircle2,
  Flame,
  Percent,
} from "lucide-react";

const HOST_ACTIVE_PIN_KEY = "senai_arena_host_active_pin";

function HostContent() {
  const searchParams = useSearchParams();
  const initialGameParam = searchParams.get("game") as MinigameId | null;
  const initialPinParam = searchParams.get("pin");

  const [selectedGame, setSelectedGame] = useState<MinigameId>(
    initialGameParam &&
      MINIGAMES_CATALOG.some((g) => g.id === initialGameParam)
      ? initialGameParam
      : "conveyor"
  );
  const [durationSec, setDurationSec] = useState<number>(120);
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [restoredPin, setRestoredPin] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [originUrl, setOriginUrl] = useState<string>("");
  const pruningEventsRef = useRef<boolean>(false);

  const roomPin = room?.pin || restoredPin || undefined;
  const roomStatus = room?.status;
  const roomEndsAt = room?.endsAt;
  const roomEvents = room?.events;

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
      const candidatePin = (
        initialPinParam ||
        sessionStorage.getItem(HOST_ACTIVE_PIN_KEY) ||
        ""
      ).trim();
      if (/^\d{6}$/.test(candidatePin)) {
        setRestoredPin(candidatePin);
      }
    }
  }, [initialPinParam]);

  useEffect(() => {
    if (!roomPin) return;
    const unsub = subscribeToRoom(roomPin, (updated) => {
      if (updated) {
        setRoom(updated);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(HOST_ACTIVE_PIN_KEY, updated.pin);
        }
      } else {
        setRoom(null);
        setRestoredPin(null);
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(HOST_ACTIVE_PIN_KEY);
        }
      }
    });
    return () => unsub();
  }, [roomPin]);

  useEffect(() => {
    if (!roomPin || roomStatus !== "PLAYING" || !roomEndsAt) return;

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

  useEffect(() => {
    if (!roomPin || roomStatus !== "PLAYING" || !roomEvents) return;
    if (pruningEventsRef.current) return;

    const entries = Object.entries(roomEvents);
    if (entries.length <= 30) return;

    const idsToRemove = entries
      .sort(([, a], [, b]) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(20)
      .map(([eventKey]) => eventKey);

    if (idsToRemove.length === 0) return;

    pruningEventsRef.current = true;
    pruneRoomEvents(roomPin, idsToRemove).finally(() => {
      pruningEventsRef.current = false;
    });
  }, [roomPin, roomStatus, roomEvents]);

  useEffect(() => {
    if (roomStatus === "FINISHED") {
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
  }, [roomStatus]);

  const handleCreateRoom = async () => {
    const created = await createRoom(selectedGame, durationSec);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(HOST_ACTIVE_PIN_KEY, created.pin);
    }
    setRestoredPin(created.pin);
    setRoom(created);
  };

  const handleCloseAndResetRoom = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(HOST_ACTIVE_PIN_KEY);
    }
    setRestoredPin(null);
    setRoom(null);
  };

  const handleUpdateLobbyDuration = async (newDurationSec: number) => {
    setDurationSec(newDurationSec);
    if (!room || room.status !== "LOBBY") return;
    setRoom((prev) =>
      prev ? { ...prev, durationSec: newDurationSec } : prev
    );
    await updateRoomDuration(room.pin, newDurationSec);
  };

  const handleStartGame = async () => {
    if (!room) return;
    await startRoomGame(room.pin, room.durationSec);
  };

  const handleStopGame = async () => {
    if (!room) return;
    await finishRoomGame(room.pin);
  };

  const handleSwitchMinigame = async (
    newGameId: MinigameId,
    resetScores: boolean,
    targetDurationSec?: number
  ) => {
    if (!room) return;
    const nextDuration =
      targetDurationSec ??
      (room.status === "LOBBY" ? room.durationSec : durationSec);
    setSelectedGame(newGameId);
    setDurationSec(nextDuration);
    await switchMinigameInRoom(room.pin, newGameId, nextDuration, resetScores);
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

  const botIdsKey = Object.values(room?.players || {})
    .filter((p) => p.id.startsWith("bot_"))
    .map((p) => p.id)
    .sort()
    .join(",");

  useEffect(() => {
    if (!roomPin || roomStatus !== "PLAYING" || !botIdsKey) return;
    const botIds = botIdsKey.split(",").filter(Boolean);
    if (botIds.length === 0) return;

    const timer = setInterval(() => {
      const randomBotId = botIds[Math.floor(Math.random() * botIds.length)];
      const isHit = Math.random() > 0.2;
      const pts = isHit ? Math.floor(50 + Math.random() * 65) : -40;
      const msg = isHit
        ? "Identificou componente com precisão"
        : "Curto-circuito na bancada (-40 pts)";
      recordPlayerAction(roomPin, randomBotId, pts, isHit, msg);
    }, 2600);

    return () => clearInterval(timer);
  }, [roomPin, roomStatus, botIdsKey]);

  const handleExportCSV = () => {
    if (!room) return;
    const players = Object.values(room.players || {}).sort(
      (a, b) => b.score - a.score
    );
    const rows = [
      [
        "Posicao",
        "Aluno",
        "Pontos",
        "Acertos",
        "Erros",
        "Precisao_Pct",
        "Maior_Combo",
        "Nivel",
      ],
      ...players.map((p, i) => {
        const total = (p.hits || 0) + (p.misses || 0);
        const acc = total > 0 ? Math.round(((p.hits || 0) / total) * 100) : 0;
        return [
          String(i + 1),
          p.name,
          String(p.score),
          String(p.hits),
          String(p.misses),
          `${acc}%`,
          String(p.maxStreak),
          String(p.level),
        ];
      }),
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

  const totalRoomHits = sortedPlayers.reduce(
    (acc, p) => acc + (p.hits || 0),
    0
  );
  const totalRoomMisses = sortedPlayers.reduce(
    (acc, p) => acc + (p.misses || 0),
    0
  );
  const roomAccuracyPct =
    totalRoomHits + totalRoomMisses > 0
      ? Math.round((totalRoomHits / (totalRoomHits + totalRoomMisses)) * 100)
      : 0;
  const bestStreakPlayer = [...sortedPlayers].sort(
    (a, b) => (b.maxStreak || 0) - (a.maxStreak || 0)
  )[0];
  const shortCircuitEvents = Object.values(room?.events || {})
    .filter((ev) => ev.type === "short_circuit")
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
                  onClick={handleCloseAndResetRoom}
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
                {MINIGAMES_CATALOG.length} módulos disponíveis
              </span>
            </div>

            <div className="p-5 space-y-5">
              {/* Trilha 1: Fundamentos & Simbologia */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Trilha 01 • Fundamentos &amp; Simbologia (5 módulos)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {MINIGAMES_CATALOG.filter((mg) => mg.track === "fundamentos").map(
                    (mg, idx) => {
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
                    }
                  )}
                </div>
              </div>

              {/* Trilha 2: Desafio Industrial (Ordem de Serviço) */}
              <div className="pt-4 border-t border-[#242933]">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-2.5">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                    Trilha 02 • Desafio Industrial — Ordem de Serviço (1 módulo)
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#0C0E12] border border-amber-500/35 text-amber-300">
                    RECOMENDADO: 5m, 7m ou 10m
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {MINIGAMES_CATALOG.filter((mg) => mg.track === "industrial").map(
                    (mg, idx) => {
                      const active = selectedGame === mg.id;
                      return (
                        <button
                          key={mg.id}
                          type="button"
                          onClick={() => setSelectedGame(mg.id)}
                          className={`rounded-md p-4 border text-left transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            active
                              ? "bg-[#1F242D] border-amber-400"
                              : "bg-[#121519] border-[#262B35] hover:border-amber-500/60"
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-amber-400 font-bold">
                                OS INDUSTRIAL 0{idx + 1}
                              </span>
                              {active && (
                                <span className="w-2 h-2 rounded-full bg-amber-400" />
                              )}
                            </div>
                            <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                              {mg.title}
                            </h3>
                            <p className="text-xs text-sky-300/90 font-medium mt-0.5">
                              {mg.subtitle}
                            </p>
                            <p className="text-xs text-zinc-400 mt-1.5 leading-relaxed max-w-3xl">
                              {mg.description}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center text-[11px] font-mono">
                            <span className="px-2.5 py-1 rounded bg-[#0C0E12] border border-amber-500/35 text-amber-400 font-bold">
                              {mg.badge}
                            </span>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Barra Inferior: Tempo + Botão Gerar Sala */}
              <div className="mt-5 pt-5 border-t border-[#242933] flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono uppercase text-zinc-400 flex items-center gap-1.5 mr-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400" /> Tempo:
                  </span>
                  {SESSION_DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.seconds}
                      type="button"
                      onClick={() => setDurationSec(opt.seconds)}
                      className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                        durationSec === opt.seconds
                          ? "bg-amber-500 text-zinc-950 border-amber-400"
                          : "bg-[#0C0E12] text-zinc-300 border-[#2A303C] hover:border-zinc-500"
                      }`}
                    >
                      {opt.shortLabel}
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
                  {formatDurationLabel(room.durationSec)}
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
                        <UserAvatar
                          avatar={p.avatar}
                          name={p.name}
                          size="sm"
                          className="border border-[#2A303C]"
                        />
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

              {/* Alternar módulo e tempo na mesma sala */}
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4 space-y-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold block mb-2.5">
                    Alternar Módulo (Mantém PIN {room.pin}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MINIGAMES_CATALOG.map((mg) => (
                      <button
                        key={mg.id}
                        type="button"
                        onClick={() =>
                          handleSwitchMinigame(mg.id, true, room.durationSec)
                        }
                        className={`p-2 rounded-md border text-left text-xs font-semibold transition-colors ${
                          room.minigameId === mg.id
                            ? "bg-[#0047B6]/25 border-[#0047B6] text-white"
                            : "bg-[#0C0E12] border-[#262B35] text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {mg.track === "industrial" && (
                          <span className="block font-mono text-[9px] uppercase text-amber-400 mb-0.5">
                            OS INDUSTRIAL
                          </span>
                        )}
                        {mg.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#242933]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5 mb-2.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Duração da Rodada (Mantém PIN {room.pin}):
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {SESSION_DURATION_OPTIONS.map((opt) => (
                      <button
                        key={opt.seconds}
                        type="button"
                        onClick={() => handleUpdateLobbyDuration(opt.seconds)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                          room.durationSec === opt.seconds
                            ? "bg-amber-500 text-zinc-950 border-amber-400"
                            : "bg-[#0C0E12] text-zinc-300 border-[#2A303C] hover:border-zinc-500"
                        }`}
                      >
                        {opt.shortLabel}
                      </button>
                    ))}
                  </div>
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
                    RODADA EM EXECUÇÃO • PIN {room.pin} •{" "}
                    {formatDurationCompact(room.durationSec)}
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
                            <UserAvatar
                              avatar={p.avatar}
                              name={p.name}
                              size="xs"
                              className="border border-[#2A303C]"
                            />
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
                          <UserAvatar
                            avatar={ev.avatar}
                            name={ev.playerName}
                            size="xs"
                          />
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
                RELATÓRIO FINAL • SALA {room.pin} •{" "}
                {formatDurationCompact(room.durationSec)}
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
                    <UserAvatar
                      avatar={sortedPlayers[1].avatar}
                      name={sortedPlayers[1].name}
                      size="lg"
                      roundedClassName="rounded-lg"
                      className="my-2 border border-zinc-500"
                    />
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
                    <UserAvatar
                      avatar={sortedPlayers[0].avatar}
                      name={sortedPlayers[0].name}
                      size="xl"
                      roundedClassName="rounded-lg"
                      className="my-2.5 border-2 border-amber-400"
                    />
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
                    <UserAvatar
                      avatar={sortedPlayers[2].avatar}
                      name={sortedPlayers[2].name}
                      size="lg"
                      roundedClassName="rounded-lg"
                      className="my-2 border border-amber-700"
                    />
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
                  onClick={() =>
                    handleSwitchMinigame(room.minigameId, true, durationSec)
                  }
                  className="px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Repetir Módulo (
                  {formatDurationCompact(durationSec)})
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

            {/* Diagnóstico Pedagógico da Turma (Debriefing Docente) */}
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#242933]">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                    AVALIAÇÃO FORMATIVA EM TEMPO REAL • DEBRIEFING DOCENTE
                  </span>
                  <h3 className="text-base font-bold text-white">
                    Diagnóstico Pedagógico da Turma na Rodada
                  </h3>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#0C0E12] border border-[#2A303C] text-zinc-300">
                  {sortedPlayers.length} bancada(s) avaliada(s)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
                <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3">
                  <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-emerald-400" /> Precisão Média
                  </span>
                  <span
                    className={`text-xl font-bold mt-1 block ${
                      roomAccuracyPct >= 80
                        ? "text-emerald-400"
                        : roomAccuracyPct >= 55
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {roomAccuracyPct}%
                  </span>
                </div>
                <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3">
                  <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Acertos Totais
                  </span>
                  <span className="text-xl font-bold text-emerald-400 mt-1 block">
                    {totalRoomHits}
                  </span>
                </div>
                <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3">
                  <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-400" /> Curtos / Falhas
                  </span>
                  <span className="text-xl font-bold text-red-400 mt-1 block">
                    {totalRoomMisses}
                  </span>
                </div>
                <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3">
                  <span className="text-[10px] uppercase text-zinc-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-400" /> Maior Combo
                  </span>
                  <span className="text-xl font-bold text-amber-400 mt-1 block">
                    {bestStreakPlayer ? `${bestStreakPlayer.maxStreak}x` : "0x"}
                  </span>
                  {bestStreakPlayer && bestStreakPlayer.maxStreak > 0 && (
                    <span className="text-[10px] text-zinc-400 truncate block">
                      {bestStreakPlayer.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Falhas Técnicas para Comentário no Projetor */}
                <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3.5 space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-red-300 font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    Pontos de Atenção / Últimos Curtos-Circuitos para Revisão:
                  </span>
                  {shortCircuitEvents.length === 0 ? (
                    <div className="py-6 px-3 text-center rounded bg-[#12241D]/50 border border-emerald-500/30 text-xs font-mono text-emerald-300">
                      Zero curto-circuito nos eventos recentes! A turma operou com alta disciplina técnica.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {shortCircuitEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-2 rounded bg-[#181B20] border-l-2 border-l-red-500 border border-[#2A303C] text-xs flex items-start justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <span className="font-bold text-red-200">
                              {ev.playerName}:
                            </span>{" "}
                            <span className="font-mono text-zinc-300">
                              {ev.message}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Classificação Completa da Sala */}
                <div className="bg-[#0C0E12] border border-[#242933] rounded-md p-3.5 space-y-2.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-sky-300 font-bold flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    Desempenho Individual Completo da Sala:
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 font-mono text-xs">
                    {sortedPlayers.map((p, idx) => {
                      const tot = (p.hits || 0) + (p.misses || 0);
                      const acc =
                        tot > 0 ? Math.round(((p.hits || 0) / tot) * 100) : 0;
                      return (
                        <div
                          key={p.id}
                          className="px-2.5 py-1.5 rounded bg-[#181B20] border border-[#2A303C] flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-zinc-400 font-bold w-5">
                              #{idx + 1}
                            </span>
                            <UserAvatar
                              avatar={p.avatar}
                              name={p.name}
                              size="xs"
                            />
                            <span className="text-white font-sans font-bold truncate">
                              {p.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-emerald-400">{acc}%</span>
                            <span className="text-zinc-400">
                              {p.hits}OK/{p.misses}E
                            </span>
                            <span className="text-amber-400 font-bold">
                              {p.score} pts
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Selecionar próximo módulo */}
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4 space-y-4">
              <div className="pb-3 border-b border-[#242933] flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-mono uppercase text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Tempo da próxima rodada:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {SESSION_DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.seconds}
                      type="button"
                      onClick={() => setDurationSec(opt.seconds)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
                        durationSec === opt.seconds
                          ? "bg-amber-500 text-zinc-950 border-amber-400"
                          : "bg-[#0C0E12] text-zinc-300 border-[#2A303C] hover:border-zinc-500"
                      }`}
                    >
                      {opt.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-mono uppercase text-zinc-400 font-semibold block mb-2.5">
                  Iniciar próximo módulo na mesma sala (PIN {room.pin}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {MINIGAMES_CATALOG.map((mg) => (
                    <button
                      key={mg.id}
                      type="button"
                      onClick={() =>
                        handleSwitchMinigame(mg.id, true, durationSec)
                      }
                      className="p-3 rounded-md bg-[#0C0E12] hover:bg-[#14181F] border border-[#262B35] hover:border-amber-400 text-left transition-colors"
                    >
                      <span
                        className={`text-[10px] font-mono uppercase font-semibold block ${
                          mg.track === "industrial"
                            ? "text-sky-400"
                            : "text-amber-400"
                        }`}
                      >
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
