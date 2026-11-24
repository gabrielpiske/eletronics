"use client";

import React, { useState, useMemo } from "react";
import {
  ElectronicComponentItem,
  RESISTOR_COLORS,
} from "@/data/electronicsData";
import { ElectronicSymbolSVG } from "@/components/ElectronicSymbolSVG";
import { formatOhmsLabel } from "@/lib/challengeGenerator";
import {
  X,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Cpu,
  Gamepad2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";

const E24_BASE_VALUES = [
  10, 11, 12, 13, 15, 16, 18, 20, 22, 24, 27, 30, 33, 36, 39, 43, 47, 51, 56,
  62, 68, 75, 82, 91,
];

function getMultimeterGuideForComponent(comp: ElectronicComponentItem): {
  scale: string;
  healthyReading: string;
  faultSymptom: string;
  safetyTip: string;
} {
  switch (comp.id) {
    case "fuse":
      return {
        scale: "Continuidade Sonora (Bip) / Resistência (200 Ω)",
        healthyReading: "Bip contínuo e resistência próxima de 0,0 Ω a 0,5 Ω.",
        faultSymptom:
          "Leitura 'OL' (aberto / sem bip) indica elo fundido por sobrecorrente ou curto a jusante.",
        safetyTip:
          "Meça sempre com a placa desenergizada e jamais substitua por fio metálico ou valor superior ao nominal.",
      };
    case "diode":
    case "schottky_diode":
    case "led":
    case "zener":
      return {
        scale: "Teste de Diodo (Símbolo de Diodo no Multímetro)",
        healthyReading:
          comp.id === "schottky_diode"
            ? "Direta (Anodo+, Catodo-): ~0,18 V a 0,32 V. Reversa: 'OL' (bloqueio)."
            : comp.id === "led"
            ? "Direta: ~1,8 V a 3,2 V (o LED pode acender fraco). Reversa: 'OL'."
            : "Direta (Anodo+, Catodo-): ~0,55 V a 0,72 V. Reversa: 'OL' (bloqueio).",
        faultSymptom:
          "0,00 V nos dois sentidos indica diodo em curto; 'OL' nos dois sentidos indica junção aberta.",
        safetyTip:
          "Confira o alinhamento da faixa do cátodo (K) com a serigrafia da PCI antes de soldar.",
      };
    case "resistor":
    case "potentiometer":
    case "ldr":
    case "thermistor":
      return {
        scale: "Resistência Ôhmica (Ω — faixa compatível com o valor nominal)",
        healthyReading:
          "Leitura estável dentro da tolerância (±5% ou ±1%) ou variando suavemente ao girar/aquecer/iluminar.",
        faultSymptom:
          "Leitura 'OL' ou muito acima do nominal indica resistor aberto ou trincado termicamente.",
        safetyTip:
          "Desenergize totalmente a placa antes de medir Ω; resistores em paralelo na PCI podem reduzir a leitura aparente.",
      };
    case "capacitor":
    case "electrolytic_cap":
      return {
        scale: "Capacitância (F) + Inspeção Visual / Teste de Curto",
        healthyReading:
          "Capacitância próxima ao valor nominal (±10%/20%) e ausência de continuidade direta entre os terminais.",
        faultSymptom:
          "Topo estufado, vazamento de eletrólito, leitura 0 Ω (curto) ou perda severa de capacitância (ESR alta).",
        safetyTip:
          "Descarregue capacitores eletrolíticos antes de encostar o multímetro e respeite rigorosamente a faixa negativa (-).",
      };
    case "transistor_npn":
    case "mosfet":
    case "scr":
    case "triac":
      return {
        scale: "Teste de Semicondutor / Diodo (entre terminais a frio)",
        healthyReading:
          comp.id === "transistor_npn"
            ? "Junções Base→Coletor e Base→Emissor conduzem (~0,65 V); Coletor↔Emissor aberto ('OL')."
            : "Alta impedância entre Drain-Source (ou A-K) desligado; isolamento íntegro no terminal Gate.",
        faultSymptom:
          "Continuidade direta (0 Ω / bip) entre Coletor-Emissor ou Drain-Source indica chave em curto.",
        safetyTip:
          "Use pulseira/manta ESD ao manusear MOSFETs e confira o pinout (B-C-E / G-D-S) no datasheet.",
      };
    default:
      if (comp.category === "digital_logica") {
        return {
          scale: "Tensão Contínua (V⎓ DC) com ponta preta no GND (0 V)",
          healthyReading:
            "Nível lógico BAIXO (0): ~0,0 V a 0,4 V • Nível lógico ALTO (1): ~3,3 V ou ~5,0 V conforme barramento VCC.",
          faultSymptom:
            "Saída travada em nível intermediário (~1,5 V) ou não obedecendo à tabela-verdade / alimentação VCC ausente.",
          safetyTip:
            "Nunca provoque curto entre pinos adjacentes de CIs SOIC/DIP com a ponta de prova durante a medição energizada.",
        };
      }
      return {
        scale: "Tensão (V⎓ / V~) ou Continuidade a frio conforme estágio",
        healthyReading:
          "Parâmetros coerentes com a especificação nominal do circuito e continuidade firme nos contatos.",
        faultSymptom:
          "Ausência de tensão de saída, bobina aberta ('OL') ou contatos carbonizados sem comutação.",
        safetyTip:
          "Identifique sempre se o estágio opera em baixa tensão DC (5V/24V) ou rede AC (127V/220V) antes de medir.",
      };
  }
}

function decodeSmdResistorCode(rawInput: string): {
  valid: boolean;
  ohms: number;
  formatted: string;
  explanation: string;
  application: string;
} {
  const code = rawInput.trim().toUpperCase();
  if (!code) {
    return {
      valid: false,
      ohms: 0,
      formatted: "—",
      explanation: "Digite um código SMD (ex.: 103, 472, 1002, 4R7, 000).",
      application: "",
    };
  }

  // Jumper 0 Ohm (0, 00, 000, 0000)
  if (/^0{1,4}$/.test(code)) {
    return {
      valid: true,
      ohms: 0,
      formatted: "0 Ω (Jumper SMD)",
      explanation:
        "Código zero indica resistor de 0 Ω utilizado como jumper de trilha na superfície da PCI.",
      application: "Interligação de malhas e configuração de jumpers em PCI SMD.",
    };
  }

  // Notação com R / K / M como separador decimal (ex: 4R7, 0R22, 2K2, 1M5)
  const radixMatch = code.match(/^(\d+)([RKM])(\d+)$/);
  if (radixMatch) {
    const intPart = Number(radixMatch[1]);
    const letter = radixMatch[2];
    const decPart = radixMatch[3];
    const mult = letter === "M" ? 1_000_000 : letter === "K" ? 1_000 : 1;
    const val = Number(`${intPart}.${decPart}`) * mult;
    return {
      valid: true,
      ohms: val,
      formatted: formatOhmsLabel(val),
      explanation: `Notação com letra decimal (${letter}): a letra '${letter}' marca a vírgula (${intPart},${decPart} ${
        letter === "R" ? "Ω" : letter + "Ω"
      }).`,
      application:
        val < 10
          ? "Sensoriamento de corrente (Shunt) ou proteção de fonte."
          : "Aplicação de precisão em malha industrial.",
    };
  }

  // 3 dígitos padrão (ex: 103 = 10 * 10^3 = 10 kΩ)
  if (/^\d{3}$/.test(code)) {
    const mantissa = Number(code.slice(0, 2));
    const exp = Number(code[2]);
    const val = mantissa * Math.pow(10, exp);
    return {
      valid: true,
      ohms: val,
      formatted: formatOhmsLabel(val),
      explanation: `Padrão SMD 3 dígitos (±5%): dígitos '${code.slice(
        0,
        2
      )}' × 10^${exp} (${Math.pow(10, exp).toLocaleString("pt-BR")} Ω).`,
      application:
        val <= 1000
          ? "Limitação de corrente de LED, optoacoplador ou gate-stopper."
          : "Pull-up / Pull-down lógico, divisor de tensão ou malha RC.",
    };
  }

  // 4 dígitos precisão (ex: 1002 = 100 * 10^2 = 10 kΩ)
  if (/^\d{4}$/.test(code)) {
    const mantissa = Number(code.slice(0, 3));
    const exp = Number(code[3]);
    const val = mantissa * Math.pow(10, exp);
    return {
      valid: true,
      ohms: val,
      formatted: formatOhmsLabel(val),
      explanation: `Padrão SMD 4 dígitos (±1% precisão): dígitos '${code.slice(
        0,
        3
      )}' × 10^${exp} (${Math.pow(10, exp).toLocaleString("pt-BR")} Ω).`,
      application:
        "Malha de instrumentação, ganho de Amp-Op ou condicionador de encoder/sensores.",
    };
  }

  return {
    valid: false,
    ohms: 0,
    formatted: "Código inválido",
    explanation:
      "Use 3 dígitos (ex: 103), 4 dígitos (ex: 4701), notação R (ex: 4R7) ou 000.",
    application: "",
  };
}

function findNearestE24Resistor(minOhms: number): {
  ohms: number;
  bands: [string, string, string];
  bandNames: [string, string, string];
} {
  const safeMin = Math.max(10, minOhms);
  const candidates: number[] = [];
  for (let exp = 0; exp <= 5; exp++) {
    const mult = Math.pow(10, exp);
    for (const b of E24_BASE_VALUES) {
      candidates.push(b * mult);
    }
  }
  const chosen =
    candidates.find((c) => c >= safeMin) || candidates[candidates.length - 1];

  // Calcula as 3 primeiras faixas para exibição
  let temp = chosen;
  let multIdx = 0;
  while (temp >= 100 && multIdx < 7) {
    temp = Math.round(temp / 10);
    multIdx++;
  }
  const d1 = Math.min(9, Math.max(1, Math.floor(temp / 10)));
  const d2 = Math.min(9, Math.max(0, temp % 10));

  const c1 = RESISTOR_COLORS[d1] || RESISTOR_COLORS[1];
  const c2 = RESISTOR_COLORS[d2] || RESISTOR_COLORS[0];
  const c3 = RESISTOR_COLORS[multIdx] || RESISTOR_COLORS[0];

  return {
    ohms: chosen,
    bands: [c1.hex, c2.hex, c3.hex],
    bandNames: [c1.name, c2.name, c3.name],
  };
}

export const WorkbenchCalculatorPanel: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [toolTab, setToolTab] = useState<"smd" | "led">("smd");
  const [showSmdExplanation, setShowSmdExplanation] = useState<boolean>(false);

  // Estado SMD
  const [smdInput, setSmdInput] = useState<string>("103");

  // Estado LED
  const [vcc, setVcc] = useState<number>(24);
  const [vf, setVf] = useState<number>(2.0);
  const [targetMa, setTargetMa] = useState<number>(10);

  const smdResult = useMemo(() => decodeSmdResistorCode(smdInput), [smdInput]);

  const ledCalc = useMemo(() => {
    const vDrop = Math.max(0.5, vcc - vf);
    const currentA = Math.max(0.001, targetMa / 1000);
    const exactOhms = vDrop / currentA;
    const e24 = findNearestE24Resistor(exactOhms);
    const realCurrentMa = (vDrop / e24.ohms) * 1000;
    const powerMw = vDrop * realCurrentMa;
    const recommendedWatt =
      powerMw <= 125
        ? "1/4 W (0,25 W)"
        : powerMw <= 250
        ? "1/2 W (0,5 W)"
        : powerMw <= 500
        ? "1 W"
        : "2 W ou maior";

    return {
      vDrop,
      exactOhms: Math.round(exactOhms),
      e24,
      realCurrentMa: realCurrentMa.toFixed(1).replace(".", ","),
      powerMw: Math.round(powerMw),
      recommendedWatt,
    };
  }, [vcc, vf, targetMa]);

  return (
    <div className="bg-[#181B20] border border-[#2A303C] rounded-xl overflow-hidden shadow-md">
      <div className="px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <Calculator className="w-5 h-5 text-amber-400" />
          <div>
            <span className="text-sm sm:text-base font-extrabold text-white">
              Instrumentos de Bancada — Decodificador SMD &amp; Dimensionador de LED
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-extrabold border transition-colors ${
            open
              ? "bg-amber-500 text-zinc-950 border-amber-400 shadow"
              : "bg-[#0C0E12] text-amber-400 border-amber-500/50 hover:border-amber-400"
          }`}
        >
          {open ? "Fechar Calculadora" : "⚡ Abrir Calculadora de Bancada"}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#242933] p-5 bg-[#121519] space-y-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setToolTab("smd")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-extrabold border transition-colors ${
                toolTab === "smd"
                  ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                  : "bg-[#0C0E12] border-[#2A303C] text-zinc-300 hover:text-white"
              }`}
            >
              1. Decodificador SMD (3/4 Dígitos &amp; R)
            </button>
            <button
              type="button"
              onClick={() => setToolTab("led")}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-mono font-extrabold border transition-colors ${
                toolTab === "led"
                  ? "bg-[#0047B6] border-[#0057E0] text-white shadow"
                  : "bg-[#0C0E12] border-[#2A303C] text-zinc-300 hover:text-white"
              }`}
            >
              2. Dimensionador de Resistor E24 para LED
            </button>
          </div>

          {toolTab === "smd" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 bg-[#0C0E12] border border-[#2A303C] rounded-lg p-4 space-y-3">
                <label className="block font-mono text-xs uppercase tracking-wider text-zinc-300 font-bold">
                  Código do Corpo SMD (0805 / 1206):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={smdInput}
                  onChange={(e) => setSmdInput(e.target.value.toUpperCase())}
                  placeholder="Ex: 103"
                  className="w-full text-center font-mono text-3xl font-black tracking-widest py-3 px-4 rounded-lg bg-[#181B20] border-2 border-[#2A303C] focus:border-amber-400 focus:outline-none text-amber-400"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono text-zinc-400 font-bold">
                    Testar:
                  </span>
                  {["103", "472", "221", "1002", "4R7", "000"].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setSmdInput(ex)}
                      className={`px-2.5 py-1 rounded font-mono text-xs sm:text-sm font-bold border ${
                        smdInput === ex
                          ? "bg-amber-500/20 border-amber-400 text-amber-300"
                          : "bg-[#181B20] border-[#2A303C] text-zinc-300 hover:text-white"
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7 lcd-readout rounded-lg p-5 flex flex-col sm:flex-row items-center gap-5">
                {/* Representação Vetorial do Chip SMD */}
                <div className="shrink-0 bg-[#181B20] border border-[#2A303C] rounded-lg p-3.5 flex flex-col items-center">
                  <svg viewBox="0 0 140 64" className="w-36 h-20">
                    <rect
                      x="8"
                      y="12"
                      width="24"
                      height="40"
                      rx="3"
                      fill="#CBD5E1"
                    />
                    <rect
                      x="108"
                      y="12"
                      width="24"
                      height="40"
                      rx="3"
                      fill="#CBD5E1"
                    />
                    <rect
                      x="24"
                      y="14"
                      width="92"
                      height="36"
                      rx="2"
                      fill="#0F172A"
                      stroke="#475569"
                      strokeWidth="2"
                    />
                    <text
                      x="70"
                      y="38"
                      textAnchor="middle"
                      fill="#F8FAFC"
                      fontSize="20"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {smdInput.slice(0, 4) || "---"}
                    </text>
                  </svg>
                  <span className="text-xs font-mono text-zinc-400 font-bold mt-1">
                    CHIP SMD
                  </span>
                </div>

                <div className="space-y-2 text-left flex-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                    LEITURA ÔHMICA DECODIFICADA
                  </span>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-emerald-400">
                    {smdResult.formatted}
                  </div>
                  {smdResult.application && (
                    <p className="text-sm font-mono font-semibold text-sky-300">
                      ⚡ {smdResult.application}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowSmdExplanation((v) => !v)}
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-zinc-300 hover:text-amber-300 pt-1"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {showSmdExplanation
                        ? "Ocultar cálculo do código"
                        : "Ver como calcular este código"}
                    </span>
                  </button>
                  {showSmdExplanation && (
                    <p className="text-sm text-zinc-200 bg-[#181B20] border border-[#2A303C] rounded-md p-2.5 leading-relaxed">
                      {smdResult.explanation}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {toolTab === "led" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6 bg-[#0C0E12] border border-[#2A303C] rounded-lg p-4 space-y-3.5">
                <div>
                  <span className="block font-mono text-xs uppercase tracking-wider text-zinc-300 font-bold mb-1.5">
                    1. Tensão da Fonte (VCC):
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[3.3, 5, 9, 12, 24].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVcc(v)}
                        className={`px-3 py-1.5 rounded-md font-mono text-xs sm:text-sm font-bold border ${
                          vcc === v
                            ? "bg-amber-500 text-zinc-950 border-amber-400"
                            : "bg-[#181B20] border-[#2A303C] text-zinc-200"
                        }`}
                      >
                        {v.toString().replace(".", ",")} V
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block font-mono text-xs uppercase tracking-wider text-zinc-300 font-bold mb-1.5">
                    2. Cor / Queda do LED (Vf):
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { label: "Opto IR (1,2V)", val: 1.2 },
                      { label: "Vermelho (1,8V)", val: 1.8 },
                      { label: "Verde/Amarelo (2,0V)", val: 2.0 },
                      { label: "Azul/Branco (3,2V)", val: 3.2 },
                    ].map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => setVf(opt.val)}
                        className={`px-3 py-1.5 rounded-md font-mono text-xs sm:text-sm font-bold border ${
                          vf === opt.val
                            ? "bg-[#0047B6] text-white border-[#0057E0]"
                            : "bg-[#181B20] border-[#2A303C] text-zinc-200"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block font-mono text-xs uppercase tracking-wider text-zinc-300 font-bold mb-1.5">
                    3. Corrente Desejada (If):
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[5, 10, 15, 20].map((ma) => (
                      <button
                        key={ma}
                        type="button"
                        onClick={() => setTargetMa(ma)}
                        className={`px-3 py-1.5 rounded-md font-mono text-xs sm:text-sm font-bold border ${
                          targetMa === ma
                            ? "bg-emerald-600 text-white border-emerald-400"
                            : "bg-[#181B20] border-[#2A303C] text-zinc-200"
                        }`}
                      >
                        {ma} mA
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 lcd-readout rounded-lg p-5 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                    RESISTOR COMERCIAL E24
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-zinc-300 font-bold">
                    Exato: {formatOhmsLabel(ledCalc.exactOhms)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-[#181B20] border border-[#2A303C] rounded-lg p-3.5">
                  <div>
                    <div className="text-2xl sm:text-3xl font-mono font-black text-emerald-400">
                      {formatOhmsLabel(ledCalc.e24.ohms)}
                    </div>
                    <div className="text-xs sm:text-sm font-mono font-bold text-zinc-200 mt-0.5">
                      {ledCalc.e24.bandNames.join(" • ")} • Ouro
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ledCalc.e24.bands.map((hex, i) => (
                      <span
                        key={i}
                        style={{ backgroundColor: hex }}
                        className="w-5 h-10 rounded-sm border border-white/30 inline-block"
                        title={ledCalc.e24.bandNames[i]}
                      />
                    ))}
                    <span
                      style={{ backgroundColor: "#EAB308" }}
                      className="w-3.5 h-10 rounded-sm border border-white/30 inline-block"
                      title="Ouro (±5%)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 font-mono">
                  <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-2.5">
                    <span className="text-xs text-zinc-400 font-bold block">
                      CORRENTE REAL
                    </span>
                    <span className="text-base sm:text-lg font-black text-sky-300">
                      {ledCalc.realCurrentMa} mA
                    </span>
                  </div>
                  <div className="bg-[#181B20] border border-[#2A303C] rounded-lg p-2.5">
                    <span className="text-xs text-zinc-400 font-bold block">
                      POTÊNCIA MÍNIMA
                    </span>
                    <span
                      className={`text-base sm:text-lg font-black ${
                        ledCalc.powerMw > 125
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {ledCalc.recommendedWatt}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ComponentDatasheetModalProps {
  component: ElectronicComponentItem | null;
  onClose: () => void;
  onStartSoloPractice: () => void;
}

export const ComponentDatasheetModal: React.FC<
  ComponentDatasheetModalProps
> = ({ component, onClose, onStartSoloPractice }) => {
  const [showExtraClues, setShowExtraClues] = useState<boolean>(false);

  if (!component) return null;

  const guide = getMultimeterGuideForComponent(component);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181B20] border-2 border-[#2A303C] rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#0047B6] via-amber-400 to-emerald-500" />

        {/* Cabeçalho da Ficha Técnica */}
        <div className="px-6 py-4 border-b border-[#242933] flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-lg sm:text-xl font-black px-3.5 py-1.5 rounded-lg bg-[#0C0E12] text-amber-400 border-2 border-amber-500/50">
              [{component.boardLetter}]
            </span>
            <div>
              <span className="font-mono text-xs uppercase tracking-wider text-sky-400 font-bold block">
                INSTRUMENTO DE BANCADA • {component.categoryLabel}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                {component.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha técnica"
            className="p-2 rounded-lg bg-[#0C0E12] text-zinc-300 hover:text-white border border-[#2A303C]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Bloco Símbolo Gigante + Função Direta */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-[#0C0E12] border border-[#242933] rounded-xl p-5">
            <div className="sm:col-span-5 flex flex-col items-center justify-center bg-[#181B20] border border-[#2A303C] rounded-lg py-5 px-3">
              <ElectronicSymbolSVG
                symbolId={component.id}
                className="w-44 h-28"
              />
              <span className="font-mono text-xs sm:text-sm text-zinc-300 mt-2.5">
                Unidade:{" "}
                <strong className="text-amber-400 font-extrabold">
                  {component.unit}
                </strong>
              </span>
            </div>

            <div className="sm:col-span-7 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-emerald-400 font-extrabold block">
                ⚡ O QUE FAZ NO CIRCUITO
              </span>
              <p className="text-base sm:text-lg text-white font-bold leading-snug">
                {component.basicFunction}
              </p>
              <div className="pt-1 flex items-center gap-2.5 flex-wrap font-mono text-xs sm:text-sm">
                <span className="px-3 py-1 rounded-md bg-[#181B20] border border-[#2A303C] text-zinc-200">
                  Letra na Placa:{" "}
                  <strong className="text-amber-400">
                    {component.boardLetter}
                  </strong>
                </span>
                <span className="px-3 py-1 rounded-md bg-[#181B20] border border-[#2A303C] text-zinc-200">
                  Medida:{" "}
                  <strong className="text-emerald-400">{component.unit}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Visores Rápidos de Teste no Multímetro */}
          <div className="bg-[#0C0E12] border border-[#242933] rounded-xl p-5 space-y-3.5">
            <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-amber-400 font-extrabold flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              TESTE RÁPIDO NO MULTÍMETRO
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg bg-[#181B20] border border-sky-500/40">
                <span className="font-mono text-xs uppercase text-sky-400 font-extrabold block">
                  1. ESCALA
                </span>
                <p className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                  {guide.scale}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#12241D]/70 border border-emerald-500/50">
                <span className="font-mono text-xs uppercase text-emerald-400 font-extrabold block">
                  2. PEÇA BOA (OK)
                </span>
                <p className="text-sm sm:text-base font-bold text-emerald-100 mt-1 leading-snug">
                  {guide.healthyReading}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#241316]/70 border border-red-500/50">
                <span className="font-mono text-xs uppercase text-red-400 font-extrabold block">
                  3. DEFEITO / CURTO
                </span>
                <p className="text-sm sm:text-base font-bold text-red-100 mt-1 leading-snug">
                  {guide.faultSymptom}
                </p>
              </div>
            </div>
          </div>

          {/* Botão Expansível: Dicas de Bancada & Pistas de Identificação */}
          <div className="bg-[#0C0E12] border border-[#242933] rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowExtraClues((v) => !v)}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#14181F] transition-colors"
            >
              <span className="font-mono text-xs sm:text-sm uppercase tracking-wider text-amber-300 font-extrabold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>
                  Ver Dica de Segurança &amp; Pistas de Jogo (
                  {component.clues.length})
                </span>
              </span>
              {showExtraClues ? (
                <ChevronUp className="w-5 h-5 text-amber-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-amber-400" />
              )}
            </button>

            {showExtraClues && (
              <div className="px-5 pb-5 pt-2 border-t border-[#1E232D] space-y-3">
                <div className="p-3.5 rounded-lg bg-[#1A1610] border border-amber-500/40 flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-mono text-xs uppercase text-amber-300 font-extrabold block">
                      Cuidado na Bancada
                    </span>
                    <p className="text-sm text-amber-100 mt-0.5 leading-relaxed">
                      {guide.safetyTip}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 text-sm text-zinc-200">
                  {component.clues.map((clue, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 bg-[#181B20] border border-[#2A303C] rounded-lg px-3.5 py-2.5 font-medium"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{clue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-6 py-4 border-t border-[#242933] bg-[#13161A] flex items-center justify-between gap-3 flex-wrap">
          <button
            type="button"
            onClick={onStartSoloPractice}
            className="px-5 py-2.5 rounded-lg bg-[#0047B6] hover:bg-[#0057E0] text-white font-extrabold text-sm flex items-center gap-2 transition-colors shadow"
          >
            <Gamepad2 className="w-4 h-4 text-amber-400" />
            <span>Treinar na Bancada Solo (+XP)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-[#0C0E12] hover:bg-[#1E2229] border border-[#2A303C] text-sm font-bold text-zinc-200"
          >
            Fechar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
