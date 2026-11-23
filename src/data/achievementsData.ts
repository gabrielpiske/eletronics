import { MinigameId } from "@/data/electronicsData";

export const MAX_PLATFORM_LEVEL = 100;
export const MAX_PLATFORM_XP = 1_000_000;

export type PatentDivision =
  | "bronze"
  | "prata"
  | "ouro"
  | "platina"
  | "esmeralda"
  | "diamante"
  | "mestre"
  | "lendario";

export interface PatentTier {
  id: string;
  order: number;
  badgeCode: string;
  title: string;
  description: string;
  minLevel: number;
  maxLevel: number;
  minXp: number;
  icon: string;
  division: PatentDivision;
  divisionLabel: string;
}

export interface RankTier {
  level: number;
  title: string;
  minXp: number;
  deltaXpRequired: number;
  badgeCode: string;
  patentId: string;
  patentCode: string;
  patentIcon: string;
  division: PatentDivision;
  divisionLabel: string;
}

interface PatentBlueprint {
  order: number;
  minLevel: number;
  maxLevel: number;
  title: string;
  description: string;
  icon: string;
  division: PatentDivision;
  divisionLabel: string;
}

const PATENT_BLUEPRINTS: PatentBlueprint[] = [
  {
    order: 1,
    minLevel: 1,
    maxLevel: 4,
    title: "Aprendiz de Bancada",
    description:
      "Início da jornada técnica reconhecendo grandezas básicas e segurança em laboratório.",
    icon: "🔧",
    division: "bronze",
    divisionLabel: "Divisão Base • Bronze I",
  },
  {
    order: 2,
    minLevel: 5,
    maxLevel: 9,
    title: "Auxiliar de Montagem PTH",
    description:
      "Identifica componentes axiais e radiais para inserção em placas de circuito impresso.",
    icon: "🪛",
    division: "bronze",
    divisionLabel: "Divisão Base • Bronze II",
  },
  {
    order: 3,
    minLevel: 10,
    maxLevel: 14,
    title: "Operador de Multímetro",
    description:
      "Realiza medições confiáveis de resistência, continuidade, tensão contínua e alternada.",
    icon: "📟",
    division: "bronze",
    divisionLabel: "Divisão Base • Bronze III",
  },
  {
    order: 4,
    minLevel: 15,
    maxLevel: 19,
    title: "Soldador de Precisão SMD",
    description:
      "Domina retrabalho e soldagem superficial de microcomponentes sem causar curto-circuito.",
    icon: "🔥",
    division: "prata",
    divisionLabel: "Divisão Técnica • Prata I",
  },
  {
    order: 5,
    minLevel: 20,
    maxLevel: 24,
    title: "Inspetor de Controle de Qualidade",
    description:
      "Audita linhas de montagem identificando desvios de tolerância e falhas de polaridade.",
    icon: "🔍",
    division: "prata",
    divisionLabel: "Divisão Técnica • Prata II",
  },
  {
    order: 6,
    minLevel: 25,
    maxLevel: 29,
    title: "Técnico de Manutenção Eletrônica",
    description:
      "Executa diagnóstico corretivo e preventivo em módulos analógicos e fontes chaveadas.",
    icon: "🛠️",
    division: "prata",
    divisionLabel: "Divisão Técnica • Prata III",
  },
  {
    order: 7,
    minLevel: 30,
    maxLevel: 34,
    title: "Analista de Esquemas Elétricos",
    description:
      "Interpreta diagramas complexos nas normas IEC e ANSI com leitura rápida de nós.",
    icon: "📐",
    division: "ouro",
    divisionLabel: "Divisão Industrial • Ouro I",
  },
  {
    order: 8,
    minLevel: 35,
    maxLevel: 39,
    title: "Especialista em Semicondutores",
    description:
      "Domina o chaveamento e polarização de diodos, Zeners, BJTs, MOSFETs, SCRs e TRIACs.",
    icon: "⚡",
    division: "ouro",
    divisionLabel: "Divisão Industrial • Ouro II",
  },
  {
    order: 9,
    minLevel: 40,
    maxLevel: 44,
    title: "Projetista de Lógica Digital",
    description:
      "Constrói e depura sistemas combinacionais, portas lógicas, contadores e displays.",
    icon: "🧮",
    division: "ouro",
    divisionLabel: "Divisão Industrial • Ouro III",
  },
  {
    order: 10,
    minLevel: 45,
    maxLevel: 49,
    title: "Técnico Sênior de Instrumentação",
    description:
      "Calibra malhas de sensores, transdutores ópticos e térmicos com altíssima precisão.",
    icon: "📡",
    division: "platina",
    divisionLabel: "Divisão Sênior • Platina I",
  },
  {
    order: 11,
    minLevel: 50,
    maxLevel: 54,
    title: "Engenheiro de Diagnóstico de Falhas",
    description:
      "Isola defeitos críticos em segundos através de análise de sintomas e telemetria.",
    icon: "🩺",
    division: "platina",
    divisionLabel: "Divisão Sênior • Platina II",
  },
  {
    order: 12,
    minLevel: 55,
    maxLevel: 59,
    title: "Supervisor de Bancada Industrial",
    description:
      "Coordena operações de manutenção de alta confiabilidade sem paradas não planejadas.",
    icon: "🏭",
    division: "platina",
    divisionLabel: "Divisão Sênior • Platina III",
  },
  {
    order: 13,
    minLevel: 60,
    maxLevel: 64,
    title: "Especialista em Eletrônica de Potência",
    description:
      "Projeta e protege circuitos retificadores, inversores, transformadores e supressores.",
    icon: "🔋",
    division: "esmeralda",
    divisionLabel: "Divisão Especialista • Esmeralda I",
  },
  {
    order: 14,
    minLevel: 65,
    maxLevel: 69,
    title: "Arquiteto de Sistemas Embarcados",
    description:
      "Integra hardware analógico, condicionamento de sinais e controle microprocessado.",
    icon: "💻",
    division: "esmeralda",
    divisionLabel: "Divisão Especialista • Esmeralda II",
  },
  {
    order: 15,
    minLevel: 70,
    maxLevel: 74,
    title: "Mestre em Automação e Controle",
    description:
      "Domina acionamentos industriais, isolamento óptico e proteção eletromecânica.",
    icon: "🤖",
    division: "esmeralda",
    divisionLabel: "Divisão Especialista • Esmeralda III",
  },
  {
    order: 16,
    minLevel: 75,
    maxLevel: 79,
    title: "Engenheiro Chefe de Laboratório",
    description:
      "Referência técnica máxima em ensaios, certificação de bancada e normas de engenharia.",
    icon: "🎖️",
    division: "diamante",
    divisionLabel: "Alta Engenharia • Diamante I",
  },
  {
    order: 17,
    minLevel: 80,
    maxLevel: 84,
    title: "Consultor Sênior de Microeletrônica",
    description:
      "Soluciona anomalias severas em arquiteturas de alta densidade e sinais mistos.",
    icon: "💎",
    division: "diamante",
    divisionLabel: "Alta Engenharia • Diamante II",
  },
  {
    order: 18,
    minLevel: 85,
    maxLevel: 89,
    title: "Diretor de Engenharia Eletroeletrônica",
    description:
      "Lidera o desenvolvimento tecnológico com precisão absoluta em todas as áreas.",
    icon: "🏛️",
    division: "diamante",
    divisionLabel: "Alta Engenharia • Diamante III",
  },
  {
    order: 19,
    minLevel: 90,
    maxLevel: 94,
    title: "Autoridade em Normas IEC / ANSI",
    description:
      "Domínio enciclopédico de toda a simbologia e especificações internacionais.",
    icon: "🌐",
    division: "mestre",
    divisionLabel: "Divisão Mestre • Grão-Mestre I",
  },
  {
    order: 20,
    minLevel: 95,
    maxLevel: 99,
    title: "Cientista Chefe de Inovação SENAI",
    description:
      "À beira da perfeição técnica, acumulando quase um milhão de pontos de experiência.",
    icon: "🚀",
    division: "mestre",
    divisionLabel: "Divisão Mestre • Grão-Mestre II",
  },
  {
    order: 21,
    minLevel: 100,
    maxLevel: 100,
    title: "Lenda Suprema da Arena SENAI",
    description:
      "Patente máxima definitiva concedida aos que atingem 1.000.000 XP e o Nível 100.",
    icon: "👑",
    division: "lendario",
    divisionLabel: "Patente Máxima • 1.000.000 XP",
  },
];

