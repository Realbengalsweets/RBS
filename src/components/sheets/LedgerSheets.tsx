"use client";

import { useMemo, useState } from "react";
import type { CellValueChangedEvent, ColDef, ValueFormatterParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { AddBar, Field, PrimaryButton, inputCls, selectCls } from "@/components/ui";
import { GridButton, chipRenderer, kg, money, rightNum } from "@/lib/gridCells";
import {
  PAY_STATUS,
  useStore,
  type GasOrder,
  type InvRow,
  type MilkOrder,
  type Transfer,
} from "@/lib/store";

const litre = (p: ValueFormatterParams) => (p.value == null || p.value === "" ? "" : `${p.value} L`);

/* Reusable delete-column factory. */
function deleteCol<T extends { id: string }>(onDelete: (id: string) => void): ColDef<T> {
  return {
    headerName: "",
    width: 96,
    pinned: "right",
    sortable: false,
    filter: false,
    editable: false,
    cellRenderer: (p: { data?: T }) =>
      p.data ? <GridButton label="Delete" tone="danger" onClick={() => onDelete(p.data!.id)} /> : null,
  };
}

/* ========================= PRODUCT TRANSFER ========================= */
export function ProductTransfer() {
  const { db, addRow, updateRow, deleteRow } = useStore();
  const products = db.products.map((p) => p.name);
  const staff = db.users.map((u) => u.name);
  const [product, setProduct] = useState(() => db.products[0]?.name ?? "");
  const [qty, setQty] = useState("");
  const [batch, setBatch] = useState("");
  const [from, setFrom] = useState(db.locations[0]);
  const [to, setTo] = useState(db.locations[3] ?? db.locations[0]);

  const cols = useMemo<ColDef<Transfer>[]>(
    () => [
      { field: "id", headerName: "Ref #", width: 100, editable: false },
      { field: "date", headerName: "Date", width: 100 },
      { field: "product", headerName: "Product", minWidth: 160, cellEditor: "agSelectCellEditor", cellEditorParams: { values: products } },
      { field: "batch", headerName: "Batch", minWidth: 120 },
      { field: "qtyKg", headerName: "Qty", width: 100, valueFormatter: kg, ...rightNum },
      { field: "from", headerName: "From", minWidth: 130, cellEditor: "agSelectCellEditor", cellEditorParams: { values: db.locations } },
      { field: "to", headerName: "To", minWidth: 130, cellEditor: "agSelectCellEditor", cellEditorParams: { values: db.locations } },
      { field: "dispatchedBy", headerName: "Dispatched by", minWidth: 140, cellEditor: "agSelectCellEditor", cellEditorParams: { values: staff } },
      { field: "receivedBy", headerName: "Received by", minWidth: 130, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["—", ...staff] } },
      { field: "status", headerName: "Status", width: 140, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["Sent", "Dispatched", "Received"] }, cellRenderer: chipRenderer({ Sent: "warn", Dispatched: "info", Received: "ok" }) },
      deleteCol<Transfer>((id) => deleteRow("transfers", id)),
    ],
    [products, staff, deleteRow, db.locations],
  );

  function add() {
    const q = parseFloat(qty);
    if (!product || !q || q <= 0) return;
    addRow("transfers", { date: "10 Jul", product, batch: batch || "—", qtyKg: q, from, to, dispatchedBy: staff[0] ?? "—", receivedBy: "—", status: "Sent" });
    setQty("");
    setBatch("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AddBar>
        <Field label="Product">
          <select className={selectCls} value={product} onChange={(e) => setProduct(e.target.value)}>
            {db.products.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Qty (kg)"><input className={`${inputCls} w-24`} type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Batch"><input className={`${inputCls} w-28`} value={batch} onChange={(e) => setBatch(e.target.value)} placeholder="LOT-…" /></Field>
        <Field label="From">
          <select className={selectCls} value={from} onChange={(e) => setFrom(e.target.value)}>{db.locations.map((l) => <option key={l}>{l}</option>)}</select>
        </Field>
        <Field label="To">
          <select className={selectCls} value={to} onChange={(e) => setTo(e.target.value)}>{db.locations.map((l) => <option key={l}>{l}</option>)}</select>
        </Field>
        <PrimaryButton onClick={add}>Record transfer</PrimaryButton>
      </AddBar>
      <DataGrid title="Product Transfer" rowData={db.transfers} columnDefs={cols} editable getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<Transfer>) => updateRow("transfers", e.data.id, { ...e.data, qtyKg: Number(e.data.qtyKg) })} fill />
    </div>
  );
}

