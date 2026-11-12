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
  | "schottky_diode"
  | "bridge_rectifier"
  | "transistor_npn"
  | "mosfet"
  | "scr"
  | "triac"
  | "fuse"
  | "varistor"
  | "switch"
  | "relay"
  | "buzzer"
  | "gnd"
  | "dc_source"
  | "ac_source"
  | "voltage_regulator"
  | "ic_opamp"
  | "optocoupler"
  | "crystal"
  | "display_7seg"
  | "gate_and"
  | "gate_or"
  | "gate_not"
  | "gate_nand"
  | "gate_xor";

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
  const accentColor = "#FBBF24";
  const bodyFill = "#0C0E12";

  switch (symbolId) {
    case "resistor":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="10" y1="45" x2="40" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="40" y="27" width="80" height="36" rx="3" stroke={strokeColor} strokeWidth="4" fill={bodyFill} />
          <line x1="120" y1="45" x2="150" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "potentiometer":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="10" y1="55" x2="40" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="40" y="37" width="80" height="36" rx="3" stroke={strokeColor} strokeWidth="4" fill={bodyFill} />
          <line x1="120" y1="55" x2="150" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="80" y1="10" x2="80" y2="33" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="80,37 73,24 87,24" fill={accentColor} />
        </svg>
      );

    case "ldr":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          <circle cx="80" cy="60" r="36" stroke={strokeColor} strokeWidth="2.5" strokeDasharray="4 4" />
          <line x1="10" y1="60" x2="46" y2="60" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="46" y="45" width="68" height="30" rx="3" stroke={strokeColor} strokeWidth="4" fill={bodyFill} />
          <line x1="114" y1="60" x2="150" y2="60" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
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
          <rect x="42" y="34" width="76" height="32" rx="3" stroke={strokeColor} strokeWidth="4" fill={bodyFill} />
          <line x1="118" y1="50" x2="150" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
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
          <line x1="70" y1="18" x2="70" y2="72" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <path d="M 92 18 Q 80 45 92 72" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" fill="none" />
          <line x1="87" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
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
          <line x1="20" y1="18" x2="52" y2="18" stroke={strokeColor} strokeWidth="3.5" />
          <path
            d="M 52 18 A 10 8 0 0 1 52 34 A 10 8 0 0 1 52 50 A 10 8 0 0 1 52 66 A 10 8 0 0 1 52 82"
            stroke={strokeColor}
            strokeWidth="3.5"
            fill="none"
          />
          <line x1="20" y1="82" x2="52" y2="82" stroke={strokeColor} strokeWidth="3.5" />
          <line x1="76" y1="16" x2="76" y2="84" stroke={accentColor} strokeWidth="3" />
          <line x1="84" y1="16" x2="84" y2="84" stroke={accentColor} strokeWidth="3" />
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
          <polygon points="60,22 60,68 102,45" stroke={strokeColor} strokeWidth="4" fill={bodyFill} strokeLinejoin="round" />
          <line x1="102" y1="22" x2="102" y2="68" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="102" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "led":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          <line x1="15" y1="58" x2="58" y2="58" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="58,36 58,80 98,58" stroke={strokeColor} strokeWidth="4" fill={bodyFill} strokeLinejoin="round" />
          <line x1="98" y1="36" x2="98" y2="80" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="98" y1="58" x2="145" y2="58" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
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
          <polygon points="58,22 58,68 100,45" stroke={strokeColor} strokeWidth="4" fill={bodyFill} strokeLinejoin="round" />
          <polyline points="90,16 100,22 100,68 110,74" stroke={accentColor} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="100" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "schottky_diode":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="15" y1="45" x2="58" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="58,22 58,68 100,45" stroke={strokeColor} strokeWidth="4" fill={bodyFill} strokeLinejoin="round" />
          {/* Barra em S do Diodo Schottky */}
          <polyline points="92,28 92,20 100,20 100,70 108,70 108,62" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="100" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "bridge_rectifier":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          {/* Losango da Ponte */}
          <polygon points="80,14 126,52 80,90 34,52" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} strokeLinejoin="round" />
          {/* Diodo interno simbólico */}
          <polygon points="72,40 72,64 92,52" fill={accentColor} />
          <line x1="92" y1="40" x2="92" y2="64" stroke={accentColor} strokeWidth="3.5" />
          {/* Terminais AC (~) e DC (+/-) */}
          <line x1="10" y1="52" x2="34" y2="52" stroke={strokeColor} strokeWidth="3.5" />
          <line x1="126" y1="52" x2="150" y2="52" stroke={strokeColor} strokeWidth="3.5" />
          <text x="75" y="30" fill="#94A3B8" fontSize="12" fontWeight="bold">~</text>
          <text x="132" y="44" fill={accentColor} fontSize="15" fontWeight="bold">+</text>
          <text x="18" y="44" fill="#94A3B8" fontSize="15" fontWeight="bold">-</text>
        </svg>
      );

    case "transistor_npn":
      return (
        <svg viewBox="0 0 160 110" className={className} fill="none">
          <circle cx="85" cy="55" r="38" stroke={strokeColor} strokeWidth="2.5" fill={bodyFill} />
          <line x1="20" y1="55" x2="68" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="68" y1="32" x2="68" y2="78" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <polyline points="68,42 102,22 102,6" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="68,68 102,88 102,104" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="101,87 86,85 93,74" fill={accentColor} />
        </svg>
      );

    case "mosfet":
      return (
        <svg viewBox="0 0 160 110" className={className} fill="none">
          <circle cx="88" cy="55" r="38" stroke={strokeColor} strokeWidth="2.5" fill={bodyFill} />
          <polyline points="20,72 64,72 64,36" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="74" y1="30" x2="74" y2="42" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="74" y1="49" x2="74" y2="61" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="74" y1="68" x2="74" y2="80" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <polyline points="74,36 105,36 105,8" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="74,55 105,55 105,102" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="74" y1="74" x2="105" y2="74" stroke={strokeColor} strokeWidth="4" />
        </svg>
      );

    case "scr":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="15" y1="45" x2="58" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="58,22 58,68 98,45" stroke={strokeColor} strokeWidth="4" fill={bodyFill} strokeLinejoin="round" />
          <line x1="98" y1="22" x2="98" y2="68" stroke={strokeColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="98" y1="45" x2="145" y2="45" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polyline points="98,55 118,78 118,92" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="124" y="88" fill={accentColor} fontSize="13" fontWeight="bold">G</text>
        </svg>
      );

    case "triac":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          <line x1="15" y1="50" x2="56" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Dois diodos antiparalelos */}
          <polygon points="56,22 56,50 96,36" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} strokeLinejoin="round" />
          <polygon points="96,50 96,78 56,64" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} strokeLinejoin="round" />
          <line x1="56" y1="20" x2="56" y2="80" stroke={strokeColor} strokeWidth="4.5" />
          <line x1="96" y1="20" x2="96" y2="80" stroke={strokeColor} strokeWidth="4.5" />
          <line x1="96" y1="50" x2="145" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          {/* Gate */}
          <polyline points="96,68 118,88 134,88" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="137" y="92" fill={accentColor} fontSize="12" fontWeight="bold">G</text>
        </svg>
      );

    case "fuse":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="10" y1="45" x2="150" y2="45" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          <rect x="44" y="27" width="72" height="36" rx="3" stroke={strokeColor} strokeWidth="4" fill="none" />
        </svg>
      );

    case "varistor":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="12" y1="50" x2="44" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="44" y="34" width="72" height="32" rx="3" stroke={strokeColor} strokeWidth="4" fill={bodyFill} />
          <line x1="116" y1="50" x2="148" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polyline points="48,78 62,78 104,20 116,20" stroke={accentColor} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <text x="68" y="24" fill={accentColor} fontSize="13" fontWeight="bold">U</text>
        </svg>
      );

    case "switch":
      return (
        <svg viewBox="0 0 160 90" className={className} fill="none">
          <line x1="15" y1="55" x2="52" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="57" cy="55" r="5" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} />
          <line x1="61" y1="52" x2="104" y2="24" stroke={accentColor} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="105" cy="55" r="5" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} />
          <line x1="110" y1="55" x2="145" y2="55" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "relay":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          {/* Bobina do Relé */}
          <rect x="24" y="26" width="42" height="54" rx="3" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} />
          <line x1="24" y1="66" x2="66" y2="38" stroke={strokeColor} strokeWidth="3" />
          <line x1="45" y1="10" x2="45" y2="26" stroke={strokeColor} strokeWidth="3.5" />
          <line x1="45" y1="80" x2="45" y2="96" stroke={strokeColor} strokeWidth="3.5" />
          {/* Linha tracejada de acoplamento magnético */}
          <line x1="68" y1="53" x2="98" y2="53" stroke={accentColor} strokeWidth="2.5" strokeDasharray="4 4" />
          {/* Contato Comutador NA */}
          <line x1="115" y1="12" x2="115" y2="36" stroke={strokeColor} strokeWidth="3.5" />
          <circle cx="115" cy="39" r="4" fill={strokeColor} />
          <line x1="115" y1="68" x2="102" y2="40" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <circle cx="115" cy="68" r="4" fill={strokeColor} />
          <line x1="115" y1="68" x2="115" y2="94" stroke={strokeColor} strokeWidth="3.5" />
        </svg>
      );

    case "buzzer":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="55" y1="70" x2="55" y2="92" stroke={strokeColor} strokeWidth="3.5" />
          <line x1="85" y1="70" x2="85" y2="92" stroke={strokeColor} strokeWidth="3.5" />
          {/* Semicírculo acústico */}
          <path d="M 40 30 L 95 30 L 95 70 L 40 70 A 20 20 0 0 1 40 30 Z" stroke={strokeColor} strokeWidth="4" fill={bodyFill} />
          {/* Ondas sonoras */}
          <path d="M 108 38 A 16 16 0 0 1 108 62" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 120 30 A 26 26 0 0 1 120 70" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
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
          <line x1="66" y1="18" x2="66" y2="78" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
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
          <circle cx="80" cy="48" r="30" stroke={strokeColor} strokeWidth="4" fill={bodyFill} />
          <path d="M 62 48 Q 71 28 80 48 T 98 48" stroke={accentColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <line x1="110" y1="48" x2="145" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "voltage_regulator":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="10" y1="42" x2="38" y2="42" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="122" y1="42" x2="150" y2="42" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="80" y1="68" x2="80" y2="94" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <rect x="38" y="18" width="84" height="50" rx="4" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} />
          <text x="44" y="46" fill="#94A3B8" fontSize="11" fontWeight="bold">IN</text>
          <text x="92" y="46" fill={accentColor} fontSize="11" fontWeight="bold">OUT</text>
          <text x="66" y="63" fill="#64748B" fontSize="10" fontWeight="bold">GND</text>
        </svg>
      );

    case "ic_opamp":
      return (
        <svg viewBox="0 0 160 100" className={className} fill="none">
          <line x1="15" y1="35" x2="48" y2="35" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="65" x2="48" y2="65" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="48,15 48,85 118,50" stroke={strokeColor} strokeWidth="4" fill={bodyFill} strokeLinejoin="round" />
          <text x="56" y="41" fill="#94A3B8" fontSize="18" fontWeight="bold">-</text>
          <text x="55" y="71" fill={accentColor} fontSize="18" fontWeight="bold">+</text>
          <line x1="118" y1="50" x2="145" y2="50" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "optocoupler":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          <rect x="26" y="14" width="108" height="76" rx="6" stroke={strokeColor} strokeWidth="3" fill={bodyFill} />
          {/* LED Emissor Interno */}
          <polygon points="42,38 58,38 50,54" fill={strokeColor} />
          <line x1="42" y1="54" x2="58" y2="54" stroke={strokeColor} strokeWidth="3" />
          {/* Setas Ópticas */}
          <line x1="64" y1="42" x2="86" y2="42" stroke={accentColor} strokeWidth="3" />
          <polygon points="90,42 82,38 82,46" fill={accentColor} />
          <line x1="64" y1="54" x2="86" y2="54" stroke={accentColor} strokeWidth="3" />
          <polygon points="90,54 82,50 82,58" fill={accentColor} />
          {/* Fototransistor Receptor */}
          <line x1="102" y1="32" x2="102" y2="64" stroke={strokeColor} strokeWidth="4" />
          <polyline points="102,40 120,26 146,26" stroke={strokeColor} strokeWidth="3.5" />
          <polyline points="102,56 120,70 146,70" stroke={strokeColor} strokeWidth="3.5" />
          <line x1="12" y1="26" x2="50" y2="26" stroke={strokeColor} strokeWidth="3.5" />
          <line x1="12" y1="70" x2="50" y2="70" stroke={strokeColor} strokeWidth="3.5" />
        </svg>
      );

    case "crystal":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="15" y1="48" x2="54" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="54" y1="22" x2="54" y2="74" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          <rect x="66" y="16" width="28" height="64" rx="2" stroke={accentColor} strokeWidth="3.5" fill={bodyFill} />
          <line x1="106" y1="22" x2="106" y2="74" stroke={strokeColor} strokeWidth="4.5" strokeLinecap="round" />
          <line x1="106" y1="48" x2="145" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "display_7seg":
      return (
        <svg viewBox="0 0 160 105" className={className} fill="none">
          <rect x="44" y="10" width="72" height="85" rx="5" stroke={strokeColor} strokeWidth="3.5" fill={bodyFill} />
          {/* 7 Segmentos formados em '8' */}
          <line x1="64" y1="24" x2="92" y2="24" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="95" y1="28" x2="95" y2="48" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="95" y1="56" x2="95" y2="76" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="64" y1="80" x2="92" y2="80" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="61" y1="56" x2="61" y2="76" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="61" y1="28" x2="61" y2="48" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <line x1="64" y1="52" x2="92" y2="52" stroke={accentColor} strokeWidth="5" strokeLinecap="round" />
          <circle cx="105" cy="82" r="3" fill={strokeColor} />
        </svg>
      );

    case "gate_and":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="15" y1="32" x2="48" y2="32" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="64" x2="48" y2="64" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <path
            d="M 48 16 L 82 16 A 32 32 0 0 1 82 80 L 48 80 Z"
            stroke={strokeColor}
            strokeWidth="4"
            fill={bodyFill}
            strokeLinejoin="round"
          />
          <text x="62" y="54" fill={accentColor} fontSize="16" fontWeight="bold">&amp;</text>
          <line x1="114" y1="48" x2="145" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "gate_or":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="15" y1="32" x2="52" y2="32" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="64" x2="52" y2="64" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <path
            d="M 42 16 Q 60 48 42 80 Q 88 80 116 48 Q 88 16 42 16 Z"
            stroke={strokeColor}
            strokeWidth="4"
            fill={bodyFill}
            strokeLinejoin="round"
          />
          <text x="62" y="53" fill={accentColor} fontSize="13" fontWeight="bold">≥1</text>
          <line x1="116" y1="48" x2="145" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "gate_not":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="15" y1="48" x2="48" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <polygon points="48,18 48,78 104,48" stroke={strokeColor} strokeWidth="4" fill={bodyFill} strokeLinejoin="round" />
          <circle cx="112" cy="48" r="7" stroke={accentColor} strokeWidth="4" fill={bodyFill} />
          <line x1="120" y1="48" x2="145" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "gate_nand":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="15" y1="32" x2="44" y2="32" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="15" y1="64" x2="44" y2="64" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <path
            d="M 44 16 L 76 16 A 32 32 0 0 1 76 80 L 44 80 Z"
            stroke={strokeColor}
            strokeWidth="4"
            fill={bodyFill}
            strokeLinejoin="round"
          />
          <circle cx="116" cy="48" r="7" stroke={accentColor} strokeWidth="4" fill={bodyFill} />
          <line x1="124" y1="48" x2="146" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case "gate_xor":
      return (
        <svg viewBox="0 0 160 95" className={className} fill="none">
          <line x1="14" y1="32" x2="44" y2="32" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="14" y1="64" x2="44" y2="64" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
          <path d="M 36 16 Q 54 48 36 80" stroke={accentColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path
            d="M 48 16 Q 66 48 48 80 Q 92 80 118 48 Q 92 16 48 16 Z"
            stroke={strokeColor}
            strokeWidth="4"
            fill={bodyFill}
            strokeLinejoin="round"
          />
          <text x="66" y="53" fill={accentColor} fontSize="13" fontWeight="bold">=1</text>
          <line x1="118" y1="48" x2="146" y2="48" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
};
