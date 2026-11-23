"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import {
  UserAvatar,
  processAvatarFileToDataUrl,
} from "@/components/UserAvatar";
import {
  UserProfile,
  subscribeToActiveProfile,
  signInWithGoogleAccount,
  signInWithQuickGoogleSimulation,
  signOutCurrentProfile,
  formatGoogleAuthError,
  getAchievementProgressForProfile,
  revalidateUserProfileAchievements,
  updateUserProfileDetails,
  getSavedLocalProfiles,
  switchActiveProfile,
  removeLocalSavedProfileOnly,
  resetOwnProfileProgress,
  deleteOwnUserProfile,
} from "@/lib/profileService";
import {
  ACHIEVEMENTS_CATALOG,
  ACHIEVEMENT_CATEGORIES,
  AchievementCategory,
  AchievementDifficulty,
  MAX_PLATFORM_LEVEL,
  MAX_PLATFORM_XP,
  PatentDivision,
  SENAI_PATENTS,
  SENAI_RANK_TIERS,
  getRankInfoByXp,
} from "@/data/achievementsData";
import { AVATARS } from "@/data/electronicsData";
import {
  AlertTriangle,
  Award,
  Camera,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  GraduationCap,
  Image as ImageIcon,
  Layers,
  Link2,
  Lock,
  LogOut,
  Percent,
  Play,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  Smile,
  Target,
  Trash2,
  Upload,
  UserCheck,
  Users,
  X,
  Zap,
  Printer,
} from "lucide-react";
import { TechnicalPassportModal } from "@/components/TechnicalPassportModal";

type ProfileTab = "patents" | "achievements" | "history" | "settings";
type PatentFilter = "all" | "unlocked" | "locked";
type DifficultyFilter = "all" | AchievementDifficulty;
type CategoryFilter = "all" | AchievementCategory;
type AchievementStatusFilter = "all" | "unlocked" | "in_progress" | "locked";

function getDivisionStyle(division: PatentDivision): {
  badge: string;
  border: string;
  glow: string;
} {
  switch (division) {
    case "bronze":
      return {
        badge: "bg-amber-950/70 text-amber-300 border-amber-700/50",
        border: "border-amber-700/50",
        glow: "from-amber-900/20 to-transparent",
      };
    case "prata":
      return {
        badge: "bg-slate-800 text-slate-200 border-slate-500/50",
        border: "border-slate-500/50",
        glow: "from-slate-500/15 to-transparent",
      };
    case "ouro":
      return {
        badge: "bg-yellow-950/70 text-yellow-300 border-yellow-500/50",
        border: "border-yellow-500/50",
        glow: "from-yellow-500/15 to-transparent",
      };
    case "platina":
      return {
        badge: "bg-cyan-950/70 text-cyan-300 border-cyan-500/50",
        border: "border-cyan-500/50",
        glow: "from-cyan-500/15 to-transparent",
      };
    case "esmeralda":
      return {
        badge: "bg-emerald-950/70 text-emerald-300 border-emerald-500/50",
        border: "border-emerald-500/50",
        glow: "from-emerald-500/15 to-transparent",
      };
    case "diamante":
      return {
        badge: "bg-blue-950/70 text-blue-300 border-blue-400/60",
        border: "border-blue-400/60",
        glow: "from-blue-500/20 to-transparent",
      };
    case "mestre":
      return {
        badge: "bg-purple-950/70 text-purple-300 border-purple-500/60",
        border: "border-purple-500/60",
        glow: "from-purple-500/20 to-transparent",
      };
    case "lendario":
      return {
        badge: "bg-amber-500/20 text-[#F59E0B] border-[#F59E0B]",
        border: "border-[#F59E0B]",
        glow: "from-amber-500/25 to-transparent",
      };
  }
}

