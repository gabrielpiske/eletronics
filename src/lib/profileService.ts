"use client";

import {
  db,
  auth,
  googleProvider,
  isFirebaseConfigured,
  isFirebaseAuthConfigured,
} from "@/lib/firebase";
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { ref, get, set, remove, onValue, off } from "firebase/database";
import {
  ACHIEVEMENTS_CATALOG,
  AchievementDef,
  MatchRecord,
  getRankInfoByXp,
} from "@/data/achievementsData";
import { MINIGAMES_CATALOG, MinigameId } from "@/data/electronicsData";

export type LeaderboardPeriod = "weekly" | "monthly" | "all";

export interface LeaderboardMeta {
  periodResetAt: number;
  seasonNumber: number;
  updatedAt: number;
}

export interface PeriodStats {
  xp: number;
  matches: number;
  hits: number;
  misses: number;
  accuracyPct: number;
  bestStreak: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  avatar: string;
  authProvider: "google" | "local";
  xp: number;
  totalXp: number;
  level: number;
  rankTitle: string;
  patentCode?: string;
  totalMatches: number;
  matchesPlayed: number;
  totalHits: number;
  totalMisses: number;
  bestStreak: number;
  perfectMatches?: number;
  highScoreMatch?: number;
  minigameBestScores?: Partial<Record<MinigameId, number>>;
  playedMinigames: MinigameId[];
  achievements: Record<string, number>;
  unlockedAchievements: string[];
  recentMatches: MatchRecord[];
  weekKey?: string;
  weeklyXp?: number;
  weeklyMatches?: number;
  weeklyHits?: number;
  weeklyMisses?: number;
  weeklyBestStreak?: number;
  monthKey?: string;
  monthlyXp?: number;
  monthlyMatches?: number;
  monthlyHits?: number;
  monthlyMisses?: number;
  monthlyBestStreak?: number;
  periodUpdatedAt?: number;
  adminOverrideAt?: number;
  updatedAt: number;
}

export const ADMIN_FIXED_PIN = "01487654";

const LOCAL_ACTIVE_USER_KEY = "senai_arena_v2_active_uid";
const LOCAL_USERS_DB_KEY = "senai_arena_v2_users_db";
const LOCAL_LEADERBOARD_META_KEY = "senai_arena_v2_leaderboard_meta";
const PROCESSED_ROUNDS_KEY = "senai_arena_v2_processed_rounds";
const PROFILE_EVENT_NAME = "senai_profile_updated";
// Caminho espelhado dentro de rooms/ para garantir permissão de escrita mesmo com regras V1
const GLOBAL_PROFILES_DB_PATH = "rooms/global_profiles_v2/users";
const LEADERBOARD_META_DB_PATH = "rooms/global_profiles_v2/meta";
const inFlightRoundKeys = new Set<string>();

export function getCurrentWeekStartTs(now = Date.now()): number {
  const d = new Date(now);
  const day = d.getDay(); // 0 = Dom, 1 = Seg, ..., 6 = Sáb
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function getNextWeekResetTs(now = Date.now()): number {
  return getCurrentWeekStartTs(now) + 7 * 24 * 60 * 60 * 1000;
}

export function getCurrentWeekKey(now = Date.now()): string {
  const d = new Date(getCurrentWeekStartTs(now));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `W_${y}-${m}-${day}`;
}

export function getCurrentMonthStartTs(now = Date.now()): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime();
}

export function getCurrentMonthKey(now = Date.now()): string {
  const d = new Date(now);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `M_${y}-${m}`;
}

export function getLocalLeaderboardMeta(): LeaderboardMeta {
  if (typeof window === "undefined") {
    return { periodResetAt: 0, seasonNumber: 1, updatedAt: 0 };
  }
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_META_KEY);
    if (!raw) return { periodResetAt: 0, seasonNumber: 1, updatedAt: 0 };
    const parsed = JSON.parse(raw) as Partial<LeaderboardMeta>;
    return {
      periodResetAt: Number(parsed.periodResetAt || 0),
      seasonNumber: Math.max(1, Number(parsed.seasonNumber || 1)),
      updatedAt: Number(parsed.updatedAt || 0),
    };
  } catch {
    return { periodResetAt: 0, seasonNumber: 1, updatedAt: 0 };
  }
}

function saveLocalLeaderboardMeta(meta: LeaderboardMeta, emitEvent = false) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_LEADERBOARD_META_KEY, JSON.stringify(meta));
  if (emitEvent) {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT_NAME));
  }
}

