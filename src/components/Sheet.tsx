"use client";

import { useEffect } from "react";

export function Sheet({
  open,
  onClose,
  children,
  title,
  hidden = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  hidden?: boolean;
}) {
  useEffect(() => {
    if (!open || hidden) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, hidden, onClose]);

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[1000] flex items-end justify-center sm:items-center ${
        hidden ? "hidden" : ""
      }`}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/10 bg-ink2 p-5 no-scrollbar sm:rounded-3xl">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-full bg-white/5 px-3 py-1 text-sm text-white/60 hover:text-white"
            >
              Close
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