/**
 * Gera os 100 níveis da plataforma garantindo que:
 * - Nível 1 = 0 XP
 * - Cada nível exige estritamente mais XP adicional (deltaXpRequired) do que o nível anterior
 * - Nível 100 = exatos 1.000.000 XP
 */
function buildProgressiveRankTiers(): RankTier[] {
  // Pesos brutos estritamente crescentes para os 99 saltos (de NV 1->2 até NV 99->100)
  // Usamos delta(i) = 450 + 95*(i-1) + 1.48*(i-1)^2 e ajustamos proporcionalmente para somar 1.000.000
  const rawDeltas: number[] = [];
  for (let step = 1; step <= 99; step++) {
    const idx = step - 1;
    const w = 420 + 88 * idx + 1.62 * idx * idx;
    rawDeltas.push(w);
  }

  const rawSum = rawDeltas.reduce((acc, v) => acc + v, 0);
  const scale = MAX_PLATFORM_XP / rawSum;

  // Arredonda cada salto para múltiplo de 50 mantendo crescimento estrito
  const roundedDeltas: number[] = [];
  for (let i = 0; i < 99; i++) {
    let d = Math.round((rawDeltas[i] * scale) / 50) * 50;
    if (i === 0) {
      d = Math.max(450, d);
    } else {
      // Garante que cada nível precise estritamente de mais pontos que o anterior
      if (d <= roundedDeltas[i - 1]) {
        d = roundedDeltas[i - 1] + 50;
      }
    }
    roundedDeltas.push(d);
  }

  // Ajusta a diferença residual nos últimos saltos mantendo a monotonicidade estrita
  let currentTotal = roundedDeltas.reduce((acc, v) => acc + v, 0);
  let diff = MAX_PLATFORM_XP - currentTotal;

  if (diff !== 0) {
    // Distribui o ajuste nos degraus finais ou adiciona no último degrau se positivo
    if (diff > 0) {
      roundedDeltas[98] += diff;
    } else {
      // Se passou um pouco de 1.000.000, reduz suavemente do fim para o começo mantendo d[i] >= d[i-1] + 20
      let rem = -diff;
      for (let i = 98; i >= 1 && rem > 0; i--) {
        const maxCanReduce = Math.max(0, roundedDeltas[i] - (roundedDeltas[i - 1] + 25));
        const take = Math.min(rem, maxCanReduce);
        roundedDeltas[i] -= take;
        rem -= take;
      }
      if (rem > 0) {
        roundedDeltas[98] -= rem;
      }
    }
  }

  const tiers: RankTier[] = [];
  let cumulativeXp = 0;

  for (let lvl = 1; lvl <= MAX_PLATFORM_LEVEL; lvl++) {
    if (lvl > 1) {
      cumulativeXp += roundedDeltas[lvl - 2];
    }
    if (lvl === MAX_PLATFORM_LEVEL) {
      cumulativeXp = MAX_PLATFORM_XP;
    }

    const blueprint =
      PATENT_BLUEPRINTS.find(
        (p) => lvl >= p.minLevel && lvl <= p.maxLevel
      ) || PATENT_BLUEPRINTS[PATENT_BLUEPRINTS.length - 1];

    const patentCode = `PAT-${String(blueprint.order).padStart(2, "0")}`;
    const badgeCode = `NV-${String(lvl).padStart(2, "0")}`;
    const deltaXpRequired = lvl === 1 ? 0 : roundedDeltas[lvl - 2];

    tiers.push({
      level: lvl,
      title: blueprint.title,
      minXp: cumulativeXp,
      deltaXpRequired,
      badgeCode,
      patentId: `patent_${blueprint.order}`,
      patentCode,
      patentIcon: blueprint.icon,
      division: blueprint.division,
      divisionLabel: blueprint.divisionLabel,
    });
  }

  return tiers;
}