export function getProfilePeriodStats(
  profile: UserProfile,
  period: LeaderboardPeriod,
  meta?: LeaderboardMeta | null
): PeriodStats {
  if (period === "all") {
    const totalAtt = (profile.totalHits || 0) + (profile.totalMisses || 0);
    return {
      xp: Math.max(0, profile.totalXp || 0),
      matches: Math.max(0, profile.matchesPlayed || 0),
      hits: Math.max(0, profile.totalHits || 0),
      misses: Math.max(0, profile.totalMisses || 0),
      accuracyPct:
        totalAtt > 0
          ? Math.round(((profile.totalHits || 0) / totalAtt) * 100)
          : 0,
      bestStreak: Math.max(0, profile.bestStreak || 0),
    };
  }

  const resetAt = meta?.periodResetAt || 0;
  const now = Date.now();

  if (period === "weekly") {
    const weekStart = Math.max(getCurrentWeekStartTs(now), resetAt);
    const curWeekKey = getCurrentWeekKey(now);

    if (profile.weekKey) {
      const isCurrentWeekValid =
        profile.weekKey === curWeekKey &&
        (profile.periodUpdatedAt || 0) >= weekStart;
      if (!isCurrentWeekValid) {
        return {
          xp: 0,
          matches: 0,
          hits: 0,
          misses: 0,
          accuracyPct: 0,
          bestStreak: 0,
        };
      }
      const hits = Math.max(0, profile.weeklyHits || 0);
      const misses = Math.max(0, profile.weeklyMisses || 0);
      const totalAtt = hits + misses;
      return {
        xp: Math.min(profile.totalXp || 0, Math.max(0, profile.weeklyXp || 0)),
        matches: Math.max(0, profile.weeklyMatches || 0),
        hits,
        misses,
        accuracyPct: totalAtt > 0 ? Math.round((hits / totalAtt) * 100) : 0,
        bestStreak: Math.max(0, profile.weeklyBestStreak || 0),
      };
    }

    // Fallback retrocompatível para perfis que jogaram antes da adição de weekKey
    const weekMatches = (profile.recentMatches || []).filter(
      (m) => (m.timestamp || m.playedAt || 0) >= weekStart
    );
    const hits = weekMatches.reduce((acc, m) => acc + (m.hits || 0), 0);
    const misses = weekMatches.reduce((acc, m) => acc + (m.misses || 0), 0);
    const totalAtt = hits + misses;
    const xp = weekMatches.reduce((acc, m) => acc + (m.xpEarned || 0), 0);
    const bestStreak = weekMatches.reduce(
      (max, m) => Math.max(max, m.maxStreak || 0),
      0
    );
    return {
      xp: Math.min(profile.totalXp || 0, Math.max(0, xp)),
      matches: weekMatches.length,
      hits,
      misses,
      accuracyPct: totalAtt > 0 ? Math.round((hits / totalAtt) * 100) : 0,
      bestStreak,
    };
  }

  // period === "monthly"
  const monthStart = Math.max(getCurrentMonthStartTs(now), resetAt);
  const curMonthKey = getCurrentMonthKey(now);

  if (profile.monthKey) {
    const isCurrentMonthValid =
      profile.monthKey === curMonthKey &&
      (profile.periodUpdatedAt || 0) >= monthStart;
    if (!isCurrentMonthValid) {
      return {
        xp: 0,
        matches: 0,
        hits: 0,
        misses: 0,
        accuracyPct: 0,
        bestStreak: 0,
      };
    }
    const hits = Math.max(0, profile.monthlyHits || 0);
    const misses = Math.max(0, profile.monthlyMisses || 0);
    const totalAtt = hits + misses;
    return {
      xp: Math.min(profile.totalXp || 0, Math.max(0, profile.monthlyXp || 0)),
      matches: Math.max(0, profile.monthlyMatches || 0),
      hits,
      misses,
      accuracyPct: totalAtt > 0 ? Math.round((hits / totalAtt) * 100) : 0,
      bestStreak: Math.max(0, profile.monthlyBestStreak || 0),
    };
  }

  const monthMatches = (profile.recentMatches || []).filter(
    (m) => (m.timestamp || m.playedAt || 0) >= monthStart
  );
  const hits = monthMatches.reduce((acc, m) => acc + (m.hits || 0), 0);
  const misses = monthMatches.reduce((acc, m) => acc + (m.misses || 0), 0);
  const totalAtt = hits + misses;
  const xp = monthMatches.reduce((acc, m) => acc + (m.xpEarned || 0), 0);
  const bestStreak = monthMatches.reduce(
    (max, m) => Math.max(max, m.maxStreak || 0),
    0
  );
  return {
    xp: Math.min(profile.totalXp || 0, Math.max(0, xp)),
    matches: monthMatches.length,
    hits,
    misses,
    accuracyPct: totalAtt > 0 ? Math.round((hits / totalAtt) * 100) : 0,
    bestStreak,
  };
}

function hasProcessedRoundKey(uid: string, roundKey: string): boolean {
  if (typeof window === "undefined" || !roundKey) return false;
  try {
    const raw = localStorage.getItem(PROCESSED_ROUNDS_KEY);
    if (!raw) return false;
    const map = JSON.parse(raw) as Record<string, string[]>;
    return Array.isArray(map[uid]) && map[uid].includes(roundKey);
  } catch {
    return false;
  }
}

function markProcessedRoundKey(uid: string, roundKey: string): void {
  if (typeof window === "undefined" || !roundKey) return;
  try {
    const raw = localStorage.getItem(PROCESSED_ROUNDS_KEY);
    const map: Record<string, string[]> = raw ? JSON.parse(raw) : {};
    const list = Array.isArray(map[uid]) ? map[uid] : [];
    if (!list.includes(roundKey)) {
      map[uid] = [roundKey, ...list].slice(0, 100);
      localStorage.setItem(PROCESSED_ROUNDS_KEY, JSON.stringify(map));
    }
  } catch {
    // ignore
  }
}

/**
 * Remove qualquer propriedade `undefined` do objeto antes de enviar ao Firebase Realtime Database.
 * O Firebase RTDB lança erro síncrono fatal se houver qualquer chave com valor `undefined`.
 */
function sanitizeForFirebase<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

/**
 * Executa uma função assíncrona do Firebase com captura de erros síncronos/assíncronos e timeout.
 */
async function safeFirebaseCall<T>(
  fn: () => Promise<T>,
  timeoutMs = 3000
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("FIREBASE_TIMEOUT"));
    }, timeoutMs);

    try {
      fn()
        .then((val) => {
          clearTimeout(timer);
          resolve(val);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    } catch (syncErr) {
      clearTimeout(timer);
      reject(syncErr);
    }
  });
}

export function formatGoogleAuthError(err: unknown): string {
  const code =
    typeof err === "object" && err !== null && "code" in err
      ? String((err as { code?: unknown }).code)
      : "";
  const msg =
    typeof err === "object" && err !== null && "message" in err
      ? String((err as { message?: unknown }).message)
      : "";

  if (code.includes("auth/unauthorized-domain")) {
    const host =
      typeof window !== "undefined" ? window.location.hostname : "seu-dominio";
    return `Domínio não autorizado no Firebase Auth. No Firebase Console, vá em Authentication → Settings → Authorized domains e adicione: ${host}`;
  }
  if (
    code.includes("auth/operation-not-allowed") ||
    code.includes("auth/configuration-not-found")
  ) {
    return "O login com Google ainda não foi ativado no projeto Firebase. No Firebase Console, vá em Authentication → Sign-in method → Google → Ativar (Enable).";
  }
  if (code.includes("auth/invalid-api-key") || msg.includes("api-key")) {
    return "A variável NEXT_PUBLIC_FIREBASE_API_KEY está incorreta ou inválida. Verifique as variáveis de ambiente e faça um Redeploy.";
  }
  if (code.includes("auth/popup-blocked")) {
    return "O navegador bloqueou a janela popup do Google. Permita popups para este site e tente novamente.";
  }
  if (
    code.includes("auth/popup-closed-by-user") ||
    code.includes("auth/cancelled-popup-request")
  ) {
    return "A janela de login do Google foi fechada antes de concluir a autenticação.";
  }
  if (!isFirebaseAuthConfigured) {
    return "As variáveis NEXT_PUBLIC_FIREBASE_API_KEY e NEXT_PUBLIC_FIREBASE_PROJECT_ID ainda não foram detectadas. Se você acabou de adicioná-las na Vercel, faça um Redeploy.";
  }
  return `Não foi possível autenticar via Google OAuth (${
    code || "erro de configuração"
  }). Você pode usar o Acesso Rápido Educacional abaixo.`;
}

