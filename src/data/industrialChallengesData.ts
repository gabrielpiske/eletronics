export type IndustrialMinigameId = "industrial_repair";

export interface ServiceOrderMeta {
  code: string;
  equipment: string;
  sector: string;
  symptom: string;
  impact: string;
  safetyNotice: string;
  powerStateLabel: string;
}

export interface IndustrialClosingFeedback {
  expectedDecision: string;
  decisiveEvidence: string;
  commonMistake: string;
  competency: string;
  labNextStep: string;
}

export interface IndustrialScoreDimensions {
  safety: boolean;
  evidence: boolean;
  decision: boolean;
  quality: boolean;
  inTime: boolean;
}

export function pickNextShuffledCase<T extends { id: string }>(
  allCases: T[],
  currentQueue: T[],
  lastCaseId?: string
): { next: T; remaining: T[] } {
  let pool = [...currentQueue];
  if (pool.length === 0) {
    pool = [...allCases].sort(() => Math.random() - 0.5);
    if (lastCaseId && pool.length > 1 && pool[0].id === lastCaseId) {
      const swapIdx = 1 + Math.floor(Math.random() * (pool.length - 1));
      [pool[0], pool[swapIdx]] = [pool[swapIdx], pool[0]];
    }
  }
  const [next, ...remaining] = pool;
  return { next, remaining };
}

// ============================================================================
// MINIGAME A — ESTAÇÃO DE REPARO DE PCI (PTH / SMD)
// ============================================================================
export type RepairVisualComponentType =
  | "connector_pth"
  | "resistor_pth"
  | "cap_pth"
  | "diode_pth"
  | "fuse_pth"
  | "opto_smd"
  | "resistor_smd"
  | "led_smd"
  | "tvs_smd"
  | "ic_smd"
  | "cap_smd";

export type RepairDefectVisualType =
  | "none"
  | "cracked_solder"
  | "solder_bridge"
  | "reversed_polarity"
  | "misaligned_smd";

export interface RepairHotspot {
  id: string;
  designator: string;
  componentName: string;
  visualType: RepairVisualComponentType;
  /** Coordenadas percentuais (0..100) dentro do viewport da placa */
  x: number;
  y: number;
  isDefective: boolean;
  defectVisual: RepairDefectVisualType;
  inspectionNote: string;
}

export interface RepairChoiceOption {
  id: string;
  label: string;
  isCorrect: boolean;
  isUnsafe?: boolean;
  mistakeFeedback: string;
}

export interface RepairCase {
  id: string;
  minigameId: "industrial_repair";
  difficulty: 1 | 2 | 3 | 4;
  mountingType: "PTH" | "SMD";
  boardAssetPath: string;
  boardTitle: string;
  serviceOrder: ServiceOrderMeta;
  hotspots: RepairHotspot[];
  defectOptions: RepairChoiceOption[];
  procedureOptions: RepairChoiceOption[];
  qualityCheckOptions: RepairChoiceOption[];
  beforeLabel: string;
  afterLabel: string;
  closing: IndustrialClosingFeedback;
}

