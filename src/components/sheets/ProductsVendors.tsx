"use client";

import { useMemo, useState } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { AddBar, Field, PrimaryButton, inputCls, selectCls } from "@/components/ui";
import { GridButton, money, rightNum } from "@/lib/gridCells";
import { VENDOR_CATEGORIES, useStore, type Product, type Vendor } from "@/lib/store";

const days = (p: ValueFormatterParams) =>
  p.value == null || p.value === "" ? "" : `${p.value} days`;

export default function ProductsVendors() {
  const { db, addProduct, addVendor, updateRow, deleteRow } = useStore();

  // Product form
  const [pName, setPName] = useState("");
  const [pRate, setPRate] = useState("");
  const [pExp, setPExp] = useState("15");

  // Vendor form
  const [vName, setVName] = useState("");
  const [vCat, setVCat] = useState(VENDOR_CATEGORIES[0]);
  const [vContact, setVContact] = useState("");

  const productCols = useMemo<ColDef<Product>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90, editable: false },
      { field: "name", headerName: "Product", minWidth: 200 },
      { field: "rate", headerName: "Price (₹/kg)", width: 150, valueFormatter: money, ...rightNum },
      { field: "expiryDays", headerName: "Expiry period", width: 150, valueFormatter: days, ...rightNum },
      {
        headerName: "",
        width: 96,
        pinned: "right",
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<Product>) =>
          p.data ? <GridButton label="Delete" tone="danger" onClick={() => deleteRow("products", p.data!.id)} /> : null,
      },
    ],
    [deleteRow],
  );

  const vendorCols = useMemo<ColDef<Vendor>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90, editable: false },
      { field: "name", headerName: "Vendor", minWidth: 200 },
      {
        field: "category",
        headerName: "Category / supplies",
        minWidth: 180,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: VENDOR_CATEGORIES },
      },
      { field: "contact", headerName: "Contact", minWidth: 160 },
      {
        headerName: "",
        width: 96,
        pinned: "right",
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<Vendor>) =>
          p.data ? <GridButton label="Delete" tone="danger" onClick={() => deleteRow("vendors", p.data!.id)} /> : null,
      },
    ],
    [deleteRow],
  );

  function submitProduct() {
    const rate = parseFloat(pRate);
    if (!pName.trim() || !rate || rate <= 0) return;
    addProduct(pName.trim(), rate, parseInt(pExp) || 0);
    setPName("");
    setPRate("");
    setPExp("15");
  }

  function submitVendor() {
    if (!vName.trim()) return;
    addVendor(vName.trim(), vCat, vContact.trim());
    setVName("");
    setVContact("");
  }

  return (
    <div className="space-y-6">
      {/* Products */}
      <div className="space-y-3">
        <AddBar>
          <Field label="Product name">
            <input className={`${inputCls} w-48`} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Besan Laddu" />
          </Field>
          <Field label="Price (₹/kg)">
            <input className={`${inputCls} w-28`} type="number" min="0" value={pRate} onChange={(e) => setPRate(e.target.value)} />
          </Field>
          <Field label="Expiry period (days)">
            <input className={`${inputCls} w-32`} type="number" min="0" value={pExp} onChange={(e) => setPExp(e.target.value)} />
          </Field>
          <PrimaryButton onClick={submitProduct}>Add product</PrimaryButton>
          <span className="ml-auto self-center text-xs text-ink-500">
            Set price and shelf life here — used across ordering, billing and expiry.
          </span>
        </AddBar>
        <DataGrid
          title={`Products (${db.products.length})`}
          rowData={db.products}
          columnDefs={productCols}
          editable
          getRowId={(r) => r.id}
          onCellValueChanged={(e: CellValueChangedEvent<Product>) =>
            updateRow("products", e.data.id, {
              name: e.data.name,
              rate: Number(e.data.rate),
              expiryDays: Number(e.data.expiryDays),
            })
          }
          height={320}
        />
      </div>

      {/* Vendors */}
      <div className="space-y-3">
        <AddBar>
          <Field label="Vendor name">
            <input className={`${inputCls} w-48`} value={vName} onChange={(e) => setVName(e.target.value)} placeholder="e.g. Sharma Traders" />
          </Field>
          <Field label="Category">
            <select className={selectCls} value={vCat} onChange={(e) => setVCat(e.target.value)}>
              {VENDOR_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Contact">
            <input className={`${inputCls} w-40`} value={vContact} onChange={(e) => setVContact(e.target.value)} placeholder="phone / email" />
          </Field>
          <PrimaryButton onClick={submitVendor}>Add vendor</PrimaryButton>
        </AddBar>
        <DataGrid
          title={`Vendors (${db.vendors.length})`}
          rowData={db.vendors}
          columnDefs={vendorCols}
          editable
          getRowId={(r) => r.id}
          onCellValueChanged={(e: CellValueChangedEvent<Vendor>) => updateRow("vendors", e.data.id, { ...e.data })}
          height={300}
        />
      </div>
    </div>
  );
}
