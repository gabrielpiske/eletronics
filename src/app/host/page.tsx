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
import { ref, set } from "firebase/database";
import {
  Tv,
  Play,
  Trophy,
  Users,
  Clock,
  Flame,
  RefreshCw,
  Download,
  ArrowLeft,
  Sparkles,
  Bot,
  StopCircle,
  Check,
  Copy,
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

  // Subscrição em tempo real à sala
  useEffect(() => {
    if (!room?.pin) return;
    const unsub = subscribeToRoom(room.pin, (updated) => {
      if (updated) {
        setRoom(updated);
      }
    });
    return () => unsub();
  }, [room?.pin]);

  // Cronômetro regressivo durante o estado PLAYING
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

  // Confetes ao finalizar a partida
  useEffect(() => {
    if (room?.status === "FINISHED") {
      try {
        confetti({
          particleCount: 110,
          spread: 80,
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

  // Adiciona alunos simulados para o professor testar o telão ao vivo
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
        lastAction: "Pronto na bancada!",
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

  // Faz os bots pontuarem automaticamente durante PLAYING para demonstração
  useEffect(() => {
    if (!room || room.status !== "PLAYING") return;
    const playersList = Object.values(room.players || {});
    const bots = playersList.filter((p) => p.id.startsWith("bot_"));
    if (bots.length === 0) return;

    const timer = setInterval(() => {
      const randomBot = bots[Math.floor(Math.random() * bots.length)];
      const isHit = Math.random() > 0.2;
      const pts = isHit ? Math.floor(130 + Math.random() * 140) : -35;
      const msg = isHit
        ? "Identificou componente com precisão!"
        : "Curto-circuito na bancada!";
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
    <div className="min-h-screen bg-[#050A14] text-slate-100 flex flex-col">
      {/* Barra Superior do Professor */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-widest text-sky-400 font-bold block">
                PAINEL DO PROFESSOR (PROJETOR / TELÃO)
              </span>
              <h1 className="text-lg font-extrabold text-white">
                {room
                  ? `Sala Ativa #${room.pin} — ${currentGameMeta.title}`
                  : "Escolher Minigame para Hospedar com PIN"}
              </h1>
            </div>
          </div>

          {room && (
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-sky-400" />
                {sortedPlayers.length} Alunos Conectados
              </span>
              <button
                onClick={() => setRoom(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Nova Sala
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full px-4 py-6 flex-1">
        {/* PASSO 1: ESCOLHER QUALQUER UM DOS 5 MINIGAMES ISOLADAMENTE */}
        {!room && (
          <div className="flex flex-col gap-6">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6">
              <h2 className="text-2xl font-black text-white">
                1. Escolha qual Minigame deseja rodar agora
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Você pode hospedar qualquer um dos 5 minigames isoladamente. Um
                PIN exclusivo será gerado para a turma!
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mt-5">
                {MINIGAMES_CATALOG.map((mg, idx) => {
                  const active = selectedGame === mg.id;
                  return (
                    <button
                      key={mg.id}
                      type="button"
                      onClick={() => setSelectedGame(mg.id)}
                      className={`rounded-2xl p-4 border-2 text-left transition-all flex flex-col justify-between ${
                        active
                          ? "bg-sky-950/70 border-sky-400 scale-[1.02] shadow-xl shadow-sky-500/20"
                          : "bg-slate-950 border-slate-800 hover:border-slate-600"
                      }`}
                    >
                      <div>
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-sky-300 font-bold">
                          Jogo #{idx + 1}
                        </span>
                        <h3 className="text-base font-extrabold text-white mt-2">
                          {mg.title}
                        </h3>
                        <p className="text-xs text-amber-300 font-semibold mt-0.5">
                          {mg.subtitle}
                        </p>
                        <p className="text-xs text-slate-400 mt-2">
                          {mg.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span
                          className={
                            active ? "text-sky-300" : "text-slate-500"
                          }
                        >
                          {active ? "✓ Selecionado" : "Selecionar"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tempo de Jogo + Botão Criar Sala */}
              <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-slate-300 flex items-center gap-1.5 mr-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Duração da
                    Partida:
                  </span>
                  {[90, 120, 180, 240].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setDurationSec(sec)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all ${
                        durationSec === sec
                          ? "bg-amber-500 text-slate-950 border-amber-400"
                          : "bg-slate-950 text-slate-300 border-slate-700 hover:border-slate-500"
                      }`}
                    >
                      {sec / 60} min ({sec}s)
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleCreateRoom}
                  className="px-7 py-4 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-base sm:text-lg shadow-xl shadow-sky-500/25 flex items-center gap-2 transition-transform active:scale-95"
                >
                  <Tv className="w-5 h-5" />
                  GERAR PIN E ABRIR SALA DE JOGO
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 2: LOBBY COM PIN GIGANTE E QR CODE */}
        {room && room.status === "LOBBY" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cartão do PIN e QR Code */}
            <div className="lg:col-span-5 bg-slate-900 border-2 border-sky-500/70 rounded-3xl p-6 text-center shadow-2xl flex flex-col items-center">
              <span className="text-xs font-mono uppercase tracking-widest px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/40 font-bold">
                ENTRE PELO CELULAR OU COMPUTADOR
              </span>

              <p className="text-xs text-slate-400 mt-3">
                PIN de Acesso da Turma:
              </p>
              <div className="my-2 px-6 py-4 rounded-2xl bg-slate-950 border-2 border-amber-400/80 shadow-inner">
                <span className="text-5xl sm:text-6xl font-mono font-black tracking-[0.18em] text-amber-300">
                  {room.pin.slice(0, 3)} {room.pin.slice(3)}
                </span>
              </div>

              {/* QR Code para leitura direta */}
              {joinUrl && (
                <div className="mt-3 bg-white p-3.5 rounded-2xl shadow-lg">
                  <QRCodeSVG value={joinUrl} size={168} />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(joinUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-3 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> Link Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-sky-400" /> Copiar Link Direto
                    da Sala
                  </>
                )}
              </button>

              <div className="w-full mt-5 pt-4 border-t border-slate-800 text-left">
                <span className="text-[11px] font-mono uppercase text-amber-400 font-bold">
                  MINIGAME SELECIONADO:
                </span>
                <h3 className="text-xl font-black text-white mt-0.5">
                  {currentGameMeta.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {currentGameMeta.howToPlay}
                </p>
              </div>

              <button
                type="button"
                onClick={handleStartGame}
                className="w-full mt-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-lg shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-transform active:scale-95"
              >
                <Play className="w-6 h-6 fill-current" />
                INICIAR PARTIDA AGORA!
              </button>
            </div>

            {/* Lista de Alunos Conectados + Troca Rápida de Minigame */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-6 h-6 text-sky-400" />
                    <h2 className="text-xl font-extrabold text-white">
                      Alunos na Bancada ({sortedPlayers.length})
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDemoBots}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-amber-300 flex items-center gap-1.5"
                  >
                    <Bot className="w-4 h-4" /> + Simular 3 Alunos (Teste)
                  </button>
                </div>

                {sortedPlayers.length === 0 ? (
                  <div className="py-14 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                    <p className="text-base font-bold text-slate-400">
                      Aguardando os alunos digitarem o PIN{" "}
                      <span className="text-amber-300 font-mono">
                        {room.pin}
                      </span>
                      ...
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Você também pode abrir outra aba ou clicar em &ldquo;Simular 3
                      Alunos&rdquo; para testar agora!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {sortedPlayers.map((p) => (
                      <div
                        key={p.id}
                        className="bg-slate-950 border border-slate-700 rounded-2xl px-3.5 py-3 flex items-center gap-2.5 animate-fade-in"
                      >
                        <span className="text-2xl">{p.avatar}</span>
                        <div className="overflow-hidden">
                          <p className="text-sm font-extrabold text-white truncate">
                            {p.name}
                          </p>
                          <p className="text-[11px] font-mono text-emerald-400">
                            {p.score > 0 ? `${p.score} pts` : "Conectado"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trocar de Minigame sem mudar o PIN */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold block mb-2.5">
                  TROCAR MINIGAME NESTA MESMA SALA (MANTÉM O PIN {room.pin}):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {MINIGAMES_CATALOG.map((mg) => (
                    <button
                      key={mg.id}
                      type="button"
                      onClick={() => handleSwitchMinigame(mg.id, false)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all ${
                        room.minigameId === mg.id
                          ? "bg-sky-500/20 border-sky-400 text-sky-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
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

        {/* PASSO 3: PARTIDA EM ANDAMENTO (CORRIDA DE RANKING AO VIVO NO TELÃO) */}
        {room && room.status === "PLAYING" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Coluna Principal: Ranking em Tempo Real */}
            <div className="lg:col-span-8 bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-4 mb-5 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> PARTIDA AO VIVO • PIN:{" "}
                    {room.pin}
                  </span>
                  <h2 className="text-2xl font-black text-white mt-0.5">
                    {currentGameMeta.title}
                  </h2>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`px-5 py-2.5 rounded-2xl border-2 font-mono font-black text-3xl flex items-center gap-2 ${
                      remainingSec <= 15
                        ? "bg-red-950 border-red-400 text-red-300 animate-pulse"
                        : "bg-slate-950 border-amber-400/80 text-amber-300"
                    }`}
                  >
                    <Clock className="w-6 h-6" />
                    {formatTime(remainingSec)}
                  </div>

                  <button
                    type="button"
                    onClick={handleStopGame}
                    className="px-4 py-3 rounded-2xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/50 text-red-300 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <StopCircle className="w-4 h-4" /> Encerrar
                  </button>
                </div>
              </div>

              {/* Corrida de Barras dos Alunos */}
              <div className="flex flex-col gap-3">
                {sortedPlayers.length === 0 ? (
                  <p className="text-center text-slate-400 py-12">
                    Nenhum aluno conectado nesta rodada.
                  </p>
                ) : (
                  sortedPlayers.map((p, idx) => {
                    const widthPct = Math.max(
                      8,
                      Math.min(100, Math.round((p.score / maxScore) * 100))
                    );
                    return (
                      <div
                        key={p.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 transition-all"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center ${
                                idx === 0
                                  ? "bg-amber-400 text-slate-950"
                                  : idx === 1
                                  ? "bg-slate-300 text-slate-950"
                                  : idx === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-slate-800 text-slate-300"
                              }`}
                            >
                              #{idx + 1}
                            </span>
                            <span className="text-xl">{p.avatar}</span>
                            <span className="font-extrabold text-white text-base">
                              {p.name}
                            </span>
                            {p.streak >= 3 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1">
                                <Flame className="w-3.5 h-3.5" /> {p.streak}x
                              </span>
                            )}
                            <span className="text-xs font-mono text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/30">
                              Nível {p.level || 1}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-xl font-mono font-black text-amber-300">
                              {p.score} pts
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {p.hits} acertos • {p.misses} curtos
                            </span>
                          </div>
                        </div>

                        {/* Barra de Progresso Estilo Corrida */}
                        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${widthPct}%` }}
                            className="h-full bg-gradient-to-r from-sky-500 via-emerald-400 to-amber-400 rounded-full transition-all duration-500"
                          />
                        </div>

                        {p.lastAction && (
                          <p className="text-[11px] text-slate-400 mt-1 font-mono truncate">
                            Última ação: {p.lastAction}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Coluna Lateral: Feed Ao Vivo da Bancada */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                <h3 className="text-sm font-mono uppercase tracking-wider text-sky-400 font-bold mb-3">
                  ⚡ Feed da Bancada ao Vivo
                </h3>
                <div className="flex flex-col gap-2.5">
                  {recentEvents.length === 0 ? (
                    <p className="text-xs text-slate-500 py-8 text-center">
                      Aguardando as primeiras ações dos alunos...
                    </p>
                  ) : (
                    recentEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className={`rounded-xl p-3 border text-xs ${
                          ev.type === "short_circuit"
                            ? "bg-red-950/50 border-red-500/40 text-red-200"
                            : ev.type === "level"
                            ? "bg-emerald-950/60 border-emerald-400/50 text-emerald-200"
                            : "bg-slate-950 border-slate-800 text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 font-extrabold">
                          <span>{ev.avatar}</span>
                          <span>{ev.playerName}</span>
                        </div>
                        <p className="mt-0.5 opacity-90">{ev.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PASSO 4: PÓDIO FINAL E SELETOR DE PRÓXIMO MINIGAME */}
        {room && room.status === "FINISHED" && (
          <div className="flex flex-col gap-6">
            <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-amber-400/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-extrabold uppercase">
                <Trophy className="w-4 h-4" /> Resultado Oficial da Bancada •
                PIN {room.pin}
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">
                Pódio — {currentGameMeta.title}
              </h2>

              {/* Pódio Top 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto mt-8 items-end">
                {/* 2º Lugar */}
                {sortedPlayers[1] && (
                  <div className="bg-slate-900 border-2 border-slate-400 rounded-3xl p-5 flex flex-col items-center order-2 sm:order-1">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-300 text-slate-950">
                      🥈 2º Lugar
                    </span>
                    <span className="text-4xl my-2">
                      {sortedPlayers[1].avatar}
                    </span>
                    <h3 className="text-lg font-extrabold text-white">
                      {sortedPlayers[1].name}
                    </h3>
                    <p className="text-2xl font-mono font-black text-slate-200 mt-1">
                      {sortedPlayers[1].score} pts
                    </p>
                    <span className="text-xs text-slate-400 mt-1">
                      {sortedPlayers[1].hits} acertos • Combo máx{" "}
                      {sortedPlayers[1].maxStreak}x
                    </span>
                  </div>
                )}

                {/* 1º Lugar */}
                {sortedPlayers[0] && (
                  <div className="bg-gradient-to-b from-amber-500/25 to-slate-900 border-2 border-amber-400 rounded-3xl p-6 flex flex-col items-center shadow-2xl shadow-amber-500/20 scale-105 order-1 sm:order-2">
                    <span className="text-xs font-black uppercase px-3 py-1 rounded-full bg-amber-400 text-slate-950">
                      🏆 1º Lugar — Mestre da Bancada
                    </span>
                    <span className="text-5xl my-3">
                      {sortedPlayers[0].avatar}
                    </span>
                    <h3 className="text-xl font-black text-white">
                      {sortedPlayers[0].name}
                    </h3>
                    <p className="text-3xl font-mono font-black text-amber-300 mt-1">
                      {sortedPlayers[0].score} pts
                    </p>
                    <span className="text-xs text-amber-200/80 mt-1">
                      {sortedPlayers[0].hits} acertos • Combo máx{" "}
                      {sortedPlayers[0].maxStreak}x
                    </span>
                  </div>
                )}

                {/* 3º Lugar */}
                {sortedPlayers[2] && (
                  <div className="bg-slate-900 border-2 border-amber-700 rounded-3xl p-5 flex flex-col items-center order-3">
                    <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-700 text-white">
                      🥉 3º Lugar
                    </span>
                    <span className="text-4xl my-2">
                      {sortedPlayers[2].avatar}
                    </span>
                    <h3 className="text-lg font-extrabold text-white">
                      {sortedPlayers[2].name}
                    </h3>
                    <p className="text-2xl font-mono font-black text-amber-400 mt-1">
                      {sortedPlayers[2].score} pts
                    </p>
                    <span className="text-xs text-slate-400 mt-1">
                      {sortedPlayers[2].hits} acertos • Combo máx{" "}
                      {sortedPlayers[2].maxStreak}x
                    </span>
                  </div>
                )}
              </div>

              {/* Ações Pós-Jogo */}
              <div className="flex items-center justify-center gap-3 flex-wrap mt-8">
                <button
                  type="button"
                  onClick={() => handleSwitchMinigame(room.minigameId, false)}
                  className="px-5 py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-sm flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" /> Jogar Novamente
                </button>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm flex items-center gap-2"
                >
                  <Download className="w-4 h-4 text-emerald-400" /> Exportar
                  Relatório CSV da Turma
                </button>
              </div>
            </div>

            {/* Rodar Outro Minigame com a Mesma Turma */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-lg font-extrabold text-white">
                Quer rodar outro Minigame agora mantendo os mesmos alunos no PIN{" "}
                <span className="text-amber-300 font-mono">{room.pin}</span>?
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Escolha abaixo o próximo minigame (os celulares dos alunos
                atualizam automaticamente):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-4">
                {MINIGAMES_CATALOG.map((mg) => (
                  <button
                    key={mg.id}
                    type="button"
                    onClick={() => handleSwitchMinigame(mg.id, false)}
                    className="p-3.5 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-700 hover:border-sky-400 text-left transition-all"
                  >
                    <span className="text-[10px] font-mono text-sky-400 uppercase font-bold block">
                      {mg.badge}
                    </span>
                    <p className="text-sm font-extrabold text-white mt-1">
                      {mg.title}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default function HostPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#050A14] text-white flex items-center justify-center">
          Carregando Painel do Professor...
        </div>
      }
    >
      <HostContent />
    </Suspense>
  );
}
