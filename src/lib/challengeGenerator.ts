import {
  ELECTRONIC_COMPONENTS,
  ElectronicComponentItem,
  RESISTOR_COLORS,
  ResistorOrder,
} from "@/data/electronicsData";
import { SymbolId } from "@/components/ElectronicSymbolSVG";

// ============================================================================
// 1. GERADOR PROCEDURAL DE RESISTORES (SÉRIE COMERCIAL E12/E24 + LEI DE OHM)
// ============================================================================
const E24_MANTISSAS: [number, number][] = [
  [1, 0], // 10
  [1, 2], // 12
  [1, 5], // 15
  [1, 8], // 18
  [2, 0], // 20
  [2, 2], // 22
  [2, 4], // 24
  [2, 7], // 27
  [3, 0], // 30
  [3, 3], // 33
  [3, 6], // 36
  [3, 9], // 39
  [4, 3], // 43
  [4, 7], // 47
  [5, 1], // 51
  [5, 6], // 56
  [6, 2], // 62
  [6, 8], // 68
  [7, 5], // 75
  [8, 2], // 82
  [9, 1], // 91
];

export function formatOhmsLabel(ohms: number): string {
  if (ohms >= 1000000) {
    return `${(ohms / 1000000).toLocaleString("pt-BR")} MΩ`;
  }
  if (ohms >= 1000) {
    return `${(ohms / 1000).toLocaleString("pt-BR")} kΩ`;
  }
  return `${ohms} Ω`;
}

