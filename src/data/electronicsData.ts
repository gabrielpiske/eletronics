import { SymbolId } from "@/components/ElectronicSymbolSVG";

export type ComponentCategory = "passivo" | "semicondutor" | "protecao_energia";

export interface ElectronicComponentItem {
  id: SymbolId;
  name: string;
  shortName: string;
  boardLetter: string;
  category: ComponentCategory;
  categoryLabel: string;
  basicFunction: string;
  unit: string;
  clues: [string, string, string];
}

export type MinigameId =
  | "conveyor"
  | "radar"
  | "resistor"
  | "match"
  | "detective";

export interface MinigameMeta {
  id: MinigameId;
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  howToPlay: string;
  colorFrom: string;
  colorTo: string;
  defaultDurationSec: number;
}

export const MINIGAMES_CATALOG: MinigameMeta[] = [
  {
    id: "conveyor",
    title: "Esteira Maluca de Componentes",
    subtitle: "Classificação Rápida na Fábrica",
    badge: "ARCADE DE VELOCIDADE",
    description:
      "Os símbolos passam na esteira rolante! Deslize ou toque na caixa certa (Passivos, Semicondutores ou Proteção/Energia) ou associe ao nome antes que a peça caia.",
    howToPlay:
      "Veja o símbolo na esteira central e toque rapidamente na caixa correta na base da tela para manter seu multiplicador de combo!",
    colorFrom: "#0EA5E9",
    colorTo: "#2563EB",
    defaultDurationSec: 120,
  },
  {
    id: "radar",
    title: "Radar do Circuito",
    subtitle: "Caça-Símbolos no Esquema Elétrico",
    badge: "INSPEÇÃO DE DIAGRAMA",
    description:
      "Um circuito elétrico completo aparece na tela! O radar pede um componente (pelo nome, função ou letra da placa) e o aluno toca direto na peça dentro do esquema.",
    howToPlay:
      "Leia a missão no topo do radar e toque diretamente em cima do símbolo correspondente dentro do diagrama elétrico!",
    colorFrom: "#10B981",
    colorTo: "#059669",
    defaultDurationSec: 120,
  },
  {
    id: "resistor",
    title: "Oficina do Resistor",
    subtitle: "Pinte as Faixas de Cores na Bancada",
    badge: "MÃO NA MASSA",
    description:
      "Chegou uma ordem de serviço pedindo um resistor específico (ex: 220 Ω, 1 kΩ, 4.7 kΩ). Toque nas faixas do resistor para pintar as cores certas e conferir no multímetro!",
    howToPlay:
      "Selecione a 1ª Faixa, 2ª Faixa e Multiplicador na paleta de cores até o multímetro marcar o valor pedido e clique em SOLDAR!",
    colorFrom: "#F59E0B",
    colorTo: "#D97706",
    defaultDurationSec: 150,
  },
  {
    id: "match",
    title: "Conexão de Bancada",
    subtitle: "Ligue os Pares: Símbolo ↔ Letra & Função",
    badge: "QUEBRA-CABEÇA RÁPIDO",
    description:
      "Painel com 12 terminais misturados! Conecte cada símbolo esquemático ao seu nome, letra na placa (R, C, D, Q, F) ou função básica para limpar a placa e subir de nível.",
    howToPlay:
      "Toque em um cartão de Símbolo (azul) e depois no cartão de Texto correspondente (âmbar) para fechar o circuito!",
    colorFrom: "#8B5CF6",
    colorTo: "#6D28D9",
    defaultDurationSec: 120,
  },
  {
    id: "detective",
    title: "Símbolo sob Fumaça",
    subtitle: "Deduza a Peça com Pistas Progressivas",
    badge: "DETETIVE DE BANCADA",
    description:
      "O símbolo começa escondido na fumaça e vai revelando sua forma enquanto 3 pistas básicas aparecem. Quanto mais rápido descobrir a peça, mais pontos ganha!",
    howToPlay:
      "Acompanhe as pistas e o símbolo saindo da fumaça. Clique no componente certo o mais cedo possível para ganhar pontuação máxima!",
    colorFrom: "#EC4899",
    colorTo: "#BE185D",
    defaultDurationSec: 120,
  },
];