export const SENAI_RANK_TIERS: RankTier[] = buildProgressiveRankTiers();

export const SENAI_PATENTS: PatentTier[] = PATENT_BLUEPRINTS.map((bp) => {
  const minTier =
    SENAI_RANK_TIERS.find((t) => t.level === bp.minLevel) || SENAI_RANK_TIERS[0];
  return {
    id: `patent_${bp.order}`,
    order: bp.order,
    badgeCode: `PAT-${String(bp.order).padStart(2, "0")}`,
    title: bp.title,
    description: bp.description,
    minLevel: bp.minLevel,
    maxLevel: bp.maxLevel,
    minXp: minTier.minXp,
    icon: bp.icon,
    division: bp.division,
    divisionLabel: bp.divisionLabel,
  };
});

export function getRankInfoByXp(xp: number): {
  currentTier: RankTier;
  nextTier: RankTier | null;
  currentPatent: PatentTier;
  nextPatent: PatentTier | null;
  progressPct: number;
  progressPercent: number;
  xpToNext: number;
  xpInCurrentLevel: number;
  xpSpanForNextLevel: number;
  patentProgressPct: number;
  levelsToNextPatent: number;
  xpToNextPatent: number;
  overallProgressPct: number;
} {
  const safeXp = Math.max(0, Number(xp) || 0);
  let currentTier = SENAI_RANK_TIERS[0];
  let nextTier: RankTier | null = SENAI_RANK_TIERS[1] || null;

  for (let i = 0; i < SENAI_RANK_TIERS.length; i++) {
    if (safeXp >= SENAI_RANK_TIERS[i].minXp) {
      currentTier = SENAI_RANK_TIERS[i];
      nextTier = SENAI_RANK_TIERS[i + 1] || null;
    } else {
      break;
    }
  }

  const currentPatent =
    SENAI_PATENTS.find(
      (p) =>
        currentTier.level >= p.minLevel && currentTier.level <= p.maxLevel
    ) || SENAI_PATENTS[0];

  const nextPatent =
    SENAI_PATENTS.find((p) => p.order === currentPatent.order + 1) || null;

  const overallProgressPct = Math.min(
    100,
    Math.round((safeXp / MAX_PLATFORM_XP) * 1000) / 10
  );

  if (!nextTier) {
    return {
      currentTier,
      nextTier: null,
      currentPatent,
      nextPatent: null,
      progressPct: 100,
      progressPercent: 100,
      xpToNext: 0,
      xpInCurrentLevel: 0,
      xpSpanForNextLevel: 0,
      patentProgressPct: 100,
      levelsToNextPatent: 0,
      xpToNextPatent: 0,
      overallProgressPct: 100,
    };
  }

  const span = Math.max(1, nextTier.minXp - currentTier.minXp);
  const currentInSpan = Math.max(0, safeXp - currentTier.minXp);
  const progressPct = Math.max(
    0,
    Math.min(100, Math.round((currentInSpan / span) * 100))
  );

  let patentProgressPct = 100;
  let levelsToNextPatent = 0;
  let xpToNextPatent = 0;

  if (nextPatent) {
    const patentXpSpan = Math.max(1, nextPatent.minXp - currentPatent.minXp);
    const patentCurrentXp = Math.max(0, safeXp - currentPatent.minXp);
    patentProgressPct = Math.max(
      0,
      Math.min(100, Math.round((patentCurrentXp / patentXpSpan) * 100))
    );
    levelsToNextPatent = Math.max(1, nextPatent.minLevel - currentTier.level);
    xpToNextPatent = Math.max(0, nextPatent.minXp - safeXp);
  }

  return {
    currentTier,
    nextTier,
    currentPatent,
    nextPatent,
    progressPct,
    progressPercent: progressPct,
    xpToNext: Math.max(0, nextTier.minXp - safeXp),
    xpInCurrentLevel: currentInSpan,
    xpSpanForNextLevel: span,
    patentProgressPct,
    levelsToNextPatent,
    xpToNextPatent,
    overallProgressPct,
  };
}