function normalizeProfile(
  raw: Partial<UserProfile> & { uid: string }
): UserProfile {
  const xpVal = Math.max(0, Number(raw.totalXp ?? raw.xp ?? 0) || 0);
  const rank = getRankInfoByXp(xpVal);
  const matchesVal = Math.max(
    0,
    Number(raw.matchesPlayed ?? raw.totalMatches ?? 0) || 0
  );
  const achMap =
    raw.achievements && typeof raw.achievements === "object"
      ? raw.achievements
      : {};
  const unlockedList =
    Array.isArray(raw.unlockedAchievements) &&
    raw.unlockedAchievements.length > 0
      ? raw.unlockedAchievements
      : Object.keys(achMap);

  const rawMatches = Array.isArray(raw.recentMatches)
    ? raw.recentMatches
    : raw.recentMatches && typeof raw.recentMatches === "object"
    ? (Object.values(raw.recentMatches) as MatchRecord[])
    : [];

  const normalizedMatches: MatchRecord[] = rawMatches.map((m, idx) => ({
    id: m.id || `m_${Date.now()}_${idx}`,
    ...(m.roundKey ? { roundKey: String(m.roundKey) } : {}),
    timestamp: Number(m.timestamp || m.playedAt || Date.now()),
    playedAt: Number(m.playedAt || m.timestamp || Date.now()),
    mode: m.mode === "room" ? "room" : "solo",
    roomPin: m.roomPin ? String(m.roomPin) : "SOLO",
    minigameId: (m.minigameId || "conveyor") as MinigameId,
    minigameTitle: m.minigameTitle || m.gameTitle || "Minigame",
    gameTitle: m.gameTitle || m.minigameTitle || "Minigame",
    score: Number(m.score || 0),
    xpEarned: Number(m.xpEarned || 0),
    hits: Number(m.hits || 0),
    misses: Number(m.misses || 0),
    accuracyPct: Number(m.accuracyPct ?? m.accuracy ?? 0),
    accuracy: Number(m.accuracy ?? m.accuracyPct ?? 0),
    maxStreak: Number(m.maxStreak || 0),
  }));

  const rawPlayedGames = Array.isArray(raw.playedMinigames)
    ? raw.playedMinigames
    : raw.playedMinigames && typeof raw.playedMinigames === "object"
    ? (Object.values(raw.playedMinigames) as MinigameId[])
    : [];

  // Deriva recordes e partidas perfeitas do histórico caso ainda não estejam gravados
  const derivedBestByGame: Partial<Record<MinigameId, number>> = {
    ...(raw.minigameBestScores && typeof raw.minigameBestScores === "object"
      ? raw.minigameBestScores
      : {}),
  };
  let derivedHighScore = Number(raw.highScoreMatch || 0);
  let derivedPerfectMatches = Number(raw.perfectMatches || 0);

  if (normalizedMatches.length > 0) {
    let historyPerfectCount = 0;
    for (const m of normalizedMatches) {
      if (m.score > derivedHighScore) {
        derivedHighScore = m.score;
      }
      const prevGameBest = derivedBestByGame[m.minigameId] || 0;
      if (m.score > prevGameBest) {
        derivedBestByGame[m.minigameId] = m.score;
      }
      if (m.hits >= 10 && m.misses === 0) {
        historyPerfectCount++;
      }
    }
    derivedPerfectMatches = Math.max(derivedPerfectMatches, historyPerfectCount);
  }

  return {
    uid: String(raw.uid),
    displayName: String(raw.displayName || "Estudante SENAI"),
    email: String(raw.email || ""),
    photoURL: String(raw.photoURL || ""),
    avatar: String(raw.avatar || "⚡"),
    authProvider: raw.authProvider === "local" ? "local" : "google",
    xp: xpVal,
    totalXp: xpVal,
    level: rank.currentTier.level,
    rankTitle: rank.currentTier.title,
    patentCode: rank.currentTier.patentCode,
    totalMatches: matchesVal,
    matchesPlayed: matchesVal,
    totalHits: Number(raw.totalHits || 0),
    totalMisses: Number(raw.totalMisses || 0),
    bestStreak: Number(raw.bestStreak || 0),
    perfectMatches: derivedPerfectMatches,
    highScoreMatch: derivedHighScore,
    minigameBestScores: derivedBestByGame,
    playedMinigames: rawPlayedGames,
    achievements: achMap,
    unlockedAchievements: unlockedList,
    recentMatches: normalizedMatches,
    ...(raw.weekKey ? { weekKey: String(raw.weekKey) } : {}),
    ...(raw.weeklyXp !== undefined
      ? { weeklyXp: Math.max(0, Number(raw.weeklyXp) || 0) }
      : {}),
    ...(raw.weeklyMatches !== undefined
      ? { weeklyMatches: Math.max(0, Number(raw.weeklyMatches) || 0) }
      : {}),
    ...(raw.weeklyHits !== undefined
      ? { weeklyHits: Math.max(0, Number(raw.weeklyHits) || 0) }
      : {}),
    ...(raw.weeklyMisses !== undefined
      ? { weeklyMisses: Math.max(0, Number(raw.weeklyMisses) || 0) }
      : {}),
    ...(raw.weeklyBestStreak !== undefined
      ? { weeklyBestStreak: Math.max(0, Number(raw.weeklyBestStreak) || 0) }
      : {}),
    ...(raw.monthKey ? { monthKey: String(raw.monthKey) } : {}),
    ...(raw.monthlyXp !== undefined
      ? { monthlyXp: Math.max(0, Number(raw.monthlyXp) || 0) }
      : {}),
    ...(raw.monthlyMatches !== undefined
      ? { monthlyMatches: Math.max(0, Number(raw.monthlyMatches) || 0) }
      : {}),
    ...(raw.monthlyHits !== undefined
      ? { monthlyHits: Math.max(0, Number(raw.monthlyHits) || 0) }
      : {}),
    ...(raw.monthlyMisses !== undefined
      ? { monthlyMisses: Math.max(0, Number(raw.monthlyMisses) || 0) }
      : {}),
    ...(raw.monthlyBestStreak !== undefined
      ? { monthlyBestStreak: Math.max(0, Number(raw.monthlyBestStreak) || 0) }
      : {}),
    ...(raw.periodUpdatedAt !== undefined
      ? { periodUpdatedAt: Number(raw.periodUpdatedAt) || 0 }
      : {}),
    ...(raw.adminOverrideAt !== undefined
      ? { adminOverrideAt: Number(raw.adminOverrideAt) || 0 }
      : {}),
    updatedAt: Number(raw.updatedAt || Date.now()),
  };
}

