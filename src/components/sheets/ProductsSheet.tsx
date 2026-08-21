"use client";

import { useMemo, useState } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { AddBar, Field, PrimaryButton, inputCls } from "@/components/ui";
import { GridButton, money, rightNum } from "@/lib/gridCells";
import type { Product } from "@/lib/store";
import { useCatalog } from "@/lib/useCatalog";

const days = (p: ValueFormatterParams) =>
  p.value == null || p.value === "" ? "" : `${p.value} days`;

export default function ProductsSheet() {
  const { products, addProduct, updateProduct, deleteProduct } = useCatalog();

  const [pName, setPName] = useState("");
  const [pRate, setPRate] = useState("");
  const [pExp, setPExp] = useState("15");

  const productCols = useMemo<ColDef<Product>[]>(
    () => [
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
          p.data ? <GridButton label="Delete" tone="danger" onClick={() => deleteProduct(p.data!.id)} /> : null,
      },
    ],
    [deleteProduct],
  );

  function submitProduct() {
    const rate = parseFloat(pRate);
    if (!pName.trim() || !rate || rate <= 0) return;
    addProduct(pName.trim(), rate, parseInt(pExp) || 0);
    setPName("");
    setPRate("");
    setPExp("15");
  }

  return (
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
        title={`Products (${products.length})`}
        rowData={products}
        columnDefs={productCols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<Product>) =>
          updateProduct(e.data.id, {
            name: e.data.name,
            rate: Number(e.data.rate),
            expiryDays: Number(e.data.expiryDays),
          })
        }
        fill
      />
    </div>
  );
}
