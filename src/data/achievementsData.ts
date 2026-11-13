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

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  code: string;
  category: "inicio" | "precisao" | "combo" | "volume" | "especialista" | "carreira";
  difficulty: AchievementDifficulty;
  difficultyLabel: string;
  targetValue: number;
  unitLabel: string;
}

export const ACHIEVEMENTS_CATALOG: AchievementDef[] = [
  // INÍCIO & PRIMEIROS PASSOS
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
    id: "all_rounder",
    title: "Polivalente de Manutenção",
    description: "Complete partidas nos 5 módulos diferentes da plataforma SENAI.",
    xpReward: 350,
    code: "ACH-02",
    category: "especialista",
    difficulty: "medio",
    difficultyLabel: "Médio",
    targetValue: 5,
    unitLabel: "módulos",
  },

  // PRECISÃO & IMUNIDADE A CURTO (MAIS DIFÍCEIS)
  {
    id: "zero_short_circuit",
    title: "Bancada Imune a Curto",
    description:
      "Finalize uma partida com pelo menos 12 acertos e 100% de precisão (0 falhas).",
    xpReward: 400,
    code: "ACH-03",
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
    code: "ACH-04",
    category: "precisao",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 22,
    unitLabel: "acertos s/ erro",
  },
  {
    id: "perfect_runs_10",
    title: "Certificação ISO Zero Defeito",
    description:
      "Acumule 10 partidas perfeitas (mínimo de 10 acertos e 0 falhas em cada uma).",
    xpReward: 1500,
    code: "ACH-05",
    category: "precisao",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 10,
    unitLabel: "partidas perfeitas",
  },
  {
    id: "high_scorer_2500",
    title: "Sobrecarga Controlada",
    description:
      "Alcance 1.500 pontos ou mais em uma única partida com o novo sistema de pontuação.",
    xpReward: 800,
    code: "ACH-06",
    category: "precisao",
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
    code: "ACH-07",
    category: "precisao",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 2800,
    unitLabel: "pts na partida",
  },

  // COMBOS DE ALTA FREQUÊNCIA
  {
    id: "combo_5",
    title: "Ritmo de Produção (10x)",
    description: "Alcance uma sequência (combo) de 10 acertos consecutivos sem errar.",
    xpReward: 250,
    code: "ACH-08",
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
    code: "ACH-09",
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
    code: "ACH-10",
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
    code: "ACH-11",
    category: "combo",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 60,
    unitLabel: "combo",
  },

  // ESPECIALISTAS DE BANCADA (5 MINIGAMES)
  {
    id: "conveyor_specialist",
    title: "Inspetor Mestre da Esteira",
    description:
      "Alcance 1.100 pontos ou mais em uma única sessão da Esteira Industrial.",
    xpReward: 650,
    code: "ACH-12",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 1100,
    unitLabel: "pts na Esteira",
  },
  {
    id: "resistor_specialist",
    title: "Mestre da Lei de Ohm",
    description:
      "Alcance 950 pontos ou mais em uma sessão da Oficina do Resistor E24.",
    xpReward: 650,
    code: "ACH-13",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 950,
    unitLabel: "pts no Resistor",
  },
  {
    id: "radar_specialist",
    title: "Rastreador de Nós Esquemáticos",
    description:
      "Alcance 900 pontos ou mais inspecionando diagramas no Radar do Circuito.",
    xpReward: 650,
    code: "ACH-14",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 900,
    unitLabel: "pts no Radar",
  },
  {
    id: "match_specialist",
    title: "Montador Ágil de Placas",
    description:
      "Alcance 900 pontos ou mais associando símbolos e funções no Jogo da Bancada.",
    xpReward: 650,
    code: "ACH-15",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 900,
    unitLabel: "pts na Bancada",
  },
  {
    id: "detective_specialist",
    title: "Perito Forense de Hardware",
    description:
      "Alcance 900 pontos ou mais diagnosticando falhas no Detetive da Fumaça.",
    xpReward: 650,
    code: "ACH-16",
    category: "especialista",
    difficulty: "dificil",
    difficultyLabel: "Difícil",
    targetValue: 900,
    unitLabel: "pts no Detetive",
  },

  // VOLUME DE PRODUÇÃO & CONSISTÊNCIA
  {
    id: "matches_5",
    title: " Operador em Treinamento (15 Partidas)",
    description: "Complete 15 partidas acumuladas na plataforma.",
    xpReward: 300,
    code: "ACH-17",
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
    code: "ACH-18",
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
    code: "ACH-19",
    category: "volume",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 150,
    unitLabel: "partidas",
  },
  {
    id: "hits_50",
    title: "150 Componentes Aferidos",
    description: "Acumule 150 identificações corretas de componentes no seu perfil.",
    xpReward: 400,
    code: "ACH-20",
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
    code: "ACH-21",
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
    code: "ACH-22",
    category: "volume",
    difficulty: "extremo",
    difficultyLabel: "Extremo",
    targetValue: 2500,
    unitLabel: "acertos",
  },

  // MARCOS DE CARREIRA & PATENTES
  {
    id: "career_level_25",
    title: "Patente Técnico de Manutenção (NV 25)",
    description:
      "Alcance o Nível 25 e desbloqueie a 6ª Patente Técnica da carreira SENAI.",
    xpReward: 1500,
    code: "ACH-23",
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
    code: "ACH-24",
    category: "carreira",
    difficulty: "lendario",
    difficultyLabel: "Lendário",
    targetValue: 50,
    unitLabel: "nível",
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