function getDifficultyBadgeStyle(diff: AchievementDifficulty): string {
  switch (diff) {
    case "facil":
      return "bg-emerald-950/60 text-emerald-300 border-emerald-500/40";
    case "medio":
      return "bg-blue-950/60 text-blue-300 border-blue-500/40";
    case "dificil":
      return "bg-amber-950/60 text-amber-300 border-amber-500/40";
    case "extremo":
      return "bg-red-950/60 text-red-300 border-red-500/40";
    case "lendario":
      return "bg-purple-950/70 text-purple-300 border-purple-400/50";
  }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<UserProfile[]>([]);

  // Estados do formulário de login rápido (deslogado)
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simClassGroup, setSimClassGroup] = useState("");
  const [simAvatar, setSimAvatar] = useState(AVATARS[0]);
  const [simPhotoURL, setSimPhotoURL] = useState("");
  const [simAvatarMode, setSimAvatarMode] = useState<"photo" | "emoji">(
    "emoji"
  );
  const [simUrlInput, setSimUrlInput] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);
  const simFileInputRef = useRef<HTMLInputElement | null>(null);

  // Estado das abas e filtros dentro do perfil
  const [activeTab, setActiveTab] = useState<ProfileTab>("patents");
  const [patentFilter, setPatentFilter] = useState<PatentFilter>("all");
  const [levelRangeIdx, setLevelRangeIdx] = useState<number>(0);
  const [difficultyFilter, setDifficultyFilter] =
    useState<DifficultyFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [achievementStatusFilter, setAchievementStatusFilter] =
    useState<AchievementStatusFilter>("all");
  const [revalidatingAch, setRevalidatingAch] = useState<boolean>(false);
  const [revalidationMsg, setRevalidationMsg] = useState<string | null>(null);

  // Estados do formulário de Gerenciamento de Perfil (logado)
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editClassGroup, setEditClassGroup] = useState("");
  const [editAvatar, setEditAvatar] = useState(AVATARS[0]);
  const [editPhotoURL, setEditPhotoURL] = useState("");
  const [editAvatarMode, setEditAvatarMode] = useState<"photo" | "emoji">(
    "emoji"
  );
  const [customUrlInput, setCustomUrlInput] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [confirmResetProgress, setConfirmResetProgress] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

  const refreshSavedProfiles = () => {
    setSavedProfiles(getSavedLocalProfiles());
  };

  useEffect(() => {
    refreshSavedProfiles();
    const unsub = subscribeToActiveProfile((prof) => {
      setProfile(prof);
      refreshSavedProfiles();
      if (prof) {
        setEditName(prof.displayName || "");
        setEditEmail(prof.email || "");
        setEditClassGroup(prof.classGroup || "");
        setEditAvatar(prof.avatar || AVATARS[0]);
        setEditPhotoURL(prof.photoURL || "");
        setEditAvatarMode(
          prof.avatarMode || (prof.photoURL ? "photo" : "emoji")
        );
        setCustomUrlInput(
          prof.photoURL && !prof.photoURL.startsWith("data:image/")
            ? prof.photoURL
            : ""
        );

        const r = getRankInfoByXp(prof.totalXp);
        const bucket = Math.min(
          4,
          Math.floor((r.currentTier.level - 1) / 20)
        );
        setLevelRangeIdx(bucket);
      }
    });
    return () => unsub();
  }, []);

  const showProfileMessage = (type: "success" | "error", text: string) => {
    setProfileFeedback({ type, text });
    setTimeout(() => {
      setProfileFeedback((prev) => (prev?.text === text ? null : prev));
    }, 4500);
  };

  const handleGoogleOAuthClick = async () => {
    setAuthLoading(true);
    setAuthErrorMsg(null);
    try {
      await signInWithGoogleAccount();
    } catch (err) {
      setAuthErrorMsg(formatGoogleAuthError(err));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSimFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAuthErrorMsg(null);
    try {
      const dataUrl = await processAvatarFileToDataUrl(file);
      setSimPhotoURL(dataUrl);
      setSimAvatarMode("photo");
    } catch (err) {
      setAuthErrorMsg(
        err instanceof Error ? err.message : "Erro ao processar a foto."
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;
    setAuthLoading(true);
    setAuthErrorMsg(null);
    try {
      await signInWithQuickGoogleSimulation(simName, simEmail, simAvatar, {
        photoURL: simPhotoURL,
        avatarMode: simPhotoURL ? simAvatarMode : "emoji",
        classGroup: simClassGroup,
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEditFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await processAvatarFileToDataUrl(file);
      setEditPhotoURL(dataUrl);
      setEditAvatarMode("photo");
      showProfileMessage(
        "success",
        "Foto carregada e ajustada! Clique em 'Salvar Alterações do Perfil' para confirmar."
      );
    } catch (err) {
      showProfileMessage(
        "error",
        err instanceof Error ? err.message : "Erro ao processar a imagem."
      );
    } finally {
      e.target.value = "";
    }
  };

  const handleApplyExternalPhotoUrl = () => {
    const clean = customUrlInput.trim();
    if (
      !clean ||
      (!clean.startsWith("https://") &&
        !clean.startsWith("http://") &&
        !clean.startsWith("data:image/"))
    ) {
      showProfileMessage(
        "error",
        "Informe um link de imagem válido começando com https:// ou http://"
      );
      return;
    }
    setEditPhotoURL(clean);
    setEditAvatarMode("photo");
    showProfileMessage(
      "success",
      "Link da foto aplicado na pré-visualização! Clique em 'Salvar Alterações' para gravar."
    );
  };

  const handleSaveProfileChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!editName.trim()) {
      showProfileMessage("error", "O nome de perfil não pode ficar em branco.");
      return;
    }

    setProfileSaving(true);
    try {
      await updateUserProfileDetails(profile.uid, {
        displayName: editName.trim(),
        email: editEmail.trim(),
        classGroup: editClassGroup.trim(),
        avatar: editAvatar,
        photoURL: editPhotoURL,
        avatarMode: editPhotoURL ? editAvatarMode : "emoji",
      });
      refreshSavedProfiles();
      showProfileMessage(
        "success",
        "Perfil atualizado e sincronizado com sucesso!"
      );
    } catch {
      showProfileMessage(
        "error",
        "Não foi possível salvar as alterações. Tente novamente."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSwitchSavedProfile = async (targetUid: string) => {
    setProfileSaving(true);
    try {
      const switched = await switchActiveProfile(targetUid);
      refreshSavedProfiles();
      if (switched) {
        showProfileMessage(
          "success",
          `Perfil ativo alterado para ${switched.displayName}.`
        );
      }
    } finally {
      setProfileSaving(false);
    }
  };

  const handleResetMyProgress = async () => {
    if (!profile) return;
    setProfileSaving(true);
    try {
      await resetOwnProfileProgress(profile.uid);
      setConfirmResetProgress(false);
      refreshSavedProfiles();
      showProfileMessage(
        "success",
        "Seu progresso (XP, partidas e conquistas) foi zerado mantendo seu perfil e foto."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteMyProfile = async () => {
    if (!profile) return;
    setProfileSaving(true);
    try {
      await deleteOwnUserProfile(profile.uid);
      setConfirmDeleteAccount(false);
      refreshSavedProfiles();
    } finally {
      setProfileSaving(false);
    }
  };

  const handleRevalidateAchievements = async () => {
    if (!profile) return;
    setRevalidatingAch(true);
    setRevalidationMsg(null);
    try {
      const report = await revalidateUserProfileAchievements(profile.uid);
      if (report) {
        setProfile(report.profile);
        refreshSavedProfiles();
        if (
          report.newlyUnlockedIds.length > 0 &&
          report.revokedIds.length > 0
        ) {
          setRevalidationMsg(
            `Revalidação concluída (${report.totalValidated} auditadas): +${report.newlyUnlockedIds.length} nova(s) conquista(s) desbloqueada(s) (+${report.xpAdded.toLocaleString("pt-BR")} XP) e ${report.revokedIds.length} conquista(s) reajustada(s) aos novos requisitos.`
          );
        } else if (report.newlyUnlockedIds.length > 0) {
          setRevalidationMsg(
            `Revalidação concluída (${report.totalValidated} auditadas): +${report.newlyUnlockedIds.length} nova(s) conquista(s) desbloqueada(s) com +${report.xpAdded.toLocaleString("pt-BR")} XP creditados no seu perfil!`
          );
        } else if (report.revokedIds.length > 0) {
          setRevalidationMsg(
            `Revalidação concluída (${report.totalValidated} auditadas): ${report.revokedIds.length} conquista(s) reajustada(s) para refletir os novos critérios de 6 módulos. Total ativo: ${report.totalUnlocked}/${report.totalValidated}.`
          );
        } else {
          setRevalidationMsg(
            `Auditoria completa (${report.totalValidated} conquistas verificadas): todas as suas ${report.totalUnlocked} conquistas desbloqueadas e barras de progresso estão 100% válidas e sincronizadas.`
          );
        }
      }
    } finally {
      setRevalidatingAch(false);
    }
  };

  const rankInfo = profile ? getRankInfoByXp(profile.totalXp) : null;
  const totalAttempts = profile ? profile.totalHits + profile.totalMisses : 0;
  const overallAccuracy =
    totalAttempts > 0 && profile
      ? Math.round((profile.totalHits / totalAttempts) * 100)
      : 0;

  const unlockedPatentsCount = rankInfo
    ? SENAI_PATENTS.filter((p) => rankInfo.currentTier.level >= p.minLevel)
        .length
    : 0;

  const filteredPatents = SENAI_PATENTS.filter((pat) => {
    if (!rankInfo) return true;
    const isReached = rankInfo.currentTier.level >= pat.minLevel;
    if (patentFilter === "unlocked") return isReached;
    if (patentFilter === "locked") return !isReached;
    return true;
  });

  const filteredAchievements = ACHIEVEMENTS_CATALOG.filter((ach) => {
    if (difficultyFilter !== "all" && ach.difficulty !== difficultyFilter) {
      return false;
    }
    if (categoryFilter !== "all" && ach.category !== categoryFilter) {
      return false;
    }
    if (profile && achievementStatusFilter !== "all") {
      const isUnlocked = profile.unlockedAchievements.includes(ach.id);
      const prog = getAchievementProgressForProfile(ach, profile);
      if (achievementStatusFilter === "unlocked" && !isUnlocked) return false;
      if (
        achievementStatusFilter === "in_progress" &&
        (isUnlocked || prog.current <= 0)
      )
        return false;
      if (achievementStatusFilter === "locked" && isUnlocked) return false;
    }
    return true;
  });

  const levelRanges = [
    { label: "NV 01 – 20", min: 1, max: 20 },
    { label: "NV 21 – 40", min: 21, max: 40 },
    { label: "NV 41 – 60", min: 41, max: 60 },
    { label: "NV 61 – 80", min: 61, max: 80 },
    { label: "NV 81 – 100 (1M)", min: 81, max: 100 },
  ];
  const activeRange = levelRanges[levelRangeIdx] || levelRanges[0];
  const visibleLevels = SENAI_RANK_TIERS.filter(
    (t) => t.level >= activeRange.min && t.level <= activeRange.max
  );

  return (
    <main className="min-h-screen flex flex-col bg-[#111317] text-[#F1F5F9]">
      <Navbar />

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">
        {!profile ? (
          /* Unauthenticated State: Prompt to Sign In + Preview of 21 Patents */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden shadow-xl">
              <div className="h-1 w-full bg-[#0047B6]" />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-5 h-5 text-[#F59E0B]" />
                  <span className="font-mono text-xs uppercase tracking-widest text-[#94A3B8] font-semibold">
                    Credencial Google // Perfil do Aluno
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Conecte sua Conta Google
                </h2>
                <p className="text-xs text-[#94A3B8] mb-5 leading-relaxed">
                  Ao entrar com sua conta Google, todas as partidas em{" "}
                  <strong className="text-white">Sala de Aula (PIN)</strong> ou no{" "}
                  <strong className="text-white">Treino Individual</strong> acumulam XP
                  para evoluir pelos{" "}
                  <strong className="text-[#F59E0B]">
                    100 Níveis (até 1.000.000 XP)
                  </strong>
                  , conquistar as{" "}
                  <strong className="text-emerald-400">
                    21 Patentes Técnicas (a cada 5 níveis)
                  </strong>{" "}
                  e desbloquear as {ACHIEVEMENTS_CATALOG.length} conquistas.
                </p>

                {authErrorMsg && (
                  <div className="mb-4 p-3 rounded-md bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2 leading-relaxed">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{authErrorMsg}</span>
                  </div>
                )}

                <button
                  type="button"
                  disabled={authLoading}
                  onClick={handleGoogleOAuthClick}
                  className="w-full py-3 px-4 rounded-md bg-white hover:bg-slate-100 disabled:opacity-60 text-slate-900 font-bold text-xs flex items-center justify-center gap-2.5 transition-colors mb-4 shadow"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                    />
                  </svg>
                  <span>
                    {authLoading
                      ? "Conectando ao Google..."
                      : "Entrar com Google (OAuth Popup)"}
                  </span>
                </button>

                <div className="relative flex py-2 items-center mb-4">
                  <div className="flex-grow border-t border-[#2A303C]" />
                  <span className="shrink mx-3 font-mono text-[10px] uppercase tracking-widest text-[#94A3B8]">
                    ou Conta Google Educacional Rápida
                  </span>
                  <div className="flex-grow border-t border-[#2A303C]" />
                </div>

                <form onSubmit={handleQuickLogin} className="space-y-3">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                      Nome Completo ou Apelido Técnico
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={24}
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      placeholder="Ex: Lucas Almeida"
                      className="w-full px-3 py-2.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0047B6] focus:outline-none text-xs text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                        E-mail (@gmail / @aluno.senai.br)
                      </label>
                      <input
                        type="email"
                        value={simEmail}
                        onChange={(e) => setSimEmail(e.target.value)}
                        placeholder="lucas@aluno.senai.br"
                        className="w-full px-3 py-2 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0047B6] focus:outline-none text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                        Turma / Unidade SENAI (Opcional)
                      </label>
                      <input
                        type="text"
                        maxLength={36}
                        value={simClassGroup}
                        onChange={(e) => setSimClassGroup(e.target.value)}
                        placeholder="Ex: Eletrotécnica • T1"
                        className="w-full px-3 py-2 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0047B6] focus:outline-none text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Escolha entre Foto Própria ou Insígnia Emoji */}
                  <div className="p-3 rounded-md bg-[#0C0E12] border border-[#2A303C] space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          avatar={simAvatar}
                          photoURL={simPhotoURL}
                          avatarMode={simPhotoURL ? simAvatarMode : "emoji"}
                          name={simName || "Preview"}
                          size="md"
                          className="border border-[#0057E0]"
                        />
                        <div>
                          <span className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                            Representação na Plataforma
                          </span>
                          <span className="text-xs font-bold text-white">
                            {simPhotoURL && simAvatarMode === "photo"
                              ? "Foto Própria Ativa"
                              : `Insígnia Emoji (${simAvatar})`}
                          </span>
                        </div>
                      </div>
                      <input
                        ref={simFileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleSimFileUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => simFileInputRef.current?.click()}
                        className="px-2.5 py-1.5 rounded bg-[#181B20] hover:bg-[#0047B6]/30 border border-[#0057E0] text-xs font-bold text-white inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#F59E0B]" />
                        <span>Enviar Foto</span>
                      </button>
                    </div>

                    {/* Link de imagem opcional */}
                    <div className="flex items-center gap-1.5">
                      <input
                        type="url"
                        value={simUrlInput}
                        onChange={(e) => setSimUrlInput(e.target.value)}
                        placeholder="Ou cole o link (URL https://...) de uma foto"
                        className="w-full px-2.5 py-1.5 rounded bg-[#181B20] border border-[#2A303C] text-[11px] text-white font-mono focus:border-[#0047B6] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (simUrlInput.trim()) {
                            setSimPhotoURL(simUrlInput.trim());
                            setSimAvatarMode("photo");
                          }
                        }}
                        className="px-2.5 py-1.5 rounded bg-[#181B20] hover:bg-[#242933] border border-[#2A303C] text-[11px] font-mono font-bold text-[#F59E0B] shrink-0"
                      >
                        Usar URL
                      </button>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                          Ou escolha uma Insígnia Emoji:
                        </span>
                        {simPhotoURL && (
                          <button
                            type="button"
                            onClick={() =>
                              setSimAvatarMode((m) =>
                                m === "photo" ? "emoji" : "photo"
                              )
                            }
                            className="font-mono text-[10px] text-[#F59E0B] hover:underline"
                          >
                            {simAvatarMode === "photo"
                              ? "Usar Emoji em vez da foto"
                              : "Voltar para Minha Foto"}
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {AVATARS.map((av) => (
                          <button
                            key={av}
                            type="button"
                            onClick={() => {
                              setSimAvatar(av);
                              setSimAvatarMode("emoji");
                            }}
                            className={`h-8 rounded flex items-center justify-center text-base border ${
                              simAvatar === av && simAvatarMode === "emoji"
                                ? "bg-[#0047B6]/25 border-[#F59E0B]"
                                : "bg-[#181B20] border-[#2A303C]"
                            }`}
                          >
                            {av}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white font-bold text-xs uppercase tracking-wider transition-colors"
                  >
                    Criar / Acessar Perfil Técnico
                  </button>
                </form>

                {/* Lista rápida de perfis já salvos neste computador */}
                {savedProfiles.length > 0 && (
                  <div className="mt-5 pt-4 border-t border-[#2A303C] space-y-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5 font-semibold">
                      <Users className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Perfis Salvos neste Computador ({savedProfiles.length})
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {savedProfiles.map((sp) => (
                        <div
                          key={sp.uid}
                          className="flex items-center justify-between gap-2 p-2 rounded-md bg-[#0C0E12] border border-[#2A303C]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar profile={sp} size="sm" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-white truncate">
                                {sp.displayName}
                              </p>
                              <p className="text-[10px] font-mono text-[#94A3B8] truncate">
                                NV {sp.level} •{" "}
                                {sp.totalXp.toLocaleString("pt-BR")} XP
                                {sp.classGroup ? ` • ${sp.classGroup}` : ""}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSwitchSavedProfile(sp.uid)}
                            className="px-2.5 py-1 rounded bg-[#0047B6] hover:bg-[#0057E0] text-white font-mono text-[11px] font-bold shrink-0"
                          >
                            Entrar
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Preview of 21 Career Patents (Every 5 Levels up to Level 100 / 1M XP) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                    <span>
                      Hierarquia de Patentes SENAI (Nova Patente a cada 5 Níveis)
                    </span>
                  </h3>
                  <span className="font-mono text-[11px] font-bold px-2.5 py-1 rounded bg-[#0C0E12] text-[#F59E0B] border border-[#2A303C]">
                    NV 1 AO 100 • MÁX 1.000.000 XP
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mb-4">
                  Cada nível exige progressivamente mais pontos que o anterior. A
                  cada 5 níveis conquistados, você sobe de patente até atingir a
                  Lenda Suprema em 1.000.000 XP.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[540px] overflow-y-auto pr-1">
                  {SENAI_PATENTS.map((pat) => {
                    const divStyle = getDivisionStyle(pat.division);
                    return (
                      <div
                        key={pat.id}
                        className={`flex items-center justify-between px-3.5 py-2.5 rounded-md bg-[#0C0E12] border ${divStyle.border}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{pat.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#0047B6]/25 text-[#F59E0B] border border-[#0057E0]/40">
                                {pat.minLevel === pat.maxLevel
                                  ? `NV ${pat.minLevel}`
                                  : `NV ${pat.minLevel}–${pat.maxLevel}`}
                              </span>
                              <span className="font-mono text-[10px] text-[#94A3B8]">
                                {pat.badgeCode}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-white truncate mt-0.5">
                              {pat.title}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono text-[11px] text-[#F59E0B] font-semibold shrink-0 ml-2">
                          {pat.minXp.toLocaleString("pt-BR")} XP
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Student Profile View */
          <>
            {/* Top Dossier Banner */}
            <section className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden shadow-lg">
              <div className="h-1 w-full bg-gradient-to-r from-[#0047B6] via-[#F59E0B] to-emerald-500" />
              <div className="p-6 space-y-5">
                {/* Linha 1: Identidade do Usuário + Botões de Ação */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-4 min-w-0">
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      title="Clique para trocar sua foto ou editar seu perfil"
                      className="relative group shrink-0"
                    >
                      <UserAvatar
                        profile={profile}
                        size="xl"
                        roundedClassName="rounded-lg"
                        className="border-2 border-[#0057E0] group-hover:border-[#F59E0B] transition-colors"
                      />
                      <span className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Camera className="w-5 h-5 text-[#F59E0B]" />
                      </span>
                      {rankInfo && (
                        <span
                          title={rankInfo.currentPatent.title}
                          className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#181B20] border border-[#F59E0B] flex items-center justify-center text-sm shadow"
                        >
                          {rankInfo.currentPatent.icon}
                        </span>
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/40">
                          NÍVEL {rankInfo?.currentTier.level} /{" "}
                          {MAX_PLATFORM_LEVEL}
                        </span>
                        <span className="font-mono text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-[#0047B6]/25 text-blue-300 border border-[#0057E0]/50">
                          {rankInfo?.currentPatent.badgeCode} •{" "}
                          {rankInfo?.currentPatent.divisionLabel}
                        </span>
                        {profile.classGroup && (
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 inline-flex items-center gap-1">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {profile.classGroup}
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2 flex-wrap">
                        <span>{profile.displayName}</span>
                        <span className="text-sm font-mono font-bold text-emerald-400">
                          // {rankInfo?.currentPatent.title}
                        </span>
                      </h2>
                      <p className="font-mono text-xs text-[#94A3B8] truncate">
                        {profile.email} • {unlockedPatentsCount} de{" "}
                        {SENAI_PATENTS.length} Patentes Alcançadas
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowPassportModal(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md bg-[#0C0E12] hover:bg-[#14181F] text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors"
                      title="Visualizar e imprimir Passaporte Técnico SENAI (PDF)"
                    >
                      <Printer className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Passaporte PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-md text-xs font-bold border transition-colors ${
                        activeTab === "settings"
                          ? "bg-[#F59E0B] text-slate-950 border-[#F59E0B]"
                          : "bg-[#0C0E12] hover:bg-[#14181F] text-white border-[#F59E0B]/50"
                      }`}
                    >
                      <Camera
                        className={`w-3.5 h-3.5 shrink-0 ${
                          activeTab === "settings"
                            ? "text-slate-950"
                            : "text-[#F59E0B]"
                        }`}
                      />
                      <span>Editar Perfil & Foto</span>
                    </button>
                    <Link
                      href="/practice"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white text-xs font-bold transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Treinar & Ganhar XP</span>
                    </Link>
                    <button
                      onClick={() => signOutCurrentProfile()}
                      className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md bg-[#111317] hover:bg-red-950/40 text-[#94A3B8] hover:text-red-400 border border-[#2A303C] text-xs font-semibold transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Trocar Conta</span>
                    </button>
                  </div>
                </div>

                {/* Linha 2: Barras de Progresso em Largura Total (Nível Atual & Próxima Patente) */}
                {rankInfo && (
                  <div className="pt-4 border-t border-[#2A303C] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Box 1: Progresso do Nível Atual */}
                    <div className="bg-[#0C0E12] border border-[#2A303C] rounded-md p-4">
                      <div className="flex items-center justify-between gap-2 text-xs mb-2">
                        <span className="font-mono uppercase text-[#94A3B8] text-[11px] font-semibold">
                          Progresso Nível {rankInfo.currentTier.level}
                        </span>
                        <span className="font-mono font-bold text-[#F59E0B] text-xs">
                          {rankInfo.nextTier
                            ? `Faltam ${rankInfo.xpToNext.toLocaleString("pt-BR")} XP`
                            : "NÍVEL MÁXIMO (1M XP)"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#181B20] rounded-sm overflow-hidden border border-[#2A303C]">
                        <div
                          className="h-full bg-[#0047B6] transition-all duration-500"
                          style={{ width: `${rankInfo.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] font-mono text-[#94A3B8]">
                        <span>
                          Atual:{" "}
                          <strong className="text-white">
                            {profile.totalXp.toLocaleString("pt-BR")} XP
                          </strong>
                        </span>
                        {rankInfo.nextTier ? (
                          <span>
                            Meta NV {rankInfo.nextTier.level}:{" "}
                            <strong className="text-zinc-300">
                              {rankInfo.nextTier.minXp.toLocaleString("pt-BR")}{" "}
                              XP
                            </strong>
                          </span>
                        ) : (
                          <span>1.000.000 XP</span>
                        )}
                      </div>
                    </div>

                    {/* Box 2: Progresso para a Próxima Patente (a cada 5 níveis) */}
                    <div className="bg-[#0C0E12] border border-[#2A303C] rounded-md p-4">
                      <div className="flex items-center justify-between gap-2 text-xs mb-2">
                        <span className="font-mono uppercase text-[#94A3B8] text-[11px] font-semibold">
                          Próxima Patente (5 em 5 NV)
                        </span>
                        <span className="font-mono font-bold text-emerald-400 text-xs">
                          {rankInfo.nextPatent
                            ? `No NV ${rankInfo.nextPatent.minLevel} (faltam ${rankInfo.levelsToNextPatent} NV)`
                            : "PATENTE SUPREMA"}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#181B20] rounded-sm overflow-hidden border border-[#2A303C]">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${rankInfo.patentProgressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-2 text-[11px] font-mono text-[#94A3B8]">
                        <span className="truncate">
                          {rankInfo.nextPatent ? (
                            <>
                              Próxima:{" "}
                              <strong className="text-emerald-300">
                                {rankInfo.nextPatent.icon}{" "}
                                {rankInfo.nextPatent.title}
                              </strong>
                            </>
                          ) : (
                            "Você conquistou todas as 21 patentes!"
                          )}
                        </span>
                        {rankInfo.nextPatent && (
                          <span className="shrink-0 text-emerald-400 font-bold">
                            {rankInfo.patentProgressPct}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 4 Telemetry Metrics */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    XP Acumulado / Meta 1M
                  </span>
                  <Zap className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {profile.totalXp.toLocaleString("pt-BR")}{" "}
                  <span className="text-xs font-normal text-[#F59E0B]">XP</span>
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1 font-mono">
                  {rankInfo?.overallProgressPct}% de{" "}
                  {MAX_PLATFORM_XP.toLocaleString("pt-BR")} XP (NV 100)
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Patentes Alcançadas
                  </span>
                  <Crown className="w-4 h-4 text-[#F59E0B]" />
                </div>
                <div className="font-mono text-2xl font-bold text-white">
                  {unlockedPatentsCount}{" "}
                  <span className="text-sm text-[#94A3B8]">
                    / {SENAI_PATENTS.length}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-400 mt-1 truncate">
                  {rankInfo?.currentPatent.icon} {rankInfo?.currentPatent.title}
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Precisão & Volume
                  </span>
                  <Percent className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-emerald-400">
                  {overallAccuracy}%
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  {profile.totalHits} acertos em {profile.matchesPlayed} partidas
                </p>
              </div>

              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                    Maior Sequência & Recorde
                  </span>
                  <Flame className="w-4 h-4 text-amber-400" />
                </div>
                <div className="font-mono text-2xl font-bold text-amber-400">
                  {profile.bestStreak}x
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-1">
                  Melhor partida:{" "}
                  {(profile.highScoreMatch || 0).toLocaleString("pt-BR")} pts
                </p>
              </div>
            </section>

            {/* Navigation Tabs Bar */}
            <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("patents")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border transition-all ${
                  activeTab === "patents"
                    ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-[#F59E0B]" />
                <span>Patentes & Carreira</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-[#F59E0B]">
                  {unlockedPatentsCount}/{SENAI_PATENTS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("achievements")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border transition-all ${
                  activeTab === "achievements"
                    ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Award className="w-4 h-4 text-[#F59E0B]" />
                <span>Conquistas & Desafios</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-emerald-400">
                  {profile.unlockedAchievements.length}/
                  {ACHIEVEMENTS_CATALOG.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("history")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border transition-all ${
                  activeTab === "history"
                    ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Clock className="w-4 h-4 text-[#38BDF8]" />
                <span>Histórico de Partidas</span>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-black/40 text-zinc-300">
                  {profile.recentMatches.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("settings")}
                className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold border transition-all ${
                  activeTab === "settings"
                    ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                    : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                }`}
              >
                <Settings className="w-4 h-4 text-[#F59E0B]" />
                <span>Gerenciar Perfil & Foto</span>
              </button>
            </div>

            {/* ABA 1: PATENTES & PROGRESSÃO DE NÍVEIS (NOVA ABA) */}
            {activeTab === "patents" && rankInfo && (
              <div className="space-y-6">
                {/* Galeria das 21 Patentes Técnicas (a cada 5 níveis) */}
                <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#F59E0B]" />
                        <h3 className="text-base font-bold text-white">
                          Quadro de Patentes Técnicas SENAI (Nova Patente a cada 5 Níveis)
                        </h3>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Acompanhe todas as patentes que você já alcançou e veja
                        quais são as próximas insígnias até atingir o Nível 100
                        (1.000.000 XP).
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        {
                          id: "all" as const,
                          label: `Todas (${SENAI_PATENTS.length})`,
                        },
                        {
                          id: "unlocked" as const,
                          label: `Alcançadas (${unlockedPatentsCount})`,
                        },
                        {
                          id: "locked" as const,
                          label: `Bloqueadas (${
                            SENAI_PATENTS.length - unlockedPatentsCount
                          })`,
                        },
                      ].map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setPatentFilter(f.id)}
                          className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                            patentFilter === f.id
                              ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]"
                              : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatents.map((patent) => {
                      const isReached =
                        rankInfo.currentTier.level >= patent.minLevel;
                      const isCurrent =
                        rankInfo.currentPatent.id === patent.id;
                      const divStyle = getDivisionStyle(patent.division);
                      const xpMissing = Math.max(
                        0,
                        patent.minXp - profile.totalXp
                      );
                      const levelsMissing = Math.max(
                        0,
                        patent.minLevel - rankInfo.currentTier.level
                      );

                      return (
                        <div
                          key={patent.id}
                          className={`rounded-lg p-4 border transition-all flex flex-col justify-between bg-gradient-to-br ${
                            isCurrent
                              ? `${divStyle.glow} bg-[#0C0E12] border-2 border-[#F59E0B] shadow-lg`
                              : isReached
                              ? `${divStyle.glow} bg-[#0C0E12] border-emerald-500/50`
                              : "bg-[#111317]/60 border-[#2A303C] opacity-75"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span
                                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${divStyle.badge}`}
                              >
                                {patent.badgeCode} • {patent.divisionLabel}
                              </span>
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-[#181B20] text-[#F59E0B] border border-[#2A303C]">
                                {patent.minLevel === patent.maxLevel
                                  ? `NV ${patent.minLevel}`
                                  : `NV ${patent.minLevel} a ${patent.maxLevel}`}
                              </span>
                            </div>

                            <div className="flex items-start gap-3 mb-2">
                              <div
                                className={`w-11 h-11 rounded-lg flex items-center justify-center text-2xl shrink-0 border ${
                                  isReached
                                    ? "bg-[#181B20] border-[#F59E0B]/50"
                                    : "bg-[#181B20] border-[#2A303C] grayscale"
                                }`}
                              >
                                {patent.icon}
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                                  <span>{patent.title}</span>
                                </h4>
                                <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed">
                                  {patent.description}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#2A303C] space-y-2">
                            {isCurrent && rankInfo.nextPatent && (
                              <div>
                                <div className="flex items-center justify-between text-[10px] font-mono text-[#94A3B8] mb-1">
                                  <span>Progresso na Patente</span>
                                  <span className="text-[#F59E0B] font-bold">
                                    {rankInfo.patentProgressPct}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 bg-[#181B20] rounded-sm overflow-hidden">
                                  <div
                                    className="h-full bg-[#F59E0B]"
                                    style={{
                                      width: `${rankInfo.patentProgressPct}%`,
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-[#94A3B8]">
                                Requisito:{" "}
                                <strong className="text-white">
                                  {patent.minXp.toLocaleString("pt-BR")} XP
                                </strong>
                              </span>

                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#F59E0B]/20 text-[#F59E0B] font-bold border border-[#F59E0B]/40">
                                  <Sparkles className="w-3 h-3" /> ATUAL
                                </span>
                              ) : isReached ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />{" "}
                                  ALCANÇADA
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[#94A3B8]">
                                  <Lock className="w-3 h-3" /> Faltam{" "}
                                  {levelsMissing} NV (
                                  {xpMissing.toLocaleString("pt-BR")} XP)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Explorador da Curva Progressiva de 100 Níveis (0 a 1.000.000 XP) */}
                <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#0057E0]" />
                        <h3 className="text-base font-bold text-white">
                          Tabela Progressiva dos 100 Níveis (0 XP até 1.000.000 XP)
                        </h3>
                      </div>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        Cada nível exige mais pontos adicionales (+Δ XP) que o
                        nível anterior. Novos marcos de patente são destacados a
                        cada 5 níveis.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {levelRanges.map((rng, idx) => (
                        <button
                          key={rng.label}
                          type="button"
                          onClick={() => setLevelRangeIdx(idx)}
                          className={`px-2.5 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                            levelRangeIdx === idx
                              ? "bg-[#0047B6] border-[#0057E0] text-white"
                              : "bg-[#0C0E12] border-[#2A303C] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {rng.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {visibleLevels.map((tier) => {
                      const unlocked =
                        rankInfo.currentTier.level >= tier.level;
                      const isCurrentLevel =
                        rankInfo.currentTier.level === tier.level;
                      const isNewPatentMilestone =
                        tier.level === 1 || tier.level % 5 === 0;

                      return (
                        <div
                          key={tier.level}
                          className={`px-3.5 py-2.5 rounded-md border flex flex-col justify-between transition-colors ${
                            isCurrentLevel
                              ? "bg-[#0047B6]/20 border-[#F59E0B] shadow"
                              : unlocked
                              ? "bg-[#0C0E12] border-emerald-500/40"
                              : "bg-[#0C0E12]/60 border-[#2A303C] opacity-75"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                                  isCurrentLevel
                                    ? "bg-[#F59E0B] text-slate-950 border-[#F59E0B]"
                                    : unlocked
                                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                    : "bg-[#181B20] text-[#94A3B8] border-[#2A303C]"
                                }`}
                              >
                                NV {tier.level}
                              </span>
                              {isNewPatentMilestone && (
                                <span
                                  title="Marco de Nova Patente"
                                  className="text-xs px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30 font-mono font-bold"
                                >
                                  {tier.patentIcon} {tier.patentCode}
                                </span>
                              )}
                            </div>

                            <span className="font-mono text-xs font-bold text-white">
                              {tier.minXp.toLocaleString("pt-BR")} XP
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between text-[11px]">
                            <span className="text-[#94A3B8] truncate pr-2">
                              {tier.title}
                            </span>
                            <span className="font-mono text-[10px] text-[#F59E0B] shrink-0">
                              {tier.level === 1
                                ? "Início"
                                : `+${tier.deltaXpRequired.toLocaleString("pt-BR")} XP`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            )}

            {/* ABA 2: CONQUISTAS & DESAFIOS TÉCNICOS (58 CONQUISTAS REVALIDADAS & EXTREMAS) */}
            {activeTab === "achievements" && (
              <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Award className="w-5 h-5 text-[#F59E0B]" />
                      <h3 className="text-base font-bold text-white">
                        Insígnias & Desafios Técnicos SENAI (
                        {profile.unlockedAchievements.length}/
                        {ACHIEVEMENTS_CATALOG.length})
                      </h3>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                        {Math.round(
                          (profile.unlockedAchievements.length /
                            Math.max(1, ACHIEVEMENTS_CATALOG.length)) *
                            100
                        )}
                        % CONCLUÍDO
                      </span>
                    </div>
                    <p className="text-xs text-[#94A3B8] mt-1">
                      Catálogo expandido e revalidado: precisão zero defeito,
                      combos de alta frequência, maestria nas 6 bancadas (incluindo
                      Reparo de PCI), manobras inovadoras e desafios lendários.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={revalidatingAch}
                    onClick={handleRevalidateAchievements}
                    className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-md bg-[#0C0E12] hover:bg-[#14181F] disabled:opacity-50 border border-[#F59E0B]/60 text-xs font-mono font-bold text-[#F59E0B] shrink-0 transition-colors"
                    title="Auditar e revalidar todas as conquistas com base nas estatísticas do seu perfil"
                  >
                    <RotateCcw
                      className={`w-3.5 h-3.5 ${
                        revalidatingAch ? "animate-spin" : ""
                      }`}
                    />
                    <span>
                      {revalidatingAch
                        ? "Auditando Dossiê..."
                        : `Revalidar Conquistas (${ACHIEVEMENTS_CATALOG.length})`}
                    </span>
                  </button>
                </div>

                {revalidationMsg && (
                  <div className="p-3.5 rounded-md bg-[#12241D] border border-emerald-500/50 border-l-4 border-l-emerald-400 text-xs font-mono text-emerald-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{revalidationMsg}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setRevalidationMsg(null)}
                      className="text-emerald-300 hover:text-white shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Resumo Rápido por Nível de Dificuldade */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {(
                    [
                      {
                        id: "facil" as const,
                        label: "Fácil",
                        color: "text-emerald-300 border-emerald-500/30",
                      },
                      {
                        id: "medio" as const,
                        label: "Médio",
                        color: "text-blue-300 border-blue-500/30",
                      },
                      {
                        id: "dificil" as const,
                        label: "Difícil",
                        color: "text-amber-300 border-amber-500/30",
                      },
                      {
                        id: "extremo" as const,
                        label: "Extremo",
                        color: "text-red-300 border-red-500/30",
                      },
                      {
                        id: "lendario" as const,
                        label: "Lendário",
                        color: "text-purple-300 border-purple-500/40",
                      },
                    ] as const
                  ).map((tier) => {
                    const totalInTier = ACHIEVEMENTS_CATALOG.filter(
                      (a) => a.difficulty === tier.id
                    ).length;
                    const unlockedInTier = ACHIEVEMENTS_CATALOG.filter(
                      (a) =>
                        a.difficulty === tier.id &&
                        profile.unlockedAchievements.includes(a.id)
                    ).length;
                    const isSelected = difficultyFilter === tier.id;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() =>
                          setDifficultyFilter((prev) =>
                            prev === tier.id ? "all" : tier.id
                          )
                        }
                        className={`p-2.5 rounded-md bg-[#0C0E12] border text-left transition-all ${
                          isSelected
                            ? "border-[#F59E0B] ring-1 ring-[#F59E0B]/40"
                            : tier.color
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase">
                          <span className="font-bold">{tier.label}</span>
                          <span className="text-white font-bold">
                            {unlockedInTier}/{totalInTier}
                          </span>
                        </div>
                        <div className="w-full h-1 bg-[#181B20] rounded-sm overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-[#F59E0B]"
                            style={{
                              width: `${Math.round(
                                (unlockedInTier / Math.max(1, totalInTier)) *
                                  100
                              )}%`,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Filtros Combinados: Categoria, Dificuldade e Status */}
                <div className="p-3.5 rounded-md bg-[#0C0E12] border border-[#2A303C] space-y-3">
                  {/* Linha 1: Categorias */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mr-1">
                      Categoria:
                    </span>
                    <button
                      type="button"
                      onClick={() => setCategoryFilter("all")}
                      className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                        categoryFilter === "all"
                          ? "bg-[#0047B6] border-[#0057E0] text-white"
                          : "bg-[#181B20] border-[#2A303C] text-[#94A3B8] hover:text-white"
                      }`}
                    >
                      Todas ({ACHIEVEMENTS_CATALOG.length})
                    </button>
                    {ACHIEVEMENT_CATEGORIES.map((cat) => {
                      const count = ACHIEVEMENTS_CATALOG.filter(
                        (a) => a.category === cat.id
                      ).length;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryFilter(cat.id)}
                          className={`px-2.5 py-1 rounded text-xs font-mono font-bold border transition-colors ${
                            categoryFilter === cat.id
                              ? "bg-[#0047B6] border-[#0057E0] text-white"
                              : "bg-[#181B20] border-[#2A303C] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {cat.shortLabel} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Linha 2: Dificuldade e Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#181B20]">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mr-1">
                        Dificuldade:
                      </span>
                      {[
                        {
                          id: "all" as const,
                          label: `Todas (${ACHIEVEMENTS_CATALOG.length})`,
                        },
                        { id: "facil" as const, label: "Fácil" },
                        { id: "medio" as const, label: "Médio" },
                        { id: "dificil" as const, label: "Difícil" },
                        { id: "extremo" as const, label: "Extremo" },
                        { id: "lendario" as const, label: "Lendário" },
                      ].map((df) => (
                        <button
                          key={df.id}
                          type="button"
                          onClick={() => setDifficultyFilter(df.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                            difficultyFilter === df.id
                              ? "bg-[#F59E0B]/20 border-[#F59E0B] text-[#F59E0B]"
                              : "bg-[#181B20] border-[#2A303C] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {df.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mr-1">
                        Status:
                      </span>
                      {[
                        { id: "all" as const, label: "Todas" },
                        { id: "unlocked" as const, label: "Conquistadas" },
                        { id: "in_progress" as const, label: "Em Progresso" },
                        { id: "locked" as const, label: "Bloqueadas" },
                      ].map((sf) => (
                        <button
                          key={sf.id}
                          type="button"
                          onClick={() => setAchievementStatusFilter(sf.id)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold border transition-colors ${
                            achievementStatusFilter === sf.id
                              ? "bg-emerald-950/70 border-emerald-400 text-emerald-300"
                              : "bg-[#181B20] border-[#2A303C] text-[#94A3B8] hover:text-white"
                          }`}
                        >
                          {sf.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {filteredAchievements.length === 0 ? (
                  <div className="p-8 rounded-md bg-[#0C0E12] border border-[#2A303C] text-center">
                    <p className="text-sm font-bold text-white">
                      Nenhuma conquista corresponde aos filtros selecionados
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter("all");
                        setDifficultyFilter("all");
                        setAchievementStatusFilter("all");
                      }}
                      className="mt-3 px-3.5 py-1.5 rounded bg-[#0047B6] text-white text-xs font-mono font-bold"
                    >
                      Limpar Filtros
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {filteredAchievements.map((ach) => {
                      const unlocked = profile.unlockedAchievements.includes(
                        ach.id
                      );
                      const prog = getAchievementProgressForProfile(
                        ach,
                        profile
                      );
                      const diffClass = getDifficultyBadgeStyle(ach.difficulty);
                      const catMeta = ACHIEVEMENT_CATEGORIES.find(
                        (c) => c.id === ach.category
                      );

                      return (
                        <div
                          key={ach.id}
                          className={`p-4 rounded-md border transition-all flex flex-col justify-between ${
                            unlocked
                              ? "bg-[#0C0E12] border-emerald-500/50 shadow-sm"
                              : "bg-[#111317]/70 border-[#2A303C]"
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span
                                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${
                                    unlocked
                                      ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40"
                                      : "bg-[#181B20] text-[#94A3B8] border-[#2A303C]"
                                  }`}
                                >
                                  {ach.code}
                                </span>
                                <span
                                  className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${diffClass}`}
                                >
                                  {ach.difficultyLabel}
                                </span>
                                {catMeta && (
                                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#181B20] text-[#94A3B8] border border-[#2A303C]">
                                    {catMeta.shortLabel}
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-xs font-bold text-[#F59E0B] shrink-0">
                                +{ach.xpReward.toLocaleString("pt-BR")} XP
                              </span>
                            </div>

                            <h4 className="text-sm font-bold text-white mb-1 flex items-center gap-1.5">
                              {unlocked ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              ) : (
                                <Lock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                              )}
                              <span>{ach.title}</span>
                            </h4>
                            <p className="text-xs text-[#94A3B8] leading-relaxed">
                              {ach.description}
                            </p>
                          </div>

                          <div className="mt-4 pt-2.5 border-t border-[#2A303C] space-y-1.5">
                            <div className="flex items-center justify-between text-[10px] font-mono">
                              <span className="text-[#94A3B8]">
                                Progresso:{" "}
                                <strong className="text-white">
                                  {prog.current.toLocaleString("pt-BR")} /{" "}
                                  {prog.target.toLocaleString("pt-BR")}{" "}
                                  {ach.unitLabel}
                                </strong>
                              </span>
                              <span
                                className={
                                  unlocked
                                    ? "text-emerald-400 font-bold"
                                    : "text-[#F59E0B] font-bold"
                                }
                              >
                                {unlocked ? "CONQUISTADA" : `${prog.pct}%`}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-[#181B20] rounded-sm overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  unlocked ? "bg-emerald-500" : "bg-[#0047B6]"
                                }`}
                                style={{ width: `${prog.pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* ABA 3: HISTÓRICO DE PARTIDAS */}
            {activeTab === "history" && (
              <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-[#0057E0]" />
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Histórico de Partidas ({profile.recentMatches.length})
                      </h3>
                      <p className="text-xs text-[#94A3B8]">
                        Registro cronológico das suas últimas partidas em Sala
                        (PIN) e Treino Individual.
                      </p>
                    </div>
                  </div>
                </div>

                {profile.recentMatches.length === 0 ? (
                  <div className="p-8 rounded-md bg-[#0C0E12] border border-[#2A303C] text-center">
                    <Target className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                    <p className="text-sm font-bold text-white mb-1">
                      Nenhuma partida registrada ainda
                    </p>
                    <p className="text-xs text-[#94A3B8] mb-4">
                      Jogue uma partida em Sala de Aula usando um PIN ou conclua
                      uma sessão no Treino Individual para registrar seu
                      histórico e ganhar XP!
                    </p>
                    <Link
                      href="/practice"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white text-xs font-bold"
                    >
                      Iniciar Treino Individual Agora
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-[#2A303C] font-mono text-[10px] uppercase tracking-wider text-[#94A3B8]">
                          <th className="py-3 px-3">Data / Hora</th>
                          <th className="py-3 px-3">Modalidade</th>
                          <th className="py-3 px-3">Prova / Minigame</th>
                          <th className="py-3 px-3 text-center">
                            Acertos / Erros
                          </th>
                          <th className="py-3 px-3 text-center">Precisão</th>
                          <th className="py-3 px-3 text-right">Pontos</th>
                          <th className="py-3 px-3 text-right">XP Ganho</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#2A303C] text-xs">
                        {profile.recentMatches.map((match) => {
                          const dateStr = new Date(
                            match.playedAt
                          ).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          });
                          return (
                            <tr
                              key={match.id}
                              className="hover:bg-[#111317]/60 transition-colors"
                            >
                              <td className="py-3 px-3 font-mono text-[#94A3B8]">
                                {dateStr}
                              </td>
                              <td className="py-3 px-3">
                                {match.mode === "room" ? (
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0047B6]/25 text-blue-300 border border-[#0057E0]/40">
                                    SALA #{match.roomPin || "PIN"}
                                  </span>
                                ) : (
                                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#0C0E12] text-[#94A3B8] border border-[#2A303C]">
                                    TREINO SOLO
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 font-semibold text-white">
                                {match.gameTitle}
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span className="text-emerald-400 font-bold">
                                  {match.hits}C
                                </span>{" "}
                                /{" "}
                                <span className="text-red-400 font-bold">
                                  {match.misses}E
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-mono">
                                <span
                                  className={`px-2 py-0.5 rounded font-bold ${
                                    match.accuracy >= 80
                                      ? "bg-emerald-950/60 text-emerald-400"
                                      : match.accuracy >= 50
                                      ? "bg-amber-950/60 text-amber-400"
                                      : "bg-red-950/60 text-red-400"
                                  }`}
                                >
                                  {match.accuracy}%
                                </span>
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-white">
                                {match.score.toLocaleString("pt-BR")} pts
                              </td>
                              <td className="py-3 px-3 text-right font-mono font-bold text-[#F59E0B]">
                                +{match.xpEarned} XP
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* ABA 4: GERENCIAR PERFIL, FOTO PRÓPRIA & CONTAS */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                {profileFeedback && (
                  <div
                    className={`rounded-md px-4 py-3 border border-l-4 flex items-center justify-between gap-3 text-xs font-mono ${
                      profileFeedback.type === "success"
                        ? "bg-[#12241D] border-emerald-500/50 border-l-emerald-400 text-emerald-200"
                        : "bg-red-950/60 border-red-500/50 border-l-red-500 text-red-200"
                    }`}
                  >
                    <span className="flex items-center gap-2 font-bold">
                      {profileFeedback.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      )}
                      {profileFeedback.text}
                    </span>
                    <button
                      type="button"
                      onClick={() => setProfileFeedback(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Coluna Principal (7 cols): Identidade Técnica & Foto Própria */}
                  <section className="lg:col-span-7 bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden shadow-lg">
                    <div className="h-1 w-full bg-[#0047B6]" />
                    <form
                      onSubmit={handleSaveProfileChanges}
                      className="p-6 space-y-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Settings className="w-5 h-5 text-[#F59E0B]" />
                            <h3 className="text-base font-bold text-white">
                              Personalizar Identidade & Foto de Perfil
                            </h3>
                          </div>
                          <p className="text-xs text-[#94A3B8] mt-0.5">
                            Altere seu nome de perfil, informe sua turma e
                            escolha uma foto própria do seu dispositivo (ou link)
                            para representá-lo no Ranking e nas Salas de Aula.
                          </p>
                        </div>
                      </div>

                      {/* Card de Pré-visualização ao Vivo */}
                      <div className="p-4 rounded-lg bg-[#0C0E12] border border-[#2A303C] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5">
                          <div className="relative">
                            <UserAvatar
                              avatar={editAvatar}
                              photoURL={editPhotoURL}
                              avatarMode={
                                editPhotoURL ? editAvatarMode : "emoji"
                              }
                              name={editName || profile.displayName}
                              size="xl"
                              roundedClassName="rounded-lg"
                              className="border-2 border-[#0057E0]"
                            />
                            {rankInfo && (
                              <span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#181B20] border border-[#F59E0B] flex items-center justify-center text-xs">
                                {rankInfo.currentPatent.icon}
                              </span>
                            )}
                          </div>
                          <div>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-[#F59E0B] font-bold block">
                              PRÉ-VISUALIZAÇÃO DO PERFIL
                            </span>
                            <h4 className="text-base font-bold text-white">
                              {editName.trim() || "Sem Nome"}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#181B20] border border-[#2A303C] text-emerald-400 font-bold">
                                {editPhotoURL && editAvatarMode === "photo"
                                  ? "📷 FOTO PRÓPRIA ATIVA"
                                  : `⚡ INSÍGNIA EMOJI (${editAvatar})`}
                              </span>
                              {editClassGroup.trim() && (
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-bold">
                                  {editClassGroup.trim()}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Alternador Rápido Foto vs Emoji */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              if (editPhotoURL) {
                                setEditAvatarMode("photo");
                              } else {
                                editFileInputRef.current?.click();
                              }
                            }}
                            className={`px-3 py-1.5 rounded text-xs font-mono font-bold border inline-flex items-center gap-1.5 transition-colors ${
                              editPhotoURL && editAvatarMode === "photo"
                                ? "bg-[#0047B6] border-[#0057E0] text-white"
                                : "bg-[#181B20] border-[#2A303C] text-[#94A3B8] hover:text-white"
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>Usar Foto</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditAvatarMode("emoji")}
                            className={`px-3 py-1.5 rounded text-xs font-mono font-bold border inline-flex items-center gap-1.5 transition-colors ${
                              !editPhotoURL || editAvatarMode === "emoji"
                                ? "bg-[#0047B6] border-[#0057E0] text-white"
                                : "bg-[#181B20] border-[#2A303C] text-[#94A3B8] hover:text-white"
                            }`}
                          >
                            <Smile className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>Usar Emoji</span>
                          </button>
                        </div>
                      </div>

                      {/* Campos de Nome, Turma e E-mail */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1.5">
                            Nome de Perfil / Apelido Técnico *
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={24}
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Ex: Gabriel Silva"
                            className="w-full px-3.5 py-2.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0057E0] focus:outline-none text-xs font-semibold text-white"
                          />
                          <span className="font-mono text-[10px] text-[#94A3B8] mt-1 block">
                            Exibido no Ranking Global, Perfil e Salas PIN (máx.
                            24 caracteres).
                          </span>
                        </div>

                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1.5">
                            Turma / Unidade SENAI (Opcional)
                          </label>
                          <input
                            type="text"
                            maxLength={36}
                            value={editClassGroup}
                            onChange={(e) => setEditClassGroup(e.target.value)}
                            placeholder="Ex: Eletrotécnica 2026 • T1"
                            className="w-full px-3.5 py-2.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0057E0] focus:outline-none text-xs text-white"
                          />
                          <span className="font-mono text-[10px] text-[#94A3B8] mt-1 block">
                            Identifica sua turma ou unidade no Dossiê e no
                            Ranking.
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1.5">
                          E-mail de Identificação
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          placeholder="aluno@aluno.senai.br"
                          className="w-full px-3.5 py-2.5 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0057E0] focus:outline-none text-xs text-white font-mono"
                        />
                      </div>

                      {/* Bloco 1: Escolha de Foto Própria */}
                      <div className="p-4 rounded-lg bg-[#0C0E12] border border-[#2A303C] space-y-3.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Camera className="w-4 h-4 text-[#F59E0B]" />
                            <h4 className="text-xs font-mono uppercase tracking-wider font-bold text-white">
                              Opção 1 • Foto Própria do Usuário
                            </h4>
                          </div>
                          {editPhotoURL && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditPhotoURL("");
                                setCustomUrlInput("");
                                setEditAvatarMode("emoji");
                              }}
                              className="text-[11px] font-mono text-red-400 hover:underline inline-flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" /> Remover foto
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                          <input
                            ref={editFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleEditFileUpload}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => editFileInputRef.current?.click()}
                            className="px-3.5 py-2.5 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white text-xs font-bold inline-flex items-center gap-2 transition-colors shadow"
                          >
                            <Upload className="w-3.5 h-3.5 text-[#F59E0B]" />
                            <span>
                              Enviar Foto do Dispositivo (PC / Celular)
                            </span>
                          </button>

                          {profile.googlePhotoURL && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditPhotoURL(profile.googlePhotoURL || "");
                                setEditAvatarMode("photo");
                              }}
                              className="px-3 py-2.5 rounded-md bg-[#181B20] hover:bg-[#242933] border border-[#2A303C] text-xs font-semibold text-zinc-200 inline-flex items-center gap-1.5"
                            >
                              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Usar Foto da Conta Google</span>
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                            Ou informe o link direto (URL) de uma imagem:
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <Link2 className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="url"
                                value={customUrlInput}
                                onChange={(e) =>
                                  setCustomUrlInput(e.target.value)
                                }
                                placeholder="https://exemplo.com/minha-foto.jpg"
                                className="w-full pl-8 pr-3 py-2 rounded-md bg-[#181B20] border border-[#2A303C] focus:border-[#0057E0] focus:outline-none text-xs text-white font-mono"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={handleApplyExternalPhotoUrl}
                              className="px-3.5 py-2 rounded-md bg-[#181B20] hover:bg-[#242933] border border-[#F59E0B]/50 text-[#F59E0B] font-mono text-xs font-bold shrink-0"
                            >
                              Aplicar Link
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Bloco 2: Insígnia Emoji Técnica */}
                      <div className="p-4 rounded-lg bg-[#0C0E12] border border-[#2A303C] space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs uppercase tracking-wider font-bold text-white flex items-center gap-2">
                            <Smile className="w-4 h-4 text-[#F59E0B]" />
                            <span>
                              Opção 2 • Insígnia Técnica (Emoji ou Fallback)
                            </span>
                          </span>
                          <span className="font-mono text-[10px] text-[#94A3B8]">
                            Clique em um emoji para selecioná-lo
                          </span>
                        </div>
                        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
                          {AVATARS.map((av) => {
                            const isSelectedEmoji = editAvatar === av;
                            const isActiveEmojiMode =
                              isSelectedEmoji &&
                              (!editPhotoURL || editAvatarMode === "emoji");
                            return (
                              <button
                                key={av}
                                type="button"
                                onClick={() => {
                                  setEditAvatar(av);
                                  setEditAvatarMode("emoji");
                                }}
                                className={`h-10 rounded-md flex items-center justify-center text-lg border transition-all ${
                                  isActiveEmojiMode
                                    ? "bg-[#0047B6]/30 border-2 border-[#F59E0B] shadow"
                                    : isSelectedEmoji
                                    ? "bg-[#181B20] border-[#0057E0]"
                                    : "bg-[#181B20] border-[#2A303C] hover:border-slate-500"
                                }`}
                              >
                                {av}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 flex items-center justify-end gap-3">
                        <button
                          type="submit"
                          disabled={profileSaving}
                          className="w-full sm:w-auto px-6 py-3 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-colors shadow-lg"
                        >
                          <Save className="w-4 h-4" />
                          <span>
                            {profileSaving
                              ? "Salvando Perfil..."
                              : "Salvar Alterações do Perfil"}
                          </span>
                        </button>
                      </div>
                    </form>
                  </section>

                  {/* Coluna Lateral (5 cols): Contas no Computador & Zona de Segurança */}
                  <div className="lg:col-span-5 space-y-6">
                    {/* Card 1: Alternar Perfis Salvos neste Computador (Modo Laboratório) */}
                    <section className="bg-[#181B20] border border-[#2A303C] rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Users className="w-5 h-5 text-[#F59E0B]" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                            Perfis neste Computador ({savedProfiles.length})
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => signOutCurrentProfile()}
                          className="px-2.5 py-1 rounded bg-[#0C0E12] hover:bg-[#14181F] border border-[#2A303C] text-[11px] font-mono font-bold text-[#F59E0B]"
                        >
                          + Outra Conta
                        </button>
                      </div>
                      <p className="text-xs text-[#94A3B8] leading-relaxed">
                        Em computadores compartilhados de laboratório, você pode
                        alternar rapidamente entre perfis salvos ou remover sua
                        conta da máquina ao terminar a aula.
                      </p>

                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {savedProfiles.map((sp) => {
                          const isCurrent = sp.uid === profile.uid;
                          const spRank = getRankInfoByXp(sp.totalXp);
                          return (
                            <div
                              key={sp.uid}
                              className={`p-3 rounded-md border flex items-center justify-between gap-3 ${
                                isCurrent
                                  ? "bg-[#0047B6]/15 border-[#0057E0]"
                                  : "bg-[#0C0E12] border-[#2A303C]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <UserAvatar
                                  profile={sp}
                                  size="md"
                                  className="border border-[#2A303C]"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <p className="text-xs font-bold text-white truncate">
                                      {sp.displayName}
                                    </p>
                                    {isCurrent && (
                                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                                        ATIVO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] font-mono text-[#F59E0B] truncate">
                                    {spRank.currentPatent.icon} NV{" "}
                                    {spRank.currentTier.level} •{" "}
                                    {sp.totalXp.toLocaleString("pt-BR")} XP
                                  </p>
                                  {sp.classGroup && (
                                    <p className="text-[10px] font-mono text-[#94A3B8] truncate">
                                      {sp.classGroup}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {!isCurrent && (
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    disabled={profileSaving}
                                    onClick={() =>
                                      handleSwitchSavedProfile(sp.uid)
                                    }
                                    className="px-2.5 py-1.5 rounded bg-[#0047B6] hover:bg-[#0057E0] text-white font-mono text-[11px] font-bold"
                                  >
                                    Ativar
                                  </button>
                                  <button
                                    type="button"
                                    title="Remover este perfil apenas deste computador"
                                    onClick={() => {
                                      removeLocalSavedProfileOnly(sp.uid);
                                      refreshSavedProfiles();
                                    }}
                                    className="p-1.5 rounded bg-[#181B20] hover:bg-red-950/50 border border-[#2A303C] text-[#94A3B8] hover:text-red-400"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>

                    {/* Card 2: Zona de Segurança & Gerenciamento de Dados */}
                    <section className="bg-[#181B20] border border-red-500/30 rounded-lg p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                          Gerenciamento de Progresso & Conta
                        </h3>
                      </div>

                      {/* Ação 1: Zerar Progresso Próprio */}
                      <div className="p-3.5 rounded-md bg-[#0C0E12] border border-[#2A303C] space-y-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-amber-400">
                            Redefinir Meu Progresso (Zerar XP e Histórico)
                          </h4>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                            Zera seu XP acumulado, conquistas e histórico de
                            partidas para recomeçar do Nível 1, mantendo seu
                            nome, foto e turma.
                          </p>
                        </div>
                        {confirmResetProgress ? (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={profileSaving}
                              onClick={handleResetMyProgress}
                              className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold"
                            >
                              Confirmar Reset de XP
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmResetProgress(false)}
                              className="px-3 py-1.5 rounded bg-[#181B20] border border-[#2A303C] text-xs text-zinc-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmResetProgress(true)}
                            className="px-3 py-1.5 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Zerar Meu Progresso</span>
                          </button>
                        )}
                      </div>

                      {/* Ação 2: Excluir Perfil Permanentemente */}
                      <div className="p-3.5 rounded-md bg-[#0C0E12] border border-red-500/30 space-y-2.5">
                        <div>
                          <h4 className="text-xs font-bold text-red-400">
                            Excluir Meu Perfil Permanentemente
                          </h4>
                          <p className="text-[11px] text-[#94A3B8] mt-0.5 leading-relaxed">
                            Remove sua conta deste computador e do Ranking
                            Global da plataforma SENAI. Esta ação não pode ser
                            desfeita.
                          </p>
                        </div>
                        {confirmDeleteAccount ? (
                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              disabled={profileSaving}
                              onClick={handleDeleteMyProfile}
                              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold"
                            >
                              Confirmar Exclusão Definitiva
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteAccount(false)}
                              className="px-3 py-1.5 rounded bg-[#181B20] border border-[#2A303C] text-xs text-zinc-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteAccount(true)}
                            className="px-3 py-1.5 rounded bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 text-red-300 font-mono text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Excluir Meu Perfil</span>
                          </button>
                        )}
                      </div>
                    </section>
                  </div>
                </div>
              </div>
            )}
            <TechnicalPassportModal
              profile={profile}
              open={showPassportModal}
              onClose={() => setShowPassportModal(false)}
            />
          </>
        )}
      </div>
    </main>
  );
}
