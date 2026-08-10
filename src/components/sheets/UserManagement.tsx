"use client";

import { useMemo, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { AddBar, Field, PrimaryButton, inputCls, selectCls } from "@/components/ui";
import { GridButton, chipRenderer } from "@/lib/gridCells";
import { ROLES, useStore, type User } from "@/lib/store";

export default function UserManagement() {
  const { db, addUser, addLocation, removeLocation, deleteRow, updateRow } = useStore();
  // Location options = the Super Admin's editable list + two catch-all entries.
  const locationOptions = useMemo(() => [...db.locations, "All locations", "Others"], [db.locations]);

  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[4]); // Shop Admin
  const [location, setLocation] = useState(db.locations[3] ?? db.locations[0]);
  const [newLoc, setNewLoc] = useState("");

  const cols = useMemo<ColDef<User>[]>(
    () => [
      { field: "id", headerName: "ID", width: 90, editable: false },
      { field: "name", headerName: "Name", minWidth: 190 },
      {
        field: "role",
        headerName: "Role",
        minWidth: 180,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ROLES },
      },
      {
        field: "location",
        headerName: "Location",
        minWidth: 150,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: locationOptions },
      },
      {
        field: "status",
        headerName: "Status",
        width: 130,
        cellEditor: "agSelectCellEditor",
        cellEditorParams: { values: ["Active", "Inactive"] },
        cellRenderer: chipRenderer({ Active: "ok", Inactive: "neutral" }),
      },
      {
        headerName: "",
        width: 96,
        pinned: "right",
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<User>) =>
          p.data ? (
            <GridButton label="Delete" tone="danger" onClick={() => deleteRow("users", p.data!.id)} />
          ) : null,
      },
    ],
    [deleteRow, locationOptions],
  );

  function submit() {
    if (!name.trim()) return;
    addUser(name.trim(), role, location);
    setName("");
  }

  function submitLocation() {
    if (!newLoc.trim()) return;
    addLocation(newLoc);
    setNewLoc("");
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Locations manager — add or remove locations as the business grows. */}
      <AddBar>
        <span className="self-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
          Locations
        </span>
        {db.locations.map((l) => (
          <span key={l} className="chip neutral">
            {l}
            <button
              onClick={() => removeLocation(l)}
              className="ml-1 text-ink-400 transition-colors hover:text-danger"
              title={`Remove ${l}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          className={`${inputCls} w-44`}
          value={newLoc}
          onChange={(e) => setNewLoc(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submitLocation()}
          placeholder="e.g. Shop 4"
        />
        <PrimaryButton onClick={submitLocation}>Add location</PrimaryButton>
      </AddBar>

      {/* Add user */}
      <AddBar>
        <Field label="Full name">
          <input className={`${inputCls} w-48`} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Anil Sharma" />
        </Field>
        <Field label="Role">
          <select className={selectCls} value={role} onChange={(e) => setRole(e.target.value)}>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Location">
          <select className={selectCls} value={location} onChange={(e) => setLocation(e.target.value)}>
            {locationOptions.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <PrimaryButton onClick={submit}>Add user</PrimaryButton>
        <span className="ml-auto self-center text-xs text-ink-500">
          {db.users.length} users · no limit — create as many as needed.
        </span>
      </AddBar>

      <DataGrid
        title="User Management"
        rowData={db.users}
        columnDefs={cols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={(e) => updateRow("users", e.data.id, { ...e.data })}
        fill
      />
    </div>
  );
}