function pickPreferredProfile(a: UserProfile, b: UserProfile): UserProfile {
  const aAdmin = a.adminOverrideAt || 0;
  const bAdmin = b.adminOverrideAt || 0;
  if (aAdmin !== bAdmin) {
    return aAdmin > bAdmin ? a : b;
  }
  if (a.totalXp !== b.totalXp) {
    return a.totalXp > b.totalXp ? a : b;
  }
  return (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
}

export function getAchievementProgressForProfile(
  ach: AchievementDef,
  profile: UserProfile
): {
  current: number;
  target: number;
  pct: number;
} {
  const unlocked = profile.unlockedAchievements.includes(ach.id);
  const bestByGame = profile.minigameBestScores || {};
  const bestFlawlessHits = (profile.recentMatches || []).reduce(
    (maxH, m) => (m.misses === 0 && m.hits > maxH ? m.hits : maxH),
    0
  );

  let current = 0;
  switch (ach.id) {
    case "first_match":
    case "matches_5":
    case "matches_15":
    case "matches_150":
      current = profile.matchesPlayed || 0;
      break;
    case "all_rounder":
      current = (profile.playedMinigames || []).length;
      break;
    case "zero_short_circuit":
    case "flawless_master_25":
      current = bestFlawlessHits;
      break;
    case "perfect_runs_10":
      current = profile.perfectMatches || 0;
      break;
    case "high_scorer_2500":
    case "high_scorer_3000":
      current = profile.highScoreMatch || 0;
      break;
    case "combo_5":
    case "combo_12":
    case "combo_35":
    case "combo_60":
      current = profile.bestStreak || 0;
      break;
    case "conveyor_specialist":
      current = bestByGame.conveyor || 0;
      break;
    case "resistor_specialist":
      current = bestByGame.resistor || 0;
      break;
    case "radar_specialist":
      current = bestByGame.radar || 0;
      break;
    case "match_specialist":
      current = bestByGame.match || 0;
      break;
    case "detective_specialist":
      current = bestByGame.detective || 0;
      break;
    case "hits_50":
    case "hits_200":
    case "hits_2500":
      current = profile.totalHits || 0;
      break;
    case "career_level_25":
    case "career_level_50":
      current = profile.level || 1;
      break;
    default:
      current = unlocked ? ach.targetValue : 0;
  }

  if (unlocked && current < ach.targetValue) {
    current = ach.targetValue;
  }

  const target = Math.max(1, ach.targetValue);
  const pct = Math.max(
    0,
    Math.min(100, Math.round((Math.min(current, target) / target) * 100))
  );

  return {
    current: Math.min(current, target),
    target,
    pct,
  };
}

function getLocalUsersMap(): Record<string, UserProfile> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(LOCAL_USERS_DB_KEY);
  const parsed: Record<string, UserProfile> = {};
  let hadSeed = false;

  if (raw) {
    try {
      const obj = JSON.parse(raw) as Record<string, UserProfile>;
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith("seed_") || v?.uid?.startsWith("seed_")) {
          hadSeed = true;
          continue;
        }
        parsed[k] = normalizeProfile({ ...v, uid: k });
      }
    } catch {
      // ignore
    }
  }

  if (hadSeed) {
    localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(parsed));
  }

  return parsed;
}

function saveLocalUsersMap(
  map: Record<string, UserProfile>,
  emitEvent = false
) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_USERS_DB_KEY, JSON.stringify(map));
  if (emitEvent) {
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT_NAME));
  }
}

function createInitialProfile(
  uid: string,
  displayName: string,
  email: string,
  photoURL: string,
  avatar: string,
  authProvider: "google" | "local"
): UserProfile {
  return normalizeProfile({
    uid,
    displayName: displayName.trim().slice(0, 22) || "Estudante SENAI",
    email,
    photoURL,
    avatar: avatar || "⚡",
    authProvider,
    xp: 0,
    totalXp: 0,
    totalMatches: 0,
    matchesPlayed: 0,
    totalHits: 0,
    totalMisses: 0,
    bestStreak: 0,
    playedMinigames: [],
    achievements: {},
    unlockedAchievements: [],
    recentMatches: [],
    updatedAt: Date.now(),
  });
}

async function fetchRemoteProfileFromFirebase(
  uid: string
): Promise<UserProfile | null> {
  if (!isFirebaseConfigured || !db) return null;

  // Tenta ler de rooms/global_profiles_v2/users/{uid} e de users/{uid}, respeitando adminOverrideAt
  const results = await Promise.allSettled([
    safeFirebaseCall(() => get(ref(db!, `${GLOBAL_PROFILES_DB_PATH}/${uid}`)), 2500),
    safeFirebaseCall(() => get(ref(db!, `users/${uid}`)), 2500),
  ]);

  let bestProfile: UserProfile | null = null;

  for (const res of results) {
    if (res.status === "fulfilled" && res.value.exists()) {
      const candidate = normalizeProfile({
        ...(res.value.val() as UserProfile),
        uid,
      });
      bestProfile = bestProfile
        ? pickPreferredProfile(bestProfile, candidate)
        : candidate;
    }
  }

  return bestProfile;
}

async function writeRemoteProfileToFirebase(profile: UserProfile): Promise<void> {
  if (!isFirebaseConfigured || !db) return;
  const cleanData = sanitizeForFirebase(profile);

  // Grava simultaneamente em rooms/global_profiles_v2/users/{uid} (compatível com rules V1 e V2)
  // e em users/{uid} (regra V2) para garantir persistência sem erro de permissão
  await Promise.allSettled([
    safeFirebaseCall(
      () => set(ref(db!, `${GLOBAL_PROFILES_DB_PATH}/${profile.uid}`), cleanData),
      3000
    ),
    safeFirebaseCall(
      () => set(ref(db!, `users/${profile.uid}`), cleanData),
      3000
    ),
  ]);
}

