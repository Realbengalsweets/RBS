import type { ICellRendererParams, ValueFormatterParams } from "ag-grid-community";

/** Right-align numeric cells (spreadsheet convention). */
export const rightNum = { cellStyle: { textAlign: "right" as const } };

/** ₹ formatter for amount columns. */
export const money = (p: ValueFormatterParams) =>
  p.value == null || p.value === ""
    ? ""
    : "₹" + Number(p.value).toLocaleString("en-IN");

/** "12 kg" formatter for quantity columns. */
export const kg = (p: ValueFormatterParams) =>
  p.value == null || p.value === "" ? "" : `${p.value} kg`;

/** Status chip cell renderer factory — maps a value to a themed chip. */
export function chipRenderer(map: Record<string, string>) {
  return (p: ICellRendererParams) => {
    const v = (p.value ?? "") as string;
    if (!v) return null;
    const cls = map[v] ?? "neutral";
    return (
      <span className={`chip ${cls}`}>
        <span className="dot" />
        {v}
      </span>
    );
  };
}

/** A small pill button used inside grid action cells. */
export function GridButton({
  label,
  tone = "default",
  onClick,
}: {
  label: string;
  tone?: "default" | "brand" | "danger";
  onClick: () => void;
}) {
  const tones: Record<string, string> = {
    default: "border-ink-200 text-ink-700 hover:bg-ink-50 hover:border-ink-300 hover:shadow-sm",
    brand: "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 hover:shadow-sm",
    // Subtle by default, turns red on hover — avoids a wall of red pills.
    danger: "border-transparent text-ink-400 hover:bg-red-50 hover:text-danger",
  };
  return (
    <button
      onClick={onClick}
      className={`mr-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold transition-all duration-150 hover:-translate-y-px active:translate-y-0 active:scale-95 ${tones[tone]}`}
    >
      {label}
    </button>
  );
}
