"use client";

import { db, isFirebaseConfigured } from "@/lib/firebase";
import { MinigameId } from "@/data/electronicsData";
import {
  ref,
  set,
  get,
  update,
  onValue,
  off,
  push,
} from "firebase/database";

export interface PlayerState {
  id: string;
  name: string;
  avatar: string;
  score: number;
  streak: number;
  maxStreak: number;
  hits: number;
  misses: number;
  level: number;
  roundStartedAt?: number | null;
  lastAction?: string;
  updatedAt: number;
}

export interface RoomEvent {
  id: string;
  playerName: string;
  avatar: string;
  message: string;
  type: "hit" | "streak" | "level" | "short_circuit";
  timestamp: number;
}

export interface GameRoom {
  pin: string;
  minigameId: MinigameId;
  status: "LOBBY" | "PLAYING" | "FINISHED";
  durationSec: number;
  startedAt: number | null;
  endsAt: number | null;
  createdAt: number;
  players?: Record<string, PlayerState>;
  events?: Record<string, RoomEvent>;
}

const LOCAL_STORAGE_PREFIX = "senai_arena_room_";
const CHANNEL_NAME = "senai_arena_sync_channel";

async function withDbTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 2800
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("FIREBASE_DB_TIMEOUT"));
    }, timeoutMs);

    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

function notifyLocalChange(pin: string) {
  if (typeof window === "undefined") return;
  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: "ROOM_UPDATED", pin, ts: Date.now() });
    channel.close();
  } catch {
    // Fallback caso BroadcastChannel não esteja disponível
  }
}

function getLocalRoom(pin: string): GameRoom | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${pin}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GameRoom;
  } catch {
    return null;
  }
}