export async function getOrLoadUserProfile(
  uid: string,
  defaults?: Partial<UserProfile>
): Promise<UserProfile> {
  const localMap = getLocalUsersMap();
  const localExisting = localMap[uid] ? normalizeProfile(localMap[uid]) : null;

  const remoteProfile = await fetchRemoteProfileFromFirebase(uid);
  if (remoteProfile) {
    const merged = localExisting
      ? pickPreferredProfile(localExisting, remoteProfile)
      : remoteProfile;
    localMap[uid] = merged;
    saveLocalUsersMap(localMap, false);
    return merged;
  }

  if (localExisting) {
    return localExisting;
  }

  const created = createInitialProfile(
    uid,
    defaults?.displayName || "Estudante SENAI",
    defaults?.email || "",
    defaults?.photoURL || "",
    defaults?.avatar || "⚡",
    defaults?.authProvider || "google"
  );

  localMap[uid] = created;
  saveLocalUsersMap(localMap, false);

  writeRemoteProfileToFirebase(created).catch(() => {});

  return created;
}

export async function saveUserProfile(profile: UserProfile): Promise<UserProfile> {
  const updated = sanitizeForFirebase(
    normalizeProfile({
      ...profile,
      updatedAt: Date.now(),
    })
  );

  const localMap = getLocalUsersMap();
  localMap[updated.uid] = updated;
  saveLocalUsersMap(localMap, true);

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, updated.uid);
    sessionStorage.setItem("senai_arena_nickname", updated.displayName);
    sessionStorage.setItem("senai_arena_avatar", updated.avatar);
  }

  await writeRemoteProfileToFirebase(updated);
  return updated;
}

export async function signInWithGoogleAccount(): Promise<UserProfile> {
  if (!isFirebaseAuthConfigured || !auth || !googleProvider) {
    throw new Error("AUTH_NOT_CONFIGURED");
  }

  const cred = await signInWithPopup(auth, googleProvider);
  const u = cred.user;
  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, u.uid);
  }
  const profile = await getOrLoadUserProfile(u.uid, {
    displayName: u.displayName || u.email?.split("@")[0] || "Aluno SENAI",
    email: u.email || "",
    photoURL: u.photoURL || "",
    avatar: "⚡",
    authProvider: "google",
  });
  if (u.displayName) {
    profile.displayName = u.displayName.slice(0, 22);
  }
  if (u.email) {
    profile.email = u.email;
  }
  if (u.photoURL) {
    profile.photoURL = u.photoURL;
  }
  return await saveUserProfile(profile);
}

export async function signInWithQuickGoogleSimulation(
  displayName: string,
  email: string,
  avatar: string
): Promise<UserProfile> {
  const cleanEmail =
    email.trim().toLowerCase() ||
    `${displayName.trim().toLowerCase().replace(/\s+/g, ".")}@aluno.sc.senai.br`;
  const uid =
    "usr_" + cleanEmail.replace(/[^a-z0-9]/g, "_").slice(0, 24);

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, uid);
  }

  const profile = await getOrLoadUserProfile(uid, {
    displayName: displayName.trim().slice(0, 22) || "Aluno SENAI",
    email: cleanEmail,
    photoURL: "",
    avatar: avatar || "⚡",
    authProvider: "google",
  });

  profile.displayName = displayName.trim().slice(0, 22) || profile.displayName;
  profile.avatar = avatar || profile.avatar;
  return await saveUserProfile(profile);
}

export async function signOutCurrentProfile(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT_NAME));
  }
  if (isFirebaseAuthConfigured && auth) {
    try {
      await safeFirebaseCall(() => firebaseSignOut(auth!), 2000);
    } catch {
      // Ignora
    }
  }
}

export function getActiveUid(): string | null {
  if (typeof window === "undefined") return null;
  if (auth?.currentUser?.uid) {
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, auth.currentUser.uid);
    return auth.currentUser.uid;
  }
  return localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
}

export function subscribeToActiveProfile(
  callback: (profile: UserProfile | null) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let isMounted = true;

  const readFromLocalCache = () => {
    if (!isMounted) return;
    const uid = getActiveUid();
    if (!uid) {
      callback(null);
      return;
    }
    const localMap = getLocalUsersMap();
    if (localMap[uid]) {
      callback(normalizeProfile(localMap[uid]));
    }
  };

  const initialSync = async () => {
    const uid = getActiveUid();
    if (!uid) {
      if (isMounted) callback(null);
      return;
    }
    readFromLocalCache();
    const prof = await getOrLoadUserProfile(uid);
    if (isMounted) callback(prof);
  };

  initialSync();

  let unsubAuth: (() => void) | null = null;
  if (isFirebaseAuthConfigured && auth) {
    try {
      unsubAuth = onAuthStateChanged(auth, async (user) => {
        if (!isMounted) return;
        if (user) {
          localStorage.setItem(LOCAL_ACTIVE_USER_KEY, user.uid);
          const prof = await getOrLoadUserProfile(user.uid, {
            displayName: user.displayName || "Aluno SENAI",
            email: user.email || "",
            photoURL: user.photoURL || "",
            authProvider: "google",
          });
          if (user.displayName && prof.displayName === "Estudante SENAI") {
            prof.displayName = user.displayName.slice(0, 22);
          }
          if (user.email && !prof.email) {
            prof.email = user.email;
          }
          if (user.photoURL && !prof.photoURL) {
            prof.photoURL = user.photoURL;
          }
          const saved = await saveUserProfile(prof);
          if (isMounted) callback(saved);
        } else {
          readFromLocalCache();
        }
      });
    } catch {
      // Ignora erro de listener Auth
    }
  }

  window.addEventListener(PROFILE_EVENT_NAME, readFromLocalCache);
  window.addEventListener("storage", readFromLocalCache);

  return () => {
    isMounted = false;
    if (unsubAuth) unsubAuth();
    window.removeEventListener(PROFILE_EVENT_NAME, readFromLocalCache);
    window.removeEventListener("storage", readFromLocalCache);
  };
}

