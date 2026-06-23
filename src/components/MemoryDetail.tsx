"use client";

import { useState } from "react";
import { Adventure, PhotoFilters, filtersToCss } from "@/lib/types";
import { PhotoEditor } from "@/components/PhotoEditor";

export function MemoryDetail({
  adventure,
  authorName,
  onSavePhoto,
  onDelete,
}: {
  adventure: Adventure;
  authorName: string;
  onSavePhoto: (photoId: string, filters: PhotoFilters) => void;
  onDelete: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const photos = adventure.photos ?? [];
  const editing = photos.find((p) => p.id === editingId) || null;

  if (editing && editing.signedUrl) {
    return (
      <PhotoEditor
        src={editing.signedUrl}
        initial={editing.filters}
        onCancel={() => setEditingId(null)}
        onSave={(f) => {
          onSavePhoto(editing.id, f);
          setEditingId(null);
        }}
      />
    );
  }

  const date = adventure.created_at
    ? new Date(adventure.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div>
      <p className="mb-3 text-xs text-white/40">
        {date} · added by {authorName}
      </p>

      {adventure.note && (
        <p className="mb-4 text-sm leading-relaxed text-white/75">
          {adventure.note}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        {photos.map((p, i) => (
          <button
            key={p.id}
            onClick={() => setEditingId(p.id)}
            className={`group relative overflow-hidden rounded-xl border border-white/10 ${
              photos.length % 2 === 1 && i === 0 ? "col-span-2" : ""
            }`}
          >
            {p.signedUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.signedUrl}
                alt=""
                style={{ filter: filtersToCss(p.filters) }}
                className="h-full max-h-72 w-full object-cover"
              />
            ) : (
              <div className="grid h-40 w-full place-items-center bg-ink text-xs text-white/30">
                loading…
              </div>
            )}
            <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/90 opacity-0 transition group-hover:opacity-100">
              ✎ edit
            </span>
          </button>
        ))}
      </div>

      <div className="mt-5">
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/60">Delete this memory?</span>
            <button
              onClick={onDelete}
              className="rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Yes, delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/60"
            >
              Keep
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-xs text-white/35 hover:text-red-400"
          >
            Delete memory
          </button>
        )}
      </div>
    </div>
  );
}
