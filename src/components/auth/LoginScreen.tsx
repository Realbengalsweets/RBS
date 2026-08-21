"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email.trim(), password);
    if (res.error) {
      setError(res.error);
      setBusy(false);
    }
    // On success the AuthProvider picks up the session and the gate swaps in the app.
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-100 p-4">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-brand-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-brand-100/60 blur-3xl" />
      <div className="fade-in relative w-full max-w-sm rounded-2xl border border-line bg-surface/90 p-7 shadow-lg backdrop-blur">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-b from-brand-500 to-brand-700 text-lg font-black text-white shadow-[var(--shadow-brand)]">
            R
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight text-ink-900">Real Bengal Sweets</div>
            <div className="text-[11px] font-semibold text-ink-500">Management System</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="you@realbengalsweets.com"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-lg border border-ink-200 bg-surface px-3 text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
            />
          </label>

          {error && <p className="text-sm font-medium text-danger">{error}</p>}

          <button
            type="submit"
            disabled={busy}
            className="btn btn-primary mt-1 w-full"
          >
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-xs text-ink-400">
          Accounts are created by the Super Admin. Contact them if you can&apos;t sign in.
        </p>
      </div>
    </div>
  );
}
