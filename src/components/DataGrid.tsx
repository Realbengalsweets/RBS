"use client";

import { useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import {
  AllCommunityModule,
  ModuleRegistry,
  type ColDef,
  type CellValueChangedEvent,
} from "ag-grid-community";
import { rbsGridTheme } from "@/lib/gridTheme";

// Register AG Grid Community modules once (v36 requires explicit registration).
ModuleRegistry.registerModules([AllCommunityModule]);

export type DataGridProps<T> = {
  /** Sheet title shown in the ribbon. */
  title?: string;
  rowData: T[];
  columnDefs: ColDef<T>[];
  /** Allow inline cell editing (spreadsheet feel). */
  editable?: boolean;
  /** Max grid body height in px before it scrolls (ignored when `fill`). */
  height?: number | string;
  /** Let the sheet grow to fill the workbook canvas height. */
  fill?: boolean;
  /** Optional right-aligned action (e.g. an "Add row" button). */
  toolbarActions?: React.ReactNode;
  /** Fired after an inline edit commits — persist the change to the store. */
  onCellValueChanged?: (e: CellValueChangedEvent<T>) => void;
  /** Stable row id (recommended when rows can be edited/deleted). */
  getRowId?: (row: T) => string;
  /** Pinned totals row(s) at the bottom (Excel-style). */
  pinnedBottomRowData?: T[];
};

export default function DataGrid<T>({
  title,
  rowData,
  columnDefs,
  editable = false,
  height = 540,
  fill = false,
  toolbarActions,
  onCellValueChanged,
  getRowId,
  pinnedBottomRowData,
}: DataGridProps<T>) {
  const gridRef = useRef<AgGridReact<T>>(null);
  const [quickFilter, setQuickFilter] = useState("");
  const [colsOpen, setColsOpen] = useState(false);
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  // Data columns the user can show/hide (skip action columns with no field).
  const toggleable = useMemo(() => columnDefs.filter((c) => !!c.field), [columnDefs]);

  const toggleCol = (colId: string) => {
    setHidden((prev) => {
      const next = new Set(prev);
      const willHide = !next.has(colId);
      if (willHide) next.add(colId);
      else next.delete(colId);
      gridRef.current?.api.applyColumnState({ state: [{ colId, hide: willHide }] });
      return next;
    });
  };

  const defaultColDef = useMemo<ColDef<T>>(
    () => ({
      sortable: true,
      filter: true,
      resizable: true,
      editable,
      minWidth: 120,
      flex: 1,
    }),
    [editable],
  );

  const exportCsv = () =>
    gridRef.current?.api.exportDataAsCsv({
      fileName: `${(title ?? "export").replace(/\s+/g, "_")}.csv`,
    });

  // The grid hugs its content (autoHeight) up to this cap, then scrolls — so a
  // sheet with a few rows looks tidy instead of leaving a big empty void.
  const maxHeight = fill
    ? "calc(100vh - 200px)"
    : typeof height === "number"
      ? `${height}px`
      : height;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Ribbon — sheet name + row count on the left, tools on the right. */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-surface-2 px-3.5 py-2.5">
        {title && (
          <h2 className="text-[16px] font-bold tracking-tight text-ink-800">{title}</h2>
        )}
        <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-[12px] font-semibold text-ink-500 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
          {rowData.length} {rowData.length === 1 ? "row" : "rows"}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <input
            value={quickFilter}
            onChange={(e) => setQuickFilter(e.target.value)}
            placeholder="Search this sheet…"
            className="h-11 w-64 rounded-lg border border-ink-200 bg-surface px-3.5 text-base text-ink-800 outline-none transition-all duration-150 placeholder:text-ink-400 hover:border-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <div className="relative">
            <button
              onClick={() => setColsOpen((o) => !o)}
              className="btn btn-outline btn-sm"
            >
              Columns
            </button>
            {colsOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setColsOpen(false)} />
                <div className="absolute right-0 z-20 mt-1 max-h-80 w-60 overflow-auto rounded-lg border border-line bg-surface p-2 shadow-lg">
                  <div className="px-2 py-1 text-[12px] font-semibold uppercase tracking-wide text-ink-400">
                    Show columns
                  </div>
                  {toggleable.map((c) => {
                    const id = String(c.field);
                    const visible = !hidden.has(id);
                    return (
                      <label
                        key={id}
                        className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-1.5 text-[15px] text-ink-700 hover:bg-ink-50"
                      >
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={() => toggleCol(id)}
                          className="h-4 w-4 accent-brand-600"
                        />
                        <span>{c.headerName ?? id}</span>
                      </label>
                    );
                  })}
                </div>
              </>
            )}
          </div>
          <button
            onClick={exportCsv}
            className="btn btn-outline btn-sm"
          >
            Export CSV
          </button>
          {toolbarActions}
        </div>
      </div>
      <div className="overflow-auto" style={{ maxHeight }}>
        <AgGridReact<T>
          ref={gridRef}
          theme={rbsGridTheme}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          quickFilterText={quickFilter}
          onCellValueChanged={onCellValueChanged}
          getRowId={getRowId ? (p) => getRowId(p.data) : undefined}
          pinnedBottomRowData={pinnedBottomRowData}
          domLayout="autoHeight"
          animateRows
        />
      </div>
    </div>
  );
}