/**
 * Calcula um nível de bancada dentro da partida baseado na pontuação acumulada (curva progressiva)
 */
export function getInMatchBenchLevel(score: number): number {
  const s = Math.max(0, score);
  if (s < 180) return 1;
  if (s < 420) return 2;
  if (s < 750) return 3;
  if (s < 1180) return 4;
  if (s < 1720) return 5;
  return 5 + Math.floor((s - 1720) / 650);
}

export type AchievementDifficulty =
  | "facil"
  | "medio"
  | "dificil"
  | "extremo"
  | "lendario";

export type AchievementCategory =
  | "inicio"
  | "precisao"
  | "combo"
  | "especialista"
  | "inovacao"
  | "volume"
  | "carreira";

export interface AchievementCategoryMeta {
  id: AchievementCategory;
  label: string;
  shortLabel: string;
}

export const ACHIEVEMENT_CATEGORIES: AchievementCategoryMeta[] = [
  { id: "inicio", label: "Início & Polivalência", shortLabel: "Início" },
  { id: "precisao", label: "Precisão & Zero Defeito", shortLabel: "Precisão" },
  { id: "combo", label: "Combos de Alta Frequência", shortLabel: "Combos" },
  { id: "especialista", label: "Maestria nas 6 Bancadas", shortLabel: "Bancadas" },
  { id: "inovacao", label: "Manobras & Engenharia Extrema", shortLabel: "Inovação" },
  { id: "volume", label: "Volume & Produção Industrial", shortLabel: "Volume" },
  { id: "carreira", label: "Carreira, Patentes & Coleção", shortLabel: "Carreira" },
];

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  code: string;
  category: AchievementCategory;
  difficulty: AchievementDifficulty;
  difficultyLabel: string;
  targetValue: number;
  unitLabel: string;
}

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  // ============================================================================
  // 1. INÍCIO & POLIVALÊNCIA (5 CONQUISTAS: ACH-01 a ACH-05)
  // ============================================================================
  {
    id: "first_match",
    title: "Primeira Energização",
    description: "Conclua sua primeira partida registrada na bancada (Sala ou Solo).",
    xpReward: 100,
    code: "ACH-01",
    category: "inicio",
    difficulty: "facil",
    difficultyLabel: "Fácil",
    targetValue: 1,
    unitLabel: "partida",
  },
  {
    id: "first_room_match",
    title: "Conexão em Rede Industrial",
    description:
      "Participe e conclua uma partida multiplayer ao vivo conectada a uma Sala de Aula (PIN).",
    xpReward: 200,
    code: "ACH-02",
    category: "inicio",
    difficulty: "facil",
    difficultyLabel: "Fácil",
    targetValue: 1,
    unitLabel: "partida em sala",
  },
  {
    id: "first_perfect_run",
    title: "Bancada Blindada",
    description:
      "Conclua sua primeira partida perfeita (mínimo de 10 acertos, ou 6 no Reparo PCI, com 0 erros).",
    xpReward: 300,
    code: "ACH-03",
    category: "inicio",
    difficulty: "facil",
    difficultyLabel: "Fácil",
    targetValue: 1,
    unitLabel: "partida perfeita",
  },
  {
    id: "all_rounder",
    title: "Polivalente de Manutenção (6 Módulos)",
    description:
      "Complete partidas em todos os 6 módulos da plataforma SENAI (incluindo a Estação de Reparo de PCI).",
    xpReward: 450,
    code: "ACH-04",
    category: "inicio",
    difficulty: "medio",
    difficultyLabel: "Médio",
    targetValue: 6,
    unitLabel: "módulos",
  },
  {
    id: "hex_veteran_5",
    title: "Rotação Completa de Laboratório",
    description:
      "Complete pelo menos 5 partidas registradas em cada um dos 6 módulos diferentes da plataforma.",
    xpReward: 1100,
    code: "ACH-05",
    category: "inicio",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 6,
    unitLabel: "módulos (5+ part.)",
  },

  // ============================================================================
  // 2. PRECISÃO & IMUNIDADE A CURTO (10 CONQUISTAS: ACH-06 a ACH-15)
  // ============================================================================
  {
    id: "zero_short_circuit",
    title: "Bancada Imune a Curto",
    description:
      "Finalize uma única partida com pelo menos 12 acertos e 100% de precisão (0 falhas).",
    xpReward: 400,
    code: "ACH-06",
    category: "precisao",
    difficulty: "medio",
    difficultyLabel: "Médio",
    targetValue: 12,
    unitLabel: "acertos s/ erro",
  },
  {
    id: "flawless_master_25",
    title: "Isolamento Galvânico Perfeito",
    description:
      "Conclua uma única partida com pelo menos 22 acertos e 0 erros (100% de precisão).",
    xpReward: 950,
    code: "ACH-07",
    category: "precisao",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 22,
    unitLabel: "acertos s/ erro",
  },
  {
    id: "flawless_master_40",
    title: "Blindagem Eletromagnética Total",
    description:
      "Conclua uma única partida com pelo menos 40 acertos e 0 erros (100% de precisão).",
    xpReward: 2400,
    code: "ACH-08",
    category: "precisao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 40,
    unitLabel: "acertos s/ erro",
  },
  {
    id: "flawless_master_60",
    title: "Vácuo Quântico Absoluto",
    description:
      "Conclua uma única partida épica com pelo menos 60 acertos e 0 erros sem desarmar a bancada.",
    xpReward: 4500,
    code: "ACH-09",
    category: "precisao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 60,
    unitLabel: "acertos s/ erro",
  },
  {
    id: "perfect_runs_10",
    title: "Certificação ISO Zero Defeito",
    description:
      "Acumule 10 partidas perfeitas (mínimo de 10 acertos, ou 6 no Reparo PCI, e 0 falhas em cada uma).",
    xpReward: 1500,
    code: "ACH-10",
    category: "precisao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 10,
    unitLabel: "partidas perfeitas",
  },
  {
    id: "perfect_runs_35",
    title: "Norma Militar MIL-STD",
    description:
      "Acumule 35 partidas perfeitas (0 falhas e mínimo de acertos exigido) ao longo da carreira.",
    xpReward: 3200,
    code: "ACH-11",
    category: "precisao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 35,
    unitLabel: "partidas perfeitas",
  },
  {
    id: "perfect_runs_100",
    title: "Padrão Aeroespacial NASA/ESA",
    description:
      "Acumule a marca histórica de 100 partidas perfeitas sem um único erro em cada uma delas.",
    xpReward: 6500,
    code: "ACH-12",
    category: "precisao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 100,
    unitLabel: "partidas perfeitas",
  },
  {
    id: "consecutive_perfect_3",
    title: "Tríade de Precisão Cirúrgica",
    description:
      "Conclua 3 partidas perfeitas consecutivas sem cometer nenhum erro entre elas.",
    xpReward: 1400,
    code: "ACH-13",
    category: "precisao",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 3,
    unitLabel: "perfeitas seguidas",
  },
  {
    id: "consecutive_perfect_7",
    title: "Protocolo Seis Sigma (7x)",
    description:
      "Conclua 7 partidas perfeitas consecutivas mantendo 100% de precisão em toda a série.",
    xpReward: 3500,
    code: "ACH-14",
    category: "precisao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 7,
    unitLabel: "perfeitas seguidas",
  },
  {
    id: "consecutive_perfect_15",
    title: "Imortal da Bancada (15x Perfeitas)",
    description:
      "Conclua 15 partidas perfeitas consecutivas sem acionar o disjuntor de erro uma única vez.",
    xpReward: 7000,
    code: "ACH-15",
    category: "precisao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 15,
    unitLabel: "perfeitas seguidas",
  },

  // ============================================================================
  // 3. COMBOS DE ALTA FREQUÊNCIA (7 CONQUISTAS: ACH-16 a ACH-22)
  // ============================================================================
  {
    id: "combo_5",
    title: "Ritmo de Produção (10x)",
    description: "Alcance uma sequência (combo) de 10 acertos consecutivos sem errar.",
    xpReward: 250,
    code: "ACH-16",
    category: "combo",
    difficulty: "facil",
    difficultyLabel: "Fácil",
    targetValue: 10,
    unitLabel: "combo",
  },
  {
    id: "combo_12",
    title: "Alta Frequência (20x)",
    description:
      "Alcance uma sequência técnica de 20 acertos consecutivos sem acionar o disjuntor.",
    xpReward: 600,
    code: "ACH-17",
    category: "combo",
    difficulty: "medio",
    difficultyLabel: "Médio",
    targetValue: 20,
    unitLabel: "combo",
  },
  {
    id: "combo_35",
    title: "Oscilador a Cristal (35x)",
    description:
      "Mantenha estabilidade absoluta alcançando um combo de 35 acertos seguidos.",
    xpReward: 1200,
    code: "ACH-18",
    category: "combo",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 35,
    unitLabel: "combo",
  },
  {
    id: "combo_60",
    title: "Supercondutor Criogênico (60x)",
    description:
      "Alcance uma sequência impecável de 60 acertos consecutivos sem nenhuma falha.",
    xpReward: 2500,
    code: "ACH-19",
    category: "combo",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 60,
    unitLabel: "combo",
  },
  {
    id: "combo_100",
    title: "Ressonância Harmônica (100x)",
    description:
      "Alcance 100 acertos consecutivos sem cometer nenhum erro (em sessão única ou série contínua).",
    xpReward: 4000,
    code: "ACH-20",
    category: "combo",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 100,
    unitLabel: "combo",
  },
  {
    id: "combo_175",
    title: "Plasma Tokamak Estabilizado (175x)",
    description:
      "Mantenha foco sobre-humano atingindo 175 acertos consecutivos sem um único erro técnico.",
    xpReward: 6500,
    code: "ACH-21",
    category: "combo",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 175,
    unitLabel: "combo",
  },
  {
    id: "combo_250",
    title: "Singularidade Eletrônica (250x)",
    description:
      "O desafio supremo de reflexo e domínio teórico: 250 acertos consecutivos sem errar.",
    xpReward: 10000,
    code: "ACH-22",
    category: "combo",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 250,
    unitLabel: "combo",
  },

  // ============================================================================
  // 4. ESPECIALISTAS & GRÃO-MESTRES DAS 6 BANCADAS (12 CONQUISTAS: ACH-23 a ACH-34)
  // ============================================================================
  {
    id: "conveyor_specialist",
    title: "Inspetor Mestre da Esteira",
    description:
      "Alcance 1.100 pontos ou mais em uma única sessão da Esteira de Componentes.",
    xpReward: 650,
    code: "ACH-23",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 1100,
    unitLabel: "pts na Esteira",
  },
  {
    id: "conveyor_grandmaster",
    title: "Automação Hipersônica (Esteira)",
    description:
      "Alcance a marca extrema de 2.400 pontos ou mais em uma única sessão da Esteira de Componentes.",
    xpReward: 2200,
    code: "ACH-24",
    category: "especialista",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2400,
    unitLabel: "pts na Esteira",
  },
  {
    id: "resistor_specialist",
    title: "Mestre da Lei de Ohm",
    description:
      "Alcance 950 pontos ou mais em uma sessão da Oficina do Resistor E24.",
    xpReward: 650,
    code: "ACH-25",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 950,
    unitLabel: "pts no Resistor",
  },
  {
    id: "resistor_grandmaster",
    title: "Oráculo das Cores E24 (Resistor)",
    description:
      "Alcance 2.200 pontos ou mais em uma única sessão da Oficina do Resistor sem depender da tabela.",
    xpReward: 2200,
    code: "ACH-26",
    category: "especialista",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2200,
    unitLabel: "pts no Resistor",
  },
  {
    id: "radar_specialist",
    title: "Rastreador de Nós Esquemáticos",
    description:
      "Alcance 900 pontos ou mais inspecionando diagramas no Radar do Circuito.",
    xpReward: 650,
    code: "ACH-27",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 900,
    unitLabel: "pts no Radar",
  },
  {
    id: "radar_grandmaster",
    title: "Arquiteto de Topologias IEC (Radar)",
    description:
      "Alcance 2.100 pontos ou mais em uma única sessão diagnosticando malhas no Radar do Circuito.",
    xpReward: 2200,
    code: "ACH-28",
    category: "especialista",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2100,
    unitLabel: "pts no Radar",
  },
  {
    id: "match_specialist",
    title: "Montador Ágil de Placas",
    description:
      "Alcance 900 pontos ou mais associando símbolos e funções na Conexão de Bancada.",
    xpReward: 650,
    code: "ACH-29",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 900,
    unitLabel: "pts na Bancada",
  },
  {
    id: "match_grandmaster",
    title: "Sincronismo Neural de Simbologia",
    description:
      "Alcance 2.100 pontos ou mais em uma única sessão conectando símbolos e funções na Bancada.",
    xpReward: 2200,
    code: "ACH-30",
    category: "especialista",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2100,
    unitLabel: "pts na Bancada",
  },
  {
    id: "detective_specialist",
    title: "Perito Forense de Hardware",
    description:
      "Alcance 900 pontos ou mais diagnosticando falhas no Diagnóstico por Pistas.",
    xpReward: 650,
    code: "ACH-31",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 900,
    unitLabel: "pts no Detetive",
  },
  {
    id: "detective_grandmaster",
    title: "Sherlock da Microeletrônica",
    description:
      "Alcance 2.200 pontos ou mais em uma única sessão deduzindo componentes logo nas primeiras pistas.",
    xpReward: 2200,
    code: "ACH-32",
    category: "especialista",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2200,
    unitLabel: "pts no Detetive",
  },
  {
    id: "industrial_specialist",
    title: "Inspetor de Reparo IPC-A-610",
    description:
      "Alcance 950 pontos ou mais solucionando Ordens de Serviço na Estação de Reparo de PCI.",
    xpReward: 850,
    code: "ACH-33",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 950,
    unitLabel: "pts no Reparo PCI",
  },
  {
    id: "industrial_grandmaster",
    title: "Cirurgião Chefe de Retrabalho PTH/SMD",
    description:
      "Alcance 2.000 pontos ou mais em uma única sessão de diagnóstico e soldagem na Estação de Reparo de PCI.",
    xpReward: 2500,
    code: "ACH-34",
    category: "especialista",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2000,
    unitLabel: "pts no Reparo PCI",
  },

  // ============================================================================
  // 5. MANOBRAS INOVADORAS & ENGENHARIA EXTREMA (10 CONQUISTAS: ACH-35 a ACH-44)
  // ============================================================================
  {
    id: "high_scorer_2500",
    title: "Sobrecarga Controlada",
    description:
      "Alcance 1.500 pontos ou mais em uma única partida com o sistema de pontuação oficial.",
    xpReward: 800,
    code: "ACH-35",
    category: "inovacao",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 1500,
    unitLabel: "pts na partida",
  },
  {
    id: "high_scorer_3000",
    title: "Usina de Alta Tensão",
    description:
      "Alcance a marca extrema de 2.800 pontos ou mais em uma única partida.",
    xpReward: 2000,
    code: "ACH-36",
    category: "inovacao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2800,
    unitLabel: "pts na partida",
  },
  {
    id: "high_scorer_4500",
    title: "Reator de Fusão Tokamak",
    description:
      "Alcance a marca lendária de 4.500 pontos ou mais em uma única sessão de alta intensidade.",
    xpReward: 5000,
    code: "ACH-37",
    category: "inovacao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 4500,
    unitLabel: "pts na partida",
  },
  {
    id: "flawless_high_1800",
    title: "Supercondutor de Alta Potência",
    description:
      "Alcance 1.800 pontos ou mais em uma única partida sem cometer nenhum erro (0 falhas).",
    xpReward: 3000,
    code: "ACH-38",
    category: "inovacao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 1800,
    unitLabel: "pts sem erro",
  },
  {
    id: "comeback_specialist",
    title: "Rearme de Emergência (Resiliência)",
    description:
      "Conclua uma partida com 1.200+ pontos e ao menos 85% de precisão mesmo após sofrer 2 ou mais erros na rodada.",
    xpReward: 1100,
    code: "ACH-39",
    category: "inovacao",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 1,
    unitLabel: "rearme épico",
  },
  {
    id: "speed_demon_45",
    title: "Frequência de Clock 5 GHz",
    description:
      "Resolva 45 ou mais acertos técnicos dentro de uma única partida.",
    xpReward: 2600,
    code: "ACH-40",
    category: "inovacao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 45,
    unitLabel: "acertos na partida",
  },
  {
    id: "flawless_all_6_modules",
    title: "Hexágono de Cristal (Zero Defeito 6x)",
    description:
      "Conclua pelo menos uma partida perfeita (0 erros e mínimo de acertos) em cada um dos 6 módulos da plataforma.",
    xpReward: 5500,
    code: "ACH-41",
    category: "inovacao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 6,
    unitLabel: "módulos perfeitos",
  },
  {
    id: "master_all_6_1000",
    title: "Domínio Hexagonal (1.000+ pts nos 6)",
    description:
      "Registre recorde pessoal de pelo menos 1.000 pontos em todos os 6 minigames da plataforma.",
    xpReward: 3800,
    code: "ACH-42",
    category: "inovacao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 6,
    unitLabel: "módulos >= 1k pts",
  },
  {
    id: "grandmaster_all_6_1800",
    title: "Soberano das Seis Bancadas (1.800+ pts nos 6)",
    description:
      "Alcance um recorde pessoal de pelo menos 1.800 pontos em todos os 6 minigames da plataforma.",
    xpReward: 8000,
    code: "ACH-43",
    category: "inovacao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 6,
    unitLabel: "módulos >= 1.8k pts",
  },
  {
    id: "elite_accuracy_career",
    title: "Metrologia Padrão Ouro (95%+ em 1.000 Acertos)",
    description:
      "Acumule pelo menos 1.000 acertos na carreira mantendo uma precisão global igual ou superior a 95%.",
    xpReward: 6000,
    code: "ACH-44",
    category: "inovacao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 1000,
    unitLabel: "acertos (c/ >=95%)",
  },

  // ============================================================================
  // 6. VOLUME DE PRODUÇÃO & CONSISTÊNCIA (8 CONQUISTAS: ACH-45 a ACH-52)
  // ============================================================================
  {
    id: "matches_5",
    title: "Operador em Treinamento (15 Partidas)",
    description: "Complete 15 partidas acumuladas na plataforma.",
    xpReward: 300,
    code: "ACH-45",
    category: "volume",
    difficulty: "facil",
    difficultyLabel: "Fácil",
    targetValue: 15,
    unitLabel: "partidas",
  },
  {
    id: "matches_15",
    title: "Veterano de Laboratório (50 Partidas)",
    description:
      "Complete 50 partidas acumuladas entre sala de aula e treino solo.",
    xpReward: 850,
    code: "ACH-46",
    category: "volume",
    difficulty: "medio",
    difficultyLabel: "Médio",
    targetValue: 50,
    unitLabel: "partidas",
  },
  {
    id: "matches_150",
    title: "Maratonista Industrial (150 Partidas)",
    description:
      "Complete 150 partidas registradas mantendo dedicação contínua.",
    xpReward: 2200,
    code: "ACH-47",
    category: "volume",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 150,
    unitLabel: "partidas",
  },
  {
    id: "matches_350",
    title: "Lenda do Chão de Fábrica (350 Partidas)",
    description:
      "Complete a marca histórica de 350 partidas registradas na plataforma SENAI.",
    xpReward: 5500,
    code: "ACH-48",
    category: "volume",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 350,
    unitLabel: "partidas",
  },
  {
    id: "hits_50",
    title: "150 Componentes Aferidos",
    description: "Acumule 150 identificações corretas de componentes no seu perfil.",
    xpReward: 400,
    code: "ACH-49",
    category: "volume",
    difficulty: "medio",
    difficultyLabel: "Médio",
    targetValue: 150,
    unitLabel: "acertos",
  },
  {
    id: "hits_200",
    title: "750 Componentes Aferidos",
    description: "Acumule 750 identificações corretas ao longo do curso.",
    xpReward: 1100,
    code: "ACH-50",
    category: "volume",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 750,
    unitLabel: "acertos",
  },
  {
    id: "hits_2500",
    title: "2.500 Componentes Aferidos",
    description:
      "Marca histórica de 2.500 componentes inspecionados corretamente na bancada.",
    xpReward: 3000,
    code: "ACH-51",
    category: "volume",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2500,
    unitLabel: "acertos",
  },
  {
    id: "hits_7500",
    title: "7.500 Componentes Aferidos (Produção em Massa)",
    description:
      "Volume industrial supremo: 7.500 identificações, medições e reparos corretos acumulados.",
    xpReward: 7500,
    code: "ACH-52",
    category: "volume",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 7500,
    unitLabel: "acertos",
  },

  // ============================================================================
  // 7. MARCOS DE CARREIRA, PATENTES & COLEÇÃO (6 CONQUISTAS: ACH-53 a ACH-58)
  // ============================================================================
  {
    id: "career_level_25",
    title: "Patente Técnico de Manutenção (NV 25)",
    description:
      "Alcance o Nível 25 e desbloqueie a 6ª Patente Técnica da carreira SENAI.",
    xpReward: 1500,
    code: "ACH-53",
    category: "carreira",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 25,
    unitLabel: "nível",
  },
  {
    id: "career_level_50",
    title: "Engenheiro de Diagnóstico (NV 50)",
    description:
      "Alcance o Nível 50 na plataforma, superando metade dos níveis de carreira.",
    xpReward: 3500,
    code: "ACH-54",
    category: "carreira",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 50,
    unitLabel: "nível",
  },
  {
    id: "career_level_75",
    title: "Engenheiro Chefe de Laboratório (NV 75)",
    description:
      "Alcance o Nível 75 e ingresse na Divisão Alta Engenharia • Diamante I.",
    xpReward: 6000,
    code: "ACH-55",
    category: "carreira",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 75,
    unitLabel: "nível",
  },
  {
    id: "career_level_100",
    title: "Lenda Suprema da Arena SENAI (NV 100)",
    description:
      "Atinja o Nível 100 (1.000.000 XP) e conquiste a 21ª e última Patente Suprema.",
    xpReward: 15000,
    code: "ACH-56",
    category: "carreira",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 100,
    unitLabel: "nível",
  },
  {
    id: "collector_25",
    title: "Curador de Insígnias (25 Conquistas)",
    description:
      "Desbloqueie 25 conquistas técnicas diferentes no seu dossiê de engenharia.",
    xpReward: 2000,
    code: "ACH-57",
    category: "carreira",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 25,
    unitLabel: "conquistas",
  },
  {
    id: "collector_50",
    title: "Panteão da Engenharia SENAI (50 Conquistas)",
    description:
      "Desbloqueie 50 conquistas técnicas no seu perfil, provando domínio completo da plataforma.",
    xpReward: 10000,
    code: "ACH-58",
    category: "carreira",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 50,
    unitLabel: "conquistas",
  },
];

export interface MatchRecord {
  id: string;
  roundKey?: string;
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
