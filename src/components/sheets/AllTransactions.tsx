"use client";

import { useMemo } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { GridButton, chipRenderer, kg, money, rightNum } from "@/lib/gridCells";
import { useAllRecords, type AnyRecord } from "@/lib/useAllRecords";

const STATUS_CHIPS = {
  Pending: "warn",
  Accepted: "info",
  Dispatched: "info",
  Received: "ok",
  Requested: "warn",
  Ordered: "info",
  "Not received": "danger",
};

/** The Super Admin's single view of every record — bills, orders and raw
 *  material requests together. Reads/writes are Supabase-backed when configured. */
export default function AllTransactions() {
  const { rows, locations, updateRecord, deleteRecord } = useAllRecords();

  // One sales column per location, auto-generated from the location list, so
  // the Super Admin sees every shop/factory/warehouse's sales in one sheet.
  const locCols = useMemo<ColDef<AnyRecord>[]>(
    () =>
      locations.map((loc) => ({
        headerName: loc,
        colId: `loc:${loc}`,
        width: 130,
        editable: false,
        filter: false,
        ...rightNum,
        valueGetter: (p) => {
          const data = p.data as (AnyRecord & Record<string, number>) | undefined;
          if (!data) return "";
          if (p.node?.rowPinned) return data[`loc:${loc}`] || "";
          return data.location === loc && typeof data.amount === "number" ? data.amount : "";
        },
        valueFormatter: money,
      })),
    [locations],
  );

  const cols = useMemo<ColDef<AnyRecord>[]>(
    () => [
      { field: "type", headerName: "Type", width: 130, editable: false, cellRenderer: chipRenderer({ Bill: "info", Order: "neutral", "Raw material": "warn" }) },
      { field: "ref", headerName: "Ref #", width: 120, editable: false },
      { field: "date", headerName: "Date", width: 100, editable: false },
      { field: "location", headerName: "Location", minWidth: 120, cellEditor: "agSelectCellEditor", cellEditorParams: { values: locations } },
      { field: "party", headerName: "Customer / Vendor", minWidth: 160 },
      { field: "item", headerName: "Item / Product", minWidth: 160, editable: (p) => p.data?.type === "Raw material" },
      { field: "qtyKg", headerName: "Qty", width: 100, valueFormatter: kg, editable: (p) => p.data?.type === "Raw material", ...rightNum },
      { field: "amount", headerName: "Amount", width: 120, valueFormatter: money, editable: false, ...rightNum },
      // Per-location sales monitor columns.
      ...locCols,
      { field: "payment", headerName: "Payment", width: 120, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["", "Cash", "Online", "Card"] }, cellRenderer: chipRenderer({ Cash: "neutral", Online: "info", Card: "info" }) },
      { field: "status", headerName: "Status", width: 140, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["", "Pending", "Accepted", "Dispatched", "Received", "Requested", "Ordered"] }, cellRenderer: chipRenderer(STATUS_CHIPS) },
      {
        headerName: "",
        width: 96,
        pinned: "right",
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<AnyRecord>) =>
          p.data && !p.node?.rowPinned ? <GridButton label="Delete" tone="danger" onClick={() => deleteRecord(p.data!.kind, p.data!.id)} /> : null,
      },
    ],
    [deleteRecord, locations, locCols],
  );

  // Pinned totals row — grand total + per-location sales totals.
  const grandTotal = rows.reduce((a, r) => a + (typeof r.amount === "number" ? r.amount : 0), 0);
  const perLoc: Record<string, number> = {};
  for (const loc of locations) {
    perLoc[`loc:${loc}`] = rows
      .filter((r) => r.location === loc && typeof r.amount === "number")
      .reduce((a, r) => a + (r.amount as number), 0);
  }
  const totalsRow = [
    {
      key: "TOTAL", kind: "bills", id: "TOTAL", ref: "TOTAL", type: "Bill",
      date: "", location: "", party: "", item: "", qtyKg: "", amount: grandTotal, payment: "", status: "",
      ...perLoc,
    } as unknown as AnyRecord,
  ];

  // Map an edit on the flat row back to the correct field of the source record.
  const onEdit = (e: CellValueChangedEvent<AnyRecord>) => {
    const r = e.data;
    const field = e.colDef.field;
    if (r.kind === "bills") {
      // Item / qty / amount come from the invoice's line items → read-only here.
      if (field === "party") updateRecord("bills", r.id, { customer: r.party });
      else if (field === "location") updateRecord("bills", r.id, { shop: r.location });
      else if (field === "payment") updateRecord("bills", r.id, { pay: r.payment });
    } else if (r.kind === "orders") {
      if (field === "location") updateRecord("orders", r.id, { shop: r.location });
      else if (field === "status") updateRecord("orders", r.id, { status: r.status });
    } else if (r.kind === "raw") {
      if (field === "party") updateRecord("raw", r.id, { source: r.party });
      else if (field === "item") updateRecord("raw", r.id, { material: r.item });
      else if (field === "qtyKg") updateRecord("raw", r.id, { neededKg: Number(r.qtyKg) });
      else if (field === "status") updateRecord("raw", r.id, { status: r.status });
    }
  };

  return (
    <DataGrid
      title={`All Records (${rows.length})`}
      rowData={rows}
      columnDefs={cols}
      editable
      getRowId={(r) => r.key}
      onCellValueChanged={onEdit}
      pinnedBottomRowData={totalsRow}
      fill
    />
  );
}
