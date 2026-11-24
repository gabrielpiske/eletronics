"use client";

import React, { useState, useRef } from "react";
import {
  RepairHotspot,
  RepairVisualComponentType,
  RepairDefectVisualType,
} from "@/data/industrialChallengesData";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  Eye,
  Move,
} from "lucide-react";

interface IndustrialBoardViewportProps {
  boardAssetPath: string;
  boardTitle: string;
  mountingType: "PTH" | "SMD";
  hotspots: RepairHotspot[];
  selectedHotspotId: string | null;
  inspectedIds: string[];
  repaired: boolean;
  disabled?: boolean;
  onSelectHotspot: (hotspot: RepairHotspot) => void;
}

/**
 * Renderiza o componente eletrônico vetorial (nítido sob qualquer zoom) com variante visual
 * fiel ao estado defeituoso ou corrigido (solda trincada, ponte de solda, polaridade invertida ou SMD deslocado).
 */
export const BoardComponentGraphic: React.FC<{
  visualType: RepairVisualComponentType;
  defectVisual: RepairDefectVisualType;
  repaired: boolean;
  designator: string;
}> = ({ visualType, defectVisual, repaired, designator }) => {
  const activeDefect: RepairDefectVisualType = repaired ? "none" : defectVisual;

  return (
    <g>
      {/* Etiqueta de serigrafia nítida */}
      <rect
        x="-26"
        y="-46"
        width="52"
        height="16"
        rx="3"
        fill="#0B0F17"
        fillOpacity="0.92"
        stroke="#475569"
        strokeWidth="1"
      />
      <text
        x="0"
        y="-34"
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize="10"
        fontWeight="700"
        fontFamily="monospace"
      >
        {designator}
      </text>

      {/* CONECTOR PTH 3 VIAS */}
      {visualType === "connector_pth" && (
        <g>
          <rect
            x="-36"
            y="-22"
            width="72"
            height="44"
            rx="4"
            fill="#1E293B"
            stroke="#94A3B8"
            strokeWidth="1.5"
          />
          {[-20, 0, 20].map((px, idx) => {
            const isCrackedPin = activeDefect === "cracked_solder" && idx === 1;
            return (
              <g key={px} transform={`translate(${px}, 0)`}>
                {/* Ilha de solda */}
                <circle
                  r="10"
                  fill={isCrackedPin ? "#94A3B8" : "#CBD5E1"}
                  stroke={isCrackedPin ? "#475569" : "#64748B"}
                  strokeWidth="1.5"
                />
                {/* Trinca circunferencial escura visível sob lupa */}
                {isCrackedPin && (
                  <>
                    <circle
                      r="7"
                      fill="none"
                      stroke="#090D14"
                      strokeWidth="2.4"
                      strokeDasharray="6 2 4 1.5"
                    />
                    <path
                      d="M -6 -4 L -3 -1 M 4 3 L 7 6"
                      stroke="#EF4444"
                      strokeWidth="1.2"
                      strokeOpacity="0.7"
                    />
                  </>
                )}
                {/* Pino central */}
                <circle r="3.8" fill="#E2E8F0" stroke="#334155" strokeWidth="1" />
                <text
                  y="19"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  P{idx + 1}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {/* RESISTOR AXIAL PTH */}
      {visualType === "resistor_pth" && (
        <g>
          <circle cx="-34" cy="0" r="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          <circle cx="34" cy="0" r="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
          <line x1="-32" y1="0" x2="32" y2="0" stroke="#94A3B8" strokeWidth="3" />
          <rect x="-20" y="-9" width="40" height="18" rx="6" fill="#E5C07B" stroke="#92400E" strokeWidth="1.4" />
          <rect x="-12" y="-9" width="4" height="18" fill="#DC2626" />
          <rect x="-4" y="-9" width="4" height="18" fill="#DC2626" />
          <rect x="4" y="-9" width="4" height="18" fill="#DC2626" />
          <rect x="12" y="-9" width="3" height="18" fill="#EAB308" />
        </g>
      )}

      {/* CAPACITOR ELETROLÍTICO PTH */}
      {visualType === "cap_pth" && (
        <g>
          <circle r="21" fill="#1E3A8A" stroke="#93C5FD" strokeWidth="1.5" />
          <circle r="15" fill="#CBD5E1" stroke="#64748B" strokeWidth="1.2" />
          <path d="M -8 -8 L 8 8 M 8 -8 L -8 8" stroke="#64748B" strokeWidth="1.2" />
          <path d="M 12 -14 A 18 18 0 0 1 12 14" fill="none" stroke="#E2E8F0" strokeWidth="3" />
          <text x="-13" y="4" fill="#FDE047" fontSize="11" fontWeight="bold" fontFamily="monospace">
            +
          </text>
        </g>
      )}

      {/* DIODO AXIAL PTH (suporta defeito de polaridade invertida) */}
      {visualType === "diode_pth" && (
        <g>
          {/* Marcação fixa de serigrafia na PCI: barra de cátodo à DIREITA */}
          <rect
            x="-26"
            y="-16"
            width="52"
            height="32"
            rx="3"
            fill="none"
            stroke="#E2E8F0"
            strokeOpacity="0.7"
            strokeWidth="1.3"
            strokeDasharray="3 2"
          />
          <line x1="20" y1="-16" x2="20" y2="16" stroke="#F8FAFC" strokeWidth="3" />
          <text x="20" y="25" textAnchor="middle" fill="#E2E8F0" fontSize="8" fontFamily="monospace">
            K (PCI)
          </text>
          {/* Terminais e pads */}
          <circle cx="-36" cy="0" r="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1.4" />
          <circle cx="36" cy="0" r="6" fill="#CBD5E1" stroke="#475569" strokeWidth="1.4" />
          <line x1="-34" y1="0" x2="34" y2="0" stroke="#94A3B8" strokeWidth="3" />
          {/* Corpo do diodo 1N4007 */}
          <rect x="-18" y="-9" width="36" height="18" rx="4" fill="#18181B" stroke="#52525B" strokeWidth="1.4" />
          {/* Faixa prateada do cátodo: à ESQUERDA se invertido, à DIREITA se correto */}
          <rect
            x={activeDefect === "reversed_polarity" ? -14 : 9}
            y="-9"
            width="5"
            height="18"
            fill="#E2E8F0"
          />
        </g>
      )}

      {/* PORTA-FUSÍVEL PTH */}
      {visualType === "fuse_pth" && (
        <g>
          <rect x="-32" y="-11" width="64" height="22" rx="4" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
          <rect x="-26" y="-7" width="10" height="14" rx="1" fill="#CBD5E1" />
          <rect x="16" y="-7" width="10" height="14" rx="1" fill="#CBD5E1" />
          <rect x="-16" y="-6" width="32" height="12" fill="#38BDF8" fillOpacity="0.22" stroke="#7DD3FC" strokeWidth="1" />
          <line x1="-16" y1="0" x2="16" y2="0" stroke="#E2E8F0" strokeWidth="1.3" />
        </g>
      )}

      {/* OPTOACOPLADOR SMD SOIC-4 (suporta defeito de ponte de solda entre pinos 3 e 4) */}
      {visualType === "opto_smd" && (
        <g>
          {/* Pads esquerdos (P1, P2) e direitos (P3, P4) */}
          <rect x="-34" y="-15" width="13" height="8" rx="1.5" fill="#CBD5E1" />
          <rect x="-34" y="7" width="13" height="8" rx="1.5" fill="#CBD5E1" />
          <rect x="21" y="-15" width="13" height="8" rx="1.5" fill="#CBD5E1" />
          <rect x="21" y="7" width="13" height="8" rx="1.5" fill="#CBD5E1" />

          {/* Ponte de solda metálica unindo pinos 3 e 4 quando defeituoso */}
          {activeDefect === "solder_bridge" && (
            <path
              d="M 22 -12 C 33 -8, 34 8, 22 12 L 33 13 C 38 4, 38 -4, 33 -13 Z"
              fill="#E2E8F0"
              stroke="#94A3B8"
              strokeWidth="1.2"
            />
          )}

          {/* Corpo SMD SOIC-4 */}
          <rect x="-22" y="-20" width="44" height="40" rx="3" fill="#18181B" stroke="#52525B" strokeWidth="1.5" />
          <circle cx="-13" cy="-11" r="2.8" fill="#94A3B8" />
          <text x="-38" y="-9" textAnchor="end" fill="#94A3B8" fontSize="8" fontFamily="monospace">1</text>
          <text x="-38" y="13" textAnchor="end" fill="#94A3B8" fontSize="8" fontFamily="monospace">2</text>
          <text x="38" y="13" textAnchor="start" fill="#94A3B8" fontSize="8" fontFamily="monospace">3</text>
          <text x="38" y="-9" textAnchor="start" fill="#94A3B8" fontSize="8" fontFamily="monospace">4</text>
        </g>
      )}

      {/* RESISTOR SMD 0805 (suporta defeito de deslocamento fora do pad) */}
      {visualType === "resistor_smd" && (
        <g>
          {/* Pads fixos na PCI */}
          <rect x="-24" y="-9" width="12" height="18" rx="1.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
          <rect x="12" y="-9" width="12" height="18" rx="1.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
          {/* Corpo SMD 0805 — rotacionado e deslocado se defeituoso */}
          <g
            transform={
              activeDefect === "misaligned_smd"
                ? "translate(-7, -8) rotate(-26)"
                : "translate(0, 0)"
            }
          >
            <rect x="-18" y="-7.5" width="36" height="15" rx="1.5" fill="#111827" stroke="#475569" strokeWidth="1.2" />
            <rect x="-18" y="-7.5" width="7" height="15" fill="#E2E8F0" />
            <rect x="11" y="-7.5" width="7" height="15" fill="#E2E8F0" />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#F8FAFC"
              fontSize="8.5"
              fontWeight="bold"
              fontFamily="monospace"
            >
              103
            </text>
          </g>
        </g>
      )}

      {/* LED SMD 0805 */}
      {visualType === "led_smd" && (
        <g>
          <rect x="-22" y="-8" width="10" height="16" rx="1" fill="#CBD5E1" />
          <rect x="12" y="-8" width="10" height="16" rx="1" fill="#CBD5E1" />
          <rect x="-14" y="-7" width="28" height="14" rx="2" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.2" />
          <rect x="-5" y="-5" width="10" height="10" rx="2" fill="#F59E0B" />
          <line x1="8" y1="-6" x2="8" y2="6" stroke="#16A34A" strokeWidth="2.5" />
        </g>
      )}

      {/* SUPRESSOR TVS SMD (SMA) */}
      {visualType === "tvs_smd" && (
        <g>
          <rect x="-28" y="-9" width="11" height="18" rx="1.5" fill="#CBD5E1" />
          <rect x="17" y="-9" width="11" height="18" rx="1.5" fill="#CBD5E1" />
          <rect x="-20" y="-11" width="40" height="22" rx="2.5" fill="#18181B" stroke="#52525B" strokeWidth="1.4" />
          <rect x="10" y="-11" width="4" height="22" fill="#CBD5E1" />
        </g>
      )}

      {/* CI SMD SOIC-8 */}
      {visualType === "ic_smd" && (
        <g>
          {[-18, -6, 6, 18].map((py) => (
            <React.Fragment key={py}>
              <rect x="-32" y={py - 2.5} width="12" height="5" rx="1" fill="#CBD5E1" />
              <rect x="20" y={py - 2.5} width="12" height="5" rx="1" fill="#CBD5E1" />
            </React.Fragment>
          ))}
          <rect x="-21" y="-26" width="42" height="52" rx="3" fill="#18181B" stroke="#52525B" strokeWidth="1.5" />
          <circle cx="-12" cy="-17" r="2.8" fill="#94A3B8" />
        </g>
      )}

      {/* CAPACITOR CERÂMICO SMD 0805 */}
      {visualType === "cap_smd" && (
        <g>
          <rect x="-21" y="-8" width="9" height="16" rx="1" fill="#CBD5E1" />
          <rect x="12" y="-8" width="9" height="16" rx="1" fill="#CBD5E1" />
          <rect x="-14" y="-7" width="28" height="14" rx="1.5" fill="#B45309" stroke="#F59E0B" strokeWidth="1" />
          <rect x="-14" y="-7" width="5" height="14" fill="#E2E8F0" />
          <rect x="9" y="-7" width="5" height="14" fill="#E2E8F0" />
        </g>
      )}
    </g>
  );
};

export const IndustrialBoardViewport: React.FC<IndustrialBoardViewportProps> = ({
  boardAssetPath,
  boardTitle,
  mountingType,
  hotspots,
  selectedHotspotId,
  inspectedIds,
  repaired,
  disabled = false,
  onSelectHotspot,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [loupeEnabled, setLoupeEnabled] = useState<boolean>(false);
  const [loupePos, setLoupePos] = useState<{ xPct: number; yPct: number } | null>(
    null
  );
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  const clampPan = (nx: number, ny: number, targetZoom: number) => {
    const maxOffset = Math.max(0, (targetZoom - 1) * 190);
    return {
      x: Math.max(-maxOffset, Math.min(maxOffset, nx)),
      y: Math.max(-maxOffset * 0.7, Math.min(maxOffset * 0.7, ny)),
    };
  };

  const handleZoomChange = (nextZoom: number) => {
    const clamped = Math.max(1, Math.min(2.5, nextZoom));
    setZoom(clamped);
    if (clamped === 1) {
      setPan({ x: 0, y: 0 });
    } else {
      setPan((prev) => clampPan(prev.x, prev.y, clamped));
    }
  };

  const handleFocusHotspot = (hs: RepairHotspot) => {
    const nextZoom = zoom < 1.75 ? 1.75 : zoom;
    setZoom(nextZoom);
    const targetPanX = ((50 - hs.x) / 50) * ((nextZoom - 1) * 170);
    const targetPanY = ((50 - hs.y) / 50) * ((nextZoom - 1) * 115);
    setPan(clampPan(targetPanX, targetPanY, nextZoom));
    setLoupePos({ xPct: hs.x, yPct: hs.y });
    onSelectHotspot(hs);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (loupeEnabled && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
      setLoupePos({ xPct, yPct });
    }
    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      setPan(
        clampPan(
          dragStartRef.current.panX + dx,
          dragStartRef.current.panY + dy,
          zoom
        )
      );
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const activeHotspot =
    hotspots.find((h) => h.id === selectedHotspotId) || null;

  return (
    <div className="bg-[#181B20] border border-[#2A303C] rounded-lg overflow-hidden">
      {/* Barra de controles ópticos da bancada */}
      <div className="bg-[#13161A] border-b border-[#242933] px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-zinc-100 font-extrabold">
            {boardTitle}
          </span>
          <span className="px-2.5 py-0.5 rounded bg-[#0C0E12] border border-sky-500/40 text-xs font-mono text-sky-300 font-black">
            {mountingType}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => handleZoomChange(zoom - 0.75)}
            disabled={zoom <= 1}
            aria-label="Diminuir zoom da placa"
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1E2229] disabled:opacity-40 border border-[#2A303C] text-zinc-100 text-xs sm:text-sm font-mono flex items-center gap-1"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="px-3 py-1.5 rounded-lg bg-[#0C0E12] border border-[#242933] text-xs sm:text-sm font-mono text-amber-400 font-black">
            {zoom.toFixed(2).replace(".00", "")}x
          </span>
          <button
            type="button"
            onClick={() => handleZoomChange(zoom + 0.75)}
            disabled={zoom >= 2.5}
            aria-label="Aumentar zoom da placa"
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1E2229] disabled:opacity-40 border border-[#2A303C] text-zinc-100 text-xs sm:text-sm font-mono flex items-center gap-1"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setLoupeEnabled((v) => !v);
              if (!loupeEnabled && zoom < 1.75) {
                handleZoomChange(1.75);
              }
            }}
            className={`px-3 py-1.5 rounded-lg border text-xs sm:text-sm font-mono font-extrabold flex items-center gap-1.5 transition-colors ${
              loupeEnabled
                ? "bg-amber-500 text-zinc-950 border-amber-400"
                : "bg-[#0C0E12] text-zinc-200 border-[#2A303C] hover:border-zinc-500"
            }`}
          >
            <Search className="w-4 h-4" />
            Lupa
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
              setLoupeEnabled(false);
            }}
            aria-label="Resetar enquadramento"
            className="px-2.5 py-1.5 rounded-lg bg-[#0C0E12] hover:bg-[#1E2229] border border-[#2A303C] text-zinc-300 hover:text-white text-xs sm:text-sm"
            title="Resetar zoom e posição"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Área visual principal: Bancada ESD + PCI fotográfica + Overlay SVG nítido */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        style={{
          backgroundImage: `url('/images/industrial/workbench-esd.jpg')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        className={`relative w-full aspect-[16/9] min-h-[260px] max-h-[390px] overflow-hidden border-b border-[#242933] p-3 sm:p-4 flex items-center justify-center ${
          zoom > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : ""
        }`}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 180ms ease-out",
          }}
          className="relative w-full h-full rounded-md overflow-hidden border-2 border-[#334155] shadow-2xl"
        >
          {/* Fundo fotográfico real do substrato PCI */}
          <img
            src={boardAssetPath}
            alt={boardTitle}
            draggable={false}
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Camada SVG nítida: trilhas de interconexão + componentes PTH/SMD + defeitos */}
          <svg
            viewBox="0 0 800 450"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {/* Trilhas sutis ligando os nós para coerência esquemática */}
            <g stroke="#34D399" strokeOpacity="0.28" strokeWidth="3" fill="none">
              <path d="M 120 234 L 416 153 L 592 198" />
              <path d="M 192 234 L 432 324 L 592 198" />
              <path d="M 160 170 L 336 216 L 560 153" />
              <path d="M 336 216 L 560 306" />
            </g>

            {hotspots.map((hs) => {
              const cx = (hs.x / 100) * 800;
              const cy = (hs.y / 100) * 450;
              const isSelected = selectedHotspotId === hs.id;
              return (
                <g key={hs.id} transform={`translate(${cx}, ${cy})`}>
                  {isSelected && (
                    <circle
                      r="52"
                      fill="#F59E0B"
                      fillOpacity="0.1"
                      stroke="#F59E0B"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                    />
                  )}
                  <BoardComponentGraphic
                    visualType={hs.visualType}
                    defectVisual={hs.defectVisual}
                    repaired={repaired}
                    designator={hs.designator}
                  />
                </g>
              );
            })}
          </svg>

          {/* Hotspots discretos acessíveis por clique e teclado */}
          {hotspots.map((hs) => {
            const isSelected = selectedHotspotId === hs.id;
            const isInspected = inspectedIds.includes(hs.id);
            return (
              <button
                key={hs.id}
                type="button"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFocusHotspot(hs);
                }}
                style={{ left: `${hs.x}%`, top: `${hs.y}%` }}
                aria-label={`Inspecionar componente ${hs.designator} (${hs.componentName})`}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-16 h-14 sm:w-20 sm:h-16 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isSelected
                    ? "border-amber-400 bg-amber-400/15 shadow-[0_0_0_2px_rgba(245,158,11,0.35)]"
                    : isInspected
                    ? "border-sky-400/60 bg-sky-400/5 hover:border-amber-300"
                    : "border-white/20 bg-black/5 hover:border-amber-400/80 hover:bg-amber-400/10"
                }`}
              >
                <span className="sr-only">
                  {hs.designator} — {hs.componentName}
                </span>
              </button>
            );
          })}
        </div>

        {/* Anel visual de lupa óptica ativa */}
        {loupeEnabled && loupePos && (
          <div
            style={{
              left: `${loupePos.xPct}%`,
              top: `${loupePos.yPct}%`,
            }}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full border-2 border-amber-400/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.22)] flex items-end justify-center pb-1.5"
          >
            <span className="px-1.5 py-0.5 rounded bg-black/80 font-mono text-[9px] text-amber-300">
              LUPA ÓPTICA
            </span>
          </div>
        )}

        {zoom > 1 && (
          <div className="pointer-events-none absolute bottom-2 right-2 px-2 py-1 rounded bg-black/75 border border-[#2A303C] text-[10px] font-mono text-zinc-300 flex items-center gap-1">
            <Move className="w-3 h-3 text-amber-400" /> Arraste para mover
          </div>
        )}
      </div>

      {/* Barra acessível de seleção rápida de pontos + nota óptica da lupa */}
      <div className="p-4 bg-[#121519] space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs sm:text-sm font-mono uppercase tracking-wider text-zinc-300 font-bold flex items-center gap-2">
            <Eye className="w-4 h-4 text-amber-400" />
            Pontos de Inspeção na Placa:
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {hotspots.map((hs) => {
              const isSelected = selectedHotspotId === hs.id;
              const isInspected = inspectedIds.includes(hs.id);
              return (
                <button
                  key={hs.id}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleFocusHotspot(hs)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-mono font-black border transition-colors ${
                    isSelected
                      ? "bg-amber-500 text-zinc-950 border-amber-400 shadow"
                      : isInspected
                      ? "bg-[#162233] text-sky-200 border-sky-500/50 hover:border-amber-400"
                      : "bg-[#0C0E12] text-zinc-200 border-[#2A303C] hover:border-zinc-500"
                  }`}
                >
                  [{hs.designator}]
                </button>
              );
            })}
          </div>
        </div>

        {activeHotspot ? (
          <div className="rounded-lg lcd-readout border-l-4 border-l-amber-400 px-4 py-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-sm sm:text-base font-extrabold text-white">
                [{activeHotspot.designator}] {activeHotspot.componentName}
              </span>
              <span className="text-xs font-mono uppercase font-bold text-amber-400">
                🔍 VISOR DA LUPA
              </span>
            </div>
            <p className="text-sm sm:text-base font-medium text-zinc-100 mt-1 leading-snug">
              {repaired && activeHotspot.isDefective
                ? "Junta/componente corrigido e validado sob lupa óptica: alinhamento e soldagem conformes."
                : activeHotspot.inspectionNote}
            </p>
          </div>
        ) : (
          <p className="text-xs sm:text-sm font-mono text-zinc-400 px-1">
            Toque em um componente na placa ou nos botões acima para dar zoom com a lupa.
          </p>
        )}
      </div>
    </div>
  );
};
