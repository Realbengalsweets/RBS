"use client";

import { useMemo, useState } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { AddBar, Field, PrimaryButton, inputCls, selectCls } from "@/components/ui";
import { GridButton } from "@/lib/gridCells";
import { VENDOR_CATEGORIES, type Vendor } from "@/lib/store";
import { useCatalog } from "@/lib/useCatalog";

export default function VendorsSheet() {
  const { vendors, addVendor, updateVendor, deleteVendor } = useCatalog();

  const [vName, setVName] = useState("");
  const [vCat, setVCat] = useState(VENDOR_CATEGORIES[0]);
  const [vContact, setVContact] = useState("");

  const vendorCols = useMemo<ColDef<Vendor>[]>(
    () => [
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
          p.data ? <GridButton label="Delete" tone="danger" onClick={() => deleteVendor(p.data!.id)} /> : null,
      },
    ],
    [deleteVendor],
  );

  function submitVendor() {
    if (!vName.trim()) return;
    addVendor(vName.trim(), vCat, vContact.trim());
    setVName("");
    setVContact("");
  }

  return (
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
        title={`Vendors (${vendors.length})`}
        rowData={vendors}
        columnDefs={vendorCols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<Vendor>) => updateVendor(e.data.id, { ...e.data })}
        fill
      />
    </div>
  );
}
