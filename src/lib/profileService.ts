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
import { ref, get, set, onValue, off } from "firebase/database";
import {
  ACHIEVEMENTS_CATALOG,
  MatchRecord,
  getRankInfoByXp,
} from "@/data/achievementsData";
import { MINIGAMES_CATALOG, MinigameId } from "@/data/electronicsData";

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
  totalMatches: number;
  matchesPlayed: number;
  totalHits: number;
  totalMisses: number;
  bestStreak: number;
  playedMinigames: MinigameId[];
  achievements: Record<string, number>;
  unlockedAchievements: string[];
  recentMatches: MatchRecord[];
  updatedAt: number;
}

const LOCAL_ACTIVE_USER_KEY = "senai_arena_v2_active_uid";
const LOCAL_USERS_DB_KEY = "senai_arena_v2_users_db";
const PROFILE_EVENT_NAME = "senai_profile_updated";

/**
 * Executa uma Promise do Firebase com timeout estrito para impedir que
 * problemas de URL/Regras/Rede do Realtime Database travem a interface.
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs = 2800
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("FIREBASE_TIMEOUT"));
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
  const xpVal = raw.totalXp ?? raw.xp ?? 0;
  const rank = getRankInfoByXp(xpVal);
  const matchesVal = raw.matchesPlayed ?? raw.totalMatches ?? 0;
  const achMap = raw.achievements || {};
  const unlockedList =
    raw.unlockedAchievements && raw.unlockedAchievements.length > 0
      ? raw.unlockedAchievements
      : Object.keys(achMap);

  const normalizedMatches: MatchRecord[] = (raw.recentMatches || []).map(
    (m) => ({
      ...m,
      timestamp: m.timestamp || m.playedAt || Date.now(),
      playedAt: m.playedAt || m.timestamp || Date.now(),
      minigameTitle: m.minigameTitle || m.gameTitle || "Minigame",
      gameTitle: m.gameTitle || m.minigameTitle || "Minigame",
      accuracyPct: m.accuracyPct ?? m.accuracy ?? 0,
      accuracy: m.accuracy ?? m.accuracyPct ?? 0,
    })
  );

  return {
    uid: raw.uid,
    displayName: raw.displayName || "Estudante SENAI",
    email: raw.email || "",
    photoURL: raw.photoURL || "",
    avatar: raw.avatar || "⚡",
    authProvider: raw.authProvider || "google",
    xp: xpVal,
    totalXp: xpVal,
    level: rank.currentTier.level,
    rankTitle: rank.currentTier.title,
    totalMatches: matchesVal,
    matchesPlayed: matchesVal,
    totalHits: raw.totalHits || 0,
    totalMisses: raw.totalMisses || 0,
    bestStreak: raw.bestStreak || 0,
    playedMinigames: raw.playedMinigames || [],
    achievements: achMap,
    unlockedAchievements: unlockedList,
    recentMatches: normalizedMatches,
    updatedAt: raw.updatedAt || Date.now(),
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

/**
 * Salva o mapa local de usuários.
 * IMPORTANTE: emitEvent só deve ser true em ações explícitas de escrita
 * (nunca dentro de leituras/listeners) para evitar loops infinitos de eventos.
 */
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

