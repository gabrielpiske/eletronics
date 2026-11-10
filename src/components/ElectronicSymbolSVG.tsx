"use client";

import React from "react";

export type SymbolId =
  | "resistor"
  | "potentiometer"
  | "ldr"
  | "thermistor"
  | "capacitor"
  | "electrolytic_cap"
  | "inductor"
  | "transformer"
  | "diode"
  | "led"
  | "zener"
  | "transistor_npn"
  | "mosfet"
  | "scr"
  | "fuse"
  | "switch"
  | "gnd"
  | "dc_source"
  | "ac_source"
  | "ic_opamp";

interface ElectronicSymbolSVGProps {
  symbolId: SymbolId;
  className?: string;
  strokeColor?: string;
}

export const ElectronicSymbolSVG: React.FC<ElectronicSymbolSVGProps> = ({
  symbolId,
  className = "w-32 h-24",
  strokeColor = "#38BDF8",
}) => {
  const accentColor = "#FBBF24"; // Amber highlight for arrows/polarity

  switch (symbolId) {
    case "resistor":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="10" y1="45" x2="40" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="40" y="27" width="80" height="36" rx="3" stroke={strokeColor} strokeWidth="4" fill="#0F172A" />
          <line x1="120" y1="45" x2="150" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "potentiometer":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="10" y1="55" x2="40" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="40" y="37" width="80" height="36" rx="3" stroke={strokeColor} strokeWidth="4" fill="#0F172A" />
          <line x1="120" y1="55" x2="150" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Cursor / Seta do potenciômetro */}
          <line x1="80" y1="10" x2="80" y2="33" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="80,37 73,24 87,24" fill={accentColor} />
        </svg>
      );

    case "ldr":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          <circle cx="80" cy="60" r="36" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="4 4" />
          <line x1="10" y1="60" x2="46" y2="60" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="46" y="45" width="68" height="30" rx="3" stroke={strokeColor} strokeWidth="4" fill="#0F172A" />
          <line x1="114" y1="60" x2="150" y2="60" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Setas de Luz Incidindo */}
          <line x1="35" y1="10" x2="55" y2="30" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="58,33 47,30 55,22" fill={accentColor} />
          <line x1="55" y1="6" x2="75" y2="26" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="78,29 67,26 75,18" fill={accentColor} />
        </svg>
      );

    case "thermistor":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="10" y1="50" x2="42" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="42" y="34" width="76" height="32" rx="3" stroke={strokeColor} strokeWidth="4" fill="#0F172A" />
          <line x1="118" y1="50" x2="150" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Linha de variação térmica */}
          <polyline points="48,78 62,78 106,20" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="108" y="25" fill={accentColor} fontSize="14" fontWeight="bold">t°</text>
        </svg>
      );

    case "capacitor":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="15" y1="45" x2="72" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="72" y1="18" x2="72" y2="72" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="88" y1="18" x2="88" y2="72" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="88" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "electrolytic_cap":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="15" y1="45" x2="70" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Placa Positiva */}
          <line x1="70" y1="18" x2="70" y2="72" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          {/* Placa Negativa Curva/Preenchida */}
          <path d="M 92 18 Q 80 45 92 72" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          <line x1="87" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Sinal de Polaridade + */}
          <text x="45" y="30" fill={accentColor} fontSize="22" fontWeight="bold">+</text>
          <text x="102" y="30" fill="#94A3B8" fontSize="22" fontWeight="bold">-</text>
        </svg>
      );

    case "inductor":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="10" y1="55" x2="32" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <path
            d="M 32 55 A 12 14 0 0 1 56 55 A 12 14 0 0 1 80 55 A 12 14 0 0 1 104 55 A 12 14 0 0 1 128 55"
            stroke={strokeColor}
            strokeWidth="4"
            fill="none"
          />
          <line x1="128" y1="55" x2="150" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "transformer":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          {/* Primário */}
          <line x1="20" y1="18" x2="52" y2="18" stroke={strokeColor} strokeWidth="3.5" />
          <path
            d="M 52 18 A 10 8 0 0 1 52 34 A 10 8 0 0 1 52 50 A 10 8 0 0 1 52 66 A 10 8 0 0 1 52 82"
            stroke={strokeColor}
            strokeWidth="3.5"
            fill="none"
          />
          <line x1="20" y1="82" x2="52" y2="82" stroke={strokeColor} strokeWidth="3.5" />
          {/* Núcleo de Ferro */}
          <line x1="76" y1="16" x2="76" y2="84" stroke={accentColor} strokeWidth="3" />
          <line x1="84" y1="16" x2="84" y2="84" stroke={accentColor} strokeWidth="3" />
          {/* Secundário */}
          <line x1="108" y1="18" x2="140" y2="18" stroke={strokeColor} strokeWidth="3.5" />
          <path
            d="M 108 18 A 10 8 0 0 0 108 34 A 10 8 0 0 0 108 50 A 10 8 0 0 0 108 66 A 10 8 0 0 0 108 82"
            stroke={strokeColor}
            strokeWidth="3.5"
            fill="none"
          />
          <line x1="108" y1="82" x2="140" y2="82" stroke={strokeColor} strokeWidth="3.5" />
        </svg>
      );

    case "diode":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="15" y1="45" x2="60" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="60,22 60,68 102,45" stroke={strokeColor} strokeWidth="4" fill="#0F172A" strokeLinejoin="round" />
          <line x1="102" y1="22" x2="102" y2="68" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="102" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "led":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          <line x1="15" y1="58" x2="58" y2="58" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="58,36 58,80 98,58" stroke={strokeColor} strokeWidth="4" fill="#0F172A" strokeLinejoin="round" />
          <line x1="98" y1="36" x2="98" y2="80" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="98" y1="58" x2="145" y2="58" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Setas de Luz Saindo */}
          <line x1="78" y1="28" x2="98" y2="8" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="101,5 90,9 97,16" fill={accentColor} />
          <line x1="96" y1="34" x2="116" y2="14" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          <polygon points="119,11 108,15 115,22" fill={accentColor} />
        </svg>
      );

    case "zener":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="15" y1="45" x2="58" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="58,22 58,68 100,45" stroke={strokeColor} strokeWidth="4" fill="#0F172A" strokeLinejoin="round" />
          {/* Barra em Z do Zener */}
          <polyline points="90,16 100,22 100,68 110,74" stroke={accentColor} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="100" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "transistor_npn":
      return (
        <svg viewBox="0 0 160 110" className={className} fill="none">
          <circle cx="85" cy="55" r="38" stroke={strokeColor} strokeWidth="2.5" fill="#0F172A" />
          {/* Base */}
          <line x1="20" y1="55" x2="68" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="68" y1="32" x2="68" y2="78" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          {/* Coletor */}
          <polyline points="68,42 102,22 102,6" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Emissor com seta para fora (NPN) */}
          <polyline points="68,68 102,88 102,104" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="101,87 86,85 93,74" fill={accentColor} />
        </svg>
      );

    case "mosfet":
      return (
        <svg viewBox="0 0 160 110" className={className} fill="none">
          <circle cx="88" cy="55" r="38" stroke={strokeColor} strokeWidth="2.5" fill="#0F172A" />
          {/* Gate isolado */}
          <polyline points="20,72 64,72 64,36" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          {/* Canal */}
          <line x1="74" y1="30" x2="74" y2="42" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="74" y1="49" x2="74" y2="61" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="74" y1="68" x2="74" y2="80" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          {/* Drain & Source */}
          <polyline points="74,36 105,36 105,8" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="74,55 105,55 105,102" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="74" y1="74" x2="105" y2="74" stroke={strokeColor} strokeWidth="4" />
        </svg>
      );

    case "scr":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="15" y1="45" x2="58" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="58,22 58,68 98,45" stroke={strokeColor} strokeWidth="4" fill="#0F172A" strokeLinejoin="round" />
          <line x1="98" y1="22" x2="98" y2="68" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="98" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Terminal de Gate do Tiristor */}
          <polyline points="98,55 118,78 118,92" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="124" y="88" fill={accentColor} fontSize="13" fontWeight="bold">G</text>
        </svg>
      );

    case "fuse":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="10" y1="45" x2="150" y2="45" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="44" y="27" width="72" height="36" rx="3" stroke={strokeColor} strokeWidth="4" fill="none" />
        </svg>
      );

    case "switch":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="15" y1="55" x2="52" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="57" cy="55" r="5" stroke={strokeColor} strokeWidth="3.5" fill="#0F172A" />
          <line x1="61" y1="52" x2="104" y2="24" stroke={accentColor} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="105" cy="55" r="5" stroke={strokeColor} strokeWidth="3.5" fill="#0F172A" />
          <line x1="110" y1="55" x2="145" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "gnd":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="80" y1="12" x2="80" y2="48" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="44" y1="48" x2="116" y2="48" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="58" y1="62" x2="102" y2="62" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="70" y1="76" x2="90" y2="76" stroke={accentColor} strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );

    case "dc_source":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="15" y1="48" x2="66" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Traço Longo (+) */}
          <line x1="66" y1="18" x2="66" y2="78" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          {/* Traço Curto Grosso (-) */}
          <line x1="84" y1="32" x2="84" y2="64" stroke={accentColor} strokeWidth="7" strokeLinecap="round" />
          <line x1="84" y1="48" x2="145" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <text x="42" y="30" fill={accentColor} fontSize="20" fontWeight="bold">+</text>
          <text x="98" y="30" fill="#94A3B8" fontSize="20" fontWeight="bold">-</text>
        </svg>
      );

    case "ac_source":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="15" y1="48" x2="50" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="80" cy="48" r="30" stroke={strokeColor} strokeWidth="4" fill="#0F172A" />
          {/* Onda Senoidal */}
          <path d="M 62 48 Q 71 28 80 48 T 98 48" stroke={accentColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="110" y1="48" x2="145" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "ic_opamp":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="15" y1="35" x2="48" y2="35" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="65" x2="48" y2="65" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="48,15 48,85 118,50" stroke={strokeColor} strokeWidth="4" fill="#0F172A" strokeLinejoin="round" />
          <text x="56" y="41" fill="#94A3B8" fontSize="18" fontWeight="bold">-</text>
          <text x="55" y="71" fill={accentColor} fontSize="18" fontWeight="bold">+</text>
          <line x1="118" y1="50" x2="145" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
};