export const ELECTRONIC_COMPONENTS: ElectronicComponentItem[] = [
  {
    id: "resistor",
    name: "Resistor Fixo",
    shortName: "Resistor",
    boardLetter: "R",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction: "Limita a passagem da corrente elétrica e provoca queda de tensão.",
    unit: "Ohm (Ω)",
    clues: [
      "Na placa de circuito impresso, sou sempre identificado pela letra R.",
      "Minha unidade de medida é o Ohm (Ω) e meu valor é lido por faixas coloridas.",
      "Minha função básica é limitar a corrente elétrica no circuito.",
    ],
  },
  {
    id: "potentiometer",
    name: "Potenciômetro",
    shortName: "Potenciômetro",
    boardLetter: "RV / POT",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction: "Resistor variável ajustável manualmente (ex: controle de volume ou brilho).",
    unit: "Ohm (Ω)",
    clues: [
      "Possuo 3 terminais e um eixo giratório ou cursor deslizante.",
      "Sou usado para regular níveis manualmente, como volume de som ou tensão.",
      "Meu símbolo é um resistor com uma seta apontando para o meio.",
    ],
  },
  {
    id: "ldr",
    name: "LDR (Fotoresistor)",
    shortName: "LDR",
    boardLetter: "LDR",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction: "Varia sua resistência elétrica conforme a intensidade de luz que recebe.",
    unit: "Ohm (Ω)",
    clues: [
      "Sou muito utilizado em fotocélulas de iluminação pública para acender postes à noite.",
      "Quanto mais luz incide sobre mim, menor fica a minha resistência elétrica.",
      "Meu símbolo é um resistor com duas setas de luz apontando para dentro.",
    ],
  },
  {
    id: "thermistor",
    name: "Termistor (NTC / PTC)",
    shortName: "Termistor",
    boardLetter: "RT / TH",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction: "Sensor térmico que varia sua resistência conforme a temperatura.",
    unit: "Ohm (Ω)",
    clues: [
      "Sou um sensor simples usado para medir temperatura ou proteger fontes.",
      "Posso ser do tipo NTC (resistência cai quando esquenta) ou PTC.",
      "Meu símbolo traz um resistor cortado por uma linha diagonal com 't°'.",
    ],
  },
  {
    id: "capacitor",
    name: "Capacitor Cerâmico / Fixo",
    shortName: "Capacitor Fixo",
    boardLetter: "C",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction: "Armazena cargas elétricas temporariamente e filtra ruídos sem ter polaridade.",
    unit: "Farad (F)",
    clues: [
      "Sou identificado pela letra C na placa e NÃO possuo lado positivo ou negativo.",
      "Minha unidade de medida é o Farad (normalmente pF ou nF, como o código 104).",
      "Meu símbolo tem duas placas paralelas retas iguaizinhas.",
    ],
  },
  {
    id: "electrolytic_cap",
    name: "Capacitor Eletrolítico",
    shortName: "Cap. Eletrolítico",
    boardLetter: "C (+)",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction: "Armazena carga elétrica em fontes e possui polaridade (+ e -) obrigatória.",
    unit: "Microfarad (µF)",
    clues: [
      "Cuidado na bancada: se me ligar invertido, posso estufar ou estourar!",
      "Possuo uma faixa lateral indicando o terminal negativo (-) e sou medido em µF.",
      "Meu símbolo tem uma placa reta com sinal '+' e outra curva.",
    ],
  },
  {
    id: "inductor",
    name: "Indutor (Bobina)",
    shortName: "Indutor",
    boardLetter: "L",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction: "Armazena energia na forma de campo magnético quando a corrente passa pelas espiras.",
    unit: "Henry (H)",
    clues: [
      "Na placa de circuito impresso, sou representado pela letra L.",
      "Sou formado por um fio condutor enrolado em espiras (bobina).",
      "Minha unidade é o Henry (H) e meu símbolo parece várias curvinhas em sequência.",
    ],
  },
  {
    id: "transformer",
    name: "Transformador",
    shortName: "Transformador",
    boardLetter: "T / TR",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction: "Aumenta ou reduz a tensão em Corrente Alternada (AC) através de duas bobinas.",
    unit: "Volt / VA",
    clues: [
      "Só funciono em Corrente Alternada (AC) e tenho enrolamento Primário e Secundário.",
      "Sou usado na entrada de fontes lineares para rebaixar 220V para 12V, por exemplo.",
      "Meu símbolo mostra duas bobinas frente a frente separadas por duas linhas de núcleo.",
    ],
  },
  {
    id: "diode",
    name: "Diodo Retificador",
    shortName: "Diodo",
    boardLetter: "D",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction: "Permite a passagem da corrente em um único sentido (do Anodo para o Catodo).",
    unit: "Queda ~0,7V",
    clues: [
      "Meus dois terminais se chamam Anodo (+) e Catodo (-, marcado com uma faixa).",
      "Sou peça-chave para transformar Corrente Alternada (AC) em Contínua (DC).",
      "Meu símbolo é um triângulo apontando para uma barra vertical.",
    ],
  },
  {
    id: "led",
    name: "LED (Diodo Emissor de Luz)",
    shortName: "LED",
    boardLetter: "LED / D",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction: "Semicondutor polarizado que emite luz quando percorrido por corrente no sentido direto.",
    unit: "mA / Vf",
    clues: [
      "Minha perna mais longa (ou chanfro menor) identifica a minha polaridade na montagem.",
      "Preciso quase sempre de um resistor em série para não queimar!",
      "Meu símbolo é um diodo com duas setinhas apontando para fora (emitindo luz).",
    ],
  },
  {
    id: "zener",
    name: "Diodo Zener",
    shortName: "Diodo Zener",
    boardLetter: "ZD / DZ",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction: "Trabalha polarizado reversamente para estabilizar e regular uma tensão fixa.",
    unit: "Volt Zener (Vz)",
    clues: [
      "Na placa sou identificado pelas letras ZD ou DZ.",
      "Diferente do diodo comum, sou projetado para trabalhar na região de ruptura reversa regulando tensão.",
      "Meu símbolo é um diodo cuja barra vertical tem as pontas dobradas parecendo um 'Z'.",
    ],
  },
  {
    id: "transistor_npn",
    name: "Transistor Bipolar (NPN)",
    shortName: "Transistor NPN",
    boardLetter: "Q / TR",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction: "Atua como chave eletrônica ou amplificador de sinal usando Base, Coletor e Emissor.",
    unit: "Ganho (hFE)",
    clues: [
      "Possuo 3 terminais chamados Base (B), Coletor (C) e Emissor (E).",
      "Na placa sou identificado pela letra Q e posso amplificar sinais ou acionar cargas.",
      "No meu símbolo NPN, a seta do Emissor aponta para FORA.",
    ],
  },
  {
    id: "mosfet",
    name: "Transistor MOSFET",
    shortName: "MOSFET",
    boardLetter: "Q / M",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction: "Transistor de potência controlado por tensão nos terminais Gate, Drain e Source.",
    unit: "Vds / Id",
    clues: [
      "Meus 3 terminais são Gate (Porta), Drain (Dreno) e Source (Fonte).",
      "Sou campeão em fontes chaveadas e controle de motores por aguentar alta corrente.",
      "Meu símbolo mostra o terminal Gate isolado de três tracinhos verticais.",
    ],
  },
  {
    id: "scr",
    name: "Tiristor SCR",
    shortName: "Tiristor SCR",
    boardLetter: "SCR / TH",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction: "Diodo controlado de potência que só conduz após receber um pulso no terminal Gate.",
    unit: "Ampere / Volt",
    clues: [
      "Sou um componente de Eletrônica de Potência com Anodo, Catodo e Gate (G).",
      "Depois que recebo um pulso no Gate, continuo conduzindo em DC até a corrente zerar.",
      "Meu símbolo é exatamente um diodo com um terceiro terminal (G) saindo do Catodo.",
    ],
  },
  {
    id: "fuse",
    name: "Fusível de Proteção",
    shortName: "Fusível",
    boardLetter: "F",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction: "Rompe seu filamento interno para abrir o circuito e proteger o equipamento contra curto.",
    unit: "Ampere (A)",
    clues: [
      "Na placa sou identificado pela letra F e sou o primeiro item testado quando nada liga!",
      "No multímetro, se eu estiver bom, dou sinal sonoro (BIP de continuidade).",
      "Meu símbolo é um retângulo com a linha do fio passando direto por dentro dele.",
    ],
  },
  {
    id: "switch",
    name: "Chave / Interruptor (NA)",
    shortName: "Chave / Botão",
    boardLetter: "SW / S",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction: "Abre ou fecha manualmente a passagem da corrente elétrica no circuito.",
    unit: "Contato NA/NF",
    clues: [
      "Na placa sou identificada pelas letras SW ou S.",
      "Posso ser Normalmente Aberta (NA) ou Normalmente Fechada (NF).",
      "Meu símbolo mostra dois pontos de contato com uma alavanca inclinada.",
    ],
  },
  {
    id: "gnd",
    name: "Terra (GND / Referência 0V)",
    shortName: "Terra (GND)",
    boardLetter: "GND",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction: "Ponto comum de referência de 0V (retorno) onde colocamos a ponta preta do multímetro.",
    unit: "0 Volts",
    clues: [
      "Quando medimos tensão DC no circuito, apoiamos a ponta PRETA do multímetro em mim!",
      "Represento o potencial de referência de 0V da placa eletrônica.",
      "Meu símbolo são três traços horizontais que vão diminuindo formando um triângulo para baixo.",
    ],
  },
  {
    id: "dc_source",
    name: "Fonte DC / Bateria",
    shortName: "Fonte Contínua (DC)",
    boardLetter: "VCC / BAT",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction: "Fornece tensão elétrica contínua com polo Positivo (+) e Negativo (-) fixos.",
    unit: "Volt DC (V)",
    clues: [
      "Forneço energia com polaridade fixa, como pilhas, baterias e fontes de bancada.",
      "No meu símbolo, o traço maior representa o Positivo (+) e o menor e grosso é o Negativo (-).",
      "Alimento os circuitos eletrônicos em Corrente Contínua (CC / DC).",
    ],
  },
  {
    id: "ac_source",
    name: "Fonte Alternada (AC)",
    shortName: "Fonte Alternada (AC)",
    boardLetter: "VAC",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction: "Fornece tensão alternada senoidal (como a rede elétrica da tomada 127V/220V).",
    unit: "Volt AC (V~)",
    clues: [
      "Represento a energia que vem da rede elétrica da tomada (ex: 220V / 60Hz).",
      "Minha tensão inverte de sentido várias vezes por segundo em formato de onda.",
      "Meu símbolo é um círculo com um til (~) senoidal desenhado no centro.",
    ],
  },
  {
    id: "ic_opamp",
    name: "Amplificador Operacional / CI",
    shortName: "Amp-Op / CI",
    boardLetter: "U / CI",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction: "Circuito integrado usado para comparar ou amplificar sinais analógicos.",
    unit: "Ganho (Av)",
    clues: [
      "Na placa sou identificado pela letra U (ou CI), como o famoso LM358 ou LM741.",
      "Possuo uma entrada não-inversora (+) e uma entrada inversora (-).",
      "Meu símbolo é um grande triângulo com entradas '+' e '-' na esquerda e saída na ponta.",
    ],
  },
];