export async function getOrLoadUserProfile(
  uid: string,
  defaults?: Partial<UserProfile>
): Promise<UserProfile> {
  const localMap = getLocalUsersMap();

  if (isFirebaseConfigured && db) {
    try {
      const snap = await withTimeout(get(ref(db, `users/${uid}`)), 2500);
      if (snap.exists()) {
        const remote = snap.val() as UserProfile;
        const normalized = normalizeProfile({ ...remote, uid });
        localMap[uid] = normalized;
        saveLocalUsersMap(localMap, false); // NÃO emite evento durante leitura!
        return normalized;
      }
    } catch {
      // Fallback imediato para local caso o Realtime Database demore ou não tenha regras publicadas
    }
  }

  if (localMap[uid]) {
    return normalizeProfile(localMap[uid]);
  }

  const created = createInitialProfile(
    uid,
    defaults?.displayName || "Estudante SENAI",
    defaults?.email || "",
    defaults?.photoURL || "",
    defaults?.avatar || "⚡",
    defaults?.authProvider || "local"
  );

  localMap[uid] = created;
  saveLocalUsersMap(localMap, false);

  if (isFirebaseConfigured && db) {
    // Sincroniza em background sem bloquear a UI
    withTimeout(set(ref(db, `users/${uid}`), created), 2500).catch(() => {});
  }

  return created;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const updated = normalizeProfile({
    ...profile,
    updatedAt: Date.now(),
  });

  const localMap = getLocalUsersMap();
  localMap[updated.uid] = updated;
  saveLocalUsersMap(localMap, true); // Emite evento apenas em escrita explícita

  if (typeof window !== "undefined") {
    sessionStorage.setItem("senai_arena_nickname", updated.displayName);
    sessionStorage.setItem("senai_arena_avatar", updated.avatar);
  }

  if (isFirebaseConfigured && db) {
    // Salva no Firebase com timeout curto para nunca travar a tela do aluno
    await withTimeout(set(ref(db, `users/${updated.uid}`), updated), 2500).catch(
      () => {}
    );
  }
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
  if (u.displayName && profile.displayName === "Estudante SENAI") {
    profile.displayName = u.displayName.slice(0, 22);
  }
  if (u.photoURL) {
    profile.photoURL = u.photoURL;
  }
  await saveUserProfile(profile);
  return profile;
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
  await saveUserProfile(profile);
  return profile;
}

export async function signOutCurrentProfile(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LOCAL_ACTIVE_USER_KEY);
    window.dispatchEvent(new CustomEvent(PROFILE_EVENT_NAME));
  }
  if (isFirebaseAuthConfigured && auth) {
    try {
      await withTimeout(firebaseSignOut(auth), 2000);
    } catch {
      // Ignora
    }
  }
}

export function getActiveUid(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_ACTIVE_USER_KEY);
}

