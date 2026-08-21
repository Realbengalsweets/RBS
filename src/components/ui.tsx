import type { ReactNode } from "react";

// Larger, touch-friendly controls — most counter staff aren't IT users, so
// inputs and buttons are deliberately big and legible.
export const inputCls =
  "h-11 rounded-lg border border-ink-200 bg-surface px-3.5 text-base text-ink-800 outline-none transition-all duration-150 placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

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

type BtnProps = {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
};

export function PrimaryButton({ children, onClick, type = "button", disabled, className = "" }: BtnProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-primary ${className}`}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, type = "button", disabled, className = "" }: BtnProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-outline ${className}`}>
      {children}
    </button>
  );
}

export function GhostButton({ children, onClick, type = "button", disabled, className = "" }: BtnProps) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn btn-ghost ${className}`}>
      {children}
    </button>
  );
}

/** A form row that sits above a grid (spreadsheet "add row" bar). */
export function AddBar({ children }: { children: ReactNode }) {
  return (
    <div className="card flex flex-wrap items-end gap-3 p-3.5">
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * StatCard — the KPI tile used across dashboards (label · big number · delta),
 * modelled on the reference dashboards. Optional colored icon badge + trend.
 * ------------------------------------------------------------------------- */
type Tone = "brand" | "ok" | "warn" | "danger" | "info" | "neutral";

const toneBadge: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-700",
  ok: "bg-[color:var(--color-ok-bg)] text-[color:var(--color-ok)]",
  warn: "bg-[color:var(--color-warn-bg)] text-[color:var(--color-warn)]",
  danger: "bg-[color:var(--color-danger-bg)] text-[color:var(--color-danger)]",
  info: "bg-[color:var(--color-info-bg)] text-[color:var(--color-info)]",
  neutral: "bg-ink-100 text-ink-600",
};

export function StatCard({
  label,
  value,
  delta,
  deltaTone = "ok",
  hint,
  icon,
  iconTone = "brand",
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  deltaTone?: "ok" | "danger" | "neutral";
  hint?: string;
  icon?: ReactNode;
  iconTone?: Tone;
}) {
  const deltaColor =
    deltaTone === "ok" ? "text-[color:var(--color-ok)]" : deltaTone === "danger" ? "text-danger" : "text-ink-500";
  return (
    <div className="card card-hover p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">{label}</div>
        {icon && (
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${toneBadge[iconTone]}`}>{icon}</div>
        )}
      </div>
      <div className="mt-2 text-[32px] font-black leading-none tracking-tight text-ink-900">{value}</div>
      {(delta || hint) && (
        <div className="mt-2 flex items-center gap-1.5 text-[13px]">
          {delta && <span className={`font-bold ${deltaColor}`}>{delta}</span>}
          {hint && <span className="font-medium text-ink-400">{hint}</span>}
        </div>
      )}
    </div>
  );
}
