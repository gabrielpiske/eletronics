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
  MAX_PLATFORM_XP,
  MatchRecord,
  getRankInfoByXp,
} from "@/data/achievementsData";
import { MINIGAMES_CATALOG, MinigameId } from "@/data/electronicsData";

export type LeaderboardPeriod = "weekly" | "monthly" | "all";

export interface LeaderboardMeta {
  periodResetAt: number;
  seasonNumber: number;
  updatedAt: number;
  /**
   * Mapa de revogação/tombstone (uid ou email normalizado -> timestamp da exclusão ou reset admin).
   * Impede que um perfil deletado ou zerado no Firebase "ressuscite" a partir do localStorage do navegador do aluno.
   */
  purgedUsers?: Record<string, number>;
}

/**
 * Limites físicos e de sanidade da plataforma (Nível 100 = 1.000.000 XP).
 * Qualquer perfil legado que exceda estes tetos (ex.: bug antigo de autoclick com >100M XP ou >26.000 partidas)
 * é automaticamente detectado como corrompido e sanitizado.
 */
export const MAX_SANE_TOTAL_XP = MAX_PLATFORM_XP * 2; // 2.000.000 XP (dobro do Nível 100)
export const MAX_SANE_MATCHES_PLAYED = 4000;
export const MAX_SANE_TOTAL_HITS = 80000;
export const MAX_SANE_SINGLE_MATCH_SCORE = 25000;
export const MAX_SANE_SINGLE_MATCH_HITS = 250;
export const MAX_SANE_SINGLE_MATCH_XP = 18000;

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
  googlePhotoURL?: string;
  avatar: string;
  avatarMode?: "photo" | "emoji";
  classGroup?: string;
  profileUpdatedAt?: number;
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
  currentGlobalStreak?: number;
  perfectMatches?: number;
  consecutivePerfectMatches?: number;
  bestConsecutivePerfectMatches?: number;
  bestFlawlessHits?: number;
  bestFlawlessScore?: number;
  bestSingleMatchHits?: number;
  comebackMatches?: number;
  roomMatchesPlayed?: number;
  soloMatchesPlayed?: number;
  highScoreMatch?: number;
  minigameBestScores?: Partial<Record<MinigameId, number>>;
  minigameMatches?: Partial<Record<MinigameId, number>>;
  minigamePerfectMatches?: Partial<Record<MinigameId, number>>;
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

export interface AchievementRevalidationReport {
  profile: UserProfile;
  newlyUnlockedIds: string[];
  revokedIds: string[];
  xpAdded: number;
  totalValidated: number;
  totalUnlocked: number;
}

export const ALL_MINIGAME_IDS: MinigameId[] = [
  "conveyor",
  "radar",
  "resistor",
  "match",
  "detective",
  "industrial_repair",
];

const VALID_ACHIEVEMENT_ID_SET = new Set(
  ACHIEVEMENTS_CATALOG.map((a) => a.id)
);

export function isPerfectMatchRun(
  minigameId: MinigameId,
  hits: number,
  misses: number
): boolean {
  if (misses !== 0) return false;
  if (minigameId === "industrial_repair") return hits >= 6;
  return hits >= 10;
}

export function isComebackMatchRun(
  score: number,
  hits: number,
  misses: number
): boolean {
  const total = hits + misses;
  if (total <= 0 || misses < 2 || score < 1200) return false;
  const acc = Math.round((hits / total) * 100);
  return acc >= 85;
}

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
    return { periodResetAt: 0, seasonNumber: 1, updatedAt: 0, purgedUsers: {} };
  }
  try {
    const raw = localStorage.getItem(LOCAL_LEADERBOARD_META_KEY);
    if (!raw) {
      return { periodResetAt: 0, seasonNumber: 1, updatedAt: 0, purgedUsers: {} };
    }
    const parsed = JSON.parse(raw) as Partial<LeaderboardMeta>;
    const rawPurged =
      parsed.purgedUsers && typeof parsed.purgedUsers === "object"
        ? parsed.purgedUsers
        : {};
    const cleanPurged: Record<string, number> = {};
    for (const [k, v] of Object.entries(rawPurged)) {
      const ts = Number(v || 0);
      if (k && ts > 0) {
        cleanPurged[k] = ts;
      }
    }
    return {
      periodResetAt: Number(parsed.periodResetAt || 0),
      seasonNumber: Math.max(1, Number(parsed.seasonNumber || 1)),
      updatedAt: Number(parsed.updatedAt || 0),
      purgedUsers: cleanPurged,
    };
  } catch {
    return { periodResetAt: 0, seasonNumber: 1, updatedAt: 0, purgedUsers: {} };
  }
}

