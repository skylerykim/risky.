"use client";

// Visual preview of the real UI with mock data, so the look and the photo
// editor can be seen without signing in. Not part of the live app flow.

import dynamic from "next/dynamic";
import { useState } from "react";
import { Wordmark } from "@/components/Wordmark";
import { Sheet } from "@/components/Sheet";
import { DistanceBar } from "@/components/DistanceBar";
import { MemoryDetail } from "@/components/MemoryDetail";
import { Adventure, DEFAULT_FILTERS } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const img = (s: string) => `https://picsum.photos/seed/${s}/900/700`;

const ADVENTURES: Adventure[] = [
  {
    id: "a1",
    author: "me",
    title: "Sunset at the overlook",
    note: "Drove up after class, caught the whole sky turning pink.",
    lat: 38.0336,
    lng: -78.508,
    happened_on: null,
    created_at: new Date().toISOString(),
    photos: [
      { id: "p1", adventure_id: "a1", storage_path: "", filters: { ...DEFAULT_FILTERS, warmth: 0.3, saturate: 1.3, brightness: 1.05 }, sort: 0, signedUrl: img("sunset1") },
      { id: "p2", adventure_id: "a1", storage_path: "", filters: { ...DEFAULT_FILTERS }, sort: 1, signedUrl: img("sunset2") },
      { id: "p3", adventure_id: "a1", storage_path: "", filters: { ...DEFAULT_FILTERS, contrast: 1.2 }, sort: 2, signedUrl: img("sunset3") },
    ],
  },
  {
    id: "a2",
    author: "her",
    title: "Coffee downtown",
    note: null,
    lat: 38.0293,
    lng: -78.4767,
    happened_on: null,
    created_at: new Date().toISOString(),
    photos: [
      { id: "p4", adventure_id: "a2", storage_path: "", filters: { ...DEFAULT_FILTERS }, sort: 0, signedUrl: img("coffee") },
    ],
  },
  {
    id: "a3",
    author: "me",
    title: "Hike day",
    note: "10 miles, worth every step.",
    lat: 38.045,
    lng: -78.49,
    happened_on: null,
    created_at: new Date().toISOString(),
    photos: [
      { id: "p5", adventure_id: "a3", storage_path: "", filters: { ...DEFAULT_FILTERS, saturate: 1.4 }, sort: 0, signedUrl: img("trail1") },
      { id: "p6", adventure_id: "a3", storage_path: "", filters: { ...DEFAULT_FILTERS }, sort: 1, signedUrl: img("trail2") },
    ],
  },
];

const me = { lat: 38.0293, lng: -78.4767 };
const partner = { lat: 38.0336, lng: -78.5081 };

export default function Preview() {
  const [selected, setSelected] = useState<Adventure | null>(ADVENTURES[0]);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const firstThumb: Record<string, string> = {};
  ADVENTURES.forEach((a) => {
    if (a.photos?.[0]?.signedUrl) firstThumb[a.id] = a.photos[0].signedUrl!;
  });

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      <div className="absolute inset-0">
        <MapView
          adventures={ADVENTURES}
          onSelect={(a) => {
            setSelected(a);
            setRecenterTrigger((t) => t + 1);
          }}
          pickMode={false}
          pickPoint={null}
          onPick={() => {}}
          me={me}
          partner={partner}
          recenterTo={selected ? [selected.lat, selected.lng] : null}
          recenterTrigger={recenterTrigger}
          firstThumb={firstThumb}
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between p-4">
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="text-3xl">
            <Wordmark />
          </div>
          <DistanceBar
            me={me}
            partner={partner}
            partnerName="Skyler"
            partnerSeen={new Date(Date.now() - 120000).toISOString()}
          />
        </div>
        <span className="pointer-events-auto rounded-full border border-white/10 bg-ink2/80 px-3 py-1.5 text-xs text-white/50 backdrop-blur">
          preview
        </span>
      </div>

      <div className="absolute bottom-6 right-5 z-[500] flex flex-col items-end gap-3">
        <button className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-ink2/85 text-lg backdrop-blur">
          🧭
        </button>
        <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-risk to-sky px-5 py-3 font-semibold text-ink shadow-glow">
          <span className="text-lg leading-none">+</span> New memory
        </button>
      </div>

      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
      >
        {selected && (
          <MemoryDetail
            adventure={selected}
            authorName={selected.author === "me" ? "Clark" : "Skyler"}
            onSavePhoto={() => {}}
            onDelete={() => setSelected(null)}
          />
        )}
      </Sheet>
    </main>
  );
}
