"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";
import { PEOPLE, isPurplePerson } from "@/lib/people";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function enter(name: string) {
    setLoading(name);
    setError(null);

    const { data, error } = await supabase.auth.signInAnonymously({
      options: { data: { display_name: name } },
    });
    if (error || !data.user) {
      setLoading(null);
      setError(
        "Could not sign in. Make sure anonymous sign-ins are enabled in Supabase."
      );
      return;
    }

    // Don't let both phones be the same person.
    const { data: taken } = await supabase
      .from("profiles")
      .select("id")
      .eq("display_name", name)
      .neq("id", data.user.id)
      .limit(1);

    if (taken && taken.length > 0) {
      await supabase.auth.signOut();
      setLoading(null);
      const other = PEOPLE.find((p) => p !== name) ?? "the other name";
      setError(
        `${name} is already taken on the other phone. Pick ${other}, or tap "Break pair" there first.`
      );
      return;
    }

    await supabase
      .from("profiles")
      .upsert({ id: data.user.id, display_name: name }, { onConflict: "id" });
    window.location.href = "/";
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-2 text-center text-5xl">
          <Wordmark />
        </div>
        <p className="mb-10 text-center text-sm text-white/50">
          Our adventures, mapped. Just the two of us.
        </p>

        <div className="rounded-2xl border border-white/10 bg-ink2 p-6">
          <p className="mb-4 text-center text-sm text-white/60">
            Who&apos;s this?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {PEOPLE.map((p) => (
              <button
                key={p}
                disabled={loading !== null}
                onClick={() => enter(p)}
                className={`rounded-2xl border border-white/10 py-6 text-lg font-semibold transition active:scale-[0.98] disabled:opacity-50 ${
                  isPurplePerson(p)
                    ? "bg-sky/15 text-sky hover:bg-sky/25"
                    : "bg-risk/15 text-risk hover:bg-risk/25"
                }`}
              >
                {loading === p ? "…" : p}
              </button>
            ))}
          </div>
          {error && (
            <p className="mt-4 text-center text-xs text-red-400">{error}</p>
          )}
        </div>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-white/30">
          Keep this link just between the two of you.
        </p>
      </div>
    </main>
  );
}