function buildResistorContext(ohms: number): string {
  if (ohms < 100) {
    const scenarios = [
      `Resistor de Gate-Stopper (${ohms} Ω) para amortecer oscilações em MOSFET de potência`,
      `Resistor Shunt de baixa resistência (${ohms} Ω) para sensoriamento de corrente na fonte`,
      `Proteção em série de entrada (${ohms} Ω) para limitar pico de corrente inicial`,
      `Casamento de impedância e amortecimento em linha de pulso rápido (${ohms} Ω)`,
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  if (ohms >= 100 && ohms <= 910) {
    const vccOptions = [5, 9, 12, 24];
    const vcc = vccOptions[Math.floor(Math.random() * vccOptions.length)];
    const currentMa = Math.max(2, Math.round(((vcc - 2) / ohms) * 1000));
    const scenarios = [
      `Limitar corrente de LED indicador em fonte de ${vcc}V DC (~${currentMa} mA)`,
      `Proteção do LED interno de um Optoacoplador PC817 em barramento de ${vcc}V`,
      `Limitação de corrente para segmentos de Display 7-Seg em painel de ${vcc}V`,
      `Polarização de Diodo Zener regulador em malha de bancada (${formatOhmsLabel(ohms)})`,
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  if (ohms >= 1000 && ohms <= 9100) {
    const scenarios = [
      `Resistor de Pull-Up (${formatOhmsLabel(ohms)}) para barramento de comunicação I2C / sensores`,
      `Polarização de Base de Transistor NPN (BC548) para acionar bobina de Relé 12V`,
      `Divisor de tensão de referência para entrada inversora (-) de Amplificador Operacional`,
      `Limitação de corrente de sinal para entrada digital de CLP / Microcontrolador`,
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  if (ohms >= 10000 && ohms <= 91000) {
    const capUf = [1, 10, 47, 100][Math.floor(Math.random() * 4)];
    const tauSec = ((ohms * capUf) / 1000000).toFixed(2).replace(".", ",");
    const scenarios = [
      `Malha de temporização RC com capacitor de ${capUf} µF (constante τ ≈ ${tauSec}s)`,
      `Resistor Pull-Down (${formatOhmsLabel(ohms)}) para manter entrada de Porta Lógica AND em nível 0`,
      `Divisor de tensão em série com sensor óptico LDR para leitura analógica`,
      `Realimentação negativa de ganho em estágio com Amplificador Operacional LM358`,
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  const scenarios = [
    `Resistor Bleeder (${formatOhmsLabel(ohms)}) para descarga segura de capacitor eletrolítico de filtro`,
    `Polarização de alta impedância entre Gate e Source de transistor MOSFET`,
    `Malha de tempo de longo período em circuito oscilador de baixa frequência`,
    `Divisor de tensão de alta impedância para monitoramento de bateria`,
  ];
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

export function generateProceduralResistorOrder(
  previousOhms?: number
): ResistorOrder {
  let targetOhms = previousOhms || 0;
  let d1 = 1;
  let d2 = 0;
  let multIdx = 1;

  for (let attempt = 0; attempt < 15; attempt++) {
    const mantissa =
      E24_MANTISSAS[Math.floor(Math.random() * E24_MANTISSAS.length)];
    d1 = mantissa[0];
    d2 = mantissa[1];
    // Multiplicadores de x1 Ω (índice 0) até x100 kΩ (índice 5)
    multIdx = Math.floor(Math.random() * 6);
    const multValue = RESISTOR_COLORS[multIdx].multiplier;
    const candidate = (d1 * 10 + d2) * multValue;
    if (candidate !== previousOhms) {
      targetOhms = candidate;
      break;
    }
  }

  return {
    targetOhms,
    displayLabel: formatOhmsLabel(targetOhms),
    usageHint: buildResistorContext(targetOhms),
    correctBands: [d1, d2, multIdx],
  };
}

// ============================================================================
// 2. GERADOR PROCEDURAL DO RADAR (3 TOPOLOGIAS COMPLETAS + FALHAS DINÂMICAS)
// ============================================================================
export interface CircuitNodeSpot {
  nodeId: string;
  symbol: SymbolId;
  stageLabel: string;
  faultSymptom: string;
  functionPrompt: string;
}

export interface CircuitTopology {
  id: string;
  title: string;
  subtitle: string;
  nodes: CircuitNodeSpot[];
}

export const RADAR_TOPOLOGIES: CircuitTopology[] = [
  {
    id: "fonte_linear_sensor",
    title: "TOPOLOGIA A: FONTE LINEAR REGULADA + SENSOR FOTOELÉTRICO",
    subtitle: "Proteção AC → Retificação → Filtragem → Regulação → Comando",
    nodes: [
      {
        nodeId: "AC1",
        symbol: "ac_source",
        stageLabel: "Rede 220V~",
        faultSymptom: "Não há tensão alternada chegando ao cabo de força.",
        functionPrompt: "Fornece alimentação alternada senoidal da rede elétrica.",
      },
      {
        nodeId: "F1",
        symbol: "fuse",
        stageLabel: "Proteção I>",
        faultSymptom: "A placa está totalmente inoperante após um curto; precisamos testar continuidade (bip) na entrada.",
        functionPrompt: "Rompe seu elo interno para interromper sobrecorrente.",
      },
      {
        nodeId: "RV1",
        symbol: "varistor",
        stageLabel: "Surto U>",
        faultSymptom: "Um raio na rede causou sobretensão e este protetor entrou em curto após o fusível.",
        functionPrompt: "Grampeia picos de sobretensão (surtos) na entrada AC.",
      },
      {
        nodeId: "T1",
        symbol: "transformer",
        stageLabel: "Rebaixador",
        faultSymptom: "Temos 220V AC na entrada, mas 0V AC antes da ponte retificadora.",
        functionPrompt: "Rebaixa a tensão AC de 220V para 12V com isolação galvânica.",
      },
      {
        nodeId: "BR1",
        symbol: "bridge_rectifier",
        stageLabel: "Onda Completa",
        faultSymptom: "Tensão AC chega do secundário, mas não é convertida em contínua pulsante.",
        functionPrompt: "Converte AC em DC de onda completa usando 4 diodos integrados.",
      },
      {
        nodeId: "C1",
        symbol: "electrolytic_cap",
        stageLabel: "Filtro Principal",
        faultSymptom: "A fonte apresenta alto ruído (ripple) de 120 Hz e o topo cilíndrico desta peça está estufado.",
        functionPrompt: "Capacitor polarizado que filtra a tensão contínua após a retificação.",
      },
      {
        nodeId: "U1",
        symbol: "voltage_regulator",
        stageLabel: "Saída +5V",
        faultSymptom: "Chegam 12V DC no pino IN, mas a linha lógica de +5V no pino OUT está zerada.",
        functionPrompt: "CI de 3 terminais (7805) que estabiliza a saída em +5V fixos.",
      },
      {
        nodeId: "LDR1",
        symbol: "ldr",
        stageLabel: "Sensor Óptico",
        faultSymptom: "O circuito não percebe a transição entre dia e noite no ambiente.",
        functionPrompt: "Varia sua resistência elétrica conforme a luz incidente.",
      },
      {
        nodeId: "Q1",
        symbol: "transistor_npn",
        stageLabel: "Driver NPN",
        faultSymptom: "O sinal chega na Base, mas a corrente não é chaveada entre Coletor e Emissor.",
        functionPrompt: "Transistor bipolar NPN que atua como chave eletrônica.",
      },
      {
        nodeId: "K1",
        symbol: "relay",
        stageLabel: "Comutação",
        faultSymptom: "Não ouvimos o 'clique' mecânico para fechar o contato da carga externa.",
        functionPrompt: "Aciona contatos mecânicos isolados através de uma bobina eletromagnética.",
      },
      {
        nodeId: "LED1",
        symbol: "led",
        stageLabel: "Status Painel",
        faultSymptom: "A carga funciona, mas o indicador luminoso frontal não acende.",
        functionPrompt: "Diodo polarizado que emite luz indicando painel energizado.",
      },
      {
        nodeId: "GND1",
        symbol: "gnd",
        stageLabel: "Comum 0V",
        faultSymptom: "Precisamos apoiar a ponta preta do multímetro na referência de 0V.",
        functionPrompt: "Ponto comum de referência de 0 Volts da bancada.",
      },
    ],
  },
  {
    id: "automacao_logica_digital",
    title: "TOPOLOGIA B: LÓGICA DIGITAL, ISOLAMENTO & ALARME INDUSTRIAL",
    subtitle: "Clock → Portas Lógicas Booleanas → Isolamento Óptico → Atuadores",
    nodes: [
      {
        nodeId: "VCC1",
        symbol: "dc_source",
        stageLabel: "Barramento +5V",
        faultSymptom: "O barramento digital está sem alimentação contínua (+ e -).",
        functionPrompt: "Fonte de tensão contínua (DC) de polaridade fixa.",
      },
      {
        nodeId: "SW1",
        symbol: "switch",
        stageLabel: "Botão Partida",
        faultSymptom: "O pulso manual do operador não fecha contato quando pressionado.",
        functionPrompt: "Chave normalmente aberta (NA) para comando manual.",
      },
      {
        nodeId: "Y1",
        symbol: "crystal",
        stageLabel: "Clock 16MHz",
        faultSymptom: "O sistema digital travou porque perdeu a oscilação de sincronismo (clock).",
        functionPrompt: "Ressonador de quartzo piezoelétrico que gera a frequência de clock.",
      },
      {
        nodeId: "U1",
        symbol: "gate_and",
        stageLabel: "Intertravamento",
        faultSymptom: "Esta porta lógica só deve liberar nível 1 quando as DUAS entradas de segurança forem 1.",
        functionPrompt: "Porta lógica AND (&): saída 1 somente se todas as entradas forem 1.",
      },
      {
        nodeId: "U2",
        symbol: "gate_or",
        stageLabel: "Acionamento Duplo",
        faultSymptom: "Precisamos da porta lógica que aciona a saída se o botão A OU o sensor B for 1.",
        functionPrompt: "Porta lógica OR (≥1): saída 1 quando pelo menos uma entrada for 1.",
      },
      {
        nodeId: "U3",
        symbol: "gate_not",
        stageLabel: "Inversor Lógico",
        faultSymptom: "O sinal precisa ser invertido (0 vira 1, e 1 vira 0) antes do próximo estágio.",
        functionPrompt: "Porta lógica NOT: inverte o estado booleano da entrada.",
      },
      {
        nodeId: "U4",
        symbol: "gate_xor",
        stageLabel: "Detector Diferença",
        faultSymptom: "Compara dois canais: só deve emitir nível 1 quando as entradas forem DIFERENTES.",
        functionPrompt: "Porta lógica XOR (=1): saída 1 apenas para entradas com níveis opostos.",
      },
      {
        nodeId: "DSP1",
        symbol: "display_7seg",
        stageLabel: "Visor Numérico",
        faultSymptom: "Um dos segmentos ('a' até 'g') do mostrador numérico está apagado.",
        functionPrompt: "Display de 7 segmentos para leitura visual de dígitos de 0 a 9.",
      },
      {
        nodeId: "PC1",
        symbol: "optocoupler",
        stageLabel: "Isolação Óptica",
        faultSymptom: "O pulso lógico não atravessa a barreira de isolamento por luz infravermelha.",
        functionPrompt: "Optoacoplador que isola eletricamente o controle da etapa de potência.",
      },
      {
        nodeId: "Q1",
        symbol: "mosfet",
        stageLabel: "Driver Gate",
        faultSymptom: "Há tensão no Gate, mas o canal Drain-Source de potência não conduz.",
        functionPrompt: "Transistor MOSFET controlado por tensão no terminal Gate.",
      },
      {
        nodeId: "BZ1",
        symbol: "buzzer",
        stageLabel: "Alarme Sonoro",
        faultSymptom: "O painel indica falha visual, mas não emite o bip acústico de alerta.",
        functionPrompt: "Transdutor sonoro (Buzzer) para alerta audível.",
      },
      {
        nodeId: "GND1",
        symbol: "gnd",
        stageLabel: "Terra Digital",
        faultSymptom: "Ponto de retorno comum de 0V para todas as portas lógicas.",
        functionPrompt: "Referência de 0V (GND) do barramento digital.",
      },
    ],
  },
  {
    id: "potencia_controle_industrial",
    title: "TOPOLOGIA C: CONTROLE DE POTÊNCIA AC/DC & CONDICIONAMENTO",
    subtitle: "Filtragem EMI → Sensoriamento Térmico → Comparador → Disparo Tiristor",
    nodes: [
      {
        nodeId: "L1",
        symbol: "inductor",
        stageLabel: "Filtro EMI",
        faultSymptom: "A bobina de bloqueio de ruído em série na linha está com espira rompida.",
        functionPrompt: "Indutor que armazena energia magnética e filtra variações de corrente.",
      },
      {
        nodeId: "C1",
        symbol: "capacitor",
        stageLabel: "Desacoplamento",
        faultSymptom: "Ruídos de alta frequência estão instabilizando o CI por falta do capacitor 100nF (104).",
        functionPrompt: "Capacitor fixo não-polarizado para desacoplamento de ruídos.",
      },
      {
        nodeId: "D1",
        symbol: "schottky_diode",
        stageLabel: "Retificação Rápida",
        faultSymptom: "Precisamos aferir o diodo de baixa queda (~0,25V) da etapa chaveada.",
        functionPrompt: "Diodo Schottky de comutação rápida e baixa queda de tensão direta.",
      },
      {
        nodeId: "ZD1",
        symbol: "zener",
        stageLabel: "Ref. Tensão",
        faultSymptom: "A tensão de referência de 5,1V variou porque o diodo reverso abriu.",
        functionPrompt: "Diodo Zener polarizado reversamente para fixar tensão de referência.",
      },
      {
        nodeId: "RT1",
        symbol: "thermistor",
        stageLabel: "Sonda Térmica",
        faultSymptom: "O dissipador superaqueceu e o sensor térmico não alterou sua resistência.",
        functionPrompt: "Termistor (NTC/PTC) que varia a resistência conforme a temperatura.",
      },
      {
        nodeId: "POT1",
        symbol: "potentiometer",
        stageLabel: "Ajuste Setpoint",
        faultSymptom: "Ao girar o seletor de potência, a tensão do cursor central não varia.",
        functionPrompt: "Potenciômetro de 3 terminais para ajuste manual de nível.",
      },
      {
        nodeId: "U1",
        symbol: "ic_opamp",
        stageLabel: "Comparador",
        faultSymptom: "Compara a sonda térmica (+) com o ajuste (-), mas a saída analógica travou.",
        functionPrompt: "Amplificador Operacional usado como comparador diferencial.",
      },
      {
        nodeId: "U2",
        symbol: "gate_nand",
        stageLabel: "Habilitação NAND",
        faultSymptom: "Porta universal cuja saída só vai a 0 quando todas as entradas estão em 1.",
        functionPrompt: "Porta lógica NAND (AND seguida de inversão).",
      },
      {
        nodeId: "SCR1",
        symbol: "scr",
        stageLabel: "Trava DC",
        faultSymptom: "Dispara com pulso no Gate e mantém a carga DC travada ligada.",
        functionPrompt: "Tiristor SCR unidirecional acionado pelo terminal Gate.",
      },
      {
        nodeId: "TR1",
        symbol: "triac",
        stageLabel: "Potência AC",
        faultSymptom: "Controla os dois semiciclos da carga AC através de pulsos no Gate.",
        functionPrompt: "TRIAC bidirecional para controle de potência em Corrente Alternada.",
      },
      {
        nodeId: "R1",
        symbol: "resistor",
        stageLabel: "Limitação Gate",
        faultSymptom: "Limita a corrente de disparo enviada ao pino Gate do tiristor.",
        functionPrompt: "Resistor fixo limitador de corrente elétrica.",
      },
      {
        nodeId: "D2",
        symbol: "diode",
        stageLabel: "Bloqueio Reverso",
        faultSymptom: "Impede o retorno de corrente reversa para o estágio de disparo.",
        functionPrompt: "Diodo retificador padrão de silício (~0,7V).",
      },
    ],
  },
];

export interface DynamicRadarChallenge {
  topology: CircuitTopology;
  targetNode: CircuitNodeSpot;
  promptTitle: string;
  promptHint: string;
  promptType: "symptom" | "function" | "designator";
}

export function generateProceduralRadarChallenge(
  topologyIndex: number,
  previousNodeId?: string
): DynamicRadarChallenge {
  const topology =
    RADAR_TOPOLOGIES[topologyIndex % RADAR_TOPOLOGIES.length];
  const candidates = topology.nodes.filter(
    (n) => n.nodeId !== previousNodeId
  );
  const targetNode =
    candidates[Math.floor(Math.random() * candidates.length)] ||
    topology.nodes[0];

  const compMeta = ELECTRONIC_COMPONENTS.find(
    (c) => c.id === targetNode.symbol
  );

  const modes: ("symptom" | "function" | "designator")[] = [
    "symptom",
    "function",
    "designator",
  ];
  const chosenMode = modes[Math.floor(Math.random() * modes.length)];

  if (chosenMode === "symptom") {
    return {
      topology,
      targetNode,
      promptTitle: `Diagnóstico: ${targetNode.faultSymptom}`,
      promptHint: `Procure pelo estágio "${targetNode.stageLabel}" (${
        compMeta?.shortName || targetNode.nodeId
      } [${targetNode.nodeId}]).`,
      promptType: "symptom",
    };
  }

  if (chosenMode === "function") {
    return {
      topology,
      targetNode,
      promptTitle: `Função: ${targetNode.functionPrompt}`,
      promptHint: `Estágio "${targetNode.stageLabel}" — designador [${targetNode.nodeId}].`,
      promptType: "function",
    };
  }

  return {
    topology,
    targetNode,
    promptTitle: `Inspecione o nó [${targetNode.nodeId}] — ${
      compMeta?.name || targetNode.stageLabel
    }`,
    promptHint: `${targetNode.functionPrompt} (${targetNode.stageLabel}).`,
    promptType: "designator",
  };
}

// ============================================================================
// 3. GERADOR PROCEDURAL DO DETETIVE (COMBINAÇÃO DINÂMICA DE PISTAS)
// ============================================================================
export interface DetectiveMysteryCase {
  target: ElectronicComponentItem;
  candidates: ElectronicComponentItem[];
  clues: [string, string, string];
  isAiGenerated?: boolean;
  source?: "ai" | "procedural";
  contextHeader: string;
}

export type DetectiveCase = DetectiveMysteryCase;

const DETECTIVE_CONTEXT_HEADERS: string[] = [
  "Inspeção de Bancada: Identifique o componente pelas leituras técnicas",
  "Ordem de Manutenção Preventiva: Qual componente corresponde ao laudo?",
  "Análise de Falha em Placa Industrial: Identifique a peça suspeita",
  "Diagnóstico de Laboratório SENAI: Descubra o componente oculto",
];

export function generateProceduralDetectiveCase(
  previousId?: SymbolId | string | string[]
): DetectiveMysteryCase {
  const excludedIds = Array.isArray(previousId)
    ? previousId
    : previousId
    ? [previousId]
    : [];
  const pool = ELECTRONIC_COMPONENTS.filter(
    (c) => !excludedIds.includes(c.id)
  );
  const sourcePool = pool.length > 0 ? pool : ELECTRONIC_COMPONENTS;
  const target = sourcePool[Math.floor(Math.random() * sourcePool.length)];

  // Prioriza distratores da mesma categoria ou categorias próximas para aumentar o desafio técnico
  const sameCategory = ELECTRONIC_COMPONENTS.filter(
    (c) => c.id !== target.id && c.category === target.category
  ).sort(() => Math.random() - 0.5);
  const otherCategory = ELECTRONIC_COMPONENTS.filter(
    (c) => c.id !== target.id && c.category !== target.category
  ).sort(() => Math.random() - 0.5);

  const distractors = [...sameCategory.slice(0, 3), ...otherCategory.slice(0, 2)].slice(
    0,
    5
  );

  // Monta um pool rico de pistas para o componente sorteado e seleciona 3 diferentes
  const dynamicCluePool: string[] = [
    ...target.clues,
    `Pertenço à família "${target.categoryLabel}" e minha grandeza principal é medida em ${target.unit}.`,
    `Na serigrafia da PCI sou identificado pelo designador [${target.boardLetter}] e minha função é: ${target.basicFunction}`,
  ];

  const shuffledClues = [...dynamicCluePool].sort(() => Math.random() - 0.5);
  const selectedClues: [string, string, string] = [
    shuffledClues[0] || target.clues[0],
    shuffledClues[1] || target.clues[1] || target.basicFunction,
    shuffledClues[2] ||
      `Designador de placa: [${target.boardLetter}] (${target.unit}).`,
  ];

  const contextHeader =
    DETECTIVE_CONTEXT_HEADERS[
      Math.floor(Math.random() * DETECTIVE_CONTEXT_HEADERS.length)
    ];

  return {
    target,
    candidates: [target, ...distractors].sort(() => Math.random() - 0.5),
    clues: selectedClues,
    source: "procedural",
    contextHeader,
  };
}
