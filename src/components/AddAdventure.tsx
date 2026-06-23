"use client";

import { useRef, useState } from "react";
import { DEFAULT_FILTERS, PhotoFilters, filtersToCss } from "@/lib/types";
import { PhotoEditor } from "@/components/PhotoEditor";
import type { LatLng } from "@/components/MapView";

export type DraftPhoto = {
  id: string;
  file: File;
  url: string;
  filters: PhotoFilters;
};

export function AddAdventure({
  point,
  picking,
  me,
  saving,
  onStartPick,
  onUseCurrent,
  onSave,
}: {
  point: LatLng | null;
  picking: boolean;
  me: LatLng | null;
  saving: boolean;
  onStartPick: () => void;
  onUseCurrent: () => void;
  onSave: (data: {
    title: string;
    note: string;
    photos: DraftPhoto[];
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [photos, setPhotos] = useState<DraftPhoto[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next: DraftPhoto[] = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({
        id: crypto.randomUUID(),
        file,
        url: URL.createObjectURL(file),
        filters: { ...DEFAULT_FILTERS },
      }));
    setPhotos((p) => [...p, ...next]);
  }

  function removePhoto(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
  }

  const editing = photos.find((p) => p.id === editingId) || null;

  if (editing) {
    return (
      <PhotoEditor
        src={editing.url}
        initial={editing.filters}
        onCancel={() => setEditingId(null)}
        onSave={(f) => {
          setPhotos((p) =>
            p.map((x) => (x.id === editing.id ? { ...x, filters: f } : x))
          );
          setEditingId(null);
        }}
      />
    );
  }

  const canSave = title.trim() && point && photos.length > 0 && !saving;

  return (
    <div className="space-y-4">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Name this memory… (e.g. Sunset hike)"
        className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm outline-none focus:border-sky"
      />
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        rows={2}
        className="w-full resize-none rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm outline-none focus:border-sky"
      />

      {/* Location */}
      <div className="rounded-xl border border-white/10 bg-ink p-3">
        <div className="mb-2 flex items-center gap-2 text-sm">
          <span>📍</span>
          <span className={point ? "text-white" : "text-white/45"}>
            {point
              ? `Location set (${point.lat.toFixed(4)}, ${point.lng.toFixed(4)})`
              : "Where did this happen?"}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onUseCurrent}
            disabled={!me}
            className="flex-1 rounded-lg border border-white/10 py-2 text-xs text-white/80 disabled:opacity-40"
          >
            Use my current spot
          </button>
          <button
            onClick={onStartPick}
            className={`flex-1 rounded-lg border py-2 text-xs ${
              picking
                ? "border-sky bg-sky/15 text-sky"
                : "border-white/10 text-white/80"
            }`}
          >
            {picking ? "Tap the map…" : "Pick on map"}
          </button>
        </div>
      </div>

      {/* Photos */}
      <div>
        <div className="mb-2 grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => setEditingId(p.id)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                style={{ filter: filtersToCss(p.filters) }}
                className="h-full w-full object-cover"
              />
              <span className="absolute bottom-1 left-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white/90">
                edit
              </span>
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  removePhoto(p.id);
                }}
                className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-[11px]"
              >
                ✕
              </span>
            </button>
          ))}
          <button
            onClick={() => fileRef.current?.click()}
            className="grid aspect-square place-items-center rounded-xl border border-dashed border-white/20 text-2xl text-white/40 hover:border-sky hover:text-sky"
          >
            +
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
        <p className="text-[11px] text-white/35">
          Tap a photo to adjust brightness, saturation and more.
        </p>
      </div>

      <button
        disabled={!canSave}
        onClick={() => onSave({ title: title.trim(), note: note.trim(), photos })}
        className="w-full rounded-xl bg-gradient-to-r from-risk to-sky py-3 text-sm font-semibold text-ink shadow-glow disabled:opacity-40"
      >
        {saving ? "Saving…" : "Save this memory"}
      </button>
    </div>
  );
}
