"use client";

import { useMemo, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { AddBar, Field, PrimaryButton, inputCls, selectCls } from "@/components/ui";
import { GridButton, chipRenderer, kg, rightNum } from "@/lib/gridCells";
import { RAW_MATERIALS, useStore, type RawReq } from "@/lib/store";

export default function RawMaterials() {
  const { db, addRawReq, setRaw } = useStore();
  const [material, setMaterial] = useState(RAW_MATERIALS[0]);
  const [customMat, setCustomMat] = useState("");
  const [needed, setNeeded] = useState("");
  const [avail, setAvail] = useState("");

  const cols = useMemo<ColDef<RawReq>[]>(
    () => [
      { field: "id", headerName: "Req #", width: 110 },
      { field: "date", headerName: "Date", width: 100 },
      { field: "material", headerName: "Material", minWidth: 160 },
      { field: "neededKg", headerName: "Needed", width: 110, valueFormatter: kg, ...rightNum },
      { field: "availableKg", headerName: "In warehouse", width: 130, valueFormatter: kg, ...rightNum },
      {
        field: "source",
        headerName: "Source",
        width: 130,
        cellRenderer: chipRenderer({ Warehouse: "info", Vendor: "warn" }),
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        cellRenderer: chipRenderer({ Requested: "warn", Ordered: "info", Received: "ok" }),
      },
      { field: "forOrder", headerName: "For order", width: 120 },
      {
        headerName: "Actions",
        minWidth: 260,
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<RawReq>) => {
          const r = p.data;
          if (!r) return null;
          if (r.status === "Received") return <span className="text-ink-400">—</span>;
          const enough = r.availableKg >= r.neededKg;
          return (
            <div className="flex items-center">
              <GridButton
                label="Order from Warehouse"
                tone={enough ? "brand" : "default"}
                onClick={() => setRaw(r.id, { source: "Warehouse", status: "Ordered" })}
              />
              <GridButton
                label="Contact Vendor"
                tone={enough ? "default" : "brand"}
                onClick={() => setRaw(r.id, { source: "Vendor", status: "Ordered" })}
              />
            </div>
          );
        },
      },
    ],
    [setRaw],
  );

  function submit() {
    const mat = material === "Other" ? customMat.trim() : material;
    const n = parseFloat(needed);
    if (!mat || !n || n <= 0) return;
    addRawReq(mat, n, parseFloat(avail) || 0);
    setMaterial(RAW_MATERIALS[0]);
    setCustomMat("");
    setNeeded("");
    setAvail("");
  }

  return (
    <div className="space-y-3">
      <AddBar>
        <Field label="Raw material">
          <select className={selectCls} value={material} onChange={(e) => setMaterial(e.target.value)}>
            {RAW_MATERIALS.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        {material === "Other" && (
          <Field label="Specify material">
            <input
              className={`${inputCls} w-40`}
              value={customMat}
              onChange={(e) => setCustomMat(e.target.value)}
              placeholder="Material name"
            />
          </Field>
        )}
        <Field label="Needed (kg)">
          <input className={`${inputCls} w-28`} type="number" min="0" value={needed} onChange={(e) => setNeeded(e.target.value)} />
        </Field>
        <Field label="In warehouse (kg)">
          <input className={`${inputCls} w-32`} type="number" min="0" value={avail} onChange={(e) => setAvail(e.target.value)} />
        </Field>
        <PrimaryButton onClick={submit}>Raise request</PrimaryButton>
        <span className="ml-auto self-center text-xs text-ink-500">
          If warehouse has enough, order from warehouse; otherwise contact a vendor.
        </span>
      </AddBar>

      <DataGrid
        title="Raw Materials & Vendors"
        rowData={db.raw}
        columnDefs={cols}
        getRowId={(r) => r.id}
        height={440}
      />
    </div>
  );
}
