import { MinigameId } from "@/data/electronicsData";

export interface RankTier {
  level: number;
  title: string;
  minXp: number;
  badgeCode: string;
}

export const SENAI_RANK_TIERS: RankTier[] = [
  { level: 1, title: "Aprendiz de Bancada", minXp: 0, badgeCode: "NV-01" },
  { level: 2, title: "Auxiliar de Montagem PTH", minXp: 600, badgeCode: "NV-02" },
  { level: 3, title: "Operador de Multímetro", minXp: 1500, badgeCode: "NV-03" },
  { level: 4, title: "Técnico de Soldagem SMD", minXp: 2800, badgeCode: "NV-04" },
  { level: 5, title: "Inspetor de Esquemas Elétricos", minXp: 4500, badgeCode: "NV-05" },
  { level: 6, title: "Analista de Manutenção Industrial", minXp: 7000, badgeCode: "NV-06" },
  { level: 7, title: "Especialista em Semicondutores", minXp: 10500, badgeCode: "NV-07" },
  { level: 8, title: "Projetista de Lógica Digital", minXp: 15000, badgeCode: "NV-08" },
  { level: 9, title: "Engenheiro de Diagnóstico", minXp: 21000, badgeCode: "NV-09" },
  { level: 10, title: "Mestre da Arena SENAI", minXp: 28000, badgeCode: "NV-10" },
];

export function getRankInfoByXp(xp: number): {
  currentTier: RankTier;
  nextTier: RankTier | null;
  progressPct: number;
  progressPercent: number;
  xpToNext: number;
} {
  let currentTier = SENAI_RANK_TIERS[0];
  let nextTier: RankTier | null = SENAI_RANK_TIERS[1];

  for (let i = 0; i < SENAI_RANK_TIERS.length; i++) {
    if (xp >= SENAI_RANK_TIERS[i].minXp) {
      currentTier = SENAI_RANK_TIERS[i];
      nextTier = SENAI_RANK_TIERS[i + 1] || null;
    }
  }

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      progressPct: 100,
      progressPercent: 100,
      xpToNext: 0,
    };
  }

  const span = nextTier.minXp - currentTier.minXp;
  const currentInSpan = xp - currentTier.minXp;
  const progressPct = Math.max(
    0,
    Math.min(100, Math.round((currentInSpan / Math.max(1, span)) * 100))
  );

  return {
    currentTier,
    nextTier,
    progressPct,
    progressPercent: progressPct,
    xpToNext: Math.max(0, nextTier.minXp - xp),
  };
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  code: string;
  category: "inicio" | "precisao" | "combo" | "volume" | "especialista";
}

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  {
    id: "first_match",
    title: "Primeira Energização",
    description: "Conclua sua primeira partida registrada na bancada (Sala ou Solo).",
    xpReward: 150,
    code: "ACH-01",
    category: "inicio",
  },
  {
    id: "zero_short_circuit",
    title: "Bancada Imune a Curto",
    description: "Finalize uma partida com pelo menos 8 acertos e 100% de precisão (0 falhas).",
    xpReward: 350,
    code: "ACH-02",
    category: "precisao",
  },
  {
    id: "combo_5",
    title: "Ritmo de Produção",
    description: "Alcance uma sequência (combo) de 5 acertos consecutivos.",
    xpReward: 200,
    code: "ACH-03",
    category: "combo",
  },
  {
    id: "combo_12",
    title: "Alta Frequência (12x)",
    description: "Alcance uma sequência impressionante de 12 acertos consecutivos sem errar.",
    xpReward: 450,
    code: "ACH-04",
    category: "combo",
  },
  {
    id: "resistor_specialist",
    title: "Mestre da Lei de Ohm",
    description: "Pontue mais de 1.200 pts em uma rodada da Oficina do Resistor.",
    xpReward: 300,
    code: "ACH-05",
    category: "especialista",
  },
  {
    id: "radar_specialist",
    title: "Leitor de Esquemas",
    description: "Pontue mais de 1.200 pts inspecionando nós no Radar do Circuito.",
    xpReward: 300,
    code: "ACH-06",
    category: "especialista",
  },
  {
    id: "all_rounder",
    title: "Polivalente de Manutenção",
    description: "Registre partidas nos 5 módulos diferentes da plataforma.",
    xpReward: 500,
    code: "ACH-07",
    category: "especialista",
  },
  {
    id: "matches_5",
    title: "Estagiário Dedicado",
    description: "Complete 5 partidas acumuladas na plataforma.",
    xpReward: 250,
    code: "ACH-08",
    category: "volume",
  },
  {
    id: "matches_15",
    title: "Veterano de Laboratório",
    description: "Complete 15 partidas acumuladas entre sala de aula e treino solo.",
    xpReward: 600,
    code: "ACH-09",
    category: "volume",
  },
  {
    id: "hits_50",
    title: "50 Componentes Aferidos",
    description: "Acumule 50 identificações corretas de componentes no seu perfil.",
    xpReward: 350,
    code: "ACH-10",
    category: "volume",
  },
  {
    id: "hits_200",
    title: "200 Componentes Aferidos",
    description: "Acumule 200 identificações corretas ao longo do curso.",
    xpReward: 800,
    code: "ACH-11",
    category: "volume",
  },
  {
    id: "high_scorer_2500",
    title: "Sobrecarga Positiva",
    description: "Alcance 2.500 pontos ou mais em uma única partida.",
    xpReward: 500,
    code: "ACH-12",
    category: "precisao",
  },
];

export interface MatchRecord {
  id: string;
  timestamp: number;
  playedAt: number;
  mode: "room" | "solo";
  roomPin?: string;
  minigameId: MinigameId;
  minigameTitle: string;
  gameTitle: string;
  score: number;
  xpEarned: number;
  hits: number;
  misses: number;
  accuracyPct: number;
  accuracy: number;
  maxStreak: number;
}
