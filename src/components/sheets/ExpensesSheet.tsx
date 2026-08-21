"use client";

import { useMemo } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { GridButton, chipRenderer, money, rightNum } from "@/lib/gridCells";
import { CATEGORIES, SUB_CATEGORIES, UNITS, monthOf, type Expense } from "@/lib/store";
import { useExpenses } from "@/lib/useExpenses";

const sel = (values: string[]) => ({
  cellEditor: "agSelectCellEditor",
  cellEditorParams: { values },
});

export default function ExpensesSheet() {
  const { expenses, vendors, staff, locations, addExpense, updateExpense, deleteExpense } = useExpenses();

  // One column per location: the amount lands under the location it was spent
  // at, so the Super Admin can monitor every shop/factory/warehouse in a single
  // sheet. Columns are generated from the Super Admin's location list, so adding
  // a location automatically adds its column — no code change.
  const locCols = useMemo<ColDef<Expense>[]>(
    () =>
      locations.map((loc) => ({
        headerName: loc,
        colId: `loc:${loc}`,
        width: 130,
        editable: false,
        filter: false,
        ...rightNum,
        valueGetter: (p) => {
          const data = p.data as (Expense & Record<string, number>) | undefined;
          if (!data) return "";
          if (p.node?.rowPinned) return data[`loc:${loc}`] || "";
          return data.location === loc ? Number(data.amount) || "" : "";
        },
        valueFormatter: money,
      })),
    [locations],
  );

  const cols = useMemo<ColDef<Expense>[]>(
    () => [
      { field: "slNo", headerName: "Sl. No.", pinned: "left", width: 100, editable: false },
      { field: "month", headerName: "Month", width: 90, editable: false },
      { field: "date", headerName: "Date of Expense", width: 140 },
      { field: "amount", headerName: "Amount", width: 110, valueFormatter: money, ...rightNum },
      { field: "location", headerName: "Received at", minWidth: 150, ...sel([...locations, "Other"]) },
      // Per-location monitor columns (auto-generated from the location list).
      ...locCols,
      { field: "item", headerName: "Product / Service", minWidth: 200 },
      { field: "qty", headerName: "Qty", width: 80, ...rightNum },
      { field: "unit", headerName: "Unit", width: 100, ...sel(UNITS) },
      { field: "vendor", headerName: "Purchased from", minWidth: 160, ...sel(vendors) },
      {
        field: "paymentStatus",
        headerName: "Payment",
        width: 120,
        ...sel(["Paid", "Pending"]),
        cellRenderer: chipRenderer({ Paid: "ok", Pending: "warn" }),
      },
      { field: "paymentDetails", headerName: "Payment Details", minWidth: 230 },
      { field: "category", headerName: "Category", minWidth: 150, ...sel(CATEGORIES) },
      { field: "subCategory", headerName: "Sub-Category", minWidth: 160, ...sel(SUB_CATEGORIES) },
      { field: "receivedBy", headerName: "Received by", minWidth: 140, ...sel(staff) },
      { field: "checkedBy", headerName: "Checked by", minWidth: 140, ...sel(staff) },
      { field: "bill", headerName: "Bill?", width: 90, ...sel(["Yes", "No"]) },
      { field: "comments", headerName: "Comments", minWidth: 160 },
      {
        headerName: "",
        width: 90,
        pinned: "right",
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<Expense>) =>
          p.data && !p.node?.rowPinned ? (
            <GridButton label="Delete" tone="danger" onClick={() => deleteExpense(p.data!.id)} />
          ) : null,
      },
    ],
    [vendors, staff, locations, locCols, deleteExpense],
  );

  const total = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
  const perLoc: Record<string, number> = {};
  for (const loc of locations) {
    perLoc[`loc:${loc}`] = expenses
      .filter((e) => e.location === loc)
      .reduce((a, e) => a + (Number(e.amount) || 0), 0);
  }
  const totalsRow = [
    {
      id: "TOTAL",
      slNo: "",
      month: "",
      date: "",
      amount: total,
      item: "TOTAL",
      qty: "",
      unit: "",
      vendor: "",
      paymentStatus: "" as Expense["paymentStatus"],
      paymentDetails: "",
      category: "",
      subCategory: "",
      location: "",
      receivedBy: "",
      checkedBy: "",
      bill: "",
      comments: "",
      ...perLoc,
    } as unknown as Expense,
  ];

  const onEdit = (e: CellValueChangedEvent<Expense>) => {
    const patch: Partial<Expense> = { ...e.data, amount: Number(e.data.amount) || 0 };
    if (e.colDef.field === "date") patch.month = monthOf(e.data.date) || e.data.month;
    updateExpense(e.data.id, patch);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataGrid
        title={`Expenses — ${expenses[0]?.month ?? ""}`}
        rowData={expenses}
        columnDefs={cols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={onEdit}
        pinnedBottomRowData={totalsRow}
        fill
        toolbarActions={
          <button
            onClick={addExpense}
            className="btn btn-primary btn-sm"
          >
            + Add row
          </button>
        }
      />
    </div>
  );
}
