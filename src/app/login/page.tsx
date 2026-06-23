"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
        data: { display_name: name.trim() || undefined },
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
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

        {sent ? (
          <div className="rounded-2xl border border-white/10 bg-ink2 p-6 text-center">
            <div className="mb-2 text-2xl">💌</div>
            <h2 className="mb-1 font-semibold">Check your email</h2>
            <p className="text-sm text-white/50">
              We sent a magic link to{" "}
              <span className="text-risk">{email}</span>. Tap it on your
              phone to jump in.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-5 text-xs text-sky underline-offset-4 hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form
            onSubmit={sendLink}
            className="space-y-3 rounded-2xl border border-white/10 bg-ink2 p-6"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs text-white/40">
                Your name
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Clark"
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm outline-none focus:border-sky"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-white/40">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm outline-none focus:border-sky"
              />
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-risk to-sky py-3 text-sm font-semibold text-ink shadow-glow transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send me a magic link"}
            </button>
            <p className="pt-1 text-center text-[11px] leading-relaxed text-white/30">
              No password. We email you a one-tap link to sign in.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
