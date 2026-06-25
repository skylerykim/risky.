import { NextResponse } from "next/server";

// Spotify search via the Client Credentials flow. The secret stays server-side
// (Vercel env var SPOTIFY_CLIENT_SECRET), never reaching the browser.

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) return null;

  if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) {
    return cachedToken.value;
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ tracks: [] });

  const token = await getToken();
  if (!token) {
    return NextResponse.json(
      { error: "Spotify is not configured (missing SPOTIFY_CLIENT_ID/SECRET)." },
      { status: 500 }
    );
  }

  const res = await fetch(
    `https://api.spotify.com/v1/search?type=track&limit=8&q=${encodeURIComponent(q)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ tracks: [] });

  const json = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tracks = (json.tracks?.items ?? []).map((t: any) => ({
    id: t.id,
    name: t.name,
    artists: (t.artists ?? []).map((a: any) => a.name).join(", "),
    image: t.album?.images?.[t.album.images.length - 1]?.url ?? null,
    url: t.external_urls?.spotify ?? "",
  }));

  return NextResponse.json({ tracks });
}
