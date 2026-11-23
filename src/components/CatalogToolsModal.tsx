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
    <div className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
      <div className="px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-4 h-4 text-amber-400" />
          <div>
            <span className="text-xs font-bold text-white">
              Utilitários de Bancada SENAI — Decodificador SMD &amp; Dimensionamento de LED
            </span>
            <span className="hidden sm:inline text-[11px] font-mono text-zinc-400 ml-2">
              (Apoio rápido para laboratório)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`px-3 py-1.5 rounded-md text-xs font-mono font-bold border transition-colors ${
            open
              ? "bg-amber-500 text-zinc-950 border-amber-400"
              : "bg-[#0C0E12] text-amber-400 border-amber-500/40 hover:border-amber-400"
          }`}
        >
          {open ? "Fechar Calculadora" : "Abrir Calculadora de Bancada"}
        </button>
      </div>

      {open && (
        <div className="border-t border-[#242933] p-4 bg-[#121519] space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setToolTab("smd")}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                toolTab === "smd"
                  ? "bg-[#0047B6] border-[#0057E0] text-white"
                  : "bg-[#0C0E12] border-[#2A303C] text-zinc-400 hover:text-white"
              }`}
            >
              1. Decodificador de Resistor SMD (3/4 Dígitos &amp; R)
            </button>
            <button
              type="button"
              onClick={() => setToolTab("led")}
              className={`px-3 py-1.5 rounded text-xs font-mono font-bold border transition-colors ${
                toolTab === "led"
                  ? "bg-[#0047B6] border-[#0057E0] text-white"
                  : "bg-[#0C0E12] border-[#2A303C] text-zinc-400 hover:text-white"
              }`}
            >
              2. Dimensionador de Resistor E24 para LED / Opto
            </button>
          </div>

          {toolTab === "smd" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-5 bg-[#0C0E12] border border-[#2A303C] rounded-md p-4 space-y-3">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  Código Impresso no Corpo SMD (0805 / 1206):
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={smdInput}
                  onChange={(e) => setSmdInput(e.target.value.toUpperCase())}
                  placeholder="Ex: 103"
                  className="w-full text-center font-mono text-xl font-bold tracking-widest py-2 px-3 rounded bg-[#181B20] border border-[#2A303C] focus:border-amber-400 focus:outline-none text-amber-400"
                />

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-500">
                    Exemplos:
                  </span>
                  {["103", "472", "221", "1002", "4R7", "000"].map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => setSmdInput(ex)}
                      className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                        smdInput === ex
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 font-bold"
                          : "bg-[#181B20] border-[#2A303C] text-zinc-400 hover:text-white"
                      }`}
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-7 bg-[#0C0E12] border border-[#2A303C] rounded-md p-4 flex flex-col sm:flex-row items-center gap-4">
                {/* Representação Vetorial do Chip SMD */}
                <div className="shrink-0 bg-[#181B20] border border-[#2A303C] rounded-md p-3 flex flex-col items-center">
                  <svg viewBox="0 0 140 64" className="w-32 h-16">
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
                      fontSize="18"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {smdInput.slice(0, 4) || "---"}
                    </text>
                  </svg>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Encapsulamento SMD
                  </span>
                </div>

                <div className="space-y-1.5 text-left">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Valor Ôhmico Decodificado
                  </span>
                  <div className="text-2xl font-mono font-bold text-emerald-400">
                    {smdResult.formatted}
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {smdResult.explanation}
                  </p>
                  {smdResult.application && (
                    <p className="text-[11px] font-mono text-sky-300">
                      Uso típico: {smdResult.application}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {toolTab === "led" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-6 bg-[#0C0E12] border border-[#2A303C] rounded-md p-4 space-y-3">
                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                    1. Tensão do Barramento / Fonte (VCC):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[3.3, 5, 9, 12, 24].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setVcc(v)}
                        className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                          vcc === v
                            ? "bg-amber-500 text-zinc-950 border-amber-400"
                            : "bg-[#181B20] border-[#2A303C] text-zinc-300"
                        }`}
                      >
                        {v.toString().replace(".", ",")} Vcc
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                    2. Queda Direta do Emissor (Vf):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
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
                        className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                          vf === opt.val
                            ? "bg-[#0047B6] text-white border-[#0057E0]"
                            : "bg-[#181B20] border-[#2A303C] text-zinc-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="block font-mono text-[10px] uppercase tracking-wider text-zinc-400 mb-1">
                    3. Corrente de Operação Desejada (If):
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[5, 10, 15, 20].map((ma) => (
                      <button
                        key={ma}
                        type="button"
                        onClick={() => setTargetMa(ma)}
                        className={`px-2.5 py-1 rounded font-mono text-xs font-bold border ${
                          targetMa === ma
                            ? "bg-emerald-600 text-white border-emerald-400"
                            : "bg-[#181B20] border-[#2A303C] text-zinc-300"
                        }`}
                      >
                        {ma} mA
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="md:col-span-6 bg-[#0C0E12] border border-[#2A303C] rounded-md p-4 space-y-2.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                    Especificação Recomendada (Série Comercial E24)
                  </span>
                  <span className="font-mono text-xs text-zinc-400">
                    Teórico: {formatOhmsLabel(ledCalc.exactOhms)}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3 bg-[#181B20] border border-[#2A303C] rounded-md p-3">
                  <div>
                    <div className="text-xl font-mono font-bold text-emerald-400">
                      {formatOhmsLabel(ledCalc.e24.ohms)}
                    </div>
                    <div className="text-[11px] font-mono text-zinc-300">
                      Faixas: {ledCalc.e24.bandNames.join(" • ")} • Ouro (±5%)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {ledCalc.e24.bands.map((hex, i) => (
                      <span
                        key={i}
                        style={{ backgroundColor: hex }}
                        className="w-4 h-8 rounded-sm border border-white/25 inline-block"
                        title={ledCalc.e24.bandNames[i]}
                      />
                    ))}
                    <span
                      style={{ backgroundColor: "#EAB308" }}
                      className="w-3 h-8 rounded-sm border border-white/25 inline-block"
                      title="Ouro (±5%)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-xs">
                  <div className="bg-[#181B20] border border-[#2A303C] rounded p-2">
                    <span className="text-[10px] text-zinc-400 block">
                      CORRENTE REAL (I)
                    </span>
                    <span className="font-bold text-sky-300">
                      {ledCalc.realCurrentMa} mA
                    </span>
                  </div>
                  <div className="bg-[#181B20] border border-[#2A303C] rounded p-2">
                    <span className="text-[10px] text-zinc-400 block">
                      DISSIPAÇÃO / POTÊNCIA
                    </span>
                    <span
                      className={`font-bold ${
                        ledCalc.powerMw > 125
                          ? "text-amber-400"
                          : "text-emerald-400"
                      }`}
                    >
                      {ledCalc.powerMw} mW → {ledCalc.recommendedWatt}
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
  if (!component) return null;

  const guide = getMultimeterGuideForComponent(component);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#181B20] border border-[#2A303C] rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
      >
        <div className="h-1 w-full bg-[#0047B6]" />

        {/* Cabeçalho da Ficha Técnica */}
        <div className="px-5 py-4 border-b border-[#242933] flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[#0C0E12] text-amber-400 border border-amber-500/40">
              [{component.boardLetter}]
            </span>
            <div>
              <span className="font-mono text-[10px] uppercase tracking-wider text-sky-400 font-bold block">
                FICHA TÉCNICA DE BANCADA • {component.categoryLabel}
              </span>
              <h3 className="text-lg font-bold text-white leading-tight">
                {component.name}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar ficha técnica"
            className="p-1.5 rounded-md bg-[#0C0E12] text-zinc-400 hover:text-white border border-[#2A303C]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corpo com scroll */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Bloco Símbolo + Função */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-[#0C0E12] border border-[#242933] rounded-lg p-4">
            <div className="sm:col-span-5 flex flex-col items-center justify-center bg-[#181B20] border border-[#2A303C] rounded-md py-4 px-3">
              <ElectronicSymbolSVG
                symbolId={component.id}
                className="w-36 h-24"
              />
              <span className="font-mono text-[10px] text-zinc-400 mt-2">
                Grandeza / Unidade:{" "}
                <strong className="text-amber-400">{component.unit}</strong>
              </span>
            </div>

            <div className="sm:col-span-7 space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold block">
                Função Primordial no Circuito
              </span>
              <p className="text-sm text-zinc-100 font-medium leading-relaxed">
                {component.basicFunction}
              </p>
              <div className="pt-2 flex items-center gap-2 flex-wrap font-mono text-[11px]">
                <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#2A303C] text-zinc-300">
                  Serigrafia PCI: <strong>{component.boardLetter}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-[#181B20] border border-[#2A303C] text-zinc-300">
                  Unidade: <strong>{component.unit}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Protocolo de Teste no Multímetro & Segurança */}
          <div className="bg-[#0C0E12] border border-[#242933] rounded-lg p-4 space-y-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              Protocolo Prático de Aferição no Multímetro &amp; Diagnóstico
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded bg-[#181B20] border border-[#2A303C]">
                <span className="font-mono text-[10px] uppercase text-sky-400 font-bold block">
                  Escala do Instrumento
                </span>
                <p className="text-zinc-200 mt-0.5">{guide.scale}</p>
              </div>
              <div className="p-2.5 rounded bg-[#181B20] border border-[#2A303C]">
                <span className="font-mono text-[10px] uppercase text-emerald-400 font-bold block">
                  Comportamento Íntegro (Bom)
                </span>
                <p className="text-zinc-200 mt-0.5">{guide.healthyReading}</p>
              </div>
              <div className="p-2.5 rounded bg-[#181B20] border border-[#2A303C]">
                <span className="font-mono text-[10px] uppercase text-red-400 font-bold block">
                  Sintoma Típico de Falha
                </span>
                <p className="text-zinc-200 mt-0.5">{guide.faultSymptom}</p>
              </div>
              <div className="p-2.5 rounded bg-[#1A1610] border border-amber-500/35">
                <span className="font-mono text-[10px] uppercase text-amber-300 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Segurança &amp; Bancada
                </span>
                <p className="text-amber-100/90 mt-0.5">{guide.safetyTip}</p>
              </div>
            </div>
          </div>

          {/* Pistas e Evidências de Identificação */}
          <div className="bg-[#0C0E12] border border-[#242933] rounded-lg p-4 space-y-2">
            <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Notas de Engenharia &amp; Pistas de Identificação ({component.clues.length})
            </span>
            <ul className="space-y-1.5 text-xs text-zinc-300">
              {component.clues.map((clue, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 bg-[#181B20] border border-[#2A303C] rounded px-3 py-2"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{clue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="px-5 py-3.5 border-t border-[#242933] bg-[#13161A] flex items-center justify-between gap-2 flex-wrap">
          <button
            type="button"
            onClick={onStartSoloPractice}
            className="px-4 py-2 rounded-md bg-[#0047B6] hover:bg-[#0057E0] text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Treinar na Bancada Solo (+XP)</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#0C0E12] hover:bg-[#1E2229] border border-[#2A303C] text-xs font-semibold text-zinc-300"
          >
            Fechar Ficha
          </button>
        </div>
      </div>
    </div>
  );
};
