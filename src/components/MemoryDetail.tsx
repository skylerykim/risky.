"use client";

import { useRef, useState } from "react";
import { Adventure, Photo, PhotoFilters, filtersToCss } from "@/lib/types";
import { PhotoEditor } from "@/components/PhotoEditor";

export function MemoryDetail({
  adventure,
  authorName,
  busy,
  onSavePhoto,
  onSaveDetails,
  onAddPhotos,
  onRemovePhoto,
  onDelete,
}: {
  adventure: Adventure;
  authorName: string;
  busy: boolean;
  onSavePhoto: (photoId: string, filters: PhotoFilters) => void;
  onSaveDetails: (title: string, note: string) => void;
  onAddPhotos: (files: FileList) => void;
  onRemovePhoto: (photo: Photo) => void;
  onDelete: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [title, setTitle] = useState(adventure.title);
  const [note, setNote] = useState(adventure.note ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const photos = adventure.photos ?? [];
  const editing = photos.find((p) => p.id === editingId) || null;

  // Per-photo filter editor (works any time, even after submitting).
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

  function saveDetails() {
    onSaveDetails(title.trim() || adventure.title, note.trim());
    setEditMode(false);
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-white/40">
          {date} · added by {authorName}
        </p>
        <button
          onClick={() => {
            if (editMode) saveDetails();
            else setEditMode(true);
          }}
          className={`rounded-full px-3 py-1 text-xs ${
            editMode
              ? "bg-gradient-to-r from-risk to-sky font-semibold text-ink"
              : "border border-white/10 text-white/60 hover:text-white"
          }`}
        >
          {editMode ? "Done" : "Edit"}
        </button>
      </div>

      {editMode ? (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-3 w-full rounded-xl border border-white/10 bg-ink px-4 py-2.5 text-sm font-semibold outline-none focus:border-sky"
        />
      ) : null}

      {editMode ? (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note"
          className="mb-4 w-full resize-none rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm outline-none focus:border-sky"
        />
      ) : (
        adventure.note && (
          <p className="mb-4 text-sm leading-relaxed text-white/75">
            {adventure.note}
          </p>
        )
      )}

      <div className="grid grid-cols-2 gap-2">
        {photos.map((p, i) => (
          <div
            key={p.id}
            className={`group relative overflow-hidden rounded-xl border border-white/10 ${
              photos.length % 2 === 1 && i === 0 && !editMode ? "col-span-2" : ""
            }`}
          >
            <button
              onClick={() => setEditingId(p.id)}
              className="block w-full"
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
              <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/90">
                ✎ edit
              </span>
            </button>
            {editMode && (
              <button
                onClick={() => onRemovePhoto(p)}
                disabled={busy}
                className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs"
                title="Remove photo"
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {editMode && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="grid aspect-square place-items-center rounded-xl border border-dashed border-white/20 text-2xl text-white/40 hover:border-sky hover:text-sky disabled:opacity-40"
          >
            {busy ? "…" : "+"}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) onAddPhotos(e.target.files);
          e.target.value = "";
        }}
      />

      {!editMode && (
        <p className="mt-3 text-[11px] text-white/35">
          Tap any photo to adjust it. Hit Edit to add or remove photos.
        </p>
      )}

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
