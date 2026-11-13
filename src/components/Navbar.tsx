"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  BookOpen,
  Trophy,
  UserCheck,
  MonitorPlay,
  LogIn,
  LogOut,
  X,
  Award,
  Radio,
  AlertTriangle,
} from "lucide-react";
import {
  UserProfile,
  subscribeToActiveProfile,
  signInWithGoogleAccount,
  signInWithQuickGoogleSimulation,
  signOutCurrentProfile,
  formatGoogleAuthError,
} from "@/lib/profileService";
import { getRankInfoByXp } from "@/data/achievementsData";
import { AVATARS } from "@/data/electronicsData";

export default function Navbar() {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [simName, setSimName] = useState("");
  const [simEmail, setSimEmail] = useState("");
  const [simAvatar, setSimAvatar] = useState(AVATARS[0]);
  const [authLoading, setAuthLoading] = useState(false);
  const [authErrorMsg, setAuthErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeToActiveProfile((prof) => {
      setProfile(prof);
    });
    return () => unsub();
  }, []);

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthErrorMsg(null);
    try {
      const signed = await signInWithGoogleAccount();
      if (signed) {
        setShowAuthModal(false);
      }
    } catch (err) {
      setAuthErrorMsg(formatGoogleAuthError(err));
      setShowAuthModal(true);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simName.trim()) return;
    setAuthLoading(true);
    setAuthErrorMsg(null);
    try {
      await signInWithQuickGoogleSimulation(simName, simEmail, simAvatar);
      setShowAuthModal(false);
      setSimName("");
      setSimEmail("");
    } finally {
      setAuthLoading(false);
    }
  };

  const rankInfo = profile ? getRankInfoByXp(profile.totalXp) : null;

  const navItems = [
    { href: "/", label: "Acesso PIN", icon: Radio },
    { href: "/practice", label: "Catálogo & Treino", icon: BookOpen },
    { href: "/leaderboard", label: "Ranking Global", icon: Trophy },
    { href: "/profile", label: "Perfil & Patentes", icon: Award },
    { href: "/host", label: "Professor", icon: MonitorPlay },
  ];

  return (
    <>
      <header className="border-b border-[#2A303C] bg-[#181B20]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0 group">
            <div className="w-9 h-9 rounded-md bg-[#0047B6] border border-[#0057E0] flex items-center justify-center shadow-sm group-hover:bg-[#0057E0] transition-colors">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#94A3B8] font-semibold">
                  SENAI // V2.0
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <h1 className="text-sm font-bold tracking-tight text-white leading-tight">
                Arena Eletrônica
              </h1>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all border ${
                    isActive
                      ? "bg-[#0047B6]/20 border-[#0057E0] text-white"
                      : "bg-[#111317] border-[#2A303C] text-[#94A3B8] hover:text-white hover:border-slate-600"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      isActive ? "text-[#F59E0B]" : "text-[#94A3B8]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right User / Google Auth Status */}
          <div className="flex items-center gap-2">
            {profile && rankInfo ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-[#0C0E12] border border-[#2A303C] hover:border-[#0057E0] transition-colors"
                  title="Ver Perfil, Histórico e Conquistas"
                >
                  <span className="text-base leading-none">{profile.avatar}</span>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate max-w-[110px]">
                        {profile.displayName}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30">
                        {rankInfo.currentPatent.icon} NV {rankInfo.currentTier.level}
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-emerald-400 font-semibold truncate max-w-[160px]">
                      {rankInfo.currentPatent.title} •{" "}
                      {profile.totalXp.toLocaleString("pt-BR")} XP
                    </div>
                  </div>
                </Link>
                <button
                  onClick={() => signOutCurrentProfile()}
                  title="Sair da conta"
                  className="p-2 rounded-md bg-[#111317] hover:bg-red-950/40 text-[#94A3B8] hover:text-red-400 border border-[#2A303C] transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthErrorMsg(null);
                  setShowAuthModal(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white text-xs font-bold border border-[#0057E0] transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-[#F59E0B]" />
                <span>Entrar com Google</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Secondary Navigation Bar */}
        <div className="flex md:hidden items-center gap-1.5 overflow-x-auto px-4 py-2 bg-[#111317] border-t border-[#2A303C]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap border ${
                  isActive
                    ? "bg-[#0047B6]/20 border-[#0057E0] text-white"
                    : "bg-[#181B20] border-[#2A303C] text-[#94A3B8]"
                }`}
              >
                <Icon className="w-3 h-3 text-[#F59E0B]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Google Login / Student Account Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181B20] border border-[#2A303C] rounded-lg max-w-md w-full overflow-hidden shadow-2xl">
            <div className="h-1 w-full bg-[#0047B6]" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#F59E0B]" />
                  <h2 className="text-base font-bold text-white">
                    Autenticação do Aluno (Google)
                  </h2>
                </div>
                <button
                  onClick={() => setShowAuthModal(false)}
                  className="p-1.5 rounded-md bg-[#111317] text-[#94A3B8] hover:text-white border border-[#2A303C]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-[#94A3B8] mb-4 leading-relaxed">
                Conecte sua conta Google para salvar seu{" "}
                <strong className="text-white">XP acumulado</strong>,{" "}
                <strong className="text-white">histórico de partidas</strong>,{" "}
                <strong className="text-white">conquistas</strong> e participar do{" "}
                <strong className="text-[#F59E0B]">Ranking Global SENAI</strong>.
              </p>

              {authErrorMsg && (
                <div className="mb-4 p-3 rounded-md bg-amber-950/70 border border-amber-500/50 text-amber-200 text-xs flex items-start gap-2 leading-relaxed">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>{authErrorMsg}</span>
                </div>
              )}

              {/* Official Firebase Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={authLoading}
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
                    : "Autenticar com Google OAuth"}
                </span>
              </button>

              <div className="relative flex py-2 items-center mb-4">
                <div className="flex-grow border-t border-[#2A303C]" />
                <span className="shrink mx-3 font-mono text-[10px] uppercase tracking-widest text-[#94A3B8]">
                  ou Acesso Rápido Google Educacional
                </span>
                <div className="flex-grow border-t border-[#2A303C]" />
              </div>

              <form onSubmit={handleQuickGoogleSubmit} className="space-y-3">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                    Nome do Aluno / Técnico
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={24}
                    value={simName}
                    onChange={(e) => setSimName(e.target.value)}
                    placeholder="Ex: Gabriel Silva"
                    className="w-full px-3 py-2 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0047B6] focus:outline-none text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                    E-mail Google (@gmail.com / @aluno.senai.br)
                  </label>
                  <input
                    type="email"
                    value={simEmail}
                    onChange={(e) => setSimEmail(e.target.value)}
                    placeholder="gabriel.silva@aluno.senai.br"
                    className="w-full px-3 py-2 rounded-md bg-[#0C0E12] border border-[#2A303C] focus:border-[#0047B6] focus:outline-none text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-[#94A3B8] mb-1">
                    Insígnia do Perfil
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {AVATARS.map((av) => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setSimAvatar(av)}
                        className={`h-8 rounded flex items-center justify-center text-base border transition-all ${
                          simAvatar === av
                            ? "bg-[#0047B6]/25 border-[#F59E0B]"
                            : "bg-[#0C0E12] border-[#2A303C]"
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 rounded-md bg-[#0047B6] hover:bg-[#0057E0] disabled:opacity-60 text-white font-bold text-xs uppercase tracking-wider transition-colors"
                >
                  Vincular Conta & Iniciar Perfil
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
