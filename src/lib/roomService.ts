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
  localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${room.pin}`, JSON.stringify(room));
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

  if (isFirebaseConfigured && db) {
    await set(ref(db, `rooms/${pin}`), newRoom);
  } else {
    saveLocalRoom(newRoom);
  }
  return newRoom;
}

export async function checkRoomExists(pin: string): Promise<boolean> {
  const cleanPin = pin.trim();
  if (!cleanPin) return false;

  if (isFirebaseConfigured && db) {
    const snap = await get(ref(db, `rooms/${cleanPin}`));
    return snap.exists();
  } else {
    return getLocalRoom(cleanPin) !== null;
  }
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

  if (isFirebaseConfigured && db) {
    const existingSnap = await get(ref(db, `rooms/${cleanPin}/players/${playerId}`));
    if (existingSnap.exists()) {
      const existing = existingSnap.val() as PlayerState;
      const updated = {
        ...existing,
        name: playerState.name,
        avatar: playerState.avatar,
        updatedAt: Date.now(),
      };
      await update(ref(db, `rooms/${cleanPin}/players/${playerId}`), updated);
      return updated;
    }
    await set(ref(db, `rooms/${cleanPin}/players/${playerId}`), playerState);
    return playerState;
  } else {
    const room = getLocalRoom(cleanPin);
    if (!room) {
      throw new Error("Sala não encontrada.");
    }
    room.players = room.players || {};
    if (room.players[playerId]) {
      room.players[playerId].name = playerState.name;
      room.players[playerId].avatar = playerState.avatar;
      saveLocalRoom(room);
      return room.players[playerId];
    }
    room.players[playerId] = playerState;
    saveLocalRoom(room);
    return playerState;
  }
}

export async function startRoomGame(pin: string): Promise<void> {
  const now = Date.now();
  if (isFirebaseConfigured && db) {
    const snap = await get(ref(db, `rooms/${pin}`));
    if (!snap.exists()) return;
    const room = snap.val() as GameRoom;
    await update(ref(db, `rooms/${pin}`), {
      status: "PLAYING",
      startedAt: now,
      endsAt: now + room.durationSec * 1000,
    });
  } else {
    const room = getLocalRoom(pin);
    if (!room) return;
    room.status = "PLAYING";
    room.startedAt = now;
    room.endsAt = now + room.durationSec * 1000;
    saveLocalRoom(room);
  }
}

export async function finishRoomGame(pin: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await update(ref(db, `rooms/${pin}`), {
      status: "FINISHED",
    });
  } else {
    const room = getLocalRoom(pin);
    if (!room) return;
    room.status = "FINISHED";
    saveLocalRoom(room);
  }
}

export async function switchMinigameInRoom(
  pin: string,
  newMinigameId: MinigameId,
  durationSec: number,
  resetScores: boolean = false
): Promise<void> {
  if (isFirebaseConfigured && db) {
    const snap = await get(ref(db, `rooms/${pin}`));
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
          lastAction: "Pronto para o próximo desafio!",
        };
      });
    } else {
      Object.keys(players).forEach((pid) => {
        players[pid] = {
          ...players[pid],
          streak: 0,
          level: 1,
          lastAction: "Novo minigame selecionado!",
        };
      });
    }
    await update(ref(db, `rooms/${pin}`), {
      minigameId: newMinigameId,
      durationSec,
      status: "LOBBY",
      startedAt: null,
      endsAt: null,
      players,
      events: {},
    });
  } else {
    const room = getLocalRoom(pin);
    if (!room) return;
    room.minigameId = newMinigameId;
    room.durationSec = durationSec;
    room.status = "LOBBY";
    room.startedAt = null;
    room.endsAt = null;
    room.events = {};
    if (room.players) {
      Object.keys(room.players).forEach((pid) => {
        if (resetScores) {
          room.players![pid].score = 0;
          room.players![pid].hits = 0;
          room.players![pid].misses = 0;
          room.players![pid].maxStreak = 0;
        }
        room.players![pid].streak = 0;
        room.players![pid].level = 1;
        room.players![pid].lastAction = "Pronto!";
      });
    }
    saveLocalRoom(room);
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

  if (isFirebaseConfigured && db) {
    const playerRef = ref(db, `rooms/${pin}/players/${playerId}`);
    const snap = await get(playerRef);
    if (!snap.exists()) return;
    const p = snap.val() as PlayerState;

    const newStreak = isHit ? (p.streak || 0) + 1 : 0;
    const newMaxStreak = Math.max(p.maxStreak || 0, newStreak);
    const updatedPlayer: PlayerState = {
      ...p,
      score: Math.max(0, (p.score || 0) + deltaScore),
      streak: newStreak,
      maxStreak: newMaxStreak,
      hits: isHit ? (p.hits || 0) + 1 : p.hits || 0,
      misses: !isHit ? (p.misses || 0) + 1 : p.misses || 0,
      level: newLevel ?? p.level ?? 1,
      lastAction: actionMessage,
      updatedAt: now,
    };

    await set(playerRef, updatedPlayer);

    // Registra evento no feed ao vivo para o telão do professor
    if (isHit && (newStreak >= 3 || deltaScore >= 200 || (newLevel && newLevel > (p.level || 1)))) {
      const evRef = push(ref(db, `rooms/${pin}/events`));
      const ev: RoomEvent = {
        id: evRef.key || String(now),
        playerName: p.name,
        avatar: p.avatar,
        message: actionMessage,
        type: newLevel && newLevel > (p.level || 1) ? "level" : newStreak >= 3 ? "streak" : "hit",
        timestamp: now,
      };
      await set(evRef, ev);
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
      await set(evRef, ev);
    }
  } else {
    const room = getLocalRoom(pin);
    if (!room || !room.players || !room.players[playerId]) return;
    const p = room.players[playerId];
    const newStreak = isHit ? (p.streak || 0) + 1 : 0;
    const newMaxStreak = Math.max(p.maxStreak || 0, newStreak);

    room.players[playerId] = {
      ...p,
      score: Math.max(0, (p.score || 0) + deltaScore),
      streak: newStreak,
      maxStreak: newMaxStreak,
      hits: isHit ? (p.hits || 0) + 1 : p.hits || 0,
      misses: !isHit ? (p.misses || 0) + 1 : p.misses || 0,
      level: newLevel ?? p.level ?? 1,
      lastAction: actionMessage,
      updatedAt: now,
    };

    room.events = room.events || {};
    const evId = "ev_" + now + "_" + Math.random().toString(36).slice(2, 6);
    room.events[evId] = {
      id: evId,
      playerName: p.name,
      avatar: p.avatar,
      message: actionMessage,
      type: !isHit
        ? "short_circuit"
        : newLevel && newLevel > (p.level || 1)
        ? "level"
        : newStreak >= 3
        ? "streak"
        : "hit",
      timestamp: now,
    };

    saveLocalRoom(room);
  }
}

export function subscribeToRoom(
  pin: string,
  callback: (room: GameRoom | null) => void
): () => void {
  const cleanPin = pin.trim();

  if (isFirebaseConfigured && db) {
    const roomRef = ref(db, `rooms/${cleanPin}`);
    const listener = onValue(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.val() as GameRoom);
      } else {
        callback(null);
      }
    });
    return () => off(roomRef, "value", listener);
  } else {
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
}
