"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { ROLES } from "@/lib/store";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [role, setRole] = useState(ROLES[4]); // Shop Admin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await signIn(email.trim(), password, role);
    if (res.error) {
      setError(res.error);
      setBusy(false);
    }
    // On success the AuthProvider picks up the session and the gate swaps in the app.
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">
            R
          </div>
          <div className="leading-tight">
            <div className="text-base font-extrabold tracking-tight text-ink-900">Real Bengal Sweets</div>
            <div className="text-[11px] font-semibold text-ink-500">Management System</div>
          </div>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              Login as
            </span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="h-10 rounded-lg border border-ink-200 bg-surface px-2 text-sm text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
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
            className="mt-1 h-10 rounded-lg bg-brand-600 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
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
