"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { timeAgo } from "@/lib/distance";

export function Settings({
  displayName,
  partnerName,
  partnerSeen,
  appUrl,
  onSaveName,
  onSignOut,
}: {
  displayName: string;
  partnerName: string | null;
  partnerSeen: string | null;
  appUrl: string;
  onSaveName: (name: string) => Promise<void>;
  onSignOut: () => void;
}) {
  const [name, setName] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [savedName, setSavedName] = useState(false);

  async function saveName() {
    if (!name.trim() || name.trim() === displayName) return;
    setSavingName(true);
    await onSaveName(name.trim());
    setSavingName(false);
    setSavedName(true);
    setTimeout(() => setSavedName(false), 1500);
  }

  return (
    <div className="space-y-6">
      {/* Your name */}
      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wide text-white/40">
          Your name
        </h3>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm outline-none focus:border-sky"
          />
          <button
            onClick={saveName}
            disabled={savingName || !name.trim() || name.trim() === displayName}
            className="rounded-xl bg-gradient-to-r from-risk to-sky px-4 text-sm font-semibold text-ink disabled:opacity-40"
          >
            {savedName ? "Saved" : savingName ? "…" : "Save"}
          </button>
        </div>
      </section>

      {/* Partner */}
      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wide text-white/40">
          Paired with
        </h3>
        <div className="rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm">
          {partnerName ? (
            <div className="flex items-center justify-between">
              <span className="font-medium">{partnerName}</span>
              <span className="text-xs text-white/40">
                {partnerSeen ? `last seen ${timeAgo(partnerSeen)}` : "no location yet"}
              </span>
            </div>
          ) : (
            <span className="text-white/45">
              Waiting for your person to sign in once. After they do, you are
              paired automatically.
            </span>
          )}
        </div>
      </section>

      {/* Install on phone */}
      <section>
        <h3 className="mb-2 text-xs uppercase tracking-wide text-white/40">
          Get it on your phone
        </h3>
        <div className="flex flex-col items-center rounded-xl border border-white/10 bg-ink p-5">
          <div className="rounded-2xl bg-white p-3">
            <QRCodeSVG
              value={appUrl}
              size={168}
              bgColor="#ffffff"
              fgColor="#171310"
              level="M"
            />
          </div>
          <p className="mt-4 text-center text-sm text-white/70">
            Scan with your phone camera, tap{" "}
            <span className="text-risk">Share</span>, then{" "}
            <span className="text-sky">Add to Home Screen</span>.
          </p>
          <p className="mt-1 break-all text-center text-[11px] text-white/30">
            {appUrl}
          </p>
        </div>
      </section>

      {/* Sign out */}
      <button
        onClick={onSignOut}
        className="w-full rounded-xl border border-white/10 py-3 text-sm text-white/70 hover:text-white"
      >
        Sign out
      </button>
    </div>
  );
}
