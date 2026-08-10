"use client";

import { useMemo } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { GridButton, chipRenderer, money, rightNum } from "@/lib/gridCells";
import { CLUBS, useStore, type Employee } from "@/lib/store";

const sel = (values: string[]) => ({
  cellEditor: "agSelectCellEditor",
  cellEditorParams: { values },
});

type ClubRow = { id: string; club: string; members: number; combined: number; advance: number; net: number };

export default function PayrollSheet() {
  const { db, addEmployeeRow, updateRow, deleteRow } = useStore();

  const empCols = useMemo<ColDef<Employee>[]>(
    () => [
      { field: "code", headerName: "Emp #", pinned: "left", width: 110, editable: false },
      { field: "name", headerName: "Name", minWidth: 170 },
      { field: "assignment", headerName: "Assigned to", minWidth: 150, ...sel(db.locations) },
      { field: "salary", headerName: "Monthly Salary", width: 150, valueFormatter: money, ...rightNum },
      { field: "advance", headerName: "Advance", width: 120, valueFormatter: money, ...rightNum },
      { field: "club", headerName: "Salary Club", minWidth: 150, ...sel(CLUBS) },
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
            <GridButton label="Delete" tone="danger" onClick={() => deleteRow("employees", p.data!.id)} />
          ) : null,
      },
    ],
    [deleteRow, db.locations],
  );

  const totalSalary = db.employees.reduce((a, e) => a + (Number(e.salary) || 0), 0);
  const totalAdvance = db.employees.reduce((a, e) => a + (Number(e.advance) || 0), 0);
  const empTotals = [
    { id: "T", code: "", name: "TOTAL", assignment: "", salary: totalSalary, advance: totalAdvance, club: "", status: "" as Employee["status"] } as Employee,
  ];

  // Clubbed payroll — auto-summed per club (the client's "clubbing").
  const clubRows = useMemo<ClubRow[]>(() => {
    const map = new Map<string, ClubRow>();
    db.employees.forEach((e) => {
      if (!e.club || e.club === "None") return;
      const r = map.get(e.club) ?? { id: e.club, club: e.club, members: 0, combined: 0, advance: 0, net: 0 };
      r.members += 1;
      r.combined += Number(e.salary) || 0;
      r.advance += Number(e.advance) || 0;
      r.net = r.combined - r.advance;
      map.set(e.club, r);
    });
    return [...map.values()];
  }, [db.employees]);

  const clubCols = useMemo<ColDef<ClubRow>[]>(
    () => [
      { field: "club", headerName: "Salary Club", minWidth: 180 },
      { field: "members", headerName: "Members", width: 120, ...rightNum },
      { field: "combined", headerName: "Combined Salary", width: 170, valueFormatter: money, ...rightNum },
      { field: "advance", headerName: "Advances", width: 130, valueFormatter: money, ...rightNum },
      { field: "net", headerName: "Net Payable", width: 150, valueFormatter: money, ...rightNum },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <DataGrid
        title={`Payroll — ${db.employees.length} employees`}
        rowData={db.employees}
        columnDefs={empCols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={(e: CellValueChangedEvent<Employee>) =>
          updateRow("employees", e.data.id, { ...e.data, salary: Number(e.data.salary) || 0, advance: Number(e.data.advance) || 0 })
        }
        pinnedBottomRowData={empTotals}
        height={360}
        toolbarActions={
          <button
            onClick={addEmployeeRow}
            className="h-11 rounded-lg bg-brand-600 px-4 text-base font-bold text-white transition-colors hover:bg-brand-700"
          >
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
          height={220}
        />
      </div>
    </div>
  );
}
