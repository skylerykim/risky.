"use client";

import { useState } from "react";
import {
  DEFAULT_FILTERS,
  PhotoFilters,
  filtersToCss,
} from "@/lib/types";

type Adj = {
  key: keyof PhotoFilters;
  label: string;
  min: number;
  max: number;
  step: number;
};

const ADJUSTMENTS: Adj[] = [
  { key: "brightness", label: "Brightness", min: 0.3, max: 1.8, step: 0.01 },
  { key: "contrast", label: "Contrast", min: 0.3, max: 1.8, step: 0.01 },
  { key: "saturate", label: "Saturation", min: 0, max: 2.5, step: 0.01 },
  { key: "warmth", label: "Warmth", min: 0, max: 1, step: 0.01 },
  { key: "grayscale", label: "Black & white", min: 0, max: 1, step: 0.01 },
  { key: "blur", label: "Blur", min: 0, max: 6, step: 0.1 },
];

const PRESETS: { name: string; f: Partial<PhotoFilters> }[] = [
  { name: "Original", f: { ...DEFAULT_FILTERS } },
  { name: "Vivid", f: { saturate: 1.5, contrast: 1.15, brightness: 1.05 } },
  { name: "Golden", f: { warmth: 0.35, saturate: 1.2, brightness: 1.08 } },
  { name: "Moody", f: { contrast: 1.3, saturate: 0.85, brightness: 0.92 } },
  { name: "B&W", f: { grayscale: 1, contrast: 1.15 } },
  { name: "Dream", f: { brightness: 1.1, saturate: 1.2, blur: 0.6 } },
];

export function PhotoEditor({
  src,
  initial,
  onCancel,
  onSave,
}: {
  src: string;
  initial?: PhotoFilters | null;
  onCancel: () => void;
  onSave: (f: PhotoFilters) => void;
}) {
  const [f, setF] = useState<PhotoFilters>({
    ...DEFAULT_FILTERS,
    ...(initial ?? {}),
  });

  const set = (k: keyof PhotoFilters, v: number) =>
    setF((prev) => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="mb-4 overflow-hidden rounded-2xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="editing"
          style={{ filter: filtersToCss(f) }}
          className="mx-auto max-h-[42vh] w-full object-contain"
        />
      </div>

      <div className="mb-4 flex gap-2 overflow-x-auto no-scrollbar">
        {PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => setF({ ...DEFAULT_FILTERS, ...p.f })}
            className="shrink-0 rounded-full border border-white/10 bg-ink px-3 py-1.5 text-xs text-white/70 hover:border-sky hover:text-white"
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {ADJUSTMENTS.map((a) => (
          <div key={a.key}>
            <div className="mb-1 flex justify-between text-xs text-white/45">
              <span>{a.label}</span>
            </div>
            <input
              type="range"
              min={a.min}
              max={a.max}
              step={a.step}
              value={f[a.key]}
              onChange={(e) => set(a.key, parseFloat(e.target.value))}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/70"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(f)}
          className="flex-1 rounded-xl bg-gradient-to-r from-risk to-sky py-3 text-sm font-semibold text-ink shadow-glow"
        >
          Save edit
        </button>
      </div>
    </div>
  );
}