export function subscribeToActiveProfile(
  callback: (profile: UserProfile | null) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  let isMounted = true;

  // Leitura síncrona local (nunca dispara rede nem eventos recursivos)
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

  // Carregamento inicial: mostra cache local imediatamente e sincroniza uma vez com Firebase
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
          if (isMounted) callback(prof);
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
  let uid = getActiveUid();
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

  const totalAttempts = params.hits + params.misses;
  if (totalAttempts === 0 && params.score === 0) {
    return { profile: null, xpEarned: 0, newlyUnlockedAchievements: [] };
  }

  const resolvedGameId = (params.minigameId ||
    params.gameId ||
    "conveyor") as MinigameId;

  const profile = await getOrLoadUserProfile(uid);
  const accuracyPct =
    totalAttempts > 0 ? Math.round((params.hits / totalAttempts) * 100) : 0;

  // Calcula XP da partida (pontos + bônus de precisão + bônus de conclusão)
  const baseXp = Math.max(25, Math.round(params.score * 0.65));
  const accuracyBonus = accuracyPct >= 85 && params.hits >= 5 ? 90 : 0;
  let totalXpEarned = baseXp + accuracyBonus;

  const gameMeta =
    MINIGAMES_CATALOG.find((g) => g.id === resolvedGameId) ||
    MINIGAMES_CATALOG[0];
  const resolvedTitle = params.gameTitle || gameMeta.title;
  const nowTs = Date.now();

  const matchRecord: MatchRecord = {
    id: "m_" + nowTs + "_" + Math.random().toString(36).slice(2, 6),
    timestamp: nowTs,
    playedAt: nowTs,
    mode: params.mode,
    roomPin: params.roomPin,
    minigameId: resolvedGameId,
    minigameTitle: resolvedTitle,
    gameTitle: resolvedTitle,
    score: params.score,
    xpEarned: totalXpEarned,
    hits: params.hits,
    misses: params.misses,
    accuracyPct,
    accuracy: accuracyPct,
    maxStreak: params.maxStreak,
  };

  const nextMatches = profile.totalMatches + 1;
  const nextHits = profile.totalHits + params.hits;
  const nextMisses = profile.totalMisses + params.misses;
  const nextBestStreak = Math.max(profile.bestStreak || 0, params.maxStreak);
  const nextPlayedGames = Array.from(
    new Set([...(profile.playedMinigames || []), resolvedGameId])
  ) as MinigameId[];

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

  tryUnlock("first_match", nextMatches >= 1);
  tryUnlock("zero_short_circuit", params.hits >= 8 && params.misses === 0);
  tryUnlock("combo_5", nextBestStreak >= 5);
  tryUnlock("combo_12", nextBestStreak >= 12);
  tryUnlock(
    "resistor_specialist",
    resolvedGameId === "resistor" && params.score >= 1200
  );
  tryUnlock(
    "radar_specialist",
    resolvedGameId === "radar" && params.score >= 1200
  );
  tryUnlock("all_rounder", nextPlayedGames.length >= 5);
  tryUnlock("matches_5", nextMatches >= 5);
  tryUnlock("matches_15", nextMatches >= 15);
  tryUnlock("hits_50", nextHits >= 50);
  tryUnlock("hits_200", nextHits >= 200);
  tryUnlock("high_scorer_2500", params.score >= 2500);

  matchRecord.xpEarned = totalXpEarned;
  const newTotalXp = (profile.totalXp || profile.xp || 0) + totalXpEarned;

  const updatedProfile: UserProfile = normalizeProfile({
    ...profile,
    xp: newTotalXp,
    totalXp: newTotalXp,
    totalMatches: nextMatches,
    matchesPlayed: nextMatches,
    totalHits: nextHits,
    totalMisses: nextMisses,
    bestStreak: nextBestStreak,
    playedMinigames: nextPlayedGames,
    achievements: unlockedMap,
    unlockedAchievements: Object.keys(unlockedMap),
    recentMatches: [matchRecord, ...(profile.recentMatches || [])].slice(0, 30),
    updatedAt: Date.now(),
  });

  await saveUserProfile(updatedProfile);

  return {
    profile: updatedProfile,
    xpEarned: totalXpEarned,
    newlyUnlockedAchievements: newlyUnlocked,
  };
}

export function subscribeToGlobalLeaderboard(
  callback: (profiles: UserProfile[]) => void
): () => void {
  if (typeof window === "undefined") return () => {};

  const loadLocal = () => {
    const map = getLocalUsersMap();
    callback(Object.values(map));
  };

  // Exibe imediatamente os dados locais para nunca travar a renderização
  loadLocal();

  if (isFirebaseConfigured && db) {
    try {
      const usersRef = ref(db, "users");
      const listener = onValue(
        usersRef,
        (snap) => {
          const localMap = getLocalUsersMap();
          if (snap.exists()) {
            const remoteMap = snap.val() as Record<string, UserProfile>;
            const merged: Record<string, UserProfile> = { ...localMap };
            for (const [k, v] of Object.entries(remoteMap)) {
              if (k.startsWith("seed_") || v?.uid?.startsWith("seed_")) {
                continue;
              }
              merged[k] = normalizeProfile({ ...v, uid: k });
            }
            callback(Object.values(merged));
          } else {
            callback(Object.values(localMap));
          }
        },
        () => {
          // Em caso de erro de permissão nas rules do Firebase, mantém a lista local
          loadLocal();
        }
      );
      window.addEventListener(PROFILE_EVENT_NAME, loadLocal);
      return () => {
        off(usersRef, "value", listener);
        window.removeEventListener(PROFILE_EVENT_NAME, loadLocal);
      };
    } catch {
      // Fallback para local
    }
  }

  window.addEventListener(PROFILE_EVENT_NAME, loadLocal);
  window.addEventListener("storage", loadLocal);
  return () => {
    window.removeEventListener(PROFILE_EVENT_NAME, loadLocal);
    window.removeEventListener("storage", loadLocal);
  };
}