// ==========================================
// DADOS DO MINIGAME 3: OFICINA DO RESISTOR
// ==========================================
export interface ResistorColorBand {
  id: string;
  name: string;
  digit: number;
  multiplier: number;
  multiplierLabel: string;
  hex: string;
  textLight: boolean;
}

export const RESISTOR_COLORS: ResistorColorBand[] = [
  { id: "preto", name: "Preto", digit: 0, multiplier: 1, multiplierLabel: "x1 Ω", hex: "#1E293B", textLight: true },
  { id: "marrom", name: "Marrom", digit: 1, multiplier: 10, multiplierLabel: "x10 Ω", hex: "#78350F", textLight: true },
  { id: "vermelho", name: "Vermelho", digit: 2, multiplier: 100, multiplierLabel: "x100 Ω", hex: "#DC2626", textLight: true },
  { id: "laranja", name: "Laranja", digit: 3, multiplier: 1000, multiplierLabel: "x1 kΩ", hex: "#EA580C", textLight: true },
  { id: "amarelo", name: "Amarelo", digit: 4, multiplier: 10000, multiplierLabel: "x10 kΩ", hex: "#FACC15", textLight: false },
  { id: "verde", name: "Verde", digit: 5, multiplier: 100000, multiplierLabel: "x100 kΩ", hex: "#16A34A", textLight: true },
  { id: "azul", name: "Azul", digit: 6, multiplier: 1000000, multiplierLabel: "x1 MΩ", hex: "#2563EB", textLight: true },
  { id: "violeta", name: "Violeta", digit: 7, multiplier: 10000000, multiplierLabel: "x10 MΩ", hex: "#7C3AED", textLight: true },
  { id: "cinza", name: "Cinza", digit: 8, multiplier: 1, multiplierLabel: "-", hex: "#64748B", textLight: true },
  { id: "branco", name: "Branco", digit: 9, multiplier: 1, multiplierLabel: "-", hex: "#F8FAFC", textLight: false },
];