/* ========================= PRODUCT INVENTORY ======================== */
export function ProductInventory() {
  const { db, updateRow, deleteRow } = useStore();
  const products = db.products.map((p) => p.name);
  const cols = useMemo<ColDef<InvRow>[]>(
    () => [
      { field: "product", headerName: "Product", minWidth: 160, cellEditor: "agSelectCellEditor", cellEditorParams: { values: products } },
      { field: "location", headerName: "Location", minWidth: 140, cellEditor: "agSelectCellEditor", cellEditorParams: { values: db.locations } },
      { field: "batch", headerName: "Batch No", minWidth: 120 },
      { field: "mfgDate", headerName: "Mfg Date", width: 120 },
      { field: "expiry", headerName: "Expiry", width: 120 },
      { field: "opening", headerName: "Opening", width: 120, valueFormatter: kg, ...rightNum },
      { field: "inQty", headerName: "In", width: 100, valueFormatter: kg, ...rightNum },
      { field: "outQty", headerName: "Out", width: 100, valueFormatter: kg, ...rightNum },
      { field: "closing", headerName: "Closing", width: 120, valueFormatter: kg, ...rightNum },
      { field: "status", headerName: "Status", width: 150, cellEditor: "agSelectCellEditor", cellEditorParams: { values: ["In stock", "Low", "Out of stock"] }, cellRenderer: chipRenderer({ "In stock": "ok", Low: "warn", "Out of stock": "danger" }) },
      deleteCol<InvRow>((id) => deleteRow("inventory", id)),
    ],
    [products, deleteRow, db.locations],
  );
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <DataGrid title="Product Inventory (live, kg)" rowData={db.inventory} columnDefs={cols} editable getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<InvRow>) => updateRow("inventory", e.data.id, { ...e.data })} fill />
    </div>
  );
}

/* ============================= MILK ORDER =========================== */
export function MilkOrderSheet() {
  const { db, addRow, updateRow, deleteRow } = useStore();
  const vendors = db.vendors.map((v) => v.name);
  const staff = db.users.map((u) => u.name);
  const [vendor, setVendor] = useState(() => db.vendors[0]?.name ?? "");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("70");
  const [payment, setPayment] = useState(PAY_STATUS[0]);
  const [location, setLocation] = useState(db.locations[0]);

  const cols = useMemo<ColDef<MilkOrder>[]>(
    () => [
      { field: "id", headerName: "Ref #", width: 100, editable: false },
      { field: "date", headerName: "Date", width: 110 },
      { field: "vendor", headerName: "Dairy / Vendor", minWidth: 160, cellEditor: "agSelectCellEditor", cellEditorParams: { values: vendors } },
      { field: "qtyL", headerName: "Qty", width: 100, valueFormatter: litre, ...rightNum },
      { field: "rate", headerName: "Rate", width: 100, valueFormatter: money, ...rightNum },
      { field: "amount", headerName: "Amount", width: 120, valueFormatter: money, editable: false, ...rightNum },
      { field: "payment", headerName: "Payment", width: 120, cellEditor: "agSelectCellEditor", cellEditorParams: { values: PAY_STATUS }, cellRenderer: chipRenderer({ Paid: "ok", Pending: "warn" }) },
      { field: "location", headerName: "Received at", minWidth: 130, cellEditor: "agSelectCellEditor", cellEditorParams: { values: db.locations } },
      { field: "receivedBy", headerName: "Received by", minWidth: 130, cellEditor: "agSelectCellEditor", cellEditorParams: { values: staff } },
      deleteCol<MilkOrder>((id) => deleteRow("milk", id)),
    ],
    [vendors, staff, deleteRow, db.locations],
  );

  function add() {
    const q = parseFloat(qty), r = parseFloat(rate);
    if (!vendor || !q || q <= 0 || !r) return;
    addRow("milk", { date: "10 Jul", vendor, qtyL: q, rate: r, amount: Math.round(q * r), payment, location, receivedBy: staff[0] ?? "—" });
    setQty("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AddBar>
        <Field label="Dairy / Vendor">
          <select className={selectCls} value={vendor} onChange={(e) => setVendor(e.target.value)}>{db.vendors.map((v) => <option key={v.id}>{v.name}</option>)}</select>
        </Field>
        <Field label="Qty (L)"><input className={`${inputCls} w-24`} type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Rate (₹/L)"><input className={`${inputCls} w-24`} type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Payment"><select className={selectCls} value={payment} onChange={(e) => setPayment(e.target.value)}>{PAY_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Received at"><select className={selectCls} value={location} onChange={(e) => setLocation(e.target.value)}>{db.locations.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <PrimaryButton onClick={add}>Add milk order</PrimaryButton>
      </AddBar>
      <DataGrid title="Milk Order" rowData={db.milk} columnDefs={cols} editable getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<MilkOrder>) => updateRow("milk", e.data.id, { ...e.data, qtyL: Number(e.data.qtyL), rate: Number(e.data.rate), amount: Math.round(Number(e.data.qtyL) * Number(e.data.rate)) })} fill />
    </div>
  );
}

