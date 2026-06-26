"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Adventure,
  PhotoFilters,
  Photo,
  Profile,
  Track,
} from "@/lib/types";
import { Wordmark } from "@/components/Wordmark";
import { Sheet } from "@/components/Sheet";
import { DistanceBar } from "@/components/DistanceBar";
import { AddAdventure, DraftPhoto } from "@/components/AddAdventure";
import { MemoryDetail } from "@/components/MemoryDetail";
import { Settings } from "@/components/Settings";
import { personColor } from "@/lib/people";
import { clusterAdventures, Cluster } from "@/lib/cluster";
import { PatchView } from "@/components/PatchView";
import type { LatLng } from "@/components/MapView";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="grid h-full w-full place-items-center text-sm text-white/40">
      loading map…
    </div>
  ),
});

const BUCKET = "photos";

export function RiskyApp({ userId }: { userId: string }) {
  const supabase = useMemo(() => createClient(), []);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [adventures, setAdventures] = useState<Adventure[]>([]);
  const [firstThumb, setFirstThumb] = useState<Record<string, string>>({});

  const [mePos, setMePos] = useState<LatLng | null>(null);

  // Add flow
  const [addOpen, setAddOpen] = useState(false);
  const [picking, setPicking] = useState(false);
  const [draftPoint, setDraftPoint] = useState<LatLng | null>(null);
  const [saving, setSaving] = useState(false);

  // Detail flow
  const [selected, setSelected] = useState<Adventure | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);

  // Patches: memories within ~10 miles are grouped together.
  const clusters = useMemo(
    () => clusterAdventures(adventures, 10),
    [adventures]
  );
  const [openPatch, setOpenPatch] = useState<Cluster | null>(null);
  const [songs, setSongs] = useState<Record<string, Track>>({});

  // Settings. The QR always points to the exact site this is being viewed on,
  // so it can't drift to a stale/wrong domain.
  const [settingsOpen, setSettingsOpen] = useState(false);
  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://risky-sigma.vercel.app";

  // Map recenter
  const [recenterTo, setRecenterTo] = useState<[number, number] | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const me = profiles.find((p) => p.id === userId) || null;
  // The other person. If stray duplicate profiles ever exist, prefer the one
  // with the most recent location.
  const partner =
    profiles
      .filter((p) => p.id !== userId && p.display_name)
      .sort(
        (a, b) =>
          (b.location_updated_at ? Date.parse(b.location_updated_at) : 0) -
          (a.location_updated_at ? Date.parse(a.location_updated_at) : 0)
      )[0] || null;
  const partnerPos: LatLng | null =
    partner?.lat != null && partner?.lng != null
      ? { lat: partner.lat, lng: partner.lng }
      : null;
  const partnerName = partner?.display_name || "your person";

  // ---- Initial load ----------------------------------------------------
  const loadProfiles = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*");
    if (data) setProfiles(data as Profile[]);
  }, [supabase]);

  const loadSongs = useCallback(async () => {
    const { data } = await supabase.from("patch_songs").select("anchor, track");
    if (data) {
      const map: Record<string, Track> = {};
      for (const row of data as { anchor: string; track: Track }[]) {
        map[row.anchor] = row.track;
      }
      setSongs(map);
    }
  }, [supabase]);

  async function searchSpotify(q: string): Promise<Track[]> {
    const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    return (await res.json()).tracks ?? [];
  }

  async function saveSong(anchor: string, track: Track | null) {
    if (track) {
      await supabase
        .from("patch_songs")
        .upsert(
          { anchor, track, updated_at: new Date().toISOString() },
          { onConflict: "anchor" }
        );
      setSongs((s) => ({ ...s, [anchor]: track }));
    } else {
      await supabase.from("patch_songs").delete().eq("anchor", anchor);
      setSongs((s) => {
        const next = { ...s };
        delete next[anchor];
        return next;
      });
    }
  }

  const loadAdventures = useCallback(async () => {
    const { data } = await supabase
      .from("adventures")
      .select("*, photos(*)")
      .order("created_at", { ascending: false });
    if (!data) return;
    const advs = data as Adventure[];
    setAdventures(advs);

    // Signed URL for the first photo of each adventure (marker thumbnail).
    const firsts = advs
      .map((a) => (a.photos && a.photos.length ? a.photos[0] : null))
      .filter(Boolean) as Photo[];
    if (firsts.length) {
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          firsts.map((p) => p.storage_path),
          3600
        );
      const map: Record<string, string> = {};
      signed?.forEach((s, i) => {
        const adv = advs.find((a) => a.photos?.[0]?.id === firsts[i].id);
        if (adv && s.signedUrl) map[adv.id] = s.signedUrl;
      });
      setFirstThumb(map);
    }
  }, [supabase]);

  useEffect(() => {
    loadProfiles();
    loadAdventures();
    loadSongs();
  }, [loadProfiles, loadAdventures, loadSongs]);

  // ---- Realtime: partner location & new memories -----------------------
  useEffect(() => {
    const channel = supabase
      .channel("risky-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => loadProfiles()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "adventures" },
        () => loadAdventures()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, loadProfiles, loadAdventures]);

  // ---- Geolocation: watch my position, push to Supabase ----------------
  const lastWrite = useRef(0);
  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        const next = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setMePos(next);
        const now = Date.now();
        if (now - lastWrite.current > 15000) {
          lastWrite.current = now;
          await supabase
            .from("profiles")
            .update({
              lat: next.lat,
              lng: next.lng,
              location_updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [supabase, userId]);

  // If my own profile gets cleared (the other person broke the pair), sign out
  // and return to the picker.
  useEffect(() => {
    if (me && !me.display_name) {
      supabase.auth.signOut().finally(() => {
        window.location.href = "/login";
      });
    }
  }, [me, supabase]);

  // Center on the user the first time their location is known.
  const centeredOnMe = useRef(false);
  useEffect(() => {
    if (mePos && !centeredOnMe.current) {
      centeredOnMe.current = true;
      setRecenterTo([mePos.lat, mePos.lng]);
      setRecenterTrigger((t) => t + 1);
    }
  }, [mePos]);

  // ---- Sign all of an adventure's photos for viewing -------------------
  const signPhotos = useCallback(
    async (a: Adventure): Promise<Adventure> => {
      const photos = a.photos ?? [];
      if (!photos.length) return { ...a, photos: [] };
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          photos.map((p) => p.storage_path),
          3600
        );
      const withUrls = photos
        .slice()
        .sort((x, y) => x.sort - y.sort)
        .map((p, i) => ({ ...p, signedUrl: signed?.[i]?.signedUrl ?? undefined }));
      return { ...a, photos: withUrls };
    },
    [supabase]
  );

  // ---- Open a memory ---------------------------------------------------
  async function openMemory(a: Adventure) {
    setSelected(await signPhotos(a));
    setRecenterTo([a.lat, a.lng]);
    setRecenterTrigger((t) => t + 1);
  }

  // ---- Re-pull a memory after editing its photos -----------------------
  const refreshSelected = useCallback(
    async (id: string) => {
      const { data } = await supabase
        .from("adventures")
        .select("*, photos(*)")
        .eq("id", id)
        .single();
      if (data) setSelected(await signPhotos(data as Adventure));
      loadAdventures();
    },
    [supabase, signPhotos, loadAdventures]
  );

  // ---- Save a new memory ----------------------------------------------
  async function saveMemory(data: {
    title: string;
    note: string;
    photos: DraftPhoto[];
  }) {
    if (!draftPoint) return;
    setSaving(true);
    try {
      const adventureId = crypto.randomUUID();
      const { error: advErr } = await supabase.from("adventures").insert({
        id: adventureId,
        author: userId,
        title: data.title,
        note: data.note || null,
        lat: draftPoint.lat,
        lng: draftPoint.lng,
      });
      if (advErr) throw advErr;

      let sort = 0;
      for (const ph of data.photos) {
        const ext = ph.file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${adventureId}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, ph.file, { upsert: false });
        if (upErr) throw upErr;
        await supabase.from("photos").insert({
          adventure_id: adventureId,
          storage_path: path,
          filters: ph.filters,
          sort: sort++,
        });
      }

      data.photos.forEach((p) => URL.revokeObjectURL(p.url));
      setAddOpen(false);
      setDraftPoint(null);
      setRecenterTo([draftPoint.lat, draftPoint.lng]);
      setRecenterTrigger((t) => t + 1);
      await loadAdventures();
    } catch (e) {
      alert("Could not save: " + (e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ---- Edit a photo's filters (persist) --------------------------------
  async function savePhotoFilters(photoId: string, filters: PhotoFilters) {
    await supabase.from("photos").update({ filters }).eq("id", photoId);
    setSelected((sel) =>
      sel
        ? {
            ...sel,
            photos: sel.photos?.map((p) =>
              p.id === photoId ? { ...p, filters } : p
            ),
          }
        : sel
    );
    loadAdventures();
  }

  // ---- Edit a memory's title / note ------------------------------------
  async function saveDetails(id: string, title: string, note: string) {
    await supabase
      .from("adventures")
      .update({ title, note: note || null })
      .eq("id", id);
    setSelected((s) => (s ? { ...s, title, note: note || null } : s));
    loadAdventures();
  }

  // ---- Add photos to an existing memory --------------------------------
  async function addPhotosToMemory(id: string, files: FileList) {
    setPhotoBusy(true);
    try {
      const existing = selected?.photos ?? [];
      let sort = existing.length
        ? Math.max(...existing.map((p) => p.sort)) + 1
        : 0;
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/${id}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { upsert: false });
        if (error) throw error;
        await supabase.from("photos").insert({
          adventure_id: id,
          storage_path: path,
          filters: {},
          sort: sort++,
        });
      }
      await refreshSelected(id);
    } catch (e) {
      alert("Could not add photo: " + (e as Error).message);
    } finally {
      setPhotoBusy(false);
    }
  }

  // ---- Remove one photo from a memory ----------------------------------
  async function removePhoto(adventureId: string, photo: Photo) {
    setPhotoBusy(true);
    try {
      await supabase.storage.from(BUCKET).remove([photo.storage_path]);
      await supabase.from("photos").delete().eq("id", photo.id);
      await refreshSelected(adventureId);
    } finally {
      setPhotoBusy(false);
    }
  }

  // ---- Update my display name ------------------------------------------
  async function saveName(name: string) {
    await supabase.from("profiles").update({ display_name: name }).eq("id", userId);
    await loadProfiles();
  }

  // ---- Delete a memory -------------------------------------------------
  async function deleteMemory(a: Adventure) {
    const paths = (a.photos ?? []).map((p) => p.storage_path);
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    await supabase.from("adventures").delete().eq("id", a.id);
    setSelected(null);
    await loadAdventures();
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  // Break the pair for BOTH people: clear my profile and my partner's so both
  // names free up. The other phone notices its profile went blank and returns
  // to the picker on its own (see the unpair effect below).
  async function breakPair() {
    const ids = [userId, partner?.id].filter(Boolean) as string[];
    await supabase
      .from("profiles")
      .update({
        display_name: null,
        lat: null,
        lng: null,
        location_updated_at: null,
      })
      .in("id", ids);
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  function flyToMe() {
    if (mePos) {
      setRecenterTo([mePos.lat, mePos.lng]);
      setRecenterTrigger((t) => t + 1);
    }
  }

  return (
    <main className="relative h-[100dvh] w-full overflow-hidden">
      {/* Map */}
      <div className="absolute inset-0">
        <MapView
          clusters={clusters}
          onSelectCluster={(c) => {
            if (c.items.length === 1) openMemory(c.items[0]);
            else setOpenPatch(c);
          }}
          pickMode={picking}
          pickPoint={draftPoint}
          onPick={(lat, lng) => {
            setDraftPoint({ lat, lng });
            setPicking(false);
          }}
          me={mePos}
          partner={partnerPos}
          meColor={personColor(me?.display_name)}
          partnerColor={personColor(partner?.display_name)}
          recenterTo={recenterTo}
          recenterTrigger={recenterTrigger}
          firstThumb={firstThumb}
        />
      </div>

      {/* Top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] flex items-start justify-between p-4">
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="text-3xl">
            <Wordmark />
          </div>
          <DistanceBar
            me={mePos}
            partner={partnerPos}
            partnerName={partnerName}
            partnerSeen={partner?.location_updated_at ?? null}
          />
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-ink2/80 text-lg backdrop-blur hover:bg-ink3"
          title="Settings"
        >
          ⚙️
        </button>
      </div>

      {/* Picking banner */}
      {picking && (
        <div className="absolute inset-x-0 top-24 z-[600] flex justify-center">
          <div className="rounded-full border border-sky/40 bg-ink2/90 px-4 py-2 text-sm text-sky shadow-glow backdrop-blur">
            Tap the map to drop your memory pin
          </div>
        </div>
      )}

      {/* Floating actions */}
      <div className="absolute bottom-6 right-5 z-[500] flex flex-col items-end gap-3">
        <button
          onClick={flyToMe}
          className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-ink2/85 text-lg backdrop-blur"
          title="Find me"
        >
          🧭
        </button>
        <button
          onClick={() => {
            setDraftPoint(mePos);
            setAddOpen(true);
          }}
          className="flex items-center gap-2 rounded-full bg-gradient-to-r from-risk to-sky px-5 py-3 font-semibold text-ink shadow-glow active:scale-95"
        >
          <span className="text-lg leading-none">+</span> New memory
        </button>
      </div>

      {/* Add sheet (kept mounted while picking so the draft survives) */}
      <Sheet
        open={addOpen}
        hidden={picking}
        onClose={() => {
          setAddOpen(false);
          setPicking(false);
        }}
        title="New memory"
      >
        <AddAdventure
          point={draftPoint}
          picking={picking}
          me={mePos}
          saving={saving}
          onStartPick={() => setPicking(true)}
          onUseCurrent={() => mePos && setDraftPoint(mePos)}
          onSave={saveMemory}
        />
      </Sheet>

      {/* Detail sheet */}
      <Sheet
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title}
      >
        {selected && (
          <MemoryDetail
            adventure={selected}
            authorName={
              profiles.find((p) => p.id === selected.author)?.display_name ||
              "someone"
            }
            busy={photoBusy}
            onSavePhoto={savePhotoFilters}
            onSaveDetails={(title, note) => saveDetails(selected.id, title, note)}
            onAddPhotos={(files) => addPhotosToMemory(selected.id, files)}
            onRemovePhoto={(photo) => removePhoto(selected.id, photo)}
            onDelete={() => deleteMemory(selected)}
          />
        )}
      </Sheet>

      {/* Patch (group of nearby memories) */}
      <Sheet
        open={!!openPatch}
        onClose={() => setOpenPatch(null)}
        title={openPatch ? `${openPatch.items.length} memories nearby` : ""}
      >
        {openPatch && (
          <PatchView
            patch={openPatch}
            track={songs[openPatch.id] ?? null}
            firstThumb={firstThumb}
            onOpenMemory={(a) => {
              setOpenPatch(null);
              openMemory(a);
            }}
            onSearch={searchSpotify}
            onSaveSong={(t) => saveSong(openPatch.id, t)}
          />
        )}
      </Sheet>

      {/* Settings sheet */}
      <Sheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Settings"
      >
        <Settings
          displayName={me?.display_name || ""}
          partnerName={partner?.display_name ?? null}
          partnerSeen={partner?.location_updated_at ?? null}
          appUrl={appUrl}
          onSaveName={saveName}
          onSignOut={signOut}
          onBreakPair={breakPair}
        />
      </Sheet>
    </main>
  );
}
