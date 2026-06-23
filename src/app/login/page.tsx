"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";

// The two people this app is for. Change these names if you ever want to.
const PEOPLE = ["Skyler", "Rihana"];

type Step = "who" | "email" | "sent";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("who");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function sendLink(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        data: { display_name: name },
        emailRedirectTo: `${origin}/auth/confirm`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setStep("sent");
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

        {/* Step 1: who are you */}
        {step === "who" && (
          <div className="rounded-2xl border border-white/10 bg-ink2 p-6">
            <p className="mb-4 text-center text-sm text-white/60">
              Who&apos;s this?
            </p>
            <div className="grid grid-cols-2 gap-3">
              {PEOPLE.map((p, i) => (
                <button
                  key={p}
                  onClick={() => {
                    setName(p);
                    setStep("email");
                  }}
                  className={`rounded-2xl border border-white/10 py-6 text-lg font-semibold transition active:scale-[0.98] ${
                    i === 0
                      ? "bg-risk/15 text-risk hover:bg-risk/25"
                      : "bg-sky/15 text-sky hover:bg-sky/25"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: email */}
        {step === "email" && (
          <form
            onSubmit={sendLink}
            className="space-y-3 rounded-2xl border border-white/10 bg-ink2 p-6"
          >
            <p className="text-center text-sm text-white/60">
              Hey <span className="font-semibold text-white">{name}</span> 👋
            </p>
            <label className="block">
              <span className="mb-1.5 block text-xs text-white/40">
                Your email
              </span>
              <input
                type="email"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-sm outline-none focus:border-sky"
              />
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-risk to-sky py-3 text-sm font-semibold text-ink shadow-glow disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send me a magic link"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("who");
                setError(null);
              }}
              className="w-full text-center text-xs text-white/40 hover:text-white/70"
            >
              Not {name}? Go back
            </button>
          </form>
        )}

        {/* Step 3: sent */}
        {step === "sent" && (
          <div className="rounded-2xl border border-white/10 bg-ink2 p-6 text-center">
            <div className="mb-2 text-2xl">💌</div>
            <h2 className="mb-1 font-semibold">Check your email</h2>
            <p className="text-sm text-white/50">
              We sent a sign-in link to{" "}
              <span className="text-risk">{email}</span>. Open it on this device
              and you&apos;re in.
            </p>
            <button
              onClick={() => sendLink()}
              className="mt-5 text-xs text-sky underline-offset-4 hover:underline"
            >
              Resend link
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
