"use client";

import { useMemo, useState } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { GridButton, chipRenderer, money, rightNum } from "@/lib/gridCells";
import type { Employee } from "@/lib/store";
import { useEmployees } from "@/lib/useEmployees";
import { inputCls, PrimaryButton } from "@/components/ui";

const sel = (values: string[]) => ({
  cellEditor: "agSelectCellEditor",
  cellEditorParams: { values },
});

type ClubRow = { id: string; club: string; members: number; combined: number; advance: number; net: number };

export default function PayrollSheet() {
  const { employees, locations, clubs, addEmployee, updateEmployee, deleteEmployee, addClub, removeClub } =
    useEmployees();
  const [newClub, setNewClub] = useState("");

  function submitClub() {
    const name = newClub.trim();
    if (!name) return;
    addClub(name);
    setNewClub("");
  }

  const empCols = useMemo<ColDef<Employee>[]>(
    () => [
      { field: "code", headerName: "Emp #", pinned: "left", width: 110, editable: false },
      { field: "name", headerName: "Name", minWidth: 170 },
      { field: "assignment", headerName: "Assigned to", minWidth: 150, ...sel(locations) },
      { field: "salary", headerName: "Monthly Salary", width: 150, valueFormatter: money, ...rightNum },
      { field: "advance", headerName: "Advance", width: 120, valueFormatter: money, ...rightNum },
      // Owner-managed clubs; blank is allowed (unclubbed).
      { field: "club", headerName: "Salary Club", minWidth: 150, ...sel(["", ...clubs]) },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        ...sel(["Paid", "Pending"]),
        cellRenderer: chipRenderer({ Paid: "ok", Pending: "warn" }),
      },
      {
        headerName: "",
        width: 90,
        pinned: "right",
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<Employee>) =>
          p.data && !p.node?.rowPinned ? (
            <GridButton label="Delete" tone="danger" onClick={() => deleteEmployee(p.data!.id)} />
          ) : null,
      },
    ],
    [deleteEmployee, locations, clubs],
  );

  const totalSalary = employees.reduce((a, e) => a + (Number(e.salary) || 0), 0);
  const totalAdvance = employees.reduce((a, e) => a + (Number(e.advance) || 0), 0);
  const empTotals = [
    { id: "T", code: "", name: "TOTAL", assignment: "", salary: totalSalary, advance: totalAdvance, club: "", status: "" as Employee["status"] } as Employee,
  ];

  // Clubbed payroll — one line per owner-defined club, auto-summed from its
  // members. Every club shows (even with no members yet) so the owner sees it
  // appear the moment they add it.
  const clubRows = useMemo<ClubRow[]>(() => {
    const map = new Map<string, ClubRow>();
    clubs.forEach((c) => map.set(c, { id: c, club: c, members: 0, combined: 0, advance: 0, net: 0 }));
    employees.forEach((e) => {
      const club = (e.club ?? "").trim();
      if (!club) return;
      const r = map.get(club) ?? { id: club, club, members: 0, combined: 0, advance: 0, net: 0 };
      r.members += 1;
      r.combined += Number(e.salary) || 0;
      r.advance += Number(e.advance) || 0;
      r.net = r.combined - r.advance;
      map.set(club, r);
    });
    return [...map.values()];
  }, [employees, clubs]);

  const clubCols = useMemo<ColDef<ClubRow>[]>(
    () => [
      { field: "club", headerName: "Salary Club", minWidth: 180 },
      { field: "members", headerName: "Members", width: 120, ...rightNum },
      { field: "combined", headerName: "Combined Salary", width: 170, valueFormatter: money, ...rightNum },
      { field: "advance", headerName: "Advances", width: 130, valueFormatter: money, ...rightNum },
      { field: "net", headerName: "Net Payable", width: 150, valueFormatter: money, ...rightNum },
      {
        headerName: "",
        width: 90,
        pinned: "right",
        sortable: false,
        filter: false,
        cellRenderer: (p: ICellRendererParams<ClubRow>) =>
          p.data && !p.node?.rowPinned ? (
            <GridButton label="Remove" tone="danger" onClick={() => removeClub(p.data!.club)} />
          ) : null,
      },
    ],
    [removeClub],
  );

  return (
    <div className="space-y-5">
      {/* Salary-club manager — the owner defines the clubs; there are no presets. */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="mr-1">
            <div className="text-[13px] font-bold text-ink-800">Salary clubs</div>
            <div className="text-[12px] text-ink-500">Group employees into one combined salary line.</div>
          </div>
          {clubs.length === 0 && (
            <span className="text-[13px] text-ink-400">No clubs yet — add one to get started.</span>
          )}
          {clubs.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[13px] font-semibold text-brand-700"
            >
              {c}
              <button
                onClick={() => removeClub(c)}
                title={`Remove ${c}`}
                className="grid h-4 w-4 place-items-center rounded-full text-brand-500 transition-colors hover:bg-brand-200 hover:text-brand-800"
              >
                ×
              </button>
            </span>
          ))}
          <div className="ml-auto flex items-end gap-2">
            <input
              className={`${inputCls} h-11 w-52`}
              value={newClub}
              onChange={(e) => setNewClub(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitClub()}
              placeholder="New club name…"
            />
            <PrimaryButton onClick={submitClub} className="btn-sm">
              + Add club
            </PrimaryButton>
          </div>
        </div>
      </div>

      <DataGrid
        title={`Payroll — ${employees.length} employees`}
        rowData={employees}
        columnDefs={empCols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<Employee>) =>
          updateEmployee(e.data.id, { ...e.data, salary: Number(e.data.salary) || 0, advance: Number(e.data.advance) || 0 })
        }
        pinnedBottomRowData={empTotals}
        height={360}
        toolbarActions={
          <button onClick={addEmployee} className="btn btn-primary btn-sm">
            + Add employee
          </button>
        }
      />

      <div>
        <div className="mb-2 text-sm font-semibold text-ink-700">
          Clubbed payroll — employees grouped into one combined salary line
        </div>
        <DataGrid
          title="Salary Clubs (auto-summed)"
          rowData={clubRows}
          columnDefs={clubCols}
          getRowId={(r) => r.id}
          height={240}
        />
      </div>
    </div>
  );
}