export const REPAIR_CASES: RepairCase[] = [
  {
    id: "os-sol-01",
    minigameId: "industrial_repair",
    difficulty: 1,
    mountingType: "PTH",
    boardAssetPath: "/images/industrial/pcb-pth-closeup.jpg",
    boardTitle: "PCI Interface Fotoelétrica • Montagem PTH",
    serviceOrder: {
      code: "OS-SOL-01",
      equipment: "Esteira de Separação — Interface de Sensor Fotoelétrico",
      sector: "Setor de Embalagem",
      symptom:
        "Sensor fotoelétrico perde o sinal de retorno de forma intermitente quando a esteira vibra.",
      impact: "Paradas curtas e contagem incorreta de peças na linha.",
      safetyNotice:
        "Placa retirada da máquina e desenergizada sobre manta ESD. Use lupa para localizar a anomalia antes de propor o reparo.",
      powerStateLabel: "DESENERGIZADA • BANCADA ESD",
    },
    hotspots: [
      {
        id: "hs-cn1",
        designator: "CN1",
        componentName: "Conector PTH 3 vias (Sinal 24 Vcc)",
        visualType: "connector_pth",
        x: 24,
        y: 52,
        isDefective: true,
        defectVisual: "cracked_solder",
        inspectionNote:
          "Anel escuro de fratura circunferencial na junta de solda do pino 2 (sinal). O pino apresenta folga mecânica leve.",
      },
      {
        id: "hs-r4",
        designator: "R4",
        componentName: "Resistor axial 2,2 kΩ (Pull-down)",
        visualType: "resistor_pth",
        x: 52,
        y: 34,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Meniscos de solda brilhantes, côncavos e contínuos em ambos os terminais. Corpo sem sinais de aquecimento.",
      },
      {
        id: "hs-c2",
        designator: "C2",
        componentName: "Capacitor eletrolítico 100 µF (Filtro)",
        visualType: "cap_pth",
        x: 74,
        y: 44,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Topo metálico plano (sem estufamento), polaridade alinhada à serigrafia e solda íntegra na ilha.",
      },
      {
        id: "hs-d1",
        designator: "D1",
        componentName: "Diodo de proteção 1N4007",
        visualType: "diode_pth",
        x: 54,
        y: 72,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Faixa do cátodo coincidente com a marcação da placa e filetes de solda bem molhados.",
      },
    ],
    defectOptions: [
      {
        id: "def-crack",
        label: "Solda trincada (fratura mecânica) no pino de sinal de CN1",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "def-bridge",
        label: "Ponte de solda unindo os pinos 1 e 2 do conector CN1",
        isCorrect: false,
        mistakeFeedback:
          "Os pads adjacentes estão isolados; o defeito visível sob a lupa é uma trinca circunferencial ao redor do pino 2.",
      },
      {
        id: "def-pol",
        label: "Conector CN1 montado com polaridade invertida",
        isCorrect: false,
        mistakeFeedback:
          "O travamento mecânico do conector está alinhado à serigrafia; a intermitência sob vibração decorre da junta fraturada.",
      },
      {
        id: "def-cap",
        label: "Capacitor C2 estufado por sobretensão",
        isCorrect: false,
        mistakeFeedback:
          "Na inspeção visual, C2 está íntegro e plano; o ponto crítico é a solda trincada em CN1.",
      },
    ],
    procedureOptions: [
      {
        id: "proc-rework-pth",
        label:
          "Desenergizada em manta ESD: limpar a área, aplicar fluxo adequado, remover solda fatigada e ressoldar o terminal PTH com aquecimento controlado",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "proc-energized",
        label:
          "Manter a placa energizada em 24 Vcc para testar o sinal enquanto encosta a ponta do ferro de solda",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Nunca se realiza soldagem em placa energizada: há risco de curto-circuito pela ponta aterrada, dano à placa e acidente na bancada.",
      },
      {
        id: "proc-blob",
        label:
          "Empilhar grande quantidade de solda por cima da trinca sem fluxo nem limpeza prévia",
        isCorrect: false,
        mistakeFeedback:
          "Adicionar solda sobre junta oxidada/fatigada gera solda fria volumosa que volta a trincar sob vibração industrial.",
      },
      {
        id: "proc-hotair-max",
        label:
          "Usar soprador térmico em temperatura máxima sobre o conector plástico até derreter a solda",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Ar quente excessivo deforma o corpo plástico do conector PTH e pode delaminar trilhas da PCI.",
      },
    ],
    qualityCheckOptions: [
      {
        id: "qc-meniscus",
        label:
          "Confirmar menisco côncavo brilhante, sem trincas ou pontes, limpar resíduos de fluxo e verificar continuidade/firmeza mecânica",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "qc-none",
        label:
          "Reinstalar imediatamente na máquina sem inspecionar sob lupa nem limpar o fluxo",
        isCorrect: false,
        mistakeFeedback:
          "Todo retrabalho exige inspeção visual final e limpeza adequada antes da liberação para a máquina.",
      },
      {
        id: "qc-force",
        label:
          "Forçar lateralmente o conector com alicate para testar se a trilha aguenta",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Aplicar esforço mecânico excessivo pode romper o pad de cobre e criar uma nova falha na PCI.",
      },
    ],
    beforeLabel: "Pino 2 de CN1 com trinca circunferencial (mau contato intermitente)",
    afterLabel: "Filete PTH côncavo uniforme, limpo e mecanicamente firme",
    closing: {
      expectedDecision:
        "Ressoldagem PTH controlada no pino 2 de CN1 com remoção da solda fatigada, uso de fluxo adequado e inspeção visual final.",
      decisiveEvidence:
        "Anel de fratura na junta de solda do conector CN1 coerente com falha intermitente sob vibração da esteira.",
      commonMistake:
        "Derreter apenas superficialmente a solda velha sem fluxo ou tentar retrabalhar com o equipamento energizado.",
      competency:
        "Aplicar técnicas de soldagem/dessoldagem PTH e inspeção visual de juntas em placas industriais.",
      labNextStep:
        "Em bancada supervisionada, confirmar continuidade da trilha do pino 2 até o próximo nó antes de reconectar o módulo na esteira.",
    },
  },
  {
    id: "os-sol-02",
    minigameId: "industrial_repair",
    difficulty: 2,
    mountingType: "SMD",
    boardAssetPath: "/images/industrial/pcb-smd-closeup.jpg",
    boardTitle: "Módulo de Saída Isolada 24 Vcc • Montagem SMD",
    serviceOrder: {
      code: "OS-SOL-02",
      equipment: "Painel de Automação — Módulo de Saída 24 Vcc",
      sector: "Linha de Envase",
      symptom:
        "Canal de saída 02 permanece acionado continuamente logo após manutenção corretiva recente.",
      impact: "Válvula pneumática fica travada aberta, gerando refugo.",
      safetyNotice:
        "Módulo removido do trilho DIN e desenergizado em estação ESD. Inspecione os terminais SMD de passo fino com a lupa.",
      powerStateLabel: "DESENERGIZADA • ESTAÇÃO ESD",
    },
    hotspots: [
      {
        id: "hs-pc2",
        designator: "PC2",
        componentName: "Optoacoplador SMD (SOIC-4)",
        visualType: "opto_smd",
        x: 42,
        y: 48,
        isDefective: true,
        defectVisual: "solder_bridge",
        inspectionNote:
          "Excesso de estanho formando ponte de solda metálica entre os pinos 3 (Emissor) e 4 (Coletor) na saída isolada.",
      },
      {
        id: "hs-r8",
        designator: "R8",
        componentName: "Resistor SMD 0805 (1 kΩ)",
        visualType: "resistor_smd",
        x: 20,
        y: 38,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Componente centrado nos pads, filetes simétricos e sem curto entre terminais.",
      },
      {
        id: "hs-led2",
        designator: "LED2",
        componentName: "LED indicador SMD 0805",
        visualType: "led_smd",
        x: 72,
        y: 34,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Marcação de cátodo alinhada à serigrafia e soldagem íntegra.",
      },
      {
        id: "hs-tvs1",
        designator: "TVS1",
        componentName: "Supressor de surto SMD (SMA)",
        visualType: "tvs_smd",
        x: 70,
        y: 68,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Encapsulamento intacto, sem marcas térmicas e terminais bem assentados.",
      },
    ],
    defectOptions: [
      {
        id: "def-bridge-pc2",
        label: "Ponte de solda unindo os terminais 3 e 4 do optoacoplador SMD PC2",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "def-missing-r8",
        label: "Resistor R8 deslocado fora do pad",
        isCorrect: false,
        mistakeFeedback:
          "R8 está bem alinhado; examine os terminais de saída do optoacoplador PC2 sob zoom.",
      },
      {
        id: "def-crack-tvs",
        label: "Solda trincada no supressor TVS1",
        isCorrect: false,
        mistakeFeedback:
          "TVS1 não apresenta fratura; o travamento da saída em nível ligado indica curto entre Coletor e Emissor em PC2.",
      },
      {
        id: "def-led-rev",
        label: "LED2 montado invertido na placa",
        isCorrect: false,
        mistakeFeedback:
          "Um LED indicador invertido apenas deixaria de acender, sem travar a saída de potência acionada.",
      },
    ],
    procedureOptions: [
      {
        id: "proc-wick-smd",
        label:
          "Aplicar fluxo pastoso no passo fino, remover o excesso com malha dessoldadora / ponta fina controlada e limpar resíduos",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "proc-knife",
        label:
          "Raspar a ponte metálica a frio com estilete até separar os pinos à força",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Raspar com lâmina pode cortar trilhas finas, levantar pads SMD e deixar limalhas condutivas sob o encapsulamento.",
      },
      {
        id: "proc-add-solder",
        label:
          "Adicionar mais estanho para tentar espalhar a gota pelos outros pinos",
        isCorrect: false,
        mistakeFeedback:
          "Adicionar solda sem malha ou fluxo adequado agrava a ponte entre os terminais SMD.",
      },
      {
        id: "proc-bypass",
        label:
          "Remover PC2 e soldar um fio direto substituindo o optoacoplador",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Um jumper elimina a isolação galvânica do módulo de saída e expõe o circuito de controle a surtos de 24 Vcc.",
      },
    ],
    qualityCheckOptions: [
      {
        id: "qc-iso-smd",
        label:
          "Inspecionar sob lupa separação total entre os pinos 3 e 4, ausência de esferas de solda e confirmar alta impedância a frio",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "qc-power-test-only",
        label:
          "Ligar direto na válvula pneumática sem checar se o curto foi eliminado",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Energizar sem confirmar eliminação do curto pode acionar a máquina inesperadamente.",
      },
      {
        id: "qc-leave-flux",
        label:
          "Deixar excesso de fluxo carbonizado entre os pinos para proteger a junta",
        isCorrect: false,
        mistakeFeedback:
          "Resíduos contaminados entre pinos SMD podem gerar fuga elétrica e corrosão em ambiente industrial.",
      },
    ],
    beforeLabel: "Ponte de solda fechando curto entre pinos 3 e 4 de PC2",
    afterLabel: "Terminais SOIC-4 isolados, limpos e com filete SMD uniforme",
    closing: {
      expectedDecision:
        "Remoção da ponte de solda nos pinos 3–4 de PC2 utilizando fluxo, malha dessoldadora/ponta fina SMD e validação de isolação a frio.",
      decisiveEvidence:
        "Ponte metálica visível sob lupa unindo Emissor e Coletor do optoacoplador, explicando o canal travado acionado.",
      commonMistake:
        "Tentar cortar a ponte mecanicamente com lâmina ou energizar o módulo sem confirmar isolação entre pinos adjacentes.",
      competency:
        "Executar retrabalho SMD de passo fino e inspeção óptica de qualidade em módulos de saída industrial.",
      labNextStep:
        "Em bancada supervisionada, confirmar resistência aberta entre pinos 3 e 4 desenergizados antes do teste funcional do canal.",
    },
  },
  {
    id: "os-sol-03",
    minigameId: "industrial_repair",
    difficulty: 2,
    mountingType: "PTH",
    boardAssetPath: "/images/industrial/pcb-pth-closeup.jpg",
    boardTitle: "Placa de Sinalização Torre Luminosa • Montagem PTH",
    serviceOrder: {
      code: "OS-SOL-03",
      equipment: "Torre Luminosa de Status — Placa de Entrada 24 Vcc",
      sector: "Célula de Usinagem",
      symptom:
        "Fusível de entrada abre imediatamente ao energizar a placa após troca de componentes.",
      impact: "Operadores sem sinalização visual de parada/alarme na célula.",
      safetyNotice:
        "Placa desenergizada e isolada sobre bancada ESD. Verifique a correspondência entre corpo dos componentes e serigrafia da PCI.",
      powerStateLabel: "DESENERGIZADA • BANCADA ESD",
    },
    hotspots: [
      {
        id: "hs-d3",
        designator: "D3",
        componentName: "Diodo de proteção contra inversão (1N4007)",
        visualType: "diode_pth",
        x: 46,
        y: 48,
        isDefective: true,
        defectVisual: "reversed_polarity",
        inspectionNote:
          "A faixa prateada do cátodo (K) no corpo do diodo está voltada para o lado oposto à barra branca da serigrafia na PCI (polaridade invertida).",
      },
      {
        id: "hs-f1",
        designator: "F1",
        componentName: "Porta-fusível PTH (1 A)",
        visualType: "fuse_pth",
        x: 22,
        y: 36,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Suporte bem soldado e íntegro; o fusível atuou corretamente como consequência da sobrecarga.",
      },
      {
        id: "hs-r2",
        designator: "R2",
        componentName: "Resistor limitador 1,8 kΩ",
        visualType: "resistor_pth",
        x: 72,
        y: 38,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Componente não-polarizado com juntas regulares e sem sinal de sobrecarga.",
      },
      {
        id: "hs-cn2",
        designator: "CN2",
        componentName: "Borne PTH de saída para torre",
        visualType: "connector_pth",
        x: 72,
        y: 70,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Terminais firmes, sem oxidação nem pontes entre vias.",
      },
    ],
    defectOptions: [
      {
        id: "def-diode-rev",
        label: "Diodo de proteção D3 montado com polaridade invertida na PCI",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "def-fuse-bad",
        label: "Defeito de fabricação no porta-fusível F1",
        isCorrect: false,
        mistakeFeedback:
          "O fusível abriu cumprindo sua função de proteção contra o curto criado pela inversão de D3.",
      },
      {
        id: "def-r2-rev",
        label: "Resistor R2 instalado com polaridade invertida",
        isCorrect: false,
        mistakeFeedback:
          "Resistores fixos não possuem polaridade; revise os componentes semicondutores polarizados.",
      },
      {
        id: "def-cn2-crack",
        label: "Solda trincada no borne CN2",
        isCorrect: false,
        mistakeFeedback:
          "Uma trinca causaria circuito aberto/intermitência, e não abertura imediata do fusível por sobrecorrente.",
      },
    ],
    procedureOptions: [
      {
        id: "proc-desolder-flip",
        label:
          "Dessoldar D3 com sugador/malha preservando as ilhas, verificar integridade do componente, reinserir alinhando a faixa do cátodo à serigrafia e soldar",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "proc-bigger-fuse",
        label:
          "Substituir o fusível F1 por um de 10 A para parar de queimar ao ligar",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Superdimensionar fusível anula a proteção elétrica, podendo incendiar trilhas da PCI e danificar a fonte de 24 Vcc.",
      },
      {
        id: "proc-pull-cold",
        label:
          "Puxar o diodo com alicate enquanto aquece apenas um terminal por vez com força",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Puxar terminal parcialmente sólido arranca os furos metalizados (barrels) e danifica irreversivelmente a PCI.",
      },
      {
        id: "proc-remove-d3",
        label:
          "Cortar D3 fora e operar a placa definitivamente sem diodo de proteção",
        isCorrect: false,
        mistakeFeedback:
          "Remover a proteção deixa o circuito vulnerável a inversão de alimentação e surtos na linha industrial.",
      },
    ],
    qualityCheckOptions: [
      {
        id: "qc-pol-diode",
        label:
          "Conferir alinhamento da faixa do cátodo com a serigrafia, validar D3 no teste de diodo do multímetro e repor fusível na corrente nominal",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "qc-no-check",
        label:
          "Reenergizar direto sem conferir a polaridade nem testar se D3 entrou em curto",
        isCorrect: false,
        mistakeFeedback:
          "Como D3 conduziu corrente de curto antes da abertura do fusível, é essencial aferir se não ficou danificado.",
      },
      {
        id: "qc-jumper-f1",
        label:
          "Fazer uma ponte metálica no lugar do fusível F1 para o teste inicial",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Jamais substitua um fusível por jumper metálico durante ensaios de bancada.",
      },
    ],
    beforeLabel: "Cátodo de D3 oposto à barra da serigrafia (condução direta em curto)",
    afterLabel: "D3 alinhado à serigrafia da PCI com juntas PTH limpas",
    closing: {
      expectedDecision:
        "Dessoldagem segura de D3, conferência do diodo, remontagem respeitando a marcação do cátodo na serigrafia e reposição do fusível nominal.",
      decisiveEvidence:
        "Faixa prateada do cátodo de D3 invertida em relação ao desenho de serigrafia, causando condução direta sobre o barramento 24 Vcc.",
      commonMistake:
        "Trocar apenas o fusível repetidamente (ou aumentar sua corrente) sem investigar a causa raiz da sobrecorrente.",
      competency:
        "Identificar polaridade de semicondutores, realizar dessoldagem PTH sem danos às ilhas e respeitar proteções nominais.",
      labNextStep:
        "Em bancada supervisionada, testar D3 em escala de diodo e energizar inicialmente com fonte de bancada limitada em corrente.",
    },
  },
  {
    id: "os-sol-04",
    minigameId: "industrial_repair",
    difficulty: 3,
    mountingType: "SMD",
    boardAssetPath: "/images/industrial/pcb-smd-closeup.jpg",
    boardTitle: "Condicionador de Entrada de Encoder • Montagem SMD",
    serviceOrder: {
      code: "OS-SOL-04",
      equipment: "Eixo Posicionador — Placa Condicionadora de Encoder",
      sector: "Usinagem CNC",
      symptom:
        "Canal B do encoder perdeu leitura de pulsos após retrabalho de um capacitor vizinho.",
      impact: "Máquina acusa erro de sincronismo e bloqueia avanço do eixo.",
      safetyNotice:
        "Placa desenergizada em manta ESD com pulseira aterrada. Inspecione componentes SMD 0805 ao redor do estágio de entrada.",
      powerStateLabel: "DESENERGIZADA • ESTAÇÃO ESD",
    },
    hotspots: [
      {
        id: "hs-r14",
        designator: "R14",
        componentName: "Resistor SMD 0805 (10 kΩ — Canal B)",
        visualType: "resistor_smd",
        x: 56,
        y: 44,
        isDefective: true,
        defectVisual: "misaligned_smd",
        inspectionNote:
          "Resistor SMD rotacionado e deslocado para fora do pad direito (contato aberto), provavelmente tocado durante o retrabalho anterior.",
      },
      {
        id: "hs-u1",
        designator: "U1",
        componentName: "CI Comparador Schmitt Trigger (SOIC-8)",
        visualType: "ic_smd",
        x: 34,
        y: 52,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Pino 1 alinhado ao marcador da PCI e todos os 8 terminais alinhados aos pads sem pontes.",
      },
      {
        id: "hs-c5",
        designator: "C5",
        componentName: "Capacitor cerâmico SMD 100 nF",
        visualType: "cap_smd",
        x: 68,
        y: 68,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Capacitor retrabalhado anteriormente está centrado e com juntas aceitáveis.",
      },
      {
        id: "hs-cn3",
        designator: "CN3",
        componentName: "Conector de entrada do encoder",
        visualType: "connector_pth",
        x: 16,
        y: 52,
        isDefective: false,
        defectVisual: "none",
        inspectionNote:
          "Pinos de entrada limpos e íntegros, sem fraturas visíveis.",
      },
    ],
    defectOptions: [
      {
        id: "def-r14-shift",
        label: "Resistor SMD R14 deslocado fora do pad (terminal aberto)",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "def-u1-bridge",
        label: "Ponte de solda entre todos os pinos do CI U1",
        isCorrect: false,
        mistakeFeedback:
          "Os 8 terminais de U1 estão limpos e bem separados; aproxime o zoom na região do resistor R14.",
      },
      {
        id: "def-c5-pol",
        label: "Capacitor cerâmico C5 montado com polaridade invertida",
        isCorrect: false,
        mistakeFeedback:
          "Capacitores cerâmicos SMD multicamada (MLCC) não possuem polaridade.",
      },
      {
        id: "def-cn3-crack",
        label: "Solda trincada no conector CN3",
        isCorrect: false,
        mistakeFeedback:
          "O conector CN3 está íntegro; a interrupção do Canal B está no desalinhamento de R14.",
      },
    ],
    procedureOptions: [
      {
        id: "proc-align-smd",
        label:
          "Aplicar fluxo, segurar com pinça ESD, realinhar R14 sobre ambos os pads com aquecimento controlado e refazer os dois filetes SMD",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "proc-glue",
        label:
          "Colar o resistor no lugar com adesivo instantâneo sem refazer a solda elétrica",
        isCorrect: false,
        mistakeFeedback:
          "Adesivos comuns são isolantes elétricos e não restabelecem a condução do sinal do encoder.",
      },
      {
        id: "proc-push-cold",
        label:
          "Empurrar o resistor a frio com chave de fenda metálica até encostar no pad",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Forçar um componente cerâmico SMD a frio trinca o corpo do resistor e arranca o pad de cobre da placa.",
      },
      {
        id: "proc-big-iron",
        label:
          "Usar ponta grossa de solda para tubulação elétrica aquecendo toda a região ao redor de U1",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Ponta desproporcional transfere calor excessivo para U1 e C5, causando deslocamento em cascata e dano térmico.",
      },
    ],
    qualityCheckOptions: [
      {
        id: "qc-r14-ok",
        label:
          "Verificar alinhamento simétrico nos dois pads sob lupa, limpeza do fluxo e leitura coerente de resistência / continuidade das trilhas",
        isCorrect: true,
        mistakeFeedback: "",
      },
      {
        id: "qc-skip-optic",
        label:
          "Dispensar a inspeção sob lupa porque o resistor 0805 já parece encostado a olho nu",
        isCorrect: false,
        mistakeFeedback:
          "Em montagem SMD, juntas abertas ou tombstoning parcial frequentemente passam despercebidas sem ampliação óptica.",
      },
      {
        id: "qc-scratch-pad",
        label:
          "Raspar a máscara de solda em volta de R14 para expor mais cobre",
        isCorrect: false,
        isUnsafe: true,
        mistakeFeedback:
          "Remover máscara de solda desnecessariamente aumenta o risco de pontes e oxidação da placa.",
      },
    ],
    beforeLabel: "R14 (0805) rotacionado com terminal direito desconectado do pad",
    afterLabel: "R14 centralizado em ambos os pads com filetes SMD simétricos",
    closing: {
      expectedDecision:
        "Realinhamento de R14 com pinça ESD, fluxo e aquecimento controlado, refazendo ambas as juntas SMD com inspeção óptica final.",
      decisiveEvidence:
        "Deslocamento físico de R14 fora do pad direito detectado com a lupa, interrompendo a malha do Canal B do encoder.",
      commonMistake:
        "Não inspecionar componentes vizinhos após um retrabalho térmico ou tentar empurrar componentes SMD a frio.",
      competency:
        "Realizar inspeção visual pós-retrabalho e posicionamento/soldagem de componentes SMD em placas de controle.",
      labNextStep:
        "Em bancada supervisionada, validar a forma de onda dos canais A e B do encoder com osciloscópio ou multímetro antes de liberar o eixo.",
    },
  },
];
