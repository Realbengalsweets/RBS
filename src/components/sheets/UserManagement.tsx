"use client";

import { useMemo, useState } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { AddBar, Field, PrimaryButton, inputCls, selectCls } from "@/components/ui";
import { GridButton, chipRenderer } from "@/lib/gridCells";
import { ROLES, type User } from "@/lib/store";
import { useUsers } from "@/lib/useUsers";

export default function UserManagement() {
  const { users, locations, canCreateAccounts, addUser, addLocation, removeLocation, deleteUser, updateUser } =
    useUsers();
  // Location options = the Super Admin's editable list + two catch-all entries.
  const locationOptions = useMemo(() => [...locations, "All locations", "Others"], [locations]);

  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[4]); // Shop Admin
  const [location, setLocation] = useState(locations[3] ?? locations[0]);
  const [newLoc, setNewLoc] = useState("");

  const cols = useMemo<ColDef<User>[]>(
    () => [
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
            <GridButton label="Delete" tone="danger" onClick={() => deleteUser(p.data!.id)} />
          ) : null,
      },
    ],
    [deleteUser, locationOptions],
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
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-1 flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-100 text-brand-700">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <div>
              <div className="text-[13px] font-bold text-ink-800">Locations</div>
              <div className="text-[12px] text-ink-500">Shops, factory and warehouses.</div>
            </div>
          </div>

          {locations.length === 0 && (
            <span className="text-[13px] text-ink-400">No locations yet — add your first below.</span>
          )}
          {locations.map((l) => (
            <span
              key={l}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-2 px-3 py-1 text-[13px] font-semibold text-ink-700 shadow-xs"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              {l}
              <button
                onClick={() => removeLocation(l)}
                title={`Remove ${l}`}
                className="grid h-4 w-4 place-items-center rounded-full text-ink-400 transition-colors hover:bg-red-100 hover:text-danger"
              >
                ×
              </button>
            </span>
          ))}

          <div className="ml-auto flex items-end gap-2">
            <input
              className={`${inputCls} h-11 w-44`}
              value={newLoc}
              onChange={(e) => setNewLoc(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitLocation()}
              placeholder="e.g. Shop 4"
            />
            <PrimaryButton onClick={submitLocation} className="btn-sm">
              + Add location
            </PrimaryButton>
          </div>
        </div>
      </div>

      {/* Add user — only in demo mode. Real logins are provisioned via Supabase
          invite/admin; here the Super Admin just assigns roles & locations. */}
      {canCreateAccounts ? (
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
            {users.length} users · no limit — create as many as needed.
          </span>
        </AddBar>
      ) : (
        <AddBar>
          <span className="self-center text-xs text-ink-600">
            {users.length} users. New sign-in accounts are created by invitation; once a
            person signs in they appear here, and you set their role, location and status below.
          </span>
        </AddBar>
      )}

      <DataGrid
        title="User Management"
        rowData={users}
        columnDefs={cols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={(e) => updateUser(e.data.id, { ...e.data })}
        fill
      />
    </div>
  );
}
