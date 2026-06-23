"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Adventure } from "@/lib/types";

// Gradient teardrop pin (built from HTML so we avoid broken image paths).
function pinIcon(thumb?: string) {
  const inner = thumb
    ? `<img src="${thumb}" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid #f9a8d4"/>`
    : `<div style="width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#f9a8d4,#a855f7);margin:6px auto"></div>`;
  return L.divIcon({
    className: "",
    html: `<div style="filter:drop-shadow(0 4px 8px rgba(0,0,0,.6))">
      <div style="width:42px;height:42px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:linear-gradient(135deg,#1e1430,#2a1d40);border:2px solid #a855f7;display:flex;align-items:center;justify-content:center">
        <div style="transform:rotate(45deg)">${inner}</div>
      </div>
    </div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 42],
  });
}

function dotIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="position:relative">
      <div style="position:absolute;width:26px;height:26px;border-radius:50%;background:${color};opacity:.25;left:-13px;top:-13px;animation:pulse 2s infinite"></div>
      <div style="position:absolute;width:14px;height:14px;border-radius:50%;background:${color};border:2px solid #0b0710;left:-7px;top:-7px"></div>
    </div>
    <style>@keyframes pulse{0%{transform:scale(.6);opacity:.5}100%{transform:scale(1.8);opacity:0}}</style>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

function Recenter({ center, trigger }: { center: [number, number]; trigger: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, Math.max(map.getZoom(), 13), { duration: 0.8 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export type LatLng = { lat: number; lng: number };

export default function MapView({
  adventures,
  onSelect,
  pickMode,
  pickPoint,
  onPick,
  me,
  partner,
  meColor = "#f9a8d4",
  partnerColor = "#a855f7",
  recenterTo,
  recenterTrigger,
  firstThumb,
}: {
  adventures: Adventure[];
  onSelect: (a: Adventure) => void;
  pickMode: boolean;
  pickPoint: LatLng | null;
  onPick: (lat: number, lng: number) => void;
  me: LatLng | null;
  partner: LatLng | null;
  meColor?: string;
  partnerColor?: string;
  recenterTo: [number, number] | null;
  recenterTrigger: number;
  firstThumb: Record<string, string | undefined>;
}) {
  const fallback: [number, number] = me
    ? [me.lat, me.lng]
    : adventures.length
    ? [adventures[0].lat, adventures[0].lng]
    : [38.0293, -78.4767]; // Charlottesville-ish default

  return (
    <MapContainer
      center={fallback}
      zoom={12}
      zoomControl={false}
      className="h-full w-full"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; OpenStreetMap &copy; CARTO'
      />

      {recenterTo && <Recenter center={recenterTo} trigger={recenterTrigger} />}
      {pickMode && <ClickCatcher onPick={onPick} />}

      {adventures.map((a) => (
        <Marker
          key={a.id}
          position={[a.lat, a.lng]}
          icon={pinIcon(firstThumb[a.id])}
          eventHandlers={{ click: () => onSelect(a) }}
        />
      ))}

      {pickMode && pickPoint && (
        <Marker position={[pickPoint.lat, pickPoint.lng]} icon={pinIcon()} />
      )}

      {me && <Marker position={[me.lat, me.lng]} icon={dotIcon(meColor)} />}
      {partner && (
        <Marker position={[partner.lat, partner.lng]} icon={dotIcon(partnerColor)} />
      )}
    </MapContainer>
  );
}