export function normalizePurgeKey(rawKey: string): string {
  return String(rawKey || "")
    .trim()
    .toLowerCase()
    .replace(/[.#$/[\]\s]/g, "_");
}

export function getPurgeTimestampForProfile(
  uid: string,
  email?: string,
  meta?: LeaderboardMeta | null
): number {
  const activeMeta = meta || getLocalLeaderboardMeta();
  const map = activeMeta.purgedUsers || {};
  let maxTs = 0;
  if (uid) {
    maxTs = Math.max(maxTs, Number(map[uid] || 0), Number(map[normalizePurgeKey(uid)] || 0));
  }
  if (email && email.trim()) {
    const emailKey = `email_${normalizePurgeKey(email)}`;
    maxTs = Math.max(maxTs, Number(map[emailKey] || 0));
  }
  return maxTs;
}

/**
 * Detecta se um perfil possui valores impossíveis gerados pelo antigo bug de XP / autoclick
 * (ex.: >100 milhões de XP ou >26.000 partidas).
 */
export function isCorruptedLegacyProfile(
  raw: Partial<UserProfile> | null | undefined
): boolean {
  if (!raw) return false;
  const xpVal = Number(raw.totalXp ?? raw.xp ?? 0) || 0;
  const matchesVal = Number(raw.matchesPlayed ?? raw.totalMatches ?? 0) || 0;
  const hitsVal = Number(raw.totalHits || 0) || 0;
  const bestStreakVal = Number(raw.bestStreak || 0) || 0;
  const highScoreVal = Number(raw.highScoreMatch || 0) || 0;

  if (
    xpVal > MAX_SANE_TOTAL_XP ||
    matchesVal > MAX_SANE_MATCHES_PLAYED ||
    hitsVal > MAX_SANE_TOTAL_HITS ||
    bestStreakVal > MAX_SANE_TOTAL_HITS ||
    highScoreVal > MAX_SANE_SINGLE_MATCH_SCORE * 4
  ) {
    return true;
  }
  return false;
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
  rawInput: Partial<UserProfile> & { uid: string }
): UserProfile {
  let raw = rawInput;

  // Se o perfil veio corrompido pelo antigo bug de XP / autoclick (>2M XP ou >4.000 partidas),
  // zera todas as métricas corrompidas preservando apenas a identidade (nome, email, foto, turma)
  if (isCorruptedLegacyProfile(rawInput)) {
    const nowTs = Date.now();
    raw = {
      uid: rawInput.uid,
      displayName: rawInput.displayName,
      email: rawInput.email,
      photoURL: rawInput.photoURL,
      googlePhotoURL: rawInput.googlePhotoURL,
      avatar: rawInput.avatar,
      avatarMode: rawInput.avatarMode,
      classGroup: rawInput.classGroup,
      profileUpdatedAt: rawInput.profileUpdatedAt,
      authProvider: rawInput.authProvider,
      xp: 0,
      totalXp: 0,
      totalMatches: 0,
      matchesPlayed: 0,
      totalHits: 0,
      totalMisses: 0,
      bestStreak: 0,
      currentGlobalStreak: 0,
      perfectMatches: 0,
      consecutivePerfectMatches: 0,
      bestConsecutivePerfectMatches: 0,
      bestFlawlessHits: 0,
      bestFlawlessScore: 0,
      bestSingleMatchHits: 0,
      comebackMatches: 0,
      roomMatchesPlayed: 0,
      soloMatchesPlayed: 0,
      highScoreMatch: 0,
      minigameBestScores: {},
      minigameMatches: {},
      minigamePerfectMatches: {},
      playedMinigames: [],
      achievements: {},
      unlockedAchievements: [],
      recentMatches: [],
      weekKey: getCurrentWeekKey(nowTs),
      weeklyXp: 0,
      weeklyMatches: 0,
      weeklyHits: 0,
      weeklyMisses: 0,
      weeklyBestStreak: 0,
      monthKey: getCurrentMonthKey(nowTs),
      monthlyXp: 0,
      monthlyMatches: 0,
      monthlyHits: 0,
      monthlyMisses: 0,
      monthlyBestStreak: 0,
      periodUpdatedAt: nowTs,
      adminOverrideAt: Math.max(Number(rawInput.adminOverrideAt || 0), nowTs),
      updatedAt: nowTs,
    };
  }

  const xpVal = Math.min(
    MAX_SANE_TOTAL_XP,
    Math.max(0, Number(raw.totalXp ?? raw.xp ?? 0) || 0)
  );
  const rank = getRankInfoByXp(xpVal);
  const matchesVal = Math.min(
    MAX_SANE_MATCHES_PLAYED,
    Math.max(0, Number(raw.matchesPlayed ?? raw.totalMatches ?? 0) || 0)
  );
  const totalHitsVal = Math.min(
    MAX_SANE_TOTAL_HITS,
    Math.max(0, Number(raw.totalHits || 0) || 0)
  );
  const totalMissesVal = Math.min(
    MAX_SANE_TOTAL_HITS,
    Math.max(0, Number(raw.totalMisses || 0) || 0)
  );

  const rawAchMap =
    raw.achievements && typeof raw.achievements === "object"
      ? raw.achievements
      : {};
  const rawUnlockedArr =
    Array.isArray(raw.unlockedAchievements) &&
    raw.unlockedAchievements.length > 0
      ? raw.unlockedAchievements
      : Object.keys(rawAchMap);

  const achMap: Record<string, number> = {};
  for (const id of rawUnlockedArr) {
    if (VALID_ACHIEVEMENT_ID_SET.has(id)) {
      achMap[id] = Number(rawAchMap[id] || raw.updatedAt || Date.now());
    }
  }
  for (const [id, ts] of Object.entries(rawAchMap)) {
    if (VALID_ACHIEVEMENT_ID_SET.has(id) && !achMap[id]) {
      achMap[id] = Number(ts || raw.updatedAt || Date.now());
    }
  }
  const unlockedList = Object.keys(achMap);

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

  const playedGamesSet = new Set<MinigameId>(
    rawPlayedGames.filter((id): id is MinigameId =>
      ALL_MINIGAME_IDS.includes(id as MinigameId)
    )
  );

  // Deriva recordes e métricas detalhadas do histórico caso ainda não estejam gravados
  const derivedBestByGame: Partial<Record<MinigameId, number>> = {
    ...(raw.minigameBestScores && typeof raw.minigameBestScores === "object"
      ? raw.minigameBestScores
      : {}),
  };
  const storedMatchesByGame: Partial<Record<MinigameId, number>> =
    raw.minigameMatches && typeof raw.minigameMatches === "object"
      ? raw.minigameMatches
      : {};
  const storedPerfectByGame: Partial<Record<MinigameId, number>> =
    raw.minigamePerfectMatches && typeof raw.minigamePerfectMatches === "object"
      ? raw.minigamePerfectMatches
      : {};

  const historyMatchesByGame: Partial<Record<MinigameId, number>> = {};
  const historyPerfectByGame: Partial<Record<MinigameId, number>> = {};

  let derivedHighScore = Math.max(0, Number(raw.highScoreMatch || 0));
  let derivedPerfectMatches = Math.max(0, Number(raw.perfectMatches || 0));
  let derivedBestFlawlessHits = Math.max(0, Number(raw.bestFlawlessHits || 0));
  let derivedBestFlawlessScore = Math.max(0, Number(raw.bestFlawlessScore || 0));
  let derivedBestSingleMatchHits = Math.max(
    0,
    Number(raw.bestSingleMatchHits || 0)
  );
  let derivedComebackMatches = Math.max(0, Number(raw.comebackMatches || 0));
  let derivedRoomMatches = Math.max(0, Number(raw.roomMatchesPlayed || 0));
  let derivedSoloMatches = Math.max(0, Number(raw.soloMatchesPlayed || 0));
  let derivedConsecutivePerfect = Math.max(
    0,
    Number(raw.consecutivePerfectMatches || 0)
  );
  let derivedBestConsecutivePerfect = Math.max(
    0,
    Number(raw.bestConsecutivePerfectMatches || 0),
    derivedConsecutivePerfect
  );
  let derivedBestStreak = Math.max(0, Number(raw.bestStreak || 0));

  if (normalizedMatches.length > 0) {
    let historyPerfectCount = 0;
    let historyComebackCount = 0;
    let historyRoomCount = 0;
    let historySoloCount = 0;
    let runningPerfectStreak = 0;
    let maxHistoryPerfectStreak = 0;

    const chronological = [...normalizedMatches].reverse();
    for (const m of chronological) {
      playedGamesSet.add(m.minigameId);
      historyMatchesByGame[m.minigameId] =
        (historyMatchesByGame[m.minigameId] || 0) + 1;

      if (m.mode === "room") {
        historyRoomCount++;
      } else {
        historySoloCount++;
      }

      if (m.score > derivedHighScore) {
        derivedHighScore = m.score;
      }
      if (m.hits > derivedBestSingleMatchHits) {
        derivedBestSingleMatchHits = m.hits;
      }
      if (m.maxStreak > derivedBestStreak) {
        derivedBestStreak = m.maxStreak;
      }

      const prevGameBest = derivedBestByGame[m.minigameId] || 0;
      if (m.score > prevGameBest) {
        derivedBestByGame[m.minigameId] = m.score;
      }

      if (m.misses === 0) {
        if (m.hits > derivedBestFlawlessHits) {
          derivedBestFlawlessHits = m.hits;
        }
        if (m.score > derivedBestFlawlessScore) {
          derivedBestFlawlessScore = m.score;
        }
      }

      if (isPerfectMatchRun(m.minigameId, m.hits, m.misses)) {
        historyPerfectCount++;
        runningPerfectStreak++;
        if (runningPerfectStreak > maxHistoryPerfectStreak) {
          maxHistoryPerfectStreak = runningPerfectStreak;
        }
        historyPerfectByGame[m.minigameId] =
          (historyPerfectByGame[m.minigameId] || 0) + 1;
      } else {
        runningPerfectStreak = 0;
      }

      if (isComebackMatchRun(m.score, m.hits, m.misses)) {
        historyComebackCount++;
      }
    }

    derivedPerfectMatches = Math.max(derivedPerfectMatches, historyPerfectCount);
    derivedComebackMatches = Math.max(
      derivedComebackMatches,
      historyComebackCount
    );
    derivedRoomMatches = Math.max(derivedRoomMatches, historyRoomCount);
    derivedSoloMatches = Math.max(derivedSoloMatches, historySoloCount);
    if (raw.consecutivePerfectMatches === undefined) {
      derivedConsecutivePerfect = runningPerfectStreak;
    }
    derivedBestConsecutivePerfect = Math.max(
      derivedBestConsecutivePerfect,
      maxHistoryPerfectStreak,
      derivedConsecutivePerfect
    );
  }

  // Preserva compatibilidade retroativa para perfis que já conquistaram 12 ou 22 acertos s/ erro antes da persistência dedicada
  if (raw.bestFlawlessHits === undefined) {
    if (achMap["flawless_master_25"] && totalHitsVal >= 22) {
      derivedBestFlawlessHits = Math.max(derivedBestFlawlessHits, 22);
    } else if (achMap["zero_short_circuit"] && totalHitsVal >= 12) {
      derivedBestFlawlessHits = Math.max(derivedBestFlawlessHits, 12);
    }
  }
  derivedBestSingleMatchHits = Math.max(
    derivedBestSingleMatchHits,
    derivedBestFlawlessHits
  );

  const derivedMatchesByGame: Partial<Record<MinigameId, number>> = {};
  const derivedPerfectByGame: Partial<Record<MinigameId, number>> = {};

  for (const gId of ALL_MINIGAME_IDS) {
    const mCount = Math.max(
      Number(storedMatchesByGame[gId] || 0),
      Number(historyMatchesByGame[gId] || 0),
      playedGamesSet.has(gId) || (derivedBestByGame[gId] || 0) > 0 ? 1 : 0
    );
    if (mCount > 0) {
      derivedMatchesByGame[gId] = mCount;
      playedGamesSet.add(gId);
    }
    const pCount = Math.max(
      Number(storedPerfectByGame[gId] || 0),
      Number(historyPerfectByGame[gId] || 0)
    );
    if (pCount > 0) {
      derivedPerfectByGame[gId] = pCount;
    }
  }

  return {
    uid: String(raw.uid),
    displayName: String(raw.displayName || "Estudante SENAI"),
    email: String(raw.email || ""),
    photoURL: String(raw.photoURL || ""),
    ...(raw.googlePhotoURL
      ? { googlePhotoURL: String(raw.googlePhotoURL) }
      : {}),
    avatar: String(raw.avatar || "⚡"),
    avatarMode:
      raw.avatarMode === "photo"
        ? "photo"
        : raw.avatarMode === "emoji"
        ? "emoji"
        : raw.photoURL
        ? "photo"
        : "emoji",
    ...(raw.classGroup !== undefined && String(raw.classGroup).trim()
      ? { classGroup: String(raw.classGroup).trim().slice(0, 36) }
      : {}),
    ...(raw.profileUpdatedAt !== undefined
      ? { profileUpdatedAt: Number(raw.profileUpdatedAt) || 0 }
      : {}),
    authProvider: raw.authProvider === "local" ? "local" : "google",
    xp: xpVal,
    totalXp: xpVal,
    level: rank.currentTier.level,
    rankTitle: rank.currentTier.title,
    patentCode: rank.currentTier.patentCode,
    totalMatches: matchesVal,
    matchesPlayed: matchesVal,
    totalHits: totalHitsVal,
    totalMisses: totalMissesVal,
    bestStreak: derivedBestStreak,
    currentGlobalStreak: Math.max(0, Number(raw.currentGlobalStreak || 0)),
    perfectMatches: derivedPerfectMatches,
    consecutivePerfectMatches: derivedConsecutivePerfect,
    bestConsecutivePerfectMatches: derivedBestConsecutivePerfect,
    bestFlawlessHits: derivedBestFlawlessHits,
    bestFlawlessScore: derivedBestFlawlessScore,
    bestSingleMatchHits: derivedBestSingleMatchHits,
    comebackMatches: derivedComebackMatches,
    roomMatchesPlayed: derivedRoomMatches,
    soloMatchesPlayed: derivedSoloMatches,
    highScoreMatch: derivedHighScore,
    minigameBestScores: derivedBestByGame,
    minigameMatches: derivedMatchesByGame,
    minigamePerfectMatches: derivedPerfectByGame,
    playedMinigames: Array.from(playedGamesSet),
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

export function getEffectiveAvatarString(
  profile: Pick<UserProfile, "avatar" | "photoURL" | "avatarMode">
): string {
  const hasPhoto = Boolean(profile.photoURL && profile.photoURL.trim());
  if (profile.avatarMode === "emoji") {
    return profile.avatar || "⚡";
  }
  if (hasPhoto && (profile.avatarMode === "photo" || !profile.avatarMode)) {
    return profile.photoURL.trim();
  }
  return profile.avatar || "⚡";
}

function pickPreferredProfile(a: UserProfile, b: UserProfile): UserProfile {
  const aAdmin = a.adminOverrideAt || 0;
  const bAdmin = b.adminOverrideAt || 0;
  let base: UserProfile;
  if (aAdmin !== bAdmin) {
    base = aAdmin > bAdmin ? a : b;
  } else if (a.totalXp !== b.totalXp) {
    base = a.totalXp > b.totalXp ? a : b;
  } else {
    base = (a.updatedAt || 0) >= (b.updatedAt || 0) ? a : b;
  }

  // Preserva as edições manuais mais recentes de identidade (nome, foto, emoji, turma)
  const aProfTs = a.profileUpdatedAt || 0;
  const bProfTs = b.profileUpdatedAt || 0;
  if (aProfTs !== bProfTs) {
    const newerIdentity = aProfTs > bProfTs ? a : b;
    if (newerIdentity !== base) {
      return normalizeProfile({
        ...base,
        displayName: newerIdentity.displayName,
        email: newerIdentity.email || base.email,
        photoURL: newerIdentity.photoURL,
        googlePhotoURL: newerIdentity.googlePhotoURL || base.googlePhotoURL,
        avatar: newerIdentity.avatar,
        avatarMode: newerIdentity.avatarMode,
        classGroup: newerIdentity.classGroup,
        profileUpdatedAt: newerIdentity.profileUpdatedAt,
        updatedAt: Math.max(base.updatedAt || 0, newerIdentity.updatedAt || 0),
      });
    }
  }
  return base;
}

/**
 * Fonte única de verdade para calcular o valor atual de progresso de cada uma das 58 conquistas.
 * Uma conquista é válida/desbloqueável se e somente se computeAchievementRawProgress(ach.id, profile) >= ach.targetValue.
 */
export function computeAchievementRawProgress(
  achId: string,
  profile: UserProfile
): number {
  const bestByGame = profile.minigameBestScores || {};
  const matchesByGame = profile.minigameMatches || {};
  const perfectByGame = profile.minigamePerfectMatches || {};
  const bestFlawlessFromRecent = (profile.recentMatches || []).reduce(
    (maxH, m) => (m.misses === 0 && m.hits > maxH ? m.hits : maxH),
    0
  );
  const bestFlawlessScoreFromRecent = (profile.recentMatches || []).reduce(
    (maxS, m) => (m.misses === 0 && m.score > maxS ? m.score : maxS),
    0
  );
  const bestSingleHitsFromRecent = (profile.recentMatches || []).reduce(
    (maxH, m) => (m.hits > maxH ? m.hits : maxH),
    0
  );

  const effectiveBestFlawlessHits = Math.max(
    profile.bestFlawlessHits || 0,
    bestFlawlessFromRecent
  );
  const effectiveBestFlawlessScore = Math.max(
    profile.bestFlawlessScore || 0,
    bestFlawlessScoreFromRecent
  );
  const effectiveBestSingleMatchHits = Math.max(
    profile.bestSingleMatchHits || 0,
    bestSingleHitsFromRecent,
    effectiveBestFlawlessHits
  );

  switch (achId) {
    // 1. Início & Polivalência
    case "first_match":
      return profile.matchesPlayed || 0;
    case "first_room_match":
      return profile.roomMatchesPlayed || 0;
    case "first_perfect_run":
      return profile.perfectMatches || 0;
    case "all_rounder":
      return (profile.playedMinigames || []).length;
    case "hex_veteran_5":
      return ALL_MINIGAME_IDS.filter((id) => (matchesByGame[id] || 0) >= 5)
        .length;

    // 2. Precisão & Imunidade a Curto
    case "zero_short_circuit":
    case "flawless_master_25":
    case "flawless_master_40":
    case "flawless_master_60":
      return effectiveBestFlawlessHits;
    case "perfect_runs_10":
    case "perfect_runs_35":
    case "perfect_runs_100":
      return profile.perfectMatches || 0;
    case "consecutive_perfect_3":
    case "consecutive_perfect_7":
    case "consecutive_perfect_15":
      return Math.max(
        profile.bestConsecutivePerfectMatches || 0,
        profile.consecutivePerfectMatches || 0
      );

    // 3. Combos de Alta Frequência
    case "combo_5":
    case "combo_12":
    case "combo_35":
    case "combo_60":
    case "combo_100":
    case "combo_175":
    case "combo_250":
      return Math.max(
        profile.bestStreak || 0,
        profile.currentGlobalStreak || 0
      );

    // 4. Especialistas & Grão-Mestres nas 6 Bancadas
    case "conveyor_specialist":
    case "conveyor_grandmaster":
      return bestByGame.conveyor || 0;
    case "resistor_specialist":
    case "resistor_grandmaster":
      return bestByGame.resistor || 0;
    case "radar_specialist":
    case "radar_grandmaster":
      return bestByGame.radar || 0;
    case "match_specialist":
    case "match_grandmaster":
      return bestByGame.match || 0;
    case "detective_specialist":
    case "detective_grandmaster":
      return bestByGame.detective || 0;
    case "industrial_specialist":
    case "industrial_grandmaster":
      return bestByGame.industrial_repair || 0;

    // 5. Manobras Inovadoras & Engenharia Extrema
    case "high_scorer_2500":
    case "high_scorer_3000":
    case "high_scorer_4500":
      return profile.highScoreMatch || 0;
    case "flawless_high_1800":
      return effectiveBestFlawlessScore;
    case "comeback_specialist":
      return profile.comebackMatches || 0;
    case "speed_demon_45":
      return effectiveBestSingleMatchHits;
    case "flawless_all_6_modules":
      return ALL_MINIGAME_IDS.filter((id) => (perfectByGame[id] || 0) >= 1)
        .length;
    case "master_all_6_1000":
      return ALL_MINIGAME_IDS.filter((id) => (bestByGame[id] || 0) >= 1000)
        .length;
    case "grandmaster_all_6_1800":
      return ALL_MINIGAME_IDS.filter((id) => (bestByGame[id] || 0) >= 1800)
        .length;
    case "elite_accuracy_career": {
      const hits = profile.totalHits || 0;
      const misses = profile.totalMisses || 0;
      const totalAtt = hits + misses;
      if (totalAtt <= 0) return 0;
      const accPct = (hits / totalAtt) * 100;
      if (accPct >= 95) {
        return hits;
      }
      // Se a precisão atual estiver abaixo de 95%, limita o progresso a no máximo 999 para exigir >=95%
      return Math.min(999, Math.floor(hits * (accPct / 95)));
    }

    // 6. Volume de Produção & Consistência
    case "matches_5":
    case "matches_15":
    case "matches_150":
    case "matches_350":
      return profile.matchesPlayed || 0;
    case "hits_50":
    case "hits_200":
    case "hits_2500":
    case "hits_7500":
      return profile.totalHits || 0;

    // 7. Marcos de Carreira, Patentes & Coleção
    case "career_level_25":
    case "career_level_50":
    case "career_level_75":
    case "career_level_100":
      return profile.level || 1;
    case "collector_25":
    case "collector_50": {
      const otherUnlockedCount = (profile.unlockedAchievements || []).filter(
        (id) => id !== achId && VALID_ACHIEVEMENT_ID_SET.has(id)
      ).length;
      return otherUnlockedCount;
    }

    default:
      return 0;
  }
}

/**
 * Audita e sincroniza todas as 58 conquistas de um perfil:
 * 1. Revoga conquistas presentes no perfil cujos requisitos atuais não sejam satisfeitos.
 * 2. Desbloqueia conquistas elegíveis em loop multi-pass (cascata de XP -> Nível -> Colecionador).
 */
export function evaluateAndSyncProfileAchievements(
  inputProfile: UserProfile,
  options?: { awardXp?: boolean }
): AchievementRevalidationReport {
  const awardXp = options?.awardXp ?? true;
  let draft = normalizeProfile(inputProfile);
  const unlockedMap: Record<string, number> = { ...(draft.achievements || {}) };
  const newlyUnlockedIds: string[] = [];
  const revokedIds: string[] = [];
  let xpAdded = 0;

  // Passo 1: Valida a validade das conquistas já marcadas como desbloqueadas
  for (const existingId of Object.keys(unlockedMap)) {
    const achDef = ACHIEVEMENTS_CATALOG.find((a) => a.id === existingId);
    if (!achDef) {
      delete unlockedMap[existingId];
      revokedIds.push(existingId);
      continue;
    }
    const rawProg = computeAchievementRawProgress(achDef.id, draft);
    if (rawProg < achDef.targetValue) {
      delete unlockedMap[existingId];
      revokedIds.push(existingId);
    }
  }

  if (revokedIds.length > 0) {
    draft = normalizeProfile({
      ...draft,
      achievements: unlockedMap,
      unlockedAchievements: Object.keys(unlockedMap),
    });
  }

  // Passo 2: Loop multi-pass para desbloquear conquistas elegíveis e propagar XP/Nível/Coleção em cascata
  let passChanged = true;
  let safetyPasses = 0;
  while (passChanged && safetyPasses < 10) {
    passChanged = false;
    safetyPasses++;

    for (const achDef of ACHIEVEMENTS_CATALOG) {
      if (unlockedMap[achDef.id]) continue;
      const rawProg = computeAchievementRawProgress(achDef.id, draft);
      if (rawProg >= achDef.targetValue) {
        unlockedMap[achDef.id] = Date.now();
        newlyUnlockedIds.push(achDef.id);
        passChanged = true;
        if (awardXp) {
          xpAdded += achDef.xpReward;
        }
        const nextTotalXp = draft.totalXp + (awardXp ? achDef.xpReward : 0);
        draft = normalizeProfile({
          ...draft,
          xp: nextTotalXp,
          totalXp: nextTotalXp,
          achievements: unlockedMap,
          unlockedAchievements: Object.keys(unlockedMap),
        });
      }
    }

    // Re-checa se alguma conquista de coleção ficou inválida caso outra tenha sido revogada
    for (const existingId of Object.keys(unlockedMap)) {
      const achDef = ACHIEVEMENTS_CATALOG.find((a) => a.id === existingId);
      if (achDef && computeAchievementRawProgress(achDef.id, draft) < achDef.targetValue) {
        delete unlockedMap[existingId];
        if (!revokedIds.includes(existingId)) {
          revokedIds.push(existingId);
        }
        draft = normalizeProfile({
          ...draft,
          achievements: unlockedMap,
          unlockedAchievements: Object.keys(unlockedMap),
        });
        passChanged = true;
      }
    }
  }

  return {
    profile: draft,
    newlyUnlockedIds,
    revokedIds,
    xpAdded,
    totalValidated: ACHIEVEMENTS_CATALOG.length,
    totalUnlocked: draft.unlockedAchievements.length,
  };
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
  let current = computeAchievementRawProgress(ach.id, profile);

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
  let shouldPersist = false;
  const meta = getLocalLeaderboardMeta();

  if (raw) {
    try {
      const obj = JSON.parse(raw) as Record<string, UserProfile>;
      for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith("seed_") || v?.uid?.startsWith("seed_")) {
          shouldPersist = true;
          continue;
        }
        // Verifica se houve exclusão ou reset remoto mais recente que este perfil salvo localmente
        const purgeTs = getPurgeTimestampForProfile(k, v?.email, meta);
        const localUpdatedTs = Number(v?.updatedAt || 0);
        const localAdminTs = Number(v?.adminOverrideAt || 0);
        if (
          purgeTs > 0 &&
          localUpdatedTs < purgeTs &&
          localAdminTs < purgeTs
        ) {
          shouldPersist = true;
          continue;
        }

        const wasCorrupted = isCorruptedLegacyProfile(v);
        const norm = normalizeProfile({ ...v, uid: k });
        const audit = evaluateAndSyncProfileAchievements(norm, {
          awardXp: !wasCorrupted,
        });
        parsed[k] = audit.profile;
        if (
          wasCorrupted ||
          audit.newlyUnlockedIds.length > 0 ||
          audit.revokedIds.length > 0
        ) {
          shouldPersist = true;
        }
      }
    } catch {
      // ignore
    }
  }

  if (shouldPersist) {
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

interface RemoteFetchResult {
  profile: UserProfile | null;
  checkedServer: boolean;
  wasCorruptedInRemote: boolean;
  meta: LeaderboardMeta;
}

async function fetchRemoteLeaderboardMetaFromFirebase(): Promise<LeaderboardMeta> {
  const localMeta = getLocalLeaderboardMeta();
  if (!isFirebaseConfigured || !db) return localMeta;
  try {
    const snap = await safeFirebaseCall(
      () => get(ref(db!, LEADERBOARD_META_DB_PATH)),
      2200
    );
    if (!snap.exists()) return localMeta;
    const val = snap.val() as Partial<LeaderboardMeta>;
    const rawPurged =
      val.purgedUsers && typeof val.purgedUsers === "object"
        ? val.purgedUsers
        : {};
    const mergedPurged: Record<string, number> = {
      ...(localMeta.purgedUsers || {}),
    };
    for (const [k, v] of Object.entries(rawPurged)) {
      const ts = Number(v || 0);
      if (k && ts > (mergedPurged[k] || 0)) {
        mergedPurged[k] = ts;
      }
    }
    const remoteMeta: LeaderboardMeta = {
      periodResetAt: Math.max(
        Number(val.periodResetAt || 0),
        localMeta.periodResetAt || 0
      ),
      seasonNumber: Math.max(
        1,
        Number(val.seasonNumber || 1),
        localMeta.seasonNumber || 1
      ),
      updatedAt: Math.max(
        Number(val.updatedAt || 0),
        localMeta.updatedAt || 0
      ),
      purgedUsers: mergedPurged,
    };
    saveLocalLeaderboardMeta(remoteMeta, false);
    return remoteMeta;
  } catch {
    return localMeta;
  }
}

async function registerRemoteUserPurge(
  uid: string,
  email?: string,
  purgeTs = Date.now()
): Promise<LeaderboardMeta> {
  const currentMeta = await fetchRemoteLeaderboardMetaFromFirebase();
  const nextPurged: Record<string, number> = {
    ...(currentMeta.purgedUsers || {}),
  };
  if (uid) {
    nextPurged[uid] = purgeTs;
    nextPurged[normalizePurgeKey(uid)] = purgeTs;
  }
  if (email && email.trim()) {
    nextPurged[`email_${normalizePurgeKey(email)}`] = purgeTs;
  }

  const nextMeta: LeaderboardMeta = {
    ...currentMeta,
    updatedAt: Math.max(currentMeta.updatedAt || 0, purgeTs),
    purgedUsers: nextPurged,
  };

  saveLocalLeaderboardMeta(nextMeta, true);

  if (isFirebaseConfigured && db) {
    try {
      await safeFirebaseCall(
        () =>
          set(ref(db!, LEADERBOARD_META_DB_PATH), sanitizeForFirebase(nextMeta)),
        3000
      );
    } catch {
      // Fallback local já salvo
    }
  }

  return nextMeta;
}

async function fetchRemoteProfileWithStatus(
  uid: string
): Promise<RemoteFetchResult> {
  const meta = await fetchRemoteLeaderboardMetaFromFirebase();
  if (!isFirebaseConfigured || !db) {
    return {
      profile: null,
      checkedServer: false,
      wasCorruptedInRemote: false,
      meta,
    };
  }

  // Tenta ler de rooms/global_profiles_v2/users/{uid} e de users/{uid}, respeitando adminOverrideAt
  const results = await Promise.allSettled([
    safeFirebaseCall(
      () => get(ref(db!, `${GLOBAL_PROFILES_DB_PATH}/${uid}`)),
      2500
    ),
    safeFirebaseCall(() => get(ref(db!, `users/${uid}`)), 2500),
  ]);

  let bestProfile: UserProfile | null = null;
  let checkedServer = false;
  let wasCorruptedInRemote = false;

  for (const res of results) {
    if (res.status === "fulfilled") {
      checkedServer = true;
      if (res.value.exists()) {
        const rawVal = res.value.val() as UserProfile;
        if (isCorruptedLegacyProfile(rawVal)) {
          wasCorruptedInRemote = true;
        }
        const candidate = normalizeProfile({
          ...rawVal,
          uid,
        });
        bestProfile = bestProfile
          ? pickPreferredProfile(bestProfile, candidate)
          : candidate;
      }
    }
  }

  return {
    profile: bestProfile,
    checkedServer,
    wasCorruptedInRemote,
    meta,
  };
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
  const {
    profile: remoteProfile,
    checkedServer,
    wasCorruptedInRemote,
    meta,
  } = await fetchRemoteProfileWithStatus(uid);

  const localMap = getLocalUsersMap();
  let localExisting = localMap[uid] ? normalizeProfile(localMap[uid]) : null;

  const purgeTs = getPurgeTimestampForProfile(
    uid,
    localExisting?.email || remoteProfile?.email || defaults?.email,
    meta
  );

  // Se o cache local for anterior a uma exclusão ou reset do Admin, descarta o cache local imediatamente!
  if (localExisting && purgeTs > 0) {
    const localTs = Math.max(
      localExisting.updatedAt || 0,
      localExisting.adminOverrideAt || 0
    );
    if (localTs < purgeTs) {
      delete localMap[uid];
      saveLocalUsersMap(localMap, false);
      localExisting = null;
    }
  }

  if (remoteProfile) {
    let chosenBase = remoteProfile;

    // Se o servidor sofreu reset/override ou se o servidor tem XP menor porque foi zerado no Firebase Console,
    // o servidor SEMPRE prevalece sobre um localStorage antigo com XP acumulado.
    if (localExisting) {
      const remoteAdminTs = remoteProfile.adminOverrideAt || 0;
      const localAdminTs = localExisting.adminOverrideAt || 0;
      if (remoteAdminTs >= localAdminTs && remoteProfile.totalXp < localExisting.totalXp) {
        // O perfil no Firebase foi zerado/reduzido (pelo Console ou pelo Admin): respeita o Firebase!
        chosenBase = pickPreferredProfile(remoteProfile, {
          ...localExisting,
          xp: remoteProfile.totalXp,
          totalXp: remoteProfile.totalXp,
          totalMatches: remoteProfile.totalMatches,
          matchesPlayed: remoteProfile.matchesPlayed,
          totalHits: remoteProfile.totalHits,
          totalMisses: remoteProfile.totalMisses,
          bestStreak: remoteProfile.bestStreak,
          currentGlobalStreak: remoteProfile.currentGlobalStreak,
          perfectMatches: remoteProfile.perfectMatches,
          consecutivePerfectMatches: remoteProfile.consecutivePerfectMatches,
          bestConsecutivePerfectMatches:
            remoteProfile.bestConsecutivePerfectMatches,
          bestFlawlessHits: remoteProfile.bestFlawlessHits,
          bestFlawlessScore: remoteProfile.bestFlawlessScore,
          bestSingleMatchHits: remoteProfile.bestSingleMatchHits,
          comebackMatches: remoteProfile.comebackMatches,
          roomMatchesPlayed: remoteProfile.roomMatchesPlayed,
          soloMatchesPlayed: remoteProfile.soloMatchesPlayed,
          highScoreMatch: remoteProfile.highScoreMatch,
          minigameBestScores: remoteProfile.minigameBestScores,
          minigameMatches: remoteProfile.minigameMatches,
          minigamePerfectMatches: remoteProfile.minigamePerfectMatches,
          playedMinigames: remoteProfile.playedMinigames,
          achievements: remoteProfile.achievements,
          unlockedAchievements: remoteProfile.unlockedAchievements,
          recentMatches: remoteProfile.recentMatches,
          weeklyXp: remoteProfile.weeklyXp,
          weeklyMatches: remoteProfile.weeklyMatches,
          monthlyXp: remoteProfile.monthlyXp,
          monthlyMatches: remoteProfile.monthlyMatches,
          adminOverrideAt: Math.max(remoteAdminTs, localAdminTs, Date.now()),
        });
      } else {
        chosenBase = pickPreferredProfile(localExisting, remoteProfile);
      }
    }

    const audit = evaluateAndSyncProfileAchievements(chosenBase, {
      awardXp: !wasCorruptedInRemote,
    });
    const merged = audit.profile;
    localMap[uid] = merged;
    saveLocalUsersMap(localMap, false);
    if (
      wasCorruptedInRemote ||
      audit.newlyUnlockedIds.length > 0 ||
      audit.revokedIds.length > 0
    ) {
      writeRemoteProfileToFirebase(merged).catch(() => {});
    }
    return merged;
  }

  // O servidor respondeu e o perfil NÃO existe no Firebase (foi deletado no Console ou pelo Admin):
  // Se o localExisting tinha XP/partidas antigas, NÃO permitimos ressuscitar esse progresso deletado!
  if (checkedServer && localExisting && (localExisting.totalXp > 0 || localExisting.matchesPlayed > 0 || purgeTs > 0)) {
    delete localMap[uid];
    saveLocalUsersMap(localMap, false);
    localExisting = null;
  }

  if (localExisting) {
    const audit = evaluateAndSyncProfileAchievements(localExisting, {
      awardXp: true,
    });
    if (
      audit.newlyUnlockedIds.length > 0 ||
      audit.revokedIds.length > 0
    ) {
      localMap[uid] = audit.profile;
      saveLocalUsersMap(localMap, false);
    }
    return audit.profile;
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

export async function revalidateUserProfileAchievements(
  uid?: string
): Promise<AchievementRevalidationReport | null> {
  const targetUid = uid || getActiveUid();
  if (!targetUid) return null;

  const current = await getOrLoadUserProfile(targetUid);
  const report = evaluateAndSyncProfileAchievements(current, {
    awardXp: true,
  });

  const saved = await saveUserProfile(report.profile);
  return {
    ...report,
    profile: saved,
  };
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
    sessionStorage.setItem(
      "senai_arena_avatar",
      getEffectiveAvatarString(updated)
    );
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
    googlePhotoURL: u.photoURL || undefined,
    avatar: "⚡",
    avatarMode: u.photoURL ? "photo" : "emoji",
    authProvider: "google",
  });
  if (u.displayName && !profile.profileUpdatedAt) {
    profile.displayName = u.displayName.slice(0, 24);
  }
  if (u.email) {
    profile.email = u.email;
  }
  if (u.photoURL) {
    profile.googlePhotoURL = u.photoURL;
    if (!profile.photoURL) {
      profile.photoURL = u.photoURL;
      if (!profile.profileUpdatedAt) {
        profile.avatarMode = "photo";
      }
    }
  }
  return await saveUserProfile(profile);
}

export async function signInWithQuickGoogleSimulation(
  displayName: string,
  email: string,
  avatar: string,
  options?: {
    photoURL?: string;
    avatarMode?: "photo" | "emoji";
    classGroup?: string;
  }
): Promise<UserProfile> {
  const cleanEmail =
    email.trim().toLowerCase() ||
    `${displayName.trim().toLowerCase().replace(/\s+/g, ".")}@aluno.sc.senai.br`;
  const uid =
    "usr_" + cleanEmail.replace(/[^a-z0-9]/g, "_").slice(0, 24);

  if (typeof window !== "undefined") {
    localStorage.setItem(LOCAL_ACTIVE_USER_KEY, uid);
  }

  const isAvatarAnImage =
    avatar.trim().startsWith("data:image/") ||
    avatar.trim().startsWith("http://") ||
    avatar.trim().startsWith("https://");
  const cleanPhoto =
    options?.photoURL?.trim() || (isAvatarAnImage ? avatar.trim() : "");
  const cleanEmoji = isAvatarAnImage ? "⚡" : avatar || "⚡";
  const resolvedMode: "photo" | "emoji" =
    options?.avatarMode || (cleanPhoto ? "photo" : "emoji");

  const profile = await getOrLoadUserProfile(uid, {
    displayName: displayName.trim().slice(0, 24) || "Aluno SENAI",
    email: cleanEmail,
    photoURL: cleanPhoto,
    avatar: cleanEmoji,
    avatarMode: resolvedMode,
    ...(options?.classGroup
      ? { classGroup: options.classGroup.trim().slice(0, 36) }
      : {}),
    authProvider: "local",
  });

  profile.displayName = displayName.trim().slice(0, 24) || profile.displayName;
  if (!isAvatarAnImage && avatar) {
    profile.avatar = avatar;
  }
  if (cleanPhoto) {
    profile.photoURL = cleanPhoto;
    profile.avatarMode = resolvedMode;
  } else if (options?.avatarMode === "emoji") {
    profile.avatarMode = "emoji";
  }
  if (options?.classGroup !== undefined) {
    profile.classGroup = options.classGroup.trim().slice(0, 36) || undefined;
  }
  profile.profileUpdatedAt = Date.now();
  return await saveUserProfile(profile);
}

export async function updateUserProfileDetails(
  uid: string,
  updates: {
    displayName?: string;
    email?: string;
    classGroup?: string;
    avatar?: string;
    photoURL?: string;
    avatarMode?: "photo" | "emoji";
  }
): Promise<UserProfile> {
  const current = await getOrLoadUserProfile(uid);
  const now = Date.now();

  const nextDisplayName =
    updates.displayName !== undefined
      ? updates.displayName.trim().slice(0, 24) || current.displayName
      : current.displayName;

  const nextEmail =
    updates.email !== undefined
      ? updates.email.trim().toLowerCase() || current.email
      : current.email;

  const nextClassGroup =
    updates.classGroup !== undefined
      ? updates.classGroup.trim().slice(0, 36)
      : current.classGroup || "";

  const nextAvatar =
    updates.avatar !== undefined
      ? updates.avatar.trim() || current.avatar || "⚡"
      : current.avatar || "⚡";

  const nextPhotoURL =
    updates.photoURL !== undefined
      ? updates.photoURL.trim()
      : current.photoURL || "";

  const nextAvatarMode: "photo" | "emoji" =
    updates.avatarMode !== undefined
      ? updates.avatarMode
      : nextPhotoURL
      ? current.avatarMode || "photo"
      : "emoji";

  const updated: UserProfile = normalizeProfile({
    ...current,
    displayName: nextDisplayName,
    email: nextEmail,
    classGroup: nextClassGroup || undefined,
    avatar: nextAvatar,
    photoURL: nextPhotoURL,
    avatarMode: nextPhotoURL ? nextAvatarMode : "emoji",
    profileUpdatedAt: now,
    updatedAt: now,
  });

  if (!nextClassGroup) {
    delete updated.classGroup;
  }

  return await saveUserProfile(updated);
}

export function getSavedLocalProfiles(): UserProfile[] {
  if (typeof window === "undefined") return [];
  const map = getLocalUsersMap();
  return Object.values(map).sort(
    (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
  );
}

export async function switchActiveProfile(
  uid: string
): Promise<UserProfile | null> {
  if (typeof window === "undefined" || !uid) return null;
  if (isFirebaseAuthConfigured && auth?.currentUser && auth.currentUser.uid !== uid) {
    try {
      await safeFirebaseCall(() => firebaseSignOut(auth!), 1800);
    } catch {
      // Ignora
    }
  }
  localStorage.setItem(LOCAL_ACTIVE_USER_KEY, uid);
  const profile = await getOrLoadUserProfile(uid);
  return await saveUserProfile(profile);
}

export function removeLocalSavedProfileOnly(uid: string): void {
  if (typeof window === "undefined" || !uid) return;
  const localMap = getLocalUsersMap();
  if (localMap[uid]) {
    delete localMap[uid];
    saveLocalUsersMap(localMap, true);
  }
}

export async function resetOwnProfileProgress(
  uid: string
): Promise<UserProfile | null> {
  const profile = await getOrLoadUserProfile(uid);
  if (!profile) return null;
  const now = Date.now();

  const resetProfile = normalizeProfile({
    ...profile,
    xp: 0,
    totalXp: 0,
    totalMatches: 0,
    matchesPlayed: 0,
    totalHits: 0,
    totalMisses: 0,
    bestStreak: 0,
    currentGlobalStreak: 0,
    perfectMatches: 0,
    consecutivePerfectMatches: 0,
    bestConsecutivePerfectMatches: 0,
    bestFlawlessHits: 0,
    bestFlawlessScore: 0,
    bestSingleMatchHits: 0,
    comebackMatches: 0,
    roomMatchesPlayed: 0,
    soloMatchesPlayed: 0,
    highScoreMatch: 0,
    minigameBestScores: {},
    minigameMatches: {},
    minigamePerfectMatches: {},
    playedMinigames: [],
    achievements: {},
    unlockedAchievements: [],
    recentMatches: [],
    weekKey: getCurrentWeekKey(now),
    weeklyXp: 0,
    weeklyMatches: 0,
    weeklyHits: 0,
    weeklyMisses: 0,
    weeklyBestStreak: 0,
    monthKey: getCurrentMonthKey(now),
    monthlyXp: 0,
    monthlyMatches: 0,
    monthlyHits: 0,
    monthlyMisses: 0,
    monthlyBestStreak: 0,
    periodUpdatedAt: now,
    adminOverrideAt: now,
    updatedAt: now,
  });

  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(PROCESSED_ROUNDS_KEY);
      if (raw) {
        const map = JSON.parse(raw) as Record<string, string[]>;
        delete map[uid];
        localStorage.setItem(PROCESSED_ROUNDS_KEY, JSON.stringify(map));
      }
    } catch {
      // ignore
    }
  }

  return await saveUserProfile(resetProfile);
}

export async function deleteOwnUserProfile(uid: string): Promise<void> {
  const activeUid = getActiveUid();
  await adminDeleteUserProfile(uid);
  if (activeUid === uid) {
    await signOutCurrentProfile();
  }
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
          if (user.displayName && prof.displayName === "Estudante SENAI" && !prof.profileUpdatedAt) {
            prof.displayName = user.displayName.slice(0, 24);
          }
          if (user.email && !prof.email) {
            prof.email = user.email;
          }
          if (user.photoURL) {
            prof.googlePhotoURL = user.photoURL;
            if (!prof.photoURL) {
              prof.photoURL = user.photoURL;
              if (!prof.profileUpdatedAt) {
                prof.avatarMode = "photo";
              }
            }
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

    // Proteção anti-autoclick / anti-manipulação por partida
    const safeHits = Math.min(
      MAX_SANE_SINGLE_MATCH_HITS,
      Math.max(1, Math.round(params.hits))
    );
    const safeMisses = Math.min(
      MAX_SANE_SINGLE_MATCH_HITS,
      Math.max(0, Math.round(params.misses))
    );
    const safeScore = Math.min(
      MAX_SANE_SINGLE_MATCH_SCORE,
      Math.max(0, Math.round(params.score))
    );
    const safeMaxStreak = Math.min(
      safeHits,
      Math.max(0, Math.round(params.maxStreak))
    );

    const resolvedGameId = (params.minigameId ||
      params.gameId ||
      "conveyor") as MinigameId;

    const profile = await getOrLoadUserProfile(uid);

    // Rate-limit contra disparo automatizado em loop (< 2.5 segundos desde a última partida salva)
    const lastMatchTs = Number(
      profile.recentMatches?.[0]?.timestamp ||
        profile.recentMatches?.[0]?.playedAt ||
        0
    );
    if (lastMatchTs > 0 && Date.now() - lastMatchTs < 2500) {
      return { profile, xpEarned: 0, newlyUnlockedAchievements: [] };
    }

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

    const safeTotalAttempts = safeHits + safeMisses;
    const accuracyPct =
      safeTotalAttempts > 0
        ? Math.round((safeHits / safeTotalAttempts) * 100)
        : 0;

    // Calcula XP da partida rebalanceado (progressão equilibrada rumo a 1.000.000 XP)
    const baseXp = Math.min(
      MAX_SANE_SINGLE_MATCH_XP,
      Math.max(15, Math.round(safeScore * 0.5) + safeHits * 8)
    );
    const accuracyBonus = accuracyPct >= 90 && safeHits >= 5 ? 45 : 0;
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
      score: safeScore,
      xpEarned: totalXpEarned,
      hits: safeHits,
      misses: safeMisses,
      accuracyPct,
      accuracy: accuracyPct,
      maxStreak: safeMaxStreak,
    };

    const nextMatches = (profile.totalMatches || 0) + 1;
    const nextHits = (profile.totalHits || 0) + safeHits;
    const nextMisses = (profile.totalMisses || 0) + safeMisses;
    const isFlawlessRound = safeMisses === 0;
    const nextCurrentGlobalStreak = isFlawlessRound
      ? (profile.currentGlobalStreak || 0) + safeHits
      : 0;
    const effectiveRoundBestStreak = Math.max(
      safeMaxStreak,
      nextCurrentGlobalStreak
    );
    const nextBestStreak = Math.max(
      profile.bestStreak || 0,
      effectiveRoundBestStreak
    );
    const nextPlayedGames = Array.from(
      new Set([...(profile.playedMinigames || []), resolvedGameId])
    ) as MinigameId[];

    const isPerfectRun = isPerfectMatchRun(
      resolvedGameId,
      safeHits,
      safeMisses
    );
    const nextPerfectMatches =
      (profile.perfectMatches || 0) + (isPerfectRun ? 1 : 0);
    const nextConsecutivePerfect = isPerfectRun
      ? (profile.consecutivePerfectMatches || 0) + 1
      : 0;
    const nextBestConsecutivePerfect = Math.max(
      profile.bestConsecutivePerfectMatches || 0,
      nextConsecutivePerfect
    );

    const nextBestFlawlessHits = Math.max(
      profile.bestFlawlessHits || 0,
      isFlawlessRound ? safeHits : 0
    );
    const nextBestFlawlessScore = Math.max(
      profile.bestFlawlessScore || 0,
      isFlawlessRound ? safeScore : 0
    );
    const nextBestSingleMatchHits = Math.max(
      profile.bestSingleMatchHits || 0,
      safeHits
    );
    const isComebackRun = isComebackMatchRun(
      safeScore,
      safeHits,
      safeMisses
    );
    const nextComebackMatches =
      (profile.comebackMatches || 0) + (isComebackRun ? 1 : 0);
    const nextRoomMatches =
      (profile.roomMatchesPlayed || 0) + (params.mode === "room" ? 1 : 0);
    const nextSoloMatches =
      (profile.soloMatchesPlayed || 0) + (params.mode !== "room" ? 1 : 0);

    const nextHighScoreMatch = Math.max(
      profile.highScoreMatch || 0,
      safeScore
    );
    const nextMinigameBestScores: Partial<Record<MinigameId, number>> = {
      ...(profile.minigameBestScores || {}),
      [resolvedGameId]: Math.max(
        profile.minigameBestScores?.[resolvedGameId] || 0,
        safeScore
      ),
    };
    const nextMinigameMatches: Partial<Record<MinigameId, number>> = {
      ...(profile.minigameMatches || {}),
      [resolvedGameId]: (profile.minigameMatches?.[resolvedGameId] || 0) + 1,
    };
    const nextMinigamePerfectMatches: Partial<Record<MinigameId, number>> = {
      ...(profile.minigamePerfectMatches || {}),
      ...(isPerfectRun
        ? {
            [resolvedGameId]:
              (profile.minigamePerfectMatches?.[resolvedGameId] || 0) + 1,
          }
        : {}),
    };

    const prelimTotalXp = (profile.totalXp || profile.xp || 0) + totalXpEarned;
    const meta = getLocalLeaderboardMeta();
    const prevWeekStats = getProfilePeriodStats(profile, "weekly", meta);
    const prevMonthStats = getProfilePeriodStats(profile, "monthly", meta);

    const draftBeforeAchievements: UserProfile = normalizeProfile({
      ...profile,
      xp: prelimTotalXp,
      totalXp: prelimTotalXp,
      totalMatches: nextMatches,
      matchesPlayed: nextMatches,
      totalHits: nextHits,
      totalMisses: nextMisses,
      bestStreak: nextBestStreak,
      currentGlobalStreak: nextCurrentGlobalStreak,
      perfectMatches: nextPerfectMatches,
      consecutivePerfectMatches: nextConsecutivePerfect,
      bestConsecutivePerfectMatches: nextBestConsecutivePerfect,
      bestFlawlessHits: nextBestFlawlessHits,
      bestFlawlessScore: nextBestFlawlessScore,
      bestSingleMatchHits: nextBestSingleMatchHits,
      comebackMatches: nextComebackMatches,
      roomMatchesPlayed: nextRoomMatches,
      soloMatchesPlayed: nextSoloMatches,
      highScoreMatch: nextHighScoreMatch,
      minigameBestScores: nextMinigameBestScores,
      minigameMatches: nextMinigameMatches,
      minigamePerfectMatches: nextMinigamePerfectMatches,
      playedMinigames: nextPlayedGames,
      recentMatches: [matchRecord, ...(profile.recentMatches || [])].slice(
        0,
        30
      ),
      updatedAt: nowTs,
    });

    const audit = evaluateAndSyncProfileAchievements(draftBeforeAchievements, {
      awardXp: true,
    });

    totalXpEarned += audit.xpAdded;
    matchRecord.xpEarned = totalXpEarned;
    matchRecord.maxStreak = Math.max(safeMaxStreak, effectiveRoundBestStreak);

    const updatedProfile: UserProfile = normalizeProfile({
      ...audit.profile,
      recentMatches: [matchRecord, ...(profile.recentMatches || [])].slice(
        0,
        30
      ),
      weekKey: getCurrentWeekKey(nowTs),
      weeklyXp: prevWeekStats.xp + totalXpEarned,
      weeklyMatches: prevWeekStats.matches + 1,
      weeklyHits: prevWeekStats.hits + safeHits,
      weeklyMisses: prevWeekStats.misses + safeMisses,
      weeklyBestStreak: Math.max(
        prevWeekStats.bestStreak,
        effectiveRoundBestStreak
      ),
      monthKey: getCurrentMonthKey(nowTs),
      monthlyXp: prevMonthStats.xp + totalXpEarned,
      monthlyMatches: prevMonthStats.matches + 1,
      monthlyHits: prevMonthStats.hits + safeHits,
      monthlyMisses: prevMonthStats.misses + safeMisses,
      monthlyBestStreak: Math.max(
        prevMonthStats.bestStreak,
        effectiveRoundBestStreak
      ),
      periodUpdatedAt: nowTs,
      updatedAt: nowTs,
    });

    const saved = await saveUserProfile(updatedProfile);

    return {
      profile: saved,
      xpEarned: totalXpEarned,
      newlyUnlockedAchievements: audit.newlyUnlockedIds,
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

export async function verifyAdminPin(inputPin: string): Promise<boolean> {
  const clean = inputPin.trim();
  if (!clean) return false;
  try {
    const res = await fetch("/api/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin: clean }),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { authorized?: boolean };
    return Boolean(data?.authorized);
  } catch {
    return false;
  }
}

export async function adminTriggerPeriodReset(): Promise<LeaderboardMeta> {
  const currentMeta = await fetchRemoteLeaderboardMetaFromFirebase();
  const now = Date.now();
  const nextMeta: LeaderboardMeta = {
    periodResetAt: now,
    seasonNumber: (currentMeta.seasonNumber || 1) + 1,
    updatedAt: now,
    purgedUsers: currentMeta.purgedUsers || {},
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

  const draftUpdated = normalizeProfile({
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
          currentGlobalStreak: 0,
          perfectMatches: 0,
          consecutivePerfectMatches: 0,
          bestConsecutivePerfectMatches: 0,
          bestFlawlessHits: 0,
          bestFlawlessScore: 0,
          bestSingleMatchHits: 0,
          comebackMatches: 0,
          roomMatchesPlayed: 0,
          soloMatchesPlayed: 0,
          highScoreMatch: 0,
          minigameBestScores: {},
          minigameMatches: {},
          minigamePerfectMatches: {},
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

  const audit = evaluateAndSyncProfileAchievements(draftUpdated, {
    awardXp: false,
  });
  const updated = normalizeProfile({
    ...audit.profile,
    adminOverrideAt: now,
    updatedAt: now,
  });

  // Registra o timestamp de purge/reset no metadado global para invalidar o cache localStorage do navegador do aluno
  if (isFullZero) {
    await registerRemoteUserPurge(uid, profile.email, now - 1);
  }

  const cleanData = sanitizeForFirebase(updated);
  const localMap = getLocalUsersMap();
  localMap[uid] = cleanData;
  saveLocalUsersMap(localMap, true);

  await writeRemoteProfileToFirebase(cleanData);
  return cleanData;
}

export async function adminDeleteUserProfile(
  uid: string,
  email?: string
): Promise<void> {
  let targetEmail = email || "";
  if (typeof window !== "undefined") {
    const localMap = getLocalUsersMap();
    if (!targetEmail && localMap[uid]?.email) {
      targetEmail = localMap[uid].email;
    }
    if (localMap[uid]) {
      delete localMap[uid];
      saveLocalUsersMap(localMap, true);
    }
  }

  // Registra o tombstone (purgedUsers) no Firebase ANTES/JUNTO da remoção para que o localStorage do aluno
  // seja automaticamente invalidado caso ele abra o site ou faça login novamente.
  await registerRemoteUserPurge(uid, targetEmail, Date.now());

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

/**
 * Varre o banco de dados (local e Firebase) em busca de qualquer perfil com valores
 * anômalos/corrompidos (ex.: >2M XP ou >4.000 partidas do antigo bug de autoclick)
 * e reseta ou remove esses registros definitivamente.
 */
export async function adminPurgeCorruptedProfiles(): Promise<{
  sanitizedCount: number;
  affectedNames: string[];
}> {
  const affectedNames: string[] = [];
  let sanitizedCount = 0;
  const now = Date.now();

  const localMap = getLocalUsersMap();
  const candidates: Record<string, Partial<UserProfile> & { uid: string }> = {};

  for (const [k, v] of Object.entries(localMap)) {
    candidates[k] = { ...v, uid: k };
  }

  if (isFirebaseConfigured && db) {
    const snaps = await Promise.allSettled([
      safeFirebaseCall(() => get(ref(db!, GLOBAL_PROFILES_DB_PATH)), 3000),
      safeFirebaseCall(() => get(ref(db!, "users")), 3000),
    ]);
    for (const res of snaps) {
      if (res.status === "fulfilled" && res.value.exists()) {
        const val = res.value.val() as Record<string, UserProfile>;
        for (const [k, v] of Object.entries(val)) {
          if (!v || k.startsWith("seed_")) continue;
          const prev = candidates[k];
          if (
            !prev ||
            isCorruptedLegacyProfile(v) ||
            Number(v.totalXp || 0) > Number(prev.totalXp || 0)
          ) {
            candidates[k] = { ...v, uid: k };
          }
        }
      }
    }
  }

  for (const [uid, rawProf] of Object.entries(candidates)) {
    const xpVal = Number(rawProf.totalXp ?? rawProf.xp ?? 0) || 0;
    const matchesVal =
      Number(rawProf.matchesPlayed ?? rawProf.totalMatches ?? 0) || 0;
    if (
      isCorruptedLegacyProfile(rawProf) ||
      xpVal > MAX_PLATFORM_XP ||
      matchesVal > MAX_SANE_MATCHES_PLAYED
    ) {
      sanitizedCount++;
      affectedNames.push(rawProf.displayName || uid);
      await registerRemoteUserPurge(uid, rawProf.email, now - 1);
      const cleaned = normalizeProfile({
        ...rawProf,
        uid,
        xp: 0,
        totalXp: 0,
        totalMatches: 0,
        matchesPlayed: 0,
        totalHits: 0,
        totalMisses: 0,
        bestStreak: 0,
        currentGlobalStreak: 0,
        perfectMatches: 0,
        consecutivePerfectMatches: 0,
        bestConsecutivePerfectMatches: 0,
        bestFlawlessHits: 0,
        bestFlawlessScore: 0,
        bestSingleMatchHits: 0,
        comebackMatches: 0,
        roomMatchesPlayed: 0,
        soloMatchesPlayed: 0,
        highScoreMatch: 0,
        minigameBestScores: {},
        minigameMatches: {},
        minigamePerfectMatches: {},
        playedMinigames: [],
        achievements: {},
        unlockedAchievements: [],
        recentMatches: [],
        weeklyXp: 0,
        weeklyMatches: 0,
        weeklyHits: 0,
        weeklyMisses: 0,
        weeklyBestStreak: 0,
        monthlyXp: 0,
        monthlyMatches: 0,
        monthlyHits: 0,
        monthlyMisses: 0,
        monthlyBestStreak: 0,
        periodUpdatedAt: now,
        adminOverrideAt: now,
        updatedAt: now,
      });
      localMap[uid] = sanitizeForFirebase(cleaned);
      await writeRemoteProfileToFirebase(cleaned);
    }
  }

  saveLocalUsersMap(localMap, true);
  return { sanitizedCount, affectedNames };
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
            const localMeta = getLocalLeaderboardMeta();
            const rawPurged =
              val.purgedUsers && typeof val.purgedUsers === "object"
                ? val.purgedUsers
                : {};
            const mergedPurged: Record<string, number> = {
              ...(localMeta.purgedUsers || {}),
            };
            for (const [k, v] of Object.entries(rawPurged)) {
              const ts = Number(v || 0);
              if (k && ts > (mergedPurged[k] || 0)) {
                mergedPurged[k] = ts;
              }
            }
            const remoteMeta: LeaderboardMeta = {
              periodResetAt: Number(val.periodResetAt || 0),
              seasonNumber: Math.max(1, Number(val.seasonNumber || 1)),
              updatedAt: Number(val.updatedAt || 0),
              purgedUsers: mergedPurged,
            };
            if (
              remoteMeta.updatedAt >= localMeta.updatedAt ||
              Object.keys(mergedPurged).length !==
                Object.keys(localMeta.purgedUsers || {}).length
            ) {
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
  let hasRemoteSnapshot = false;
  const autoHealedUids = new Set<string>();

  const emitCombined = () => {
    const meta = getLocalLeaderboardMeta();
    const localMap = getLocalUsersMap();
    const combined: Record<string, UserProfile> = {};

    // Se o Firebase ainda não carregou, mostra os perfis locais não-purgados
    if (!hasRemoteSnapshot) {
      for (const [k, v] of Object.entries(localMap)) {
        const purgeTs = getPurgeTimestampForProfile(k, v.email, meta);
        const profTs = Math.max(v.updatedAt || 0, v.adminOverrideAt || 0);
        if (purgeTs > 0 && profTs < purgeTs) continue;
        combined[k] = v;
      }
    }

    const mergeSource = (
      source: Record<string, UserProfile>,
      sourceLabel: "mirror" | "users"
    ) => {
      for (const [k, v] of Object.entries(source)) {
        if (!v || k.startsWith("seed_") || v.uid?.startsWith("seed_")) {
          continue;
        }
        const purgeTs = getPurgeTimestampForProfile(k, v.email, meta);
        const profTs = Math.max(
          Number(v.updatedAt || 0),
          Number(v.adminOverrideAt || 0)
        );
        // Se este nó remoto for mais antigo que um comando de exclusão (tombstone), ignora e remove!
        if (purgeTs > 0 && profTs < purgeTs) {
          if (!autoHealedUids.has(`del_${sourceLabel}_${k}`)) {
            autoHealedUids.add(`del_${sourceLabel}_${k}`);
            if (isFirebaseConfigured && db) {
              const path =
                sourceLabel === "mirror"
                  ? `${GLOBAL_PROFILES_DB_PATH}/${k}`
                  : `users/${k}`;
              safeFirebaseCall(() => remove(ref(db!, path)), 2500).catch(
                () => {}
              );
            }
          }
          continue;
        }

        const wasCorrupted = isCorruptedLegacyProfile(v);
        const norm = normalizeProfile({ ...v, uid: k });

        // Auto-cura no Firebase caso encontre um perfil com >100M XP ou >26.000 partidas
        if (wasCorrupted && !autoHealedUids.has(`heal_${k}`)) {
          autoHealedUids.add(`heal_${k}`);
          writeRemoteProfileToFirebase(norm).catch(() => {});
        }

        combined[k] = combined[k]
          ? pickPreferredProfile(combined[k], norm)
          : norm;
      }
    };

    mergeSource(remoteMirrorMap, "mirror");
    mergeSource(remoteUsersMap, "users");

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
          hasRemoteSnapshot = true;
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
          hasRemoteSnapshot = true;
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