export async function recordCompletedMatch(params: {
  mode: "room" | "solo";
  roundKey?: string;
  roomPin?: string;
  minigameId?: MinigameId;
  gameId?: string;
  gameTitle?: string;
  score: number;
  hits: number;
  misses: number;
  maxStreak: number;
}): Promise<{
  profile: UserProfile | null;
  xpEarned: number;
  newlyUnlockedAchievements: string[];
}> {
  const cleanRoundKey = params.roundKey?.trim() || "";
  if (cleanRoundKey && inFlightRoundKeys.has(cleanRoundKey)) {
    return { profile: null, xpEarned: 0, newlyUnlockedAchievements: [] };
  }
  if (cleanRoundKey) {
    inFlightRoundKeys.add(cleanRoundKey);
  }

  try {
    // Exige pelo menos 1 acerto válido e pontuação positiva na rodada para conceder XP
    if (params.hits <= 0 || params.score <= 0) {
      return { profile: null, xpEarned: 0, newlyUnlockedAchievements: [] };
    }

    let uid = getActiveUid();

    // Se o usuário estiver logado no Firebase Auth mas o localStorage ainda não tinha o UID
    if (!uid && auth?.currentUser) {
      uid = auth.currentUser.uid;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_ACTIVE_USER_KEY, uid);
      }
    }

    // Se jogou com apelido de bancada sem logar antes, cria/vincula perfil automaticamente
    if (!uid && typeof window !== "undefined") {
      const savedName = sessionStorage.getItem("senai_arena_nickname");
      const savedAvatar = sessionStorage.getItem("senai_arena_avatar") || "⚡";
      if (savedName) {
        const autoProfile = await signInWithQuickGoogleSimulation(
          savedName,
          `${savedName.toLowerCase().replace(/\s+/g, ".")}@aluno.senai.br`,
          savedAvatar
        );
        uid = autoProfile.uid;
      } else {
        const guestProfile = await signInWithQuickGoogleSimulation(
          "Aluno SENAI",
          "aluno@senai.br",
          "⚡"
        );
        uid = guestProfile.uid;
      }
    }

    if (!uid) {
      return { profile: null, xpEarned: 0, newlyUnlockedAchievements: [] };
    }

    if (cleanRoundKey && hasProcessedRoundKey(uid, cleanRoundKey)) {
      return { profile: null, xpEarned: 0, newlyUnlockedAchievements: [] };
    }

    const totalAttempts = params.hits + params.misses;
    if (totalAttempts === 0 || params.hits <= 0 || params.score <= 0) {
      return { profile: null, xpEarned: 0, newlyUnlockedAchievements: [] };
    }

    const resolvedGameId = (params.minigameId ||
      params.gameId ||
      "conveyor") as MinigameId;

    const profile = await getOrLoadUserProfile(uid);

    // Impede duplicação caso a rodada já conste no histórico do perfil (ex.: F5 ou outra aba)
    if (
      cleanRoundKey &&
      (hasProcessedRoundKey(uid, cleanRoundKey) ||
        (profile.recentMatches || []).some((m) => m.roundKey === cleanRoundKey))
    ) {
      markProcessedRoundKey(uid, cleanRoundKey);
      return { profile, xpEarned: 0, newlyUnlockedAchievements: [] };
    }

    if (cleanRoundKey) {
      markProcessedRoundKey(uid, cleanRoundKey);
    }

    const accuracyPct =
      totalAttempts > 0 ? Math.round((params.hits / totalAttempts) * 100) : 0;

    // Calcula XP da partida rebalanceado (progressão equilibrada rumo a 1.000.000 XP)
    const baseXp = Math.max(
      15,
      Math.round(Math.max(0, params.score) * 0.5) + params.hits * 8
    );
    const accuracyBonus = accuracyPct >= 90 && params.hits >= 5 ? 45 : 0;
    let totalXpEarned = baseXp + accuracyBonus;

    const gameMeta =
      MINIGAMES_CATALOG.find((g) => g.id === resolvedGameId) ||
      MINIGAMES_CATALOG[0];
    const resolvedTitle = params.gameTitle || gameMeta.title;
    const nowTs = Date.now();

    const matchRecord: MatchRecord = {
      id: "m_" + nowTs + "_" + Math.random().toString(36).slice(2, 6),
      ...(cleanRoundKey ? { roundKey: cleanRoundKey } : {}),
      timestamp: nowTs,
      playedAt: nowTs,
      mode: params.mode,
      roomPin: params.roomPin ? String(params.roomPin) : "SOLO",
      minigameId: resolvedGameId,
      minigameTitle: resolvedTitle,
      gameTitle: resolvedTitle,
      score: Math.max(0, params.score),
      xpEarned: totalXpEarned,
      hits: params.hits,
      misses: params.misses,
      accuracyPct,
      accuracy: accuracyPct,
      maxStreak: params.maxStreak,
    };

    const nextMatches = (profile.totalMatches || 0) + 1;
    const nextHits = (profile.totalHits || 0) + params.hits;
    const nextMisses = (profile.totalMisses || 0) + params.misses;
    const nextBestStreak = Math.max(profile.bestStreak || 0, params.maxStreak);
    const nextPlayedGames = Array.from(
      new Set([...(profile.playedMinigames || []), resolvedGameId])
    ) as MinigameId[];
    const isPerfectRun = params.hits >= 10 && params.misses === 0;
    const nextPerfectMatches =
      (profile.perfectMatches || 0) + (isPerfectRun ? 1 : 0);
    const nextHighScoreMatch = Math.max(
      profile.highScoreMatch || 0,
      Math.max(0, params.score)
    );
    const nextMinigameBestScores: Partial<Record<MinigameId, number>> = {
      ...(profile.minigameBestScores || {}),
      [resolvedGameId]: Math.max(
        profile.minigameBestScores?.[resolvedGameId] || 0,
        Math.max(0, params.score)
      ),
    };

    const unlockedMap: Record<string, number> = {
      ...(profile.achievements || {}),
    };
    const newlyUnlocked: string[] = [];

    const tryUnlock = (achId: string, condition: boolean) => {
      if (condition && !unlockedMap[achId]) {
        unlockedMap[achId] = Date.now();
        newlyUnlocked.push(achId);
        const achDef = ACHIEVEMENTS_CATALOG.find((a) => a.id === achId);
        if (achDef) {
          totalXpEarned += achDef.xpReward;
        }
      }
    };

    // Início & Polivalência
    tryUnlock("first_match", nextMatches >= 1);
    tryUnlock("all_rounder", nextPlayedGames.length >= 5);

    // Precisão & Pontuação em Partida
    tryUnlock("zero_short_circuit", params.hits >= 12 && params.misses === 0);
    tryUnlock("flawless_master_25", params.hits >= 22 && params.misses === 0);
    tryUnlock("perfect_runs_10", nextPerfectMatches >= 10);
    tryUnlock("high_scorer_2500", nextHighScoreMatch >= 1500);
    tryUnlock("high_scorer_3000", nextHighScoreMatch >= 2800);

    // Combos de Alta Frequência
    tryUnlock("combo_5", nextBestStreak >= 10);
    tryUnlock("combo_12", nextBestStreak >= 20);
    tryUnlock("combo_35", nextBestStreak >= 35);
    tryUnlock("combo_60", nextBestStreak >= 60);

    // Especialistas nos 5 Minigames
    tryUnlock(
      "conveyor_specialist",
      (nextMinigameBestScores.conveyor || 0) >= 1100
    );
    tryUnlock(
      "resistor_specialist",
      (nextMinigameBestScores.resistor || 0) >= 950
    );
    tryUnlock("radar_specialist", (nextMinigameBestScores.radar || 0) >= 900);
    tryUnlock("match_specialist", (nextMinigameBestScores.match || 0) >= 900);
    tryUnlock(
      "detective_specialist",
      (nextMinigameBestScores.detective || 0) >= 900
    );

    // Volume de Partidas & Acertos
    tryUnlock("matches_5", nextMatches >= 15);
    tryUnlock("matches_15", nextMatches >= 50);
    tryUnlock("matches_150", nextMatches >= 150);
    tryUnlock("hits_50", nextHits >= 150);
    tryUnlock("hits_200", nextHits >= 750);
    tryUnlock("hits_2500", nextHits >= 2500);

    // Verifica marcos de nível após somar XP preliminar
    let prelimTotalXp = (profile.totalXp || profile.xp || 0) + totalXpEarned;
    let prelimRank = getRankInfoByXp(prelimTotalXp);
    tryUnlock("career_level_25", prelimRank.currentTier.level >= 25);
    prelimTotalXp = (profile.totalXp || profile.xp || 0) + totalXpEarned;
    prelimRank = getRankInfoByXp(prelimTotalXp);
    tryUnlock("career_level_50", prelimRank.currentTier.level >= 50);

    matchRecord.xpEarned = totalXpEarned;
    const newTotalXp = (profile.totalXp || profile.xp || 0) + totalXpEarned;

    const meta = getLocalLeaderboardMeta();
    const prevWeekStats = getProfilePeriodStats(profile, "weekly", meta);
    const prevMonthStats = getProfilePeriodStats(profile, "monthly", meta);

    const updatedProfile: UserProfile = normalizeProfile({
      ...profile,
      xp: newTotalXp,
      totalXp: newTotalXp,
      totalMatches: nextMatches,
      matchesPlayed: nextMatches,
      totalHits: nextHits,
      totalMisses: nextMisses,
      bestStreak: nextBestStreak,
      perfectMatches: nextPerfectMatches,
      highScoreMatch: nextHighScoreMatch,
      minigameBestScores: nextMinigameBestScores,
      playedMinigames: nextPlayedGames,
      achievements: unlockedMap,
      unlockedAchievements: Object.keys(unlockedMap),
      recentMatches: [matchRecord, ...(profile.recentMatches || [])].slice(
        0,
        30
      ),
      weekKey: getCurrentWeekKey(nowTs),
      weeklyXp: prevWeekStats.xp + totalXpEarned,
      weeklyMatches: prevWeekStats.matches + 1,
      weeklyHits: prevWeekStats.hits + params.hits,
      weeklyMisses: prevWeekStats.misses + params.misses,
      weeklyBestStreak: Math.max(prevWeekStats.bestStreak, params.maxStreak),
      monthKey: getCurrentMonthKey(nowTs),
      monthlyXp: prevMonthStats.xp + totalXpEarned,
      monthlyMatches: prevMonthStats.matches + 1,
      monthlyHits: prevMonthStats.hits + params.hits,
      monthlyMisses: prevMonthStats.misses + params.misses,
      monthlyBestStreak: Math.max(prevMonthStats.bestStreak, params.maxStreak),
      periodUpdatedAt: nowTs,
      updatedAt: nowTs,
    });

    const saved = await saveUserProfile(updatedProfile);

    return {
      profile: saved,
      xpEarned: totalXpEarned,
      newlyUnlockedAchievements: newlyUnlocked,
    };
  } catch (err) {
    console.error("Erro ao registrar partida e atualizar XP:", err);
    return { profile: null, xpEarned: 0, newlyUnlockedAchievements: [] };
  } finally {
    if (cleanRoundKey) {
      inFlightRoundKeys.delete(cleanRoundKey);
    }
  }
}