/* ============================== GAS ORDER =========================== */
export function GasOrderSheet() {
  const { db, addRow, updateRow, deleteRow } = useStore();
  const vendors = db.vendors.map((v) => v.name);
  const staff = db.users.map((u) => u.name);
  const [vendor, setVendor] = useState(() => db.vendors.find((v) => v.category === "Fuel / Gas")?.name ?? db.vendors[0]?.name ?? "");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("100");
  const [payment, setPayment] = useState(PAY_STATUS[0]);
  const [location, setLocation] = useState(db.locations[0]);

  const cols = useMemo<ColDef<GasOrder>[]>(
    () => [
      { field: "id", headerName: "Ref #", width: 100, editable: false },
      { field: "date", headerName: "Date", width: 110 },
      { field: "vendor", headerName: "Vendor", minWidth: 150, cellEditor: "agSelectCellEditor", cellEditorParams: { values: vendors } },
      { field: "qtyKg", headerName: "Qty", width: 100, valueFormatter: kg, ...rightNum },
      { field: "rate", headerName: "Rate", width: 100, valueFormatter: money, ...rightNum },
      { field: "amount", headerName: "Amount", width: 120, valueFormatter: money, editable: false, ...rightNum },
      { field: "payment", headerName: "Payment", width: 120, cellEditor: "agSelectCellEditor", cellEditorParams: { values: PAY_STATUS }, cellRenderer: chipRenderer({ Paid: "ok", Pending: "warn" }) },
      { field: "location", headerName: "Location", minWidth: 130, cellEditor: "agSelectCellEditor", cellEditorParams: { values: db.locations } },
      { field: "receivedBy", headerName: "Received by", minWidth: 130, cellEditor: "agSelectCellEditor", cellEditorParams: { values: staff } },
      deleteCol<GasOrder>((id) => deleteRow("gas", id)),
    ],
    [vendors, staff, deleteRow, db.locations],
  );

  function add() {
    const q = parseFloat(qty), r = parseFloat(rate);
    if (!vendor || !q || q <= 0 || !r) return;
    addRow("gas", { date: "10 Jul", vendor, qtyKg: q, rate: r, amount: Math.round(q * r), payment, location, receivedBy: staff[0] ?? "—" });
    setQty("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <AddBar>
        <Field label="Vendor">
          <select className={selectCls} value={vendor} onChange={(e) => setVendor(e.target.value)}>{db.vendors.map((v) => <option key={v.id}>{v.name}</option>)}</select>
        </Field>
        <Field label="Qty (kg)"><input className={`${inputCls} w-24`} type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)} /></Field>
        <Field label="Rate (₹/kg)"><input className={`${inputCls} w-24`} type="number" min="0" value={rate} onChange={(e) => setRate(e.target.value)} /></Field>
        <Field label="Payment"><select className={selectCls} value={payment} onChange={(e) => setPayment(e.target.value)}>{PAY_STATUS.map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Location"><select className={selectCls} value={location} onChange={(e) => setLocation(e.target.value)}>{db.locations.map((l) => <option key={l}>{l}</option>)}</select></Field>
        <PrimaryButton onClick={add}>Add gas order</PrimaryButton>
      </AddBar>
      <DataGrid title="Gas Order" rowData={db.gas} columnDefs={cols} editable getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<GasOrder>) => updateRow("gas", e.data.id, { ...e.data, qtyKg: Number(e.data.qtyKg), rate: Number(e.data.rate), amount: Math.round(Number(e.data.qtyKg) * Number(e.data.rate)) })} fill />
    </div>
  );
}
