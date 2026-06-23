"use client";

import { haversineMiles, formatDistance, timeAgo } from "@/lib/distance";
import type { LatLng } from "@/components/MapView";

export function DistanceBar({
  me,
  partner,
  partnerName,
  partnerSeen,
}: {
  me: LatLng | null;
  partner: LatLng | null;
  partnerName: string;
  partnerSeen: string | null;
}) {
  let label = "waiting for locations…";
  let strong = false;

  if (me && partner) {
    const miles = haversineMiles(me.lat, me.lng, partner.lat, partner.lng);
    label = formatDistance(miles);
    strong = true;
  } else if (!me) {
    label = "turn on your location";
  } else if (!partner) {
    label = `waiting for ${partnerName}`;
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-ink2/80 px-3 py-1.5 backdrop-blur">
      <span className="relative flex h-2 w-2">
        <span
          className={`absolute inline-flex h-full w-full rounded-full ${
            strong ? "animate-ping bg-sky/70" : "bg-white/20"
          }`}
        />
        <span
          className={`relative inline-flex h-2 w-2 rounded-full ${
            strong ? "bg-sky" : "bg-white/30"
          }`}
        />
      </span>
      <span className={`text-sm ${strong ? "font-semibold" : "text-white/50"}`}>
        {label}
      </span>
      {strong && partnerSeen && (
        <span className="text-[11px] text-white/35">
          · {partnerName} {timeAgo(partnerSeen)}
        </span>
      )}
    </div>
  );
}
