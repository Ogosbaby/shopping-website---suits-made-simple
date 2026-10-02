"use client";

import { useState } from "react";

export interface MeasurementHotspot {
  key: string;
  n: string;
  label: string;
  where: string;
  top: string;
  left: string;
  arrowDirection: "left" | "right" | "top" | "bottom";
  lineCoordinates: { x1: number; y1: number; x2: number; y2: number };
}

const HOTSPOTS: MeasurementHotspot[] = [
  {
    key: "neck",
    n: "01",
    label: "Neck / Collar",
    where: "Base of collar & shirt neckband",
    top: "17%",
    left: "50%",
    arrowDirection: "bottom",
    lineCoordinates: { x1: 175, y1: 110, x2: 225, y2: 110 },
  },
  {
    key: "chest",
    n: "02",
    label: "Chest Width",
    where: "Fullest circumference beneath armpits",
    top: "27%",
    left: "50%",
    arrowDirection: "right",
    lineCoordinates: { x1: 115, y1: 185, x2: 285, y2: 185 },
  },
  {
    key: "waist",
    n: "03",
    label: "Waist Suppression",
    where: "Natural waistline above trousers",
    top: "39%",
    left: "50%",
    arrowDirection: "right",
    lineCoordinates: { x1: 125, y1: 265, x2: 275, y2: 265 },
  },
  {
    key: "jacket_length",
    n: "04",
    label: "Jacket Length",
    where: "Collar seam straight down to jacket hem",
    top: "46%",
    left: "68%",
    arrowDirection: "left",
    lineCoordinates: { x1: 280, y1: 120, x2: 280, y2: 345 },
  },
  {
    key: "sleeve_length",
    n: "05",
    label: "Sleeve Length",
    where: "Shoulder seam crown to wrist cuff bone",
    top: "32%",
    left: "24%",
    arrowDirection: "right",
    lineCoordinates: { x1: 105, y1: 130, x2: 80, y2: 300 },
  },
  {
    key: "trouser_length",
    n: "06",
    label: "Trouser Outseam",
    where: "Waistband along outer leg down to shoe top",
    top: "70%",
    left: "67%",
    arrowDirection: "left",
    lineCoordinates: { x1: 270, y1: 345, x2: 270, y2: 595 },
  },
];

interface FitDiagramProps {
  className?: string;
  activeKey?: string | null;
  onSelectKey?: (key: string) => void;
}

export function FitDiagram({ className = "", activeKey, onSelectKey }: FitDiagramProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const currentKey = hoveredKey || activeKey || "neck";
  const activeSpot = HOTSPOTS.find((h) => h.key === currentKey) || HOTSPOTS[0];

  return (
    <div className={`relative overflow-hidden border border-line bg-paper shadow-card ${className}`}>
      {/* High-res photograph of distinguished Black model in tailored suit */}
      <div className="relative aspect-[3/4] w-full select-none overflow-hidden bg-mist">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/products/fit-guide-black-model.jpg"
          alt="Distinguished Black gentleman in a bespoke tailored SMS charcoal suit"
          className="h-full w-full object-cover object-top transition-transform duration-700 hover:scale-[1.01]"
        />

        {/* Subtle vignette overlay to ensure indicator legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-deeper/50 via-transparent to-brand-deeper/20" />

        {/* Dynamic measurement caliper guide lines */}
        <svg
          viewBox="0 0 400 660"
          className="pointer-events-none absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          {HOTSPOTS.map((h) => {
            const isSelected = h.key === currentKey;
            const { x1, y1, x2, y2 } = h.lineCoordinates;
            const isVertical = x1 === x2;

            return (
              <g
                key={h.key}
                className={`transition-opacity duration-300 ${
                  isSelected ? "opacity-100" : "opacity-35"
                }`}
              >
                {/* Measuring caliper line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isSelected ? "#C3BCB1" : "#FAF9F6"}
                  strokeWidth={isSelected ? "2.5" : "1.2"}
                  strokeDasharray={isSelected ? "none" : "3 3"}
                />
                {/* Arrow / End Ticks */}
                {isVertical ? (
                  <>
                    <line x1={x1 - 8} y1={y1} x2={x1 + 8} y2={y1} stroke="#C3BCB1" strokeWidth="2" />
                    <line x1={x2 - 8} y1={y2} x2={x2 + 8} y2={y2} stroke="#C3BCB1" strokeWidth="2" />
                  </>
                ) : (
                  <>
                    <line x1={x1} y1={y1 - 8} x2={x1} y2={y1 + 8} stroke="#C3BCB1" strokeWidth="2" />
                    <line x1={x2} y1={y2 - 8} x2={x2} y2={y2 + 8} stroke="#C3BCB1" strokeWidth="2" />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Interactive Hotspot Pins with Arrows */}
        {HOTSPOTS.map((spot) => {
          const isSelected = spot.key === currentKey;

          return (
            <button
              key={spot.key}
              type="button"
              onClick={() => onSelectKey?.(spot.key)}
              onMouseEnter={() => setHoveredKey(spot.key)}
              onMouseLeave={() => setHoveredKey(null)}
              style={{ top: spot.top, left: spot.left }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none ${
                isSelected ? "z-30 scale-110" : "z-20"
              }`}
              aria-label={`Inspect ${spot.label} measurement point`}
            >
              <span className="relative flex h-8 w-8 items-center justify-center">
                {/* Pulsing ring on active */}
                {isSelected ? (
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-taupe opacity-75" />
                ) : null}
                <span
                  className={`relative flex h-7 w-7 items-center justify-center rounded-full border text-[0.65rem] font-bold shadow-md transition-colors ${
                    isSelected
                      ? "border-taupe-light bg-brand-deeper text-taupe-light ring-2 ring-taupe"
                      : "border-line/80 bg-white/95 text-ink hover:bg-brand hover:text-white"
                  }`}
                >
                  {spot.n}
                </span>
              </span>
            </button>
          );
        })}

        {/* Floating Active Guide Badge at bottom of model */}
        <div className="absolute inset-x-3 bottom-3 border border-line/60 bg-brand-deeper/90 p-3.5 text-white shadow-lift backdrop-blur sm:inset-x-4 sm:bottom-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-taupe text-[0.6rem] font-bold text-brand-deeper">
                {activeSpot.n}
              </span>
              <p className="font-display text-sm tracking-wide text-white">{activeSpot.label}</p>
            </div>
            <span className="text-[0.6rem] uppercase tracking-brand text-taupe-light">
              Tap pin to inspect
            </span>
          </div>
          <p className="mt-1 text-xs text-mist/80">{activeSpot.where}</p>
        </div>
      </div>
    </div>
  );
}
