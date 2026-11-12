import { SymbolId } from "@/components/ElectronicSymbolSVG";

export type ComponentCategory =
  | "passivo"
  | "semicondutor"
  | "protecao_energia"
  | "digital_logica";

export interface ElectronicComponentItem {
  id: SymbolId;
  name: string;
  shortName: string;
  boardLetter: string;
  category: ComponentCategory;
  categoryLabel: string;
  basicFunction: string;
  unit: string;
  clues: string[];
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
    title: "Esteira de Componentes",
    subtitle: "Triagem Rápida de Simbologia e Famílias",
    badge: "TRIAGEM INDUSTRIAL",
    description:
      "Classifique componentes Passivos, Semicondutores, Proteção/Energia e Eletrônica Digital antes do fim de curso da esteira.",
    howToPlay:
      "Observe o símbolo na esteira e selecione o coletor correspondente para manter o multiplicador.",
    colorFrom: "#0EA5E9",
    colorTo: "#2563EB",
    defaultDurationSec: 120,
  },
  {
    id: "radar",
    title: "Radar do Circuito",
    subtitle: "Inspeção de Topologias e Localização de Falhas",
    badge: "INSPEÇÃO DE ESQUEMA",
    description:
      "Inspecione 3 topologias completas (Fonte Linear, Comando Digital com Portas Lógicas e Controle de Potência AC/DC).",
    howToPlay:
      "Leia a ordem técnica ou sintoma de falha no topo e selecione o nó correspondente no diagrama.",
    colorFrom: "#10B981",
    colorTo: "#059669",
    defaultDurationSec: 120,
  },
  {
    id: "resistor",
    title: "Oficina do Resistor",
    subtitle: "Série E12/E24 e Especificação Ôhmica",
    badge: "AFERIÇÃO ÔHMICA",
    description:
      "Configure as faixas de cores para atender ordens dinâmicas calculadas pela Lei de Ohm e séries comerciais.",
    howToPlay:
      "Selecione a 1ª Faixa, 2ª Faixa e Multiplicador até atingir o valor exigido na ordem de bancada.",
    colorFrom: "#F59E0B",
    colorTo: "#D97706",
    defaultDurationSec: 150,
  },
  {
    id: "match",
    title: "Conexão de Bancada",
    subtitle: "Associação Símbolo ↔ Designador e Função",
    badge: "ASSOCIAÇÃO TÉCNICA",
    description:
      "Relacione símbolos esquemáticos aos seus designadores na placa (R, C, D, Q, U, K) e funções técnicas.",
    howToPlay:
      "Selecione um símbolo na coluna esquerda e sua especificação correspondente na coluna direita.",
    colorFrom: "#8B5CF6",
    colorTo: "#6D28D9",
    defaultDurationSec: 120,
  },
  {
    id: "detective",
    title: "Diagnóstico por Pistas",
    subtitle: "Investigação Técnica de Componentes e Lógica",
    badge: "DIAGNÓSTICO DE BANCADA",
    description:
      "Analise pistas técnicas progressivas, sintomas de multímetro e tabelas-verdade para identificar o componente.",
    howToPlay:
      "Acompanhe as 3 pistas técnicas e selecione o componente correto o mais cedo possível.",
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
    basicFunction:
      "Limita a passagem da corrente elétrica e provoca queda de tensão controlada.",
    unit: "Ohm (Ω)",
    clues: [
      "Na placa de circuito impresso, sou sempre identificado pela letra R.",
      "Minha unidade de medida é o Ohm (Ω) e meu valor PTH é lido por faixas coloridas.",
      "Minha função primordial é limitar a corrente elétrica e dividir tensão (V = R × I).",
      "Em montagem SMD, trago códigos numéricos como '103' (10 kΩ) ou '472' (4,7 kΩ).",
      "Não possuo polaridade: posso ser soldado em qualquer sentido na placa.",
    ],
  },
  {
    id: "potentiometer",
    name: "Potenciômetro",
    shortName: "Potenciômetro",
    boardLetter: "RV / POT",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction:
      "Resistor variável ajustável manualmente para dividir tensão ou calibrar níveis.",
    unit: "Ohm (Ω)",
    clues: [
      "Possuo 3 terminais e um eixo giratório ou cursor deslizante.",
      "Sou utilizado para ajuste manual de grandezas, como volume, brilho ou referência analógica.",
      "Meu símbolo é um resistor com uma seta apontando para o centro do corpo.",
      "Entre os terminais extremos apresento resistência fixa; no pino central a leitura varia com o giro.",
      "Minha versão miniatura de ajuste fino em placas industriais é chamada de Trimpot.",
    ],
  },
  {
    id: "ldr",
    name: "LDR (Fotoresistor)",
    shortName: "LDR",
    boardLetter: "LDR",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction:
      "Varia sua resistência elétrica conforme a intensidade luminosa incidente.",
    unit: "Ohm (Ω)",
    clues: [
      "Sou amplamente utilizado em relés fotoelétricos para acionar iluminação automaticamente no escuro.",
      "No escuro minha resistência sobe para centenas de kΩ; sob luz forte cai para poucos Ohms.",
      "Meu símbolo exibe um resistor recebendo duas setas paralelas indicando incidência de luz.",
      "Sou um sensor óptico passivo construído com sulfeto de cádmio (CdS).",
    ],
  },
  {
    id: "thermistor",
    name: "Termistor (NTC / PTC)",
    shortName: "Termistor",
    boardLetter: "RT / TH",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction:
      "Sensor térmico semicondutor/passivo que altera sua resistência com a temperatura.",
    unit: "Ohm (Ω)",
    clues: [
      "Sou utilizado para monitorar temperatura em baterias, fontes chaveadas e cabeçotes térmicos.",
      "Na versão NTC, minha resistência diminui quando a temperatura aumenta; no PTC, ela sobe.",
      "Meu símbolo traz um resistor atravessado por uma linha diagonal com a indicação 't°'.",
      "Em fontes chaveadas, sou ligado em série na entrada para limitar a corrente de partida (inrush).",
    ],
  },
  {
    id: "capacitor",
    name: "Capacitor Cerâmico / Fixo",
    shortName: "Capacitor Fixo",
    boardLetter: "C",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction:
      "Armazena energia em campo elétrico e filtra ruídos de alta frequência (desacoplamento).",
    unit: "Farad (pF / nF)",
    clues: [
      "Sou identificado pela letra C na placa e NÃO possuo polaridade (+ ou -).",
      "Costumo ter código '104' (100 nF) e sou instalado próximo aos pinos VCC de CIs para filtrar ruídos.",
      "Meu símbolo apresenta duas placas paralelas retas idênticas.",
      "Em corrente contínua constante atuo como circuito aberto após carregado.",
    ],
  },
  {
    id: "electrolytic_cap",
    name: "Capacitor Eletrolítico",
    shortName: "Cap. Eletrolítico",
    boardLetter: "C (+)",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction:
      "Armazena carga elétrica elevada para filtragem de ripple em fontes DC, com polaridade obrigatória.",
    unit: "Microfarad (µF)",
    clues: [
      "Atenção na bancada: se soldado com polaridade invertida, pode aquecer, estufar o topo ou explodir!",
      "Possuo faixa lateral indicando o terminal negativo (-) e valores típicos de 10 µF a 4700 µF.",
      "Meu símbolo tem uma placa reta com sinal '+' e outra placa curva ou preenchida.",
      "Sou o principal responsável por suavizar a tensão pulsante após a ponte retificadora.",
    ],
  },
  {
    id: "inductor",
    name: "Indutor (Bobina)",
    shortName: "Indutor",
    boardLetter: "L",
    category: "passivo",
    categoryLabel: "Componente Passivo",
    basicFunction:
      "Armazena energia em campo magnético e se opõe a variações bruscas de corrente elétrica.",
    unit: "Henry (mH / µH)",
    clues: [
      "Na serigrafia da placa sou sempre identificado pela letra L.",
      "Sou constituído por espiras de fio esmaltado enroladas sobre núcleo de ar ou ferrite.",
      "Minha unidade é o Henry (H) e meu símbolo mostra arcos sucessivos representando espiras.",
      "No teste de continuidade do multímetro, apresento resistência ôhmica muito baixa.",
    ],
  },
  {
    id: "transformer",
    name: "Transformador",
    shortName: "Transformador",
    boardLetter: "T / TR",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Converte níveis de tensão AC por indução eletromagnética entre primário e secundário.",
    unit: "Volt / VA",
    clues: [
      "Opero exclusivamente em Corrente Alternada (AC) através de acoplamento magnético entre bobinas.",
      "Garanto isolação galvânica entre a rede elétrica primária (127V/220V) e a bancada secundária.",
      "Meu símbolo apresenta dois indutores frente a frente separados por duas linhas de núcleo.",
      "A relação de espiras Np/Ns define se sou abaixador ou elevador de tensão.",
    ],
  },
  {
    id: "diode",
    name: "Diodo Retificador",
    shortName: "Diodo",
    boardLetter: "D",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Conduz corrente em sentido único (Anodo → Catodo), bloqueando o sentido reverso.",
    unit: "Vf ~0,7V",
    clues: [
      "Meus terminais são Anodo (+) e Catodo (-, identificado por um anel prateado no corpo).",
      "Quando polarizado diretamente (silício), apresento queda típica de 0,6V a 0,7V no multímetro.",
      "Meu símbolo é uma seta triangular apontando para uma barra vertical reta.",
      "Frequentemente sou ligado em paralelo com bobinas de relés (diodo de roda-livre / flyback).",
    ],
  },
  {
    id: "led",
    name: "LED (Diodo Emissor de Luz)",
    shortName: "LED",
    boardLetter: "LED / D",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Semicondutor polarizado que emite radiação luminosa quando percorrido por corrente direta.",
    unit: "Vf / mA",
    clues: [
      "O terminal mais longo (Anodo) é o positivo; o chanfro lateral na cápsula indica o Catodo (-).",
      "Exijo resistor limitador de corrente em série para não queimar por sobrecorrente.",
      "Meu símbolo é um diodo com duas setas paralelas apontando para fora.",
      "Minha tensão direta (Vf) varia entre ~1,8V (vermelho) e ~3,2V (azul/branco).",
    ],
  },
  {
    id: "zener",
    name: "Diodo Zener",
    shortName: "Diodo Zener",
    boardLetter: "ZD / DZ",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Opera na região de ruptura reversa para manter uma tensão estabilizada constante.",
    unit: "Volt Zener (Vz)",
    clues: [
      "Na placa sou identificado por ZD ou DZ e sou instalado polarizado reversamente.",
      "Mantenho tensão fixa (ex: 5,1V ou 12V) sobre a carga quando associado a um resistor série.",
      "Meu símbolo é um diodo cuja barra do catodo possui abas dobradas em formato de 'Z'.",
    ],
  },
  {
    id: "schottky_diode",
    name: "Diodo Schottky",
    shortName: "Diodo Schottky",
    boardLetter: "D",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Diodo de junção metal-semicondutor com comutação ultrarrápida e baixa queda direta (~0,25V).",
    unit: "Vf ~0,25V",
    clues: [
      "No multímetro em escala de diodo, minha queda direta mede apenas ~0,2V a 0,3V (metade do silício comum).",
      "Sou indispensável no secundário de fontes chaveadas de alta frequência (ex: 1N5819, MBR20100).",
      "Meu símbolo é um diodo cuja barra vertical possui as duas extremidades dobradas formando um 'S' quadrado.",
    ],
  },
  {
    id: "bridge_rectifier",
    name: "Ponte Retificadora",
    shortName: "Ponte Retificadora",
    boardLetter: "BR / DB",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Conjunto de 4 diodos em ponte de Graetz que converte AC em DC de onda completa.",
    unit: "Ampere / Volt",
    clues: [
      "Possuo 4 terminais: dois de entrada alternada (~) e dois de saída contínua (+ e -).",
      "Integro 4 diodos retificadores em um único encapsulamento para retificação de onda completa.",
      "Meu símbolo é um losango com indicações '~', '+' e '-' e um diodo central.",
    ],
  },
  {
    id: "transistor_npn",
    name: "Transistor Bipolar (NPN)",
    shortName: "Transistor NPN",
    boardLetter: "Q / TR",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Amplifica corrente ou atua como chave eletrônica controlada pela corrente de Base.",
    unit: "Ganho (hFE)",
    clues: [
      "Possuo 3 terminais: Base (B), Coletor (C) e Emissor (E), como nos clássicos BC548 e TIP41.",
      "Uma pequena corrente na Base controla uma corrente muito maior entre Coletor e Emissor.",
      "No símbolo NPN, a seta do terminal Emissor aponta para FORA.",
    ],
  },
  {
    id: "mosfet",
    name: "Transistor MOSFET",
    shortName: "MOSFET",
    boardLetter: "Q / M",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Chave eletrônica de potência controlada por tensão elétrica no terminal Gate.",
    unit: "Rds(on) / Vds",
    clues: [
      "Meus 3 terminais são Gate (Porta), Drain (Dreno) e Source (Fonte), ex: IRF540N.",
      "Diferente do BJT, sou acionado por tensão no Gate com baixíssima resistência de condução Rds(on).",
      "Meu símbolo exibe o terminal Gate isolado do canal segmentado em três traços.",
    ],
  },
  {
    id: "scr",
    name: "Tiristor SCR",
    shortName: "Tiristor SCR",
    boardLetter: "SCR / TH",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Retificador controlado de silício que dispara ao receber pulso no Gate e trava conduzindo em DC.",
    unit: "Ampere / Volt",
    clues: [
      "Possuo Anodo (A), Catodo (K) e Gate (G); sou um tiristor unidirecional.",
      "Em corrente contínua, após um pulso no Gate, permaneço conduzindo até a corrente cair abaixo de Ih.",
      "Meu símbolo é um diodo com o terminal de disparo Gate saindo próximo ao Catodo.",
    ],
  },
  {
    id: "triac",
    name: "TRIAC (Tiristor Bidirecional)",
    shortName: "TRIAC",
    boardLetter: "Q / TR",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Chave semicondutora bidirecional para controle de fase e potência em Corrente Alternada (AC).",
    unit: "Ampere AC",
    clues: [
      "Meus terminais são MT1, MT2 e Gate (G), muito usado em dimmers e acionamento de cargas AC (ex: BT136).",
      "Conduzo nos dois semiciclos da rede alternada (positivo e negativo) quando disparado pelo Gate.",
      "Meu símbolo mostra dois diodos/tiristores em antiparalelo com um terminal Gate lateral.",
    ],
  },
  {
    id: "fuse",
    name: "Fusível de Proteção",
    shortName: "Fusível",
    boardLetter: "F",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Elemento de sacrifício que funde seu elo condutor para interromper sobrecorrentes e curtos.",
    unit: "Ampere (A)",
    clues: [
      "Na placa sou identificado pela letra F e sou o primeiro item inspecionado quando o aparelho não liga.",
      "Se estiver íntegro, apresenta resistência próxima de 0 Ω (bip de continuidade no multímetro).",
      "Meu símbolo é um retângulo com a linha do condutor atravessando seu interior de ponta a ponta.",
    ],
  },
  {
    id: "varistor",
    name: "Varistor (MOV / VDR)",
    shortName: "Varistor",
    boardLetter: "RV / VDR",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Resistor dependente de tensão que protege a entrada AC contra surtos e descargas atmosféricas.",
    unit: "Volt RMS",
    clues: [
      "Sou ligado em paralelo com a rede AC logo após o fusível de entrada.",
      "Quando ocorre um pico de sobretensão (surto), minha resistência cai drasticamente, queimando o fusível para salvar a placa.",
      "Meu símbolo é um resistor cortado por uma linha diagonal com a letra 'U' (tensão).",
    ],
  },
  {
    id: "switch",
    name: "Chave / Interruptor (NA)",
    shortName: "Chave / Botão",
    boardLetter: "SW / S",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Estabelece ou interrompe mecanicamente a continuidade elétrica de uma malha.",
    unit: "Contato NA/NF",
    clues: [
      "Na placa sou identificada por SW ou S (push-button ou chave gangorra).",
      "No estado Normalmente Aberto (NA), só há continuidade enquanto acionada.",
      "Meu símbolo mostra dois pontos de contato com uma haste móvel inclinada.",
    ],
  },
  {
    id: "relay",
    name: "Relé Eletromecânico",
    shortName: "Relé",
    boardLetter: "K / RL",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Comuta cargas de potência através de contatos mecânicos acionados por bobina eletromagnética.",
    unit: "Vbobina / Acontato",
    clues: [
      "Permito que um sinal fraco (5V/12V DC na bobina) acione cargas isoladas de 220V AC.",
      "Possuo contatos Comum (COM), Normalmente Aberto (NA) e Normalmente Fechado (NF).",
      "Meu símbolo combina o bloco da bobina eletromagnética acoplado por linha tracejada à chave de contato.",
    ],
  },
  {
    id: "buzzer",
    name: "Buzzer / Sinalizador Sonoro",
    shortName: "Buzzer",
    boardLetter: "BZ / LS",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Transdutor eletroacústico que converte sinal elétrico em alerta sonoro audível.",
    unit: "dB / Hz",
    clues: [
      "Sou usado em painéis industriais, nobreaks e multímetros para emitir alertas sonoros (bips).",
      "Na versão ativa, basta aplicar tensão contínua (ex: 5V ou 12V) para que eu apite.",
      "Meu símbolo apresenta uma cápsula semicircular com arcos indicando ondas sonoras.",
    ],
  },
  {
    id: "gnd",
    name: "Terra (GND / Referência 0V)",
    shortName: "Terra (GND)",
    boardLetter: "GND",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Nó comum de referência de 0V para retorno de corrente e medição com a ponta preta do multímetro.",
    unit: "0 Volts",
    clues: [
      "Para aferir tensões DC na placa, apoiamos a ponta de prova PRETA do multímetro neste ponto.",
      "Represento o potencial de referência de 0V comum a todo o circuito eletrônico.",
      "Meu símbolo é formado por três traços horizontais decrescentes na extremidade inferior.",
    ],
  },
  {
    id: "dc_source",
    name: "Fonte DC / Bateria",
    shortName: "Fonte Contínua (DC)",
    boardLetter: "VCC / BAT",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Fornece tensão elétrica contínua constante com polaridade fixa (+ e -).",
    unit: "Volt DC (V)",
    clues: [
      "Forneço energia unidirecional com polo Positivo (+) e Negativo (-) definidos.",
      "No meu símbolo, a linha longa fina indica o polo Positivo (+) e a linha curta espessa indica o Negativo (-).",
    ],
  },
  {
    id: "ac_source",
    name: "Fonte Alternada (AC)",
    shortName: "Fonte Alternada (AC)",
    boardLetter: "VAC",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "Fornece tensão elétrica senoidal que inverte de polaridade periodicamente (ex: 60 Hz).",
    unit: "Volt AC (V~)",
    clues: [
      "Represento a alimentação senoidal da rede elétrica (127V / 220V em 60 Hz).",
      "Meu símbolo é uma circunferência contendo um ciclo de onda senoidal (~) no centro.",
    ],
  },
  {
    id: "voltage_regulator",
    name: "Regulador de Tensão Linear (78XX)",
    shortName: "Regulador 7805",
    boardLetter: "U / VR",
    category: "protecao_energia",
    categoryLabel: "Proteção, Controle & Energia",
    basicFunction:
      "CI de 3 terminais (IN, GND, OUT) que converte uma tensão DC maior em uma saída fixa regulada.",
    unit: "Volt Fixo (5V/12V)",
    clues: [
      "Na família 78XX, o famoso LM7805 recebe de 7V a 24V no pino IN e entrega 5,0V cravados no pino OUT.",
      "Possuo 3 terminais (Entrada, Terra e Saída) e costumo usar dissipador térmico de alumínio.",
      "Meu símbolo é um bloco retangular identificado com os terminais IN, GND e OUT.",
    ],
  },
  {
    id: "ic_opamp",
    name: "Amplificador Operacional",
    shortName: "Amp-Op (CI)",
    boardLetter: "U / CI",
    category: "semicondutor",
    categoryLabel: "Semicondutor",
    basicFunction:
      "Circuito integrado diferencial de alto ganho para condicionamento de sinais e comparadores.",
    unit: "Ganho (Av)",
    clues: [
      "Possuo entrada não-inversora (+), entrada inversora (-) e saída analógica (ex: LM358, LM741).",
      "Sem realimentação, atuo como comparador de tensão; com resistores de realimentação, amplifico sinais.",
      "Meu símbolo é um triângulo grande com duas entradas à esquerda (+ e -) e uma saída no vértice direito.",
    ],
  },
  {
    id: "optocoupler",
    name: "Optoacoplador (Isolador Óptico)",
    shortName: "Optoacoplador",
    boardLetter: "U / PC",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Transfere sinais elétricos entre dois circuitos isolados usando um LED infravermelho e um fototransistor.",
    unit: "CTR (%)",
    clues: [
      "Muito usado em fontes chaveadas e entradas de CLPs (ex: PC817, 4N25) para isolar eletricamente o microcontrolador.",
      "Internamente possuo um LED emissor de um lado e um fototransistor receptor do outro, sem contato elétrico entre eles.",
      "Meu símbolo exibe um CI contendo um diodo emissor apontando setas de luz para a base de um transistor.",
    ],
  },
  {
    id: "crystal",
    name: "Cristal Oscilador (Quartzo)",
    shortName: "Cristal (XTAL)",
    boardLetter: "Y / XTAL",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Ressonador piezoelétrico de alta precisão que gera o sinal de clock para microcontroladores.",
    unit: "MHz / kHz",
    clues: [
      "Na placa sou identificado por Y ou XTAL (ex: 16 MHz no Arduino ou 32,768 kHz em relógios RTC).",
      "Trabalho em conjunto com dois pequenos capacitores cerâmicos (ex: 22 pF) ligados ao GND.",
      "Meu símbolo apresenta um retângulo piezoelétrico central ladeado por duas placas condutoras.",
    ],
  },
  {
    id: "display_7seg",
    name: "Display de 7 Segmentos",
    shortName: "Display 7-Seg",
    boardLetter: "DSP / DS",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Indicador numérico formado por 7 LEDs individuais (a–g) para exibir algarismos de 0 a 9.",
    unit: "Catodo/Anodo Comum",
    clues: [
      "Sou composto por 7 segmentos de LED nomeados de 'a' até 'g', mais o ponto decimal 'dp'.",
      "Posso ser do tipo Catodo Comum (pino comum no GND) ou Anodo Comum (pino comum no VCC).",
      "Meu símbolo é um bloco retangular exibindo o dígito '8' segmentado e o ponto decimal.",
    ],
  },
  {
    id: "gate_and",
    name: "Porta Lógica AND (E)",
    shortName: "Porta AND",
    boardLetter: "U (7408)",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Executa a multiplicação lógica (S = A · B): saída é 1 somente se TODAS as entradas forem 1.",
    unit: "Lógica Booleana",
    clues: [
      "Na minha tabela-verdade, basta que uma única entrada seja 0 para que a saída seja obrigatoriamente 0.",
      "A saída só vai para nível lógico ALTO (1) quando a entrada A = 1 E a entrada B = 1.",
      "Meu símbolo tem a base esquerda reta e a frente direita arredondada em formato de 'D' (norma IEC: '&').",
    ],
  },
  {
    id: "gate_or",
    name: "Porta Lógica OR (OU)",
    shortName: "Porta OR",
    boardLetter: "U (7432)",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Executa a soma lógica (S = A + B): saída é 1 quando PELO MENOS UMA entrada for 1.",
    unit: "Lógica Booleana",
    clues: [
      "Na minha tabela-verdade, a saída só é 0 quando todas as entradas forem 0 simultaneamente.",
      "Se A = 1 ou B = 1 (ou ambos forem 1), minha saída assume nível lógico ALTO (1).",
      "Meu símbolo possui a base esquerda côncava (curvada) e a ponta direita afilada (norma IEC: '≥1').",
    ],
  },
  {
    id: "gate_not",
    name: "Porta Lógica NOT (Inversora)",
    shortName: "Porta NOT",
    boardLetter: "U (7404)",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Inverte o estado lógico do sinal de entrada: se entra 0 sai 1; se entra 1 sai 0.",
    unit: "Inversor Lógico",
    clues: [
      "Possuo apenas 1 entrada e 1 saída, realizando a operação de negação/complemento booleano.",
      "Quando aplico 0V (nível 0) na entrada, minha saída entrega VCC (nível 1), e vice-versa.",
      "Meu símbolo é um triângulo com um pequeno círculo (bolha de inversão) na ponta de saída.",
    ],
  },
  {
    id: "gate_nand",
    name: "Porta Lógica NAND (NÃO-E)",
    shortName: "Porta NAND",
    boardLetter: "U (7400)",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Inverso da porta AND: a saída só vai para 0 quando TODAS as entradas forem 1.",
    unit: "Porta Universal",
    clues: [
      "Sou conhecida como 'Porta Universal' na eletrônica digital, pois qualquer circuito lógico pode ser feito comigo.",
      "Minha saída permanece em nível ALTO (1) quase sempre, caindo para 0 apenas quando A = 1 e B = 1.",
      "Meu símbolo é idêntico ao da porta AND (formato 'D'), porém com um círculo de inversão na saída.",
    ],
  },
  {
    id: "gate_xor",
    name: "Porta Lógica XOR (OU-Exclusivo)",
    shortName: "Porta XOR",
    boardLetter: "U (7486)",
    category: "digital_logica",
    categoryLabel: "Eletrônica Digital & Lógica",
    basicFunction:
      "Detectora de desigualdade: saída é 1 somente quando as entradas possuem níveis lógicos DIFERENTES.",
    unit: "Comparador Lógico",
    clues: [
      "Se as duas entradas forem iguais (0 e 0, ou 1 e 1), minha saída será 0.",
      "Minha saída só vai para 1 quando uma entrada é 0 e a outra é 1 (muito usada em somadores binários).",
      "Meu símbolo é uma porta OR com um segundo arco curvo paralelo na entrada (norma IEC: '=1').",
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
  correctBands: [number, number, number];
}

export const RESISTOR_ORDERS: ResistorOrder[] = [
  {
    targetOhms: 100,
    displayLabel: "100 Ω",
    usageHint: "Proteção de barramento de sinal digital",
    correctBands: [1, 0, 1],
  },
  {
    targetOhms: 220,
    displayLabel: "220 Ω",
    usageHint: "Limitar corrente de LED em 5V (Arduino/TTL)",
    correctBands: [2, 2, 1],
  },
  {
    targetOhms: 470,
    displayLabel: "470 Ω",
    usageHint: "Limitar corrente de LED em fonte 12V",
    correctBands: [4, 7, 1],
  },
  {
    targetOhms: 1000,
    displayLabel: "1 kΩ",
    usageHint: "Acionamento de Base de Transistor NPN",
    correctBands: [1, 0, 2],
  },
  {
    targetOhms: 4700,
    displayLabel: "4,7 kΩ",
    usageHint: "Resistor Pull-Up em barramento I2C",
    correctBands: [4, 7, 2],
  },
  {
    targetOhms: 10000,
    displayLabel: "10 kΩ",
    usageHint: "Divisor de tensão com LDR ou botão Pull-Down",
    correctBands: [1, 0, 3],
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
];

export const AVATARS: string[] = [
  "⚡",
  "🔧",
  "🤖",
  "🔋",
  "💡",
  "🛠️",
  "📟",
  "🚀",
  "🔬",
  "⚙️",
  "📡",
  "🔌",
];

