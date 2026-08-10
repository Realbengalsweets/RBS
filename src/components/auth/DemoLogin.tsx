"use client";

import { useState } from "react";
import type { User } from "@/lib/store";

/**
 * Simple demo login: pick an account from a dropdown and enter the app as that
 * user. Used only in demo mode (no Supabase project); the real email/password
 * login takes over once a backend is configured.
 */
export default function DemoLogin({
  users,
  onSignIn,
}: {
  users: User[];
  onSignIn: (id: string) => void;
}) {
  // Default to a Shop Admin — the focus of this Phase-1 preview.
  const [sel, setSel] = useState(
    () => (users.find((u) => u.role === "Shop Admin") ?? users[0])?.id ?? "",
  );
  const current = users.find((u) => u.id === sel);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-xl font-black text-white">
            R
          </div>
          <div className="leading-tight">
            <div className="text-lg font-extrabold tracking-tight text-ink-900">Real Bengal Sweets</div>
            <div className="text-[12px] font-semibold text-ink-500">Management System</div>
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">Select account</span>
          <select
            value={sel}
            onChange={(e) => setSel(e.target.value)}
            className="h-12 rounded-lg border border-ink-200 bg-surface px-3.5 text-base text-ink-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} — {u.role}
              </option>
            ))}
          </select>
        </label>

        {current && (
          <p className="mt-2 text-[13px] text-ink-500">
            Location: <span className="font-semibold text-ink-700">{current.location}</span>
          </p>
        )}

        <button
          onClick={() => sel && onSignIn(sel)}
          className="mt-5 h-12 w-full rounded-lg bg-brand-600 text-base font-bold text-white transition-colors hover:bg-brand-700"
        >
          Sign in
        </button>

        <p className="mt-5 text-center text-xs text-ink-400">
          Preview — choose an account to explore its screens.
        </p>
      </div>
    </div>
  );
}