export interface ResistorOrder {
  targetOhms: number;
  displayLabel: string;
  usageHint: string;
  correctBands: [number, number, number]; // [digit1, digit2, multiplierIndex]
}

export const RESISTOR_ORDERS: ResistorOrder[] = [
  {
    targetOhms: 100,
    displayLabel: "100 Ω",
    usageHint: "Proteção de barramento de sinal digital",
    correctBands: [1, 0, 1], // Marrom, Preto, Marrom
  },
  {
    targetOhms: 220,
    displayLabel: "220 Ω",
    usageHint: "Limitar corrente de LED em 5V (Arduino/TTL)",
    correctBands: [2, 2, 1], // Vermelho, Vermelho, Marrom
  },
  {
    targetOhms: 330,
    displayLabel: "330 Ω",
    usageHint: "Limitar corrente de display 7 segmentos",
    correctBands: [3, 3, 1], // Laranja, Laranja, Marrom
  },
  {
    targetOhms: 470,
    displayLabel: "470 Ω",
    usageHint: "Limitar corrente de LED em fonte 12V",
    correctBands: [4, 7, 1], // Amarelo, Violeta, Marrom
  },
  {
    targetOhms: 1000,
    displayLabel: "1 kΩ (1.000 Ω)",
    usageHint: "Acionamento de Base de Transistor NPN (BC548)",
    correctBands: [1, 0, 2], // Marrom, Preto, Vermelho
  },
  {
    targetOhms: 2200,
    displayLabel: "2,2 kΩ (2.200 Ω)",
    usageHint: "Polarização de circuito amplificador",
    correctBands: [2, 2, 2], // Vermelho, Vermelho, Vermelho
  },
  {
    targetOhms: 4700,
    displayLabel: "4,7 kΩ (4.700 Ω)",
    usageHint: "Resistor Pull-Up em barramento de comunicação",
    correctBands: [4, 7, 2], // Amarelo, Violeta, Vermelho
  },
  {
    targetOhms: 10000,
    displayLabel: "10 kΩ (10.000 Ω)",
    usageHint: "Divisor de tensão com LDR ou botão Pull-Down",
    correctBands: [1, 0, 3], // Marrom, Preto, Laranja
  },
  {
    targetOhms: 47000,
    displayLabel: "47 kΩ (47.000 Ω)",
    usageHint: "Malha de tempo RC com CI 555",
    correctBands: [4, 7, 3], // Amarelo, Violeta, Laranja
  },
  {
    targetOhms: 100000,
    displayLabel: "100 kΩ (100.000 Ω)",
    usageHint: "Descarga de segurança de capacitor",
    correctBands: [1, 0, 4], // Marrom, Preto, Amarelo
  },
];

