"use client";

import { useMemo } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { GridButton, chipRenderer, kg, money, rightNum } from "@/lib/gridCells";
import { useStore, type Kind } from "@/lib/store";

/** One flat row shape for every record type — so the Super Admin sees
 *  everything in a single sheet without switching tabs. */
type AnyRecord = {
  key: string; // grid row id (kind + id)
  kind: Kind; // source collection
  id: string; // source record id
  type: "Bill" | "Order" | "Raw material";
  date: string;
  location: string;
  party: string; // customer / vendor-source
  item: string;
  qtyKg: number;
  amount: number | "";
  payment: string;
  status: string;
};

const STATUS_CHIPS = {
  Pending: "warn",
  Accepted: "info",
  Dispatched: "info",
  Received: "ok",
  Requested: "warn",
  Ordered: "info",
  "Not received": "danger",
};

export default function AllTransactions() {
  const { db, updateRow, deleteRow } = useStore();

  const rows = useMemo<AnyRecord[]>(() => {
    const bills: AnyRecord[] = db.bills.map((b) => ({
      key: `bills:${b.id}`, kind: "bills", id: b.id, type: "Bill", date: b.time,
      location: b.shop, party: b.customer, item: b.items.map((i) => i.item).join(", "), qtyKg: b.qtyKg, amount: b.amount, payment: b.pay, status: "",
    }));
    const orders: AnyRecord[] = db.orders.map((o) => ({
      key: `orders:${o.id}`, kind: "orders", id: o.id, type: "Order", date: o.date,
      location: o.shop, party: "—", item: o.items.map((i) => i.product).join(", "), qtyKg: o.qtyKg, amount: "", payment: "", status: o.status,
    }));
    const raw: AnyRecord[] = db.raw.map((r) => ({
      key: `raw:${r.id}`, kind: "raw", id: r.id, type: "Raw material", date: r.date,
      location: "Factory", party: r.source, item: r.material, qtyKg: r.neededKg, amount: "", payment: "", status: r.status,
    }));
    return [...bills, ...orders, ...raw];
  }, [db]);

  const cols = useMemo<ColDef<AnyRecord>[]>(
    () => [
      { field: "type", headerName: "Type", width: 130, editable: false, cellRenderer: chipRenderer({ Bill: "info", Order: "neutral", "Raw material": "warn" }) },
      { field: "id", headerName: "Ref #", width: 110, editable: false },
      { field: "date", headerName: "Date", width: 100, editable: false },
      { field: "location", headerName: "Location", minWidth: 120, cellEditor: "agSelectCellEditor", cellEditorParams: { values: db.locations } },
      { field: "party", headerName: "Customer / Vendor", minWidth: 160 },
      { field: "item", headerName: "Item / Product", minWidth: 160, editable: (p) => p.data?.type === "Raw material" },
      { field: "qtyKg", headerName: "Qty", width: 100, valueFormatter: kg, editable: (p) => p.data?.type === "Raw material", ...rightNum },
      { field: "amount", headerName: "Amount", width: 120, valueFormatter: money, editable: false, ...rightNum },
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
          p.data ? <GridButton label="Delete" tone="danger" onClick={() => deleteRow(p.data!.kind, p.data!.id)} /> : null,
      },
    ],
    [deleteRow, db.locations],
  );

  // Map an edit on the flat row back to the correct field of the source record.
  const onEdit = (e: CellValueChangedEvent<AnyRecord>) => {
    const r = e.data;
    const field = e.colDef.field;
    if (r.kind === "bills") {
      // Item / qty / amount are derived from the invoice's line items, so they
      // stay read-only here; the rest can be corrected inline.
      if (field === "party") updateRow("bills", r.id, { customer: r.party });
      else if (field === "location") updateRow("bills", r.id, { shop: r.location });
      else if (field === "payment") updateRow("bills", r.id, { pay: r.payment });
    } else if (r.kind === "orders") {
      // Products / qty are derived from the order's lines, so they're read-only here.
      if (field === "location") updateRow("orders", r.id, { shop: r.location });
      else if (field === "status") updateRow("orders", r.id, { status: r.status });
    } else if (r.kind === "raw") {
      if (field === "party") updateRow("raw", r.id, { source: r.party });
      else if (field === "item") updateRow("raw", r.id, { material: r.item });
      else if (field === "qtyKg") updateRow("raw", r.id, { neededKg: Number(r.qtyKg) });
      else if (field === "status") updateRow("raw", r.id, { status: r.status });
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
      fill
    />
  );
}
