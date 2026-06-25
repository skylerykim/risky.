"use client";

import { useState } from "react";
import { Adventure, Track } from "@/lib/types";
import { Cluster } from "@/lib/cluster";

export function PatchView({
  patch,
  track,
  firstThumb,
  onOpenMemory,
  onSearch,
  onSaveSong,
}: {
  patch: Cluster;
  track: Track | null;
  firstThumb: Record<string, string | undefined>;
  onOpenMemory: (a: Adventure) => void;
  onSearch: (q: string) => Promise<Track[]>;
  onSaveSong: (track: Track | null) => Promise<void>;
}) {
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setResults(await onSearch(q));
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      {/* Song */}
      <section className="rounded-2xl border border-white/10 bg-ink p-4">
        {track ? (
          <div>
            <div className="flex items-center gap-3">
              {track.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={track.image}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{track.name}</p>
                <p className="truncate text-xs text-white/50">{track.artists}</p>
              </div>
            </div>
            <iframe
              title="spotify"
              src={`https://open.spotify.com/embed/track/${track.id}`}
              className="mt-3 w-full rounded-xl"
              height={80}
              allow="encrypted-media"
            />
            <div className="mt-2 flex gap-3 text-xs">
              <button
                onClick={() => setSearching(true)}
                className="text-sky hover:underline"
              >
                Change song
              </button>
              <button
                onClick={() => onSaveSong(null)}
                className="text-white/40 hover:text-red-400"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setSearching(true)}
            className="flex w-full items-center justify-center gap-2 py-2 text-sm font-medium text-sky"
          >
            🎵 Add a song to this patch
          </button>
        )}

        {searching && (
          <div className="mt-3 border-t border-white/10 pt-3">
            <form onSubmit={runSearch} className="flex gap-2">
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search a song or artist"
                className="flex-1 rounded-lg border border-white/10 bg-ink2 px-3 py-2 text-sm outline-none focus:border-sky"
              />
              <button className="rounded-lg bg-gradient-to-r from-risk to-sky px-3 text-sm font-semibold text-ink">
                {loading ? "…" : "Go"}
              </button>
            </form>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto no-scrollbar">
              {results.map((t) => (
                <button
                  key={t.id}
                  onClick={async () => {
                    await onSaveSong(t);
                    setSearching(false);
                    setResults([]);
                    setQ("");
                  }}
                  className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-white/5"
                >
                  {t.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.image} alt="" className="h-9 w-9 rounded" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{t.name}</p>
                    <p className="truncate text-xs text-white/50">{t.artists}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Memories in this patch */}
      <div className="space-y-2">
        {patch.items.map((a) => (
          <button
            key={a.id}
            onClick={() => onOpenMemory(a)}
            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-ink p-2 text-left hover:border-sky"
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink2">
              {firstThumb[a.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={firstThumb[a.id]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{a.title}</p>
              <p className="text-xs text-white/40">
                {new Date(a.created_at).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