// ==========================================
// DADOS DO MINIGAME 2: RADAR DO CIRCUITO
// ==========================================
export interface RadarMission {
  id: string;
  targetNodeId: string;
  targetSymbol: SymbolId;
  promptTitle: string;
  promptHint: string;
}

export const RADAR_MISSIONS: RadarMission[] = [
  {
    id: "m1",
    targetNodeId: "F1",
    targetSymbol: "fuse",
    promptTitle: "Toque no FUSÍVEL (F1) do circuito!",
    promptHint: "Fica logo na entrada para proteger contra curto-circuito.",
  },
  {
    id: "m2",
    targetNodeId: "T1",
    targetSymbol: "transformer",
    promptTitle: "Encontre o TRANSFORMADOR (T1)!",
    promptHint: "Possui bobina primária e secundária para abaixar a tensão AC.",
  },
  {
    id: "m3",
    targetNodeId: "D1",
    targetSymbol: "diode",
    promptTitle: "Toque no DIODO RETIFICADOR (D1)!",
    promptHint: "Conduz a corrente em apenas um sentido após o transformador.",
  },
  {
    id: "m4",
    targetNodeId: "C1",
    targetSymbol: "electrolytic_cap",
    promptTitle: "Localize o CAPACITOR ELETROLÍTICO (C1)!",
    promptHint: "Componente polarizado (+) que filtra a tensão contínua.",
  },
  {
    id: "m5",
    targetNodeId: "ZD1",
    targetSymbol: "zener",
    promptTitle: "Toque no DIODO ZENER (ZD1)!",
    promptHint: "Trabalha estabilizando/regulando a tensão da fonte.",
  },
  {
    id: "m6",
    targetNodeId: "SW1",
    targetSymbol: "switch",
    promptTitle: "Encontre a CHAVE / INTERRUPTOR (SW1)!",
    promptHint: "Abre e fecha manualmente o acionamento da carga.",
  },
  {
    id: "m7",
    targetNodeId: "LDR1",
    targetSymbol: "ldr",
    promptTitle: "Toque no sensor de luz LDR (LDR1)!",
    promptHint: "Resistor variável que recebe duas setas de luz.",
  },
  {
    id: "m8",
    targetNodeId: "Q1",
    targetSymbol: "transistor_npn",
    promptTitle: "Localize o TRANSISTOR NPN (Q1)!",
    promptHint: "Componente de 3 terminais (Base, Coletor e Emissor) que chaveia o LED.",
  },
  {
    id: "m9",
    targetNodeId: "R1",
    targetSymbol: "resistor",
    promptTitle: "Toque no RESISTOR LIMITADOR (R1)!",
    promptHint: "Retângulo em série com o LED para limitar a corrente.",
  },
  {
    id: "m10",
    targetNodeId: "LED1",
    targetSymbol: "led",
    promptTitle: "Encontre o LED INDICADOR (LED1)!",
    promptHint: "Diodo com duas setinhas para fora que emite luz na saída.",
  },
  {
    id: "m11",
    targetNodeId: "GND1",
    targetSymbol: "gnd",
    promptTitle: "Toque no TERRA DE REFERÊNCIA (GND)!",
    promptHint: "Três traços horizontais na base (referência 0V).",
  },
];