function saveLocalRoom(room: GameRoom) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${LOCAL_STORAGE_PREFIX}${room.pin}`,
    JSON.stringify(room)
  );
  notifyLocalChange(room.pin);
}

export function generatePin(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function getOrCreatePlayerId(): string {
  if (typeof window === "undefined") return "player_ssr";
  const key = "senai_arena_player_id";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = "p_" + Math.random().toString(36).substring(2, 10);
    sessionStorage.setItem(key, id);
  }
  return id;
}

export async function createRoom(
  minigameId: MinigameId,
  durationSec: number
): Promise<GameRoom> {
  const pin = generatePin();
  const newRoom: GameRoom = {
    pin,
    minigameId,
    status: "LOBBY",
    durationSec,
    startedAt: null,
    endsAt: null,
    createdAt: Date.now(),
    players: {},
    events: {},
  };

  saveLocalRoom(newRoom);

  if (isFirebaseConfigured && db) {
    try {
      await withDbTimeout(set(ref(db, `rooms/${pin}`), newRoom));
    } catch {
      // Usa fallback local se o Realtime Database demorar ou bloquear
    }
  }
  return newRoom;
}

export async function checkRoomExists(pin: string): Promise<boolean> {
  const cleanPin = pin.trim();
  if (!cleanPin) return false;

  if (getLocalRoom(cleanPin) !== null) {
    return true;
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await withDbTimeout(get(ref(db, `rooms/${cleanPin}`)));
      return snap.exists();
    } catch {
      return getLocalRoom(cleanPin) !== null;
    }
  }
  return false;
}

export async function joinRoom(
  pin: string,
  playerName: string,
  avatar: string
): Promise<PlayerState> {
  const cleanPin = pin.trim();
  const playerId = getOrCreatePlayerId();

  const playerState: PlayerState = {
    id: playerId,
    name: playerName.trim().slice(0, 18) || "Aprendiz",
    avatar,
    score: 0,
    streak: 0,
    maxStreak: 0,
    hits: 0,
    misses: 0,
    level: 1,
    lastAction: "Entrou na bancada!",
    updatedAt: Date.now(),
  };

  const localRoom = getLocalRoom(cleanPin);
  if (localRoom) {
    localRoom.players = localRoom.players || {};
    if (localRoom.players[playerId]) {
      localRoom.players[playerId].name = playerState.name;
      localRoom.players[playerId].avatar = playerState.avatar;
    } else {
      localRoom.players[playerId] = playerState;
    }
    saveLocalRoom(localRoom);
  }

  if (isFirebaseConfigured && db) {
    try {
      const existingSnap = await withDbTimeout(
        get(ref(db, `rooms/${cleanPin}/players/${playerId}`))
      );
      if (existingSnap.exists()) {
        const existing = existingSnap.val() as PlayerState;
        const updated = {
          ...existing,
          name: playerState.name,
          avatar: playerState.avatar,
          updatedAt: Date.now(),
        };
        await withDbTimeout(
          update(ref(db, `rooms/${cleanPin}/players/${playerId}`), updated)
        );
        return updated;
      }
      await withDbTimeout(
        set(ref(db, `rooms/${cleanPin}/players/${playerId}`), playerState)
      );
      return playerState;
    } catch {
      // Fallback para local já salvo acima
    }
  }

  return playerState;
}

export async function startRoomGame(pin: string): Promise<void> {
  const now = Date.now();
  const localRoom = getLocalRoom(pin);
  if (localRoom) {
    localRoom.status = "PLAYING";
    localRoom.startedAt = now;
    localRoom.endsAt = now + localRoom.durationSec * 1000;
    localRoom.events = {};
    if (localRoom.players) {
      Object.keys(localRoom.players).forEach((pid) => {
        localRoom.players![pid] = {
          ...localRoom.players![pid],
          score: 0,
          streak: 0,
          maxStreak: 0,
          hits: 0,
          misses: 0,
          level: 1,
          roundStartedAt: now,
          lastAction: "Rodada iniciada!",
          updatedAt: now,
        };
      });
    }
    saveLocalRoom(localRoom);
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await withDbTimeout(get(ref(db, `rooms/${pin}`)));
      if (!snap.exists()) return;
      const room = snap.val() as GameRoom;
      const players = room.players || {};
      Object.keys(players).forEach((pid) => {
        players[pid] = {
          ...players[pid],
          score: 0,
          streak: 0,
          maxStreak: 0,
          hits: 0,
          misses: 0,
          level: 1,
          roundStartedAt: now,
          lastAction: "Rodada iniciada!",
          updatedAt: now,
        };
      });
      await withDbTimeout(
        update(ref(db, `rooms/${pin}`), {
          status: "PLAYING",
          startedAt: now,
          endsAt: now + room.durationSec * 1000,
          players,
          events: {},
        })
      );
    } catch {
      // Fallback local já aplicado
    }
  }
}

export async function finishRoomGame(pin: string): Promise<void> {
  const localRoom = getLocalRoom(pin);
  if (localRoom) {
    localRoom.status = "FINISHED";
    saveLocalRoom(localRoom);
  }

  if (isFirebaseConfigured && db) {
    try {
      await withDbTimeout(
        update(ref(db, `rooms/${pin}`), {
          status: "FINISHED",
        })
      );
    } catch {
      // Fallback local já aplicado
    }
  }
}

export async function switchMinigameInRoom(
  pin: string,
  newMinigameId: MinigameId,
  durationSec: number,
  resetScores: boolean = true
): Promise<void> {
  const localRoom = getLocalRoom(pin);
  if (localRoom) {
    localRoom.minigameId = newMinigameId;
    localRoom.durationSec = durationSec;
    localRoom.status = "LOBBY";
    localRoom.startedAt = null;
    localRoom.endsAt = null;
    localRoom.events = {};
    if (localRoom.players) {
      Object.keys(localRoom.players).forEach((pid) => {
        if (resetScores) {
          localRoom.players![pid].score = 0;
          localRoom.players![pid].hits = 0;
          localRoom.players![pid].misses = 0;
          localRoom.players![pid].maxStreak = 0;
        }
        localRoom.players![pid].streak = 0;
        localRoom.players![pid].level = 1;
        localRoom.players![pid].roundStartedAt = null;
        localRoom.players![pid].lastAction = "Pronto!";
      });
    }
    saveLocalRoom(localRoom);
  }

  if (isFirebaseConfigured && db) {
    try {
      const snap = await withDbTimeout(get(ref(db, `rooms/${pin}`)));
      if (!snap.exists()) return;
      const room = snap.val() as GameRoom;
      const players = room.players || {};
      if (resetScores) {
        Object.keys(players).forEach((pid) => {
          players[pid] = {
            ...players[pid],
            score: 0,
            streak: 0,
            maxStreak: 0,
            hits: 0,
            misses: 0,
            level: 1,
            roundStartedAt: null,
            lastAction: "Pronto para o próximo desafio!",
          };
        });
      } else {
        Object.keys(players).forEach((pid) => {
          players[pid] = {
            ...players[pid],
            streak: 0,
            level: 1,
            roundStartedAt: null,
            lastAction: "Novo minigame selecionado!",
          };
        });
      }
      await withDbTimeout(
        update(ref(db, `rooms/${pin}`), {
          minigameId: newMinigameId,
          durationSec,
          status: "LOBBY",
          startedAt: null,
          endsAt: null,
          players,
          events: {},
        })
      );
    } catch {
      // Fallback local já aplicado
    }
  }
}

export async function recordPlayerAction(
  pin: string,
  playerId: string,
  deltaScore: number,
  isHit: boolean,
  actionMessage: string,
  newLevel?: number
): Promise<void> {
  const now = Date.now();

  const localRoom = getLocalRoom(pin);
  if (
    localRoom &&
    localRoom.status === "PLAYING" &&
    localRoom.players &&
    localRoom.players[playerId]
  ) {
    const p = localRoom.players[playerId];
    const isCurrentRound = Boolean(
      localRoom.startedAt && p.roundStartedAt === localRoom.startedAt
    );
    const baseScore = isCurrentRound ? p.score || 0 : 0;
    const baseStreak = isCurrentRound ? p.streak || 0 : 0;
    const baseMaxStreak = isCurrentRound ? p.maxStreak || 0 : 0;
    const baseHits = isCurrentRound ? p.hits || 0 : 0;
    const baseMisses = isCurrentRound ? p.misses || 0 : 0;
    const baseLevel = isCurrentRound ? p.level || 1 : 1;

    const newStreak = isHit ? baseStreak + 1 : 0;
    const newMaxStreak = Math.max(baseMaxStreak, newStreak);

    localRoom.players[playerId] = {
      ...p,
      score: Math.max(0, baseScore + deltaScore),
      streak: newStreak,
      maxStreak: newMaxStreak,
      hits: isHit ? baseHits + 1 : baseHits,
      misses: !isHit ? baseMisses + 1 : baseMisses,
      level: newLevel ?? baseLevel,
      roundStartedAt: localRoom.startedAt || now,
      lastAction: actionMessage,
      updatedAt: now,
    };

    localRoom.events = localRoom.events || {};
    const evId = "ev_" + now + "_" + Math.random().toString(36).slice(2, 6);
    localRoom.events[evId] = {
      id: evId,
      playerName: p.name,
      avatar: p.avatar,
      message: actionMessage,
      type: !isHit
        ? "short_circuit"
        : newLevel && newLevel > baseLevel
        ? "level"
        : newStreak >= 3
        ? "streak"
        : "hit",
      timestamp: now,
    };

    saveLocalRoom(localRoom);
  }

  if (isFirebaseConfigured && db) {
    try {
      const roomRef = ref(db, `rooms/${pin}`);
      const roomSnap = await withDbTimeout(get(roomRef), 2000);
      if (!roomSnap.exists()) return;
      const room = roomSnap.val() as GameRoom;
      if (room.status !== "PLAYING") return;

      const p = room.players?.[playerId];
      if (!p) return;

      const isCurrentRound = Boolean(
        room.startedAt && p.roundStartedAt === room.startedAt
      );
      const baseScore = isCurrentRound ? p.score || 0 : 0;
      const baseStreak = isCurrentRound ? p.streak || 0 : 0;
      const baseMaxStreak = isCurrentRound ? p.maxStreak || 0 : 0;
      const baseHits = isCurrentRound ? p.hits || 0 : 0;
      const baseMisses = isCurrentRound ? p.misses || 0 : 0;
      const baseLevel = isCurrentRound ? p.level || 1 : 1;

      const newStreak = isHit ? baseStreak + 1 : 0;
      const newMaxStreak = Math.max(baseMaxStreak, newStreak);
      const updatedPlayer: PlayerState = {
        ...p,
        score: Math.max(0, baseScore + deltaScore),
        streak: newStreak,
        maxStreak: newMaxStreak,
        hits: isHit ? baseHits + 1 : baseHits,
        misses: !isHit ? baseMisses + 1 : baseMisses,
        level: newLevel ?? baseLevel,
        roundStartedAt: room.startedAt || now,
        lastAction: actionMessage,
        updatedAt: now,
      };

      const playerRef = ref(db, `rooms/${pin}/players/${playerId}`);
      await withDbTimeout(set(playerRef, updatedPlayer), 2000);

      if (
        isHit &&
        (newStreak >= 3 ||
          deltaScore >= 200 ||
          (newLevel && newLevel > baseLevel))
      ) {
        const evRef = push(ref(db, `rooms/${pin}/events`));
        const ev: RoomEvent = {
          id: evRef.key || String(now),
          playerName: p.name,
          avatar: p.avatar,
          message: actionMessage,
          type:
            newLevel && newLevel > baseLevel
              ? "level"
              : newStreak >= 3
              ? "streak"
              : "hit",
          timestamp: now,
        };
        await withDbTimeout(set(evRef, ev), 2000);
      } else if (!isHit) {
        const evRef = push(ref(db, `rooms/${pin}/events`));
        const ev: RoomEvent = {
          id: evRef.key || String(now),
          playerName: p.name,
          avatar: p.avatar,
          message: actionMessage,
          type: "short_circuit",
          timestamp: now,
        };
        await withDbTimeout(set(evRef, ev), 2000);
      }
    } catch {
      // Fallback local já atualizado
    }
  }
}

export function subscribeToRoom(
  pin: string,
  callback: (room: GameRoom | null) => void
): () => void {
  const cleanPin = pin.trim();

  if (isFirebaseConfigured && db) {
    try {
      const roomRef = ref(db, `rooms/${cleanPin}`);
      const listener = onValue(
        roomRef,
        (snapshot) => {
          if (snapshot.exists()) {
            callback(snapshot.val() as GameRoom);
          } else {
            callback(getLocalRoom(cleanPin));
          }
        },
        () => {
          callback(getLocalRoom(cleanPin));
        }
      );
      return () => off(roomRef, "value", listener);
    } catch {
      // Fallback abaixo
    }
  }

  // Modo Local com sincronização instantânea entre abas
  const load = () => {
    callback(getLocalRoom(cleanPin));
  };
  load();

  let channel: BroadcastChannel | null = null;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.onmessage = (event) => {
      if (event.data?.pin === cleanPin) {
        load();
      }
    };
  } catch {
    // Fallback
  }

  const onStorage = (e: StorageEvent) => {
    if (e.key === `${LOCAL_STORAGE_PREFIX}${cleanPin}`) {
      load();
    }
  };
  window.addEventListener("storage", onStorage);
  const interval = setInterval(load, 1000);

  return () => {
    if (channel) channel.close();
    window.removeEventListener("storage", onStorage);
    clearInterval(interval);
  };
}
