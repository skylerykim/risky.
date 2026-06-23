"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Wordmark } from "@/components/Wordmark";

// The two people this app is for. Change these names if you ever want to.
const PEOPLE = ["Skyler", "Rihana"];

type Step = "who" | "email" | "code";

export default function LoginPage() {
  const [step, setStep] = useState<Step>("who");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  async function sendCode(e?: React.FormEvent) {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true, data: { display_name: name } },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setStep("code");
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    if (error) {
      setLoading(false);
      setError("That code didn't work. Double-check it or send a new one.");
      return;
    }
    // Make sure this person has a profile with the name they picked.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .upsert({ id: user.id, display_name: name }, { onConflict: "id" });
    }
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
            onSubmit={sendCode}
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
              {loading ? "Sending…" : "Email me a 6-digit code"}
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

        {/* Step 3: code */}
        {step === "code" && (
          <form
            onSubmit={verifyCode}
            className="space-y-3 rounded-2xl border border-white/10 bg-ink2 p-6"
          >
            <p className="text-center text-sm text-white/60">
              Enter the 6-digit code we sent to
              <br />
              <span className="text-risk">{email}</span>
            </p>
            <input
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              maxLength={6}
              placeholder="123456"
              className="w-full rounded-xl border border-white/10 bg-ink px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-sky"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              disabled={loading || code.length < 6}
              className="w-full rounded-xl bg-gradient-to-r from-risk to-sky py-3 text-sm font-semibold text-ink shadow-glow disabled:opacity-40"
            >
              {loading ? "Checking…" : "Enter"}
            </button>
            <button
              type="button"
              onClick={() => sendCode()}
              className="w-full text-center text-xs text-white/40 hover:text-white/70"
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