export function verifyAdminPin(inputPin: string): boolean {
  return inputPin.trim() === ADMIN_FIXED_PIN;
}

export async function adminTriggerPeriodReset(): Promise<LeaderboardMeta> {
  const currentMeta = getLocalLeaderboardMeta();
  const now = Date.now();
  const nextMeta: LeaderboardMeta = {
    periodResetAt: now,
    seasonNumber: (currentMeta.seasonNumber || 1) + 1,
    updatedAt: now,
  };

  saveLocalLeaderboardMeta(nextMeta, true);

  if (isFirebaseConfigured && db) {
    try {
      await safeFirebaseCall(
        () => set(ref(db!, LEADERBOARD_META_DB_PATH), sanitizeForFirebase(nextMeta)),
        3000
      );
    } catch {
      // Fallback local já salvo
    }
  }

  return nextMeta;
}

export async function adminAdjustUserXp(
  uid: string,
  options: {
    deltaXp?: number;
    setExactXp?: number;
    target: "both" | "weekly" | "total";
  }
): Promise<UserProfile | null> {
  const profile = await getOrLoadUserProfile(uid);
  if (!profile) return null;

  const now = Date.now();
  const meta = getLocalLeaderboardMeta();
  const curWeekStats = getProfilePeriodStats(profile, "weekly", meta);
  const curMonthStats = getProfilePeriodStats(profile, "monthly", meta);

  let nextTotalXp = profile.totalXp || 0;
  let nextWeeklyXp = curWeekStats.xp;
  let nextMonthlyXp = curMonthStats.xp;

  if (options.setExactXp !== undefined) {
    const exact = Math.max(0, Math.round(options.setExactXp));
    if (options.target === "weekly") {
      nextWeeklyXp = Math.min(nextTotalXp, exact);
    } else if (options.target === "total") {
      nextTotalXp = exact;
      nextWeeklyXp = Math.min(nextTotalXp, nextWeeklyXp);
      nextMonthlyXp = Math.min(nextTotalXp, nextMonthlyXp);
    } else {
      nextTotalXp = exact;
      nextWeeklyXp = exact;
      nextMonthlyXp = exact;
    }
  } else if (options.deltaXp !== undefined) {
    const delta = Math.round(options.deltaXp);
    if (options.target === "weekly") {
      nextWeeklyXp = Math.max(0, Math.min(nextTotalXp, nextWeeklyXp + delta));
    } else if (options.target === "total") {
      nextTotalXp = Math.max(0, nextTotalXp + delta);
      nextWeeklyXp = Math.min(nextTotalXp, nextWeeklyXp);
      nextMonthlyXp = Math.min(nextTotalXp, nextMonthlyXp);
    } else {
      nextTotalXp = Math.max(0, nextTotalXp + delta);
      nextWeeklyXp = Math.max(0, Math.min(nextTotalXp, nextWeeklyXp + delta));
      nextMonthlyXp = Math.max(0, Math.min(nextTotalXp, nextMonthlyXp + delta));
    }
  }

  // Se zerou o XP total, zera também as conquistas de carreira incompatíveis e estatísticas se for 0
  const isFullZero = nextTotalXp === 0 && options.target !== "weekly";

  const updated = normalizeProfile({
    ...profile,
    xp: nextTotalXp,
    totalXp: nextTotalXp,
    ...(isFullZero
      ? {
          totalMatches: 0,
          matchesPlayed: 0,
          totalHits: 0,
          totalMisses: 0,
          bestStreak: 0,
          perfectMatches: 0,
          highScoreMatch: 0,
          minigameBestScores: {},
          playedMinigames: [],
          achievements: {},
          unlockedAchievements: [],
          recentMatches: [],
          weeklyMatches: 0,
          weeklyHits: 0,
          weeklyMisses: 0,
          weeklyBestStreak: 0,
          monthlyMatches: 0,
          monthlyHits: 0,
          monthlyMisses: 0,
          monthlyBestStreak: 0,
        }
      : {}),
    weekKey: getCurrentWeekKey(now),
    weeklyXp: nextWeeklyXp,
    monthKey: getCurrentMonthKey(now),
    monthlyXp: nextMonthlyXp,
    periodUpdatedAt: now,
    adminOverrideAt: now,
    updatedAt: now,
  });

  const cleanData = sanitizeForFirebase(updated);
  const localMap = getLocalUsersMap();
  localMap[uid] = cleanData;
  saveLocalUsersMap(localMap, true);

  await writeRemoteProfileToFirebase(cleanData);
  return cleanData;
}

