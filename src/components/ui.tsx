import type { ReactNode } from "react";

// Larger, touch-friendly controls — most counter staff aren't IT users, so
// inputs and buttons are deliberately big and legible.
export const inputCls =
  "h-11 rounded-lg border border-ink-200 bg-surface px-3.5 text-base text-ink-800 outline-none placeholder:text-ink-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export const selectCls = inputCls;

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">
        {label}
      </span>
      {children}
    </label>
  );
}

export function PrimaryButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="h-11 rounded-lg bg-brand-600 px-5 text-base font-bold text-white transition-colors hover:bg-brand-700"
    >
      {children}
    </button>
  );
}

/** A form row that sits above a grid (spreadsheet "add row" bar). */
export function AddBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-surface p-3.5">
      {children}
    </div>
  );
}
