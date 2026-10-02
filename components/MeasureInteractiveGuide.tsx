"use client";

import { useState } from "react";
import { FitDiagram } from "@/components/FitDiagram";
import { MEASUREMENT_FIELDS } from "@/types";

const GUIDE: Record<string, { where: string; how: string; proTip: string; image: string }> = {
  neck: {
    where: "Around the collar band",
    how: "Measure around the base of the neck where your dress shirt collar sits, keeping one finger of ease inside the tape.",
    proTip: "A standard collar should allow you to slide two fingers comfortably between your neck and the buttoned band.",
    image: "/products/fit-neck-collar.jpg",
  },
  chest: {
    where: "Across the fullest chest width",
    how: "Measure around the fullest part of the chest, keeping the tape level under the armpits with arms relaxed at your sides.",
    proTip: "Do not puff your chest out or hold your breath — stand naturally for an authoritative bespoke drape.",
    image: "/products/fit-chest-measure.jpg",
  },
  waist: {
    where: "Natural waistline above trousers",
    how: "Measure around your natural waistline just above the hip bone and below your navel, without pulling the tape tight.",
    proTip: "This determines the jacket's waist suppression and trouser waistband fit without binding.",
    image: "/products/fit-waist-measure.jpg",
  },
  jacket_length: {
    where: "Collar seam to jacket hem",
    how: "From the base of the back collar seam, straight down over the shoulder blade to your desired jacket bottom hem.",
    proTip: "A classic suit jacket hem should bisect your thumb knuckle or fully cover the seat of your trousers.",
    image: "/products/fit-jacket-length.jpg",
  },
  sleeve_length: {
    where: "Shoulder crown to wrist cuff bone",
    how: "With your arm hanging naturally at your side, measure from the outer shoulder seam crown down to the wrist bone.",
    proTip: "Cut to expose roughly 1/4\" to 1/2\" of crisp shirt cuff beneath the tailored jacket sleeve.",
    image: "/products/fit-sleeve-length.jpg",
  },
  trouser_length: {
    where: "Waistband outseam to shoe break",
    how: "From the top of your trouser waistband along the outer seam down to the top of the dress shoe you will wear.",
    proTip: "We recommend a slight or medium break for a clean, dignified modern pastoral or corporate silhouette.",
    image: "/products/fit-guide-black-model.jpg",
  },
};

export function MeasureInteractiveGuide() {
  const [activeKey, setActiveKey] = useState<string>("neck");

  return (
    <div className="mt-14 grid gap-12 lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-16">
      {/* Sticky Interactive Model Diagram */}
      <div className="flex flex-col items-center">
        <div className="sticky top-28 w-full max-w-[380px]">
          <FitDiagram
            className="w-full"
            activeKey={activeKey}
            onSelectKey={(key) => setActiveKey(key)}
          />
          <p className="mt-3 text-center text-xs text-brand-soft">
            Interactive guide: tap any numbered indicator on the model to view that exact measurement.
          </p>
        </div>
      </div>

      {/* Synchronized Measurement Steps */}
      <ol className="grid gap-px overflow-hidden border border-line bg-line sm:grid-cols-2">
        {MEASUREMENT_FIELDS.map((field, index) => {
          const entry = GUIDE[field.key];
          const number = String(index + 1).padStart(2, "0");
          const isSelected = activeKey === field.key;

          return (
            <li
              key={field.key}
              onClick={() => setActiveKey(field.key)}
              className={`cursor-pointer bg-white transition-all duration-300 ${
                isSelected
                  ? "ring-2 ring-inset ring-brand bg-paper/60"
                  : "hover:bg-mist/30"
              }`}
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-mist">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.image}
                  alt={`${field.label} measurement demonstration`}
                  className={`h-full w-full object-cover transition-transform duration-700 ${
                    isSelected ? "scale-105" : "hover:scale-102"
                  }`}
                  loading="lazy"
                />
                <span className="absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-brand-deeper text-[0.65rem] font-bold text-taupe-light shadow-md">
                  {number}
                </span>
                {isSelected ? (
                  <span className="absolute right-3 top-3 border border-brand bg-brand px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-white">
                    Inspecting
                  </span>
                ) : null}
              </div>

              <div className="p-6">
                <div className="flex items-center justify-between">
                  <p className="font-display text-lg text-ink">{field.label}</p>
                  <span className="text-[0.6rem] uppercase tracking-brand text-brand-soft">
                    {entry.where}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand-light">{entry.how}</p>
                <div className="mt-4 border-l-2 border-taupe bg-mist/50 p-2.5 text-xs text-brand-dark">
                  <span className="font-semibold text-brand">Tailor's Rule: </span>
                  {entry.proTip}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