export async function adminDeleteUserProfile(uid: string): Promise<void> {
  if (typeof window !== "undefined") {
    const localMap = getLocalUsersMap();
    if (localMap[uid]) {
      delete localMap[uid];
      saveLocalUsersMap(localMap, true);
    }
  }

  if (isFirebaseConfigured && db) {
    await Promise.allSettled([
      safeFirebaseCall(
        () => remove(ref(db!, `${GLOBAL_PROFILES_DB_PATH}/${uid}`)),
        3000
      ),
      safeFirebaseCall(() => remove(ref(db!, `users/${uid}`)), 3000),
    ]);
  }
}

export function subscribeToLeaderboardMeta(
  callback: (meta: LeaderboardMeta) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const emitLocal = () => {
    callback(getLocalLeaderboardMeta());
  };

  emitLocal();

  if (isFirebaseConfigured && db) {
    try {
      const metaRef = ref(db, LEADERBOARD_META_DB_PATH);
      const listener = onValue(
        metaRef,
        (snap) => {
          if (snap.exists()) {
            const val = snap.val() as Partial<LeaderboardMeta>;
            const remoteMeta: LeaderboardMeta = {
              periodResetAt: Number(val.periodResetAt || 0),
              seasonNumber: Math.max(1, Number(val.seasonNumber || 1)),
              updatedAt: Number(val.updatedAt || 0),
            };
            const localMeta = getLocalLeaderboardMeta();
            if (remoteMeta.updatedAt >= localMeta.updatedAt) {
              saveLocalLeaderboardMeta(remoteMeta, false);
              callback(remoteMeta);
            } else {
              callback(localMeta);
            }
          } else {
            emitLocal();
          }
        },
        () => {
          emitLocal();
        }
      );

      window.addEventListener(PROFILE_EVENT_NAME, emitLocal);
      return () => {
        off(metaRef, "value", listener);
        window.removeEventListener(PROFILE_EVENT_NAME, emitLocal);
      };
    } catch {
      // Fallback local
    }
  }

  window.addEventListener(PROFILE_EVENT_NAME, emitLocal);
  window.addEventListener("storage", emitLocal);
  return () => {
    window.removeEventListener(PROFILE_EVENT_NAME, emitLocal);
    window.removeEventListener("storage", emitLocal);
  };
}

export function subscribeToGlobalLeaderboard(
  callback: (profiles: UserProfile[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let remoteMirrorMap: Record<string, UserProfile> = {};
  let remoteUsersMap: Record<string, UserProfile> = {};

  const emitCombined = () => {
    const localMap = getLocalUsersMap();
    const combined: Record<string, UserProfile> = { ...localMap };

    const mergeSource = (source: Record<string, UserProfile>) => {
      for (const [k, v] of Object.entries(source)) {
        if (!v || k.startsWith("seed_") || v.uid?.startsWith("seed_")) {
          continue;
        }
        const norm = normalizeProfile({ ...v, uid: k });
        combined[k] = combined[k]
          ? pickPreferredProfile(combined[k], norm)
          : norm;
      }
    };

    mergeSource(remoteMirrorMap);
    mergeSource(remoteUsersMap);

    callback(Object.values(combined));
  };

  emitCombined();

  if (isFirebaseConfigured && db) {
    try {
      const mirrorRef = ref(db, GLOBAL_PROFILES_DB_PATH);
      const usersRef = ref(db, "users");

      const mirrorListener = onValue(
        mirrorRef,
        (snap) => {
          remoteMirrorMap = snap.exists()
            ? (snap.val() as Record<string, UserProfile>)
            : {};
          emitCombined();
        },
        () => {
          emitCombined();
        }
      );

      const usersListener = onValue(
        usersRef,
        (snap) => {
          remoteUsersMap = snap.exists()
            ? (snap.val() as Record<string, UserProfile>)
            : {};
          emitCombined();
        },
        () => {
          emitCombined();
        }
      );

      window.addEventListener(PROFILE_EVENT_NAME, emitCombined);
      return () => {
        off(mirrorRef, "value", mirrorListener);
        off(usersRef, "value", usersListener);
        window.removeEventListener(PROFILE_EVENT_NAME, emitCombined);
      };
    } catch {
      // Fallback para local
    }
  }

  window.addEventListener(PROFILE_EVENT_NAME, emitCombined);
  window.addEventListener("storage", emitCombined);
  return () => {
    window.removeEventListener(PROFILE_EVENT_NAME, emitCombined);
    window.removeEventListener("storage", emitCombined);
  };
}
