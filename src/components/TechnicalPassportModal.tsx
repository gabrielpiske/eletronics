"use client";

import React from "react";
import { UserProfile } from "@/lib/profileService";
import {
  ACHIEVEMENTS_CATALOG,
  MAX_PLATFORM_LEVEL,
  SENAI_PATENTS,
  getRankInfoByXp,
} from "@/data/achievementsData";
import { MINIGAMES_CATALOG } from "@/data/electronicsData";
import { UserAvatar } from "@/components/UserAvatar";
import {
  X,
  Printer,
  ShieldCheck,
  Award,
  CheckCircle2,
  GraduationCap,
} from "lucide-react";

interface TechnicalPassportModalProps {
  profile: UserProfile | null;
  open: boolean;
  onClose: () => void;
}

export const TechnicalPassportModal: React.FC<TechnicalPassportModalProps> = ({
  profile,
  open,
  onClose,
}) => {
  if (!open || !profile) return null;

  const rankInfo = getRankInfoByXp(profile.totalXp);
  const totalAttempts = (profile.totalHits || 0) + (profile.totalMisses || 0);
  const accuracyPct =
    totalAttempts > 0
      ? Math.round(((profile.totalHits || 0) / totalAttempts) * 100)
      : 0;
  const unlockedPatentsCount = SENAI_PATENTS.filter(
    (p) => rankInfo.currentTier.level >= p.minLevel
  ).length;
  const unlockedAchievementDefs = ACHIEVEMENTS_CATALOG.filter((a) =>
    profile.unlockedAchievements.includes(a.id)
  );
  const issuedDate = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrintPassport = () => {
    const win = window.open("", "_blank", "width=960,height=800");
    if (!win) {
      window.print();
      return;
    }

    const modulesRowsHtml = MINIGAMES_CATALOG.map((mg) => {
      const best = profile.minigameBestScores?.[mg.id] || 0;
      const count = profile.minigameMatches?.[mg.id] || 0;
      const perf = profile.minigamePerfectMatches?.[mg.id] || 0;
      return `
        <tr>
          <td><strong>${mg.title}</strong><br/><span style="font-size:11px;color:#64748b;">${
        mg.track === "industrial" ? "Trilha 02 • OS Industrial" : "Trilha 01 • Fundamentos"
      }</span></td>
          <td style="text-align:center;">${count}</td>
          <td style="text-align:center;font-weight:700;color:#0f172a;">${best.toLocaleString(
            "pt-BR"
          )} pts</td>
          <td style="text-align:center;color:#059669;font-weight:700;">${perf}</td>
          <td style="text-align:center;">${
            count > 0 ? "✅ Validado" : "Pendente"
          }</td>
        </tr>
      `;
    }).join("");

    const achievementsHtml =
      unlockedAchievementDefs.length > 0
        ? unlockedAchievementDefs
            .slice(0, 18)
            .map(
              (a) =>
                `<span style="display:inline-block;margin:3px;padding:4px 8px;border-radius:6px;background:#f1f5f9;border:1px solid #cbd5e1;font-size:11px;"><strong>[${a.code}]</strong> ${a.title}</span>`
            )
            .join("")
        : `<p style="font-size:12px;color:#64748b;">Nenhuma insígnia desbloqueada até o momento.</p>`;

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <title>Passaporte Técnico SENAI — ${profile.displayName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", system-ui, sans-serif; color: #0f172a; background: #ffffff; padding: 24px; line-height: 1.45; }
    .sheet { max-width: 880px; margin: 0 auto; border: 2px solid #0047b6; border-radius: 12px; overflow: hidden; }
    .header { background: #0047b6; color: #ffffff; padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; }
    .header h1 { font-size: 20px; font-weight: 800; }
    .header p { font-size: 12px; color: #dbeafe; margin-top: 2px; }
    .badge-box { text-align: right; background: rgba(255,255,255,0.14); padding: 8px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.3); }
    .content { padding: 20px 24px; }
    .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
    .stat { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; }
    .stat span { display: block; font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; }
    .stat strong { font-size: 16px; color: #0f172a; }
    h2 { font-size: 13px; text-transform: uppercase; color: #0047b6; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px; margin: 16px 0 8px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 7px 10px; text-align: left; }
    th { background: #f1f5f9; font-weight: 700; }
    .footer-sign { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 28px; padding-top: 16px; }
    .sign-line { border-top: 1px solid #475569; text-align: center; padding-top: 6px; font-size: 11px; color: #475569; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div>
        <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#fde047;">SENAI/SC • UNIDADE CURRICULAR: TÉCNICAS DE MANUTENÇÃO ELETRÔNICA</div>
        <h1>Passaporte &amp; Dossiê de Competências Técnicas</h1>
        <p>Aprendiz: <strong>${profile.displayName}</strong> ${
      profile.classGroup ? `• Turma: <strong>${profile.classGroup}</strong>` : ""
    } ${profile.email ? `• ${profile.email}` : ""}</p>
      </div>
      <div class="badge-box">
        <div style="font-size:11px;text-transform:uppercase;color:#fde047;font-weight:700;">${
          rankInfo.currentPatent.badgeCode
        } • NÍVEL ${rankInfo.currentTier.level}/${MAX_PLATFORM_LEVEL}</div>
        <div style="font-size:15px;font-weight:800;">${
          rankInfo.currentPatent.title
        }</div>
        <div style="font-size:11px;color:#e0f2fe;">Emissão: ${issuedDate}</div>
      </div>
    </div>

    <div class="content">
      <div class="grid-4">
        <div class="stat">
          <span>XP Acumulado na Carreira</span>
          <strong>${profile.totalXp.toLocaleString("pt-BR")} XP</strong>
        </div>
        <div class="stat">
          <span>Precisão Técnica Global</span>
          <strong>${accuracyPct}% (${profile.totalHits} OK)</strong>
        </div>
        <div class="stat">
          <span>Partidas / Perfeitas (0 Erro)</span>
          <strong>${profile.matchesPlayed} / ${
      profile.perfectMatches || 0
    }</strong>
        </div>
        <div class="stat">
          <span>Maior Combo / Conquistas</span>
          <strong>${profile.bestStreak}x • ${
      profile.unlockedAchievements.length
    }/${ACHIEVEMENTS_CATALOG.length}</strong>
        </div>
      </div>

      <h2>1. Desempenho por Estação de Bancada (Trilha 01 &amp; Trilha 02)</h2>
      <table>
        <thead>
          <tr>
            <th>Módulo / Bancada Simulada</th>
            <th style="text-align:center;">Partidas</th>
            <th style="text-align:center;">Recorde Pessoal</th>
            <th style="text-align:center;">Sessões Zero-Defeito</th>
            <th style="text-align:center;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${modulesRowsHtml}
        </tbody>
      </table>

      <h2>2. Insígnias e Conquistas Técnicas Desbloqueadas (${
        unlockedAchievementDefs.length
      }/${ACHIEVEMENTS_CATALOG.length})</h2>
      <div style="margin-top:6px;">
        ${achievementsHtml}
      </div>

      <div class="footer-sign">
        <div class="sign-line">Assinatura do Aprendiz (${
          profile.displayName
        })</div>
        <div class="sign-line">Visto do Docente Responsável — SENAI</div>
      </div>
    </div>
  </div>
  <script>window.onload = function() { window.print(); };</script>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181B20] border border-[#2A303C] rounded-lg max-w-3xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="h-1 w-full bg-gradient-to-r from-[#0047B6] via-[#F59E0B] to-emerald-500" />

        {/* Topo do Modal */}
        <div className="px-6 py-4 border-b border-[#242933] flex items-center justify-between gap-3">
          <div>
            <span className="font-mono text-xs uppercase tracking-wider text-amber-400 font-bold block">
              RELATÓRIO DE PORTFÓLIO ESCOLAR • SENAI
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Passaporte &amp; Dossiê Técnico do Aprendiz
            </h3>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrintPassport}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-1.5 transition-colors shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg bg-[#0C0E12] text-zinc-300 hover:text-white border border-[#2A303C]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo do Passaporte */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Identificação */}
          <div className="bg-[#0C0E12] border border-[#2A303C] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <UserAvatar
                profile={profile}
                size="lg"
                roundedClassName="rounded-xl"
                className="border-2 border-[#0057E0]"
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg sm:text-xl font-extrabold text-white">
                    {profile.displayName}
                  </h4>
                  {profile.classGroup && (
                    <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {profile.classGroup}
                    </span>
                  )}
                </div>
                <p className="text-sm sm:text-base text-emerald-400 font-extrabold mt-0.5">
                  {rankInfo.currentPatent.icon} {rankInfo.currentPatent.title} (
                  {rankInfo.currentPatent.badgeCode})
                </p>
                <p className="text-xs sm:text-sm font-mono text-zinc-300 mt-0.5">
                  Nível {rankInfo.currentTier.level}/{MAX_PLATFORM_LEVEL} •{" "}
                  {unlockedPatentsCount}/{SENAI_PATENTS.length} Patentes •{" "}
                  {issuedDate}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono shrink-0">
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-2.5 text-center">
                <span className="text-xs text-zinc-400 font-bold block">
                  XP TOTAL
                </span>
                <span className="text-lg sm:text-xl font-black text-amber-400">
                  {profile.totalXp.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="bg-[#181B20] border border-[#2A303C] rounded-lg px-4 py-2.5 text-center">
                <span className="text-xs text-zinc-400 font-bold block">
                  PRECISÃO
                </span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">
                  {accuracyPct}%
                </span>
              </div>
            </div>
          </div>

          {/* Tabela de Desempenho por Módulo */}
          <div className="bg-[#0C0E12] border border-[#2A303C] rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-[#13161A] border-b border-[#242933] flex items-center justify-between">
              <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-zinc-200 font-extrabold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Histórico de Domínio nas 6 Bancadas
              </span>
              <span className="font-mono text-xs sm:text-sm font-bold text-amber-400">
                {profile.playedMinigames.length}/{MINIGAMES_CATALOG.length}{" "}
                módulos concluídos
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#242933] text-xs font-mono uppercase text-zinc-300 bg-[#181B20]">
                    <th className="py-3 px-4">Estação / Módulo</th>
                    <th className="py-3 px-3 text-center">Partidas</th>
                    <th className="py-3 px-3 text-center">Recorde</th>
                    <th className="py-3 px-3 text-center">Zero-Defeito</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#242933] font-mono">
                  {MINIGAMES_CATALOG.map((mg) => {
                    const count = profile.minigameMatches?.[mg.id] || 0;
                    const best = profile.minigameBestScores?.[mg.id] || 0;
                    const perf = profile.minigamePerfectMatches?.[mg.id] || 0;
                    return (
                      <tr key={mg.id}>
                        <td className="py-3 px-4 font-sans">
                          <span className="font-bold text-white block text-sm sm:text-base">
                            {mg.title}
                          </span>
                          <span className="text-xs font-mono text-zinc-400">
                            {mg.badge}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-zinc-200">
                          {count}
                        </td>
                        <td className="py-3 px-3 text-center font-black text-amber-400">
                          {best.toLocaleString("pt-BR")} pts
                        </td>
                        <td className="py-3 px-3 text-center text-emerald-400 font-black">
                          {perf}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {count > 0 ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-extrabold text-xs sm:text-sm">
                              <CheckCircle2 className="w-4 h-4" /> Validado
                            </span>
                          ) : (
                            <span className="text-zinc-500 text-xs sm:text-sm">
                              Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Resumo de Conquistas Desbloqueadas */}
          <div className="bg-[#0C0E12] border border-[#2A303C] rounded-xl p-5 space-y-3">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-amber-400 font-extrabold flex items-center gap-2">
              <Award className="w-4 h-4" />
              Certificações &amp; Conquistas Desbloqueadas (
              {unlockedAchievementDefs.length}/{ACHIEVEMENTS_CATALOG.length})
            </span>
            {unlockedAchievementDefs.length === 0 ? (
              <p className="text-sm text-zinc-400 font-mono">
                Jogue partidas na Sala PIN ou na Bancada Solo para desbloquear suas primeiras certificações técnicas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {unlockedAchievementDefs.map((ach) => (
                  <span
                    key={ach.id}
                    className="px-3 py-1.5 rounded-lg bg-[#181B20] border border-[#2A303C] text-xs sm:text-sm font-mono text-zinc-100"
                  >
                    <strong className="text-amber-400">[{ach.code}]</strong>{" "}
                    {ach.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
