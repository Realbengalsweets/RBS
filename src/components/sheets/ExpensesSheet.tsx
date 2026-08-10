"use client";

import { useMemo } from "react";
import type { CellValueChangedEvent, ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { GridButton, chipRenderer, money, rightNum } from "@/lib/gridCells";
import {
  CATEGORIES,
  SUB_CATEGORIES,
  UNITS,
  monthOf,
  useStore,
  type Expense,
} from "@/lib/store";

const sel = (values: string[]) => ({
  cellEditor: "agSelectCellEditor",
  cellEditorParams: { values },
});

export default function ExpensesSheet() {
  const { db, addExpense, updateRow, deleteRow } = useStore();
  const vendors = ["NA", ...db.vendors.map((v) => v.name)];
  const staff = db.users.map((u) => u.name);

  const cols = useMemo<ColDef<Expense>[]>(
    () => [
      { field: "slNo", headerName: "Sl. No.", pinned: "left", width: 100, editable: false },
      { field: "month", headerName: "Month", width: 90, editable: false },
      { field: "date", headerName: "Date of Expense", width: 140 },
      { field: "amount", headerName: "Amount", width: 110, valueFormatter: money, ...rightNum },
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
      { field: "location", headerName: "Received at", minWidth: 150 },
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
            <GridButton label="Delete" tone="danger" onClick={() => deleteRow("expenses", p.data!.id)} />
          ) : null,
      },
    ],
    [vendors, staff, deleteRow],
  );

  const total = db.expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
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
    } as Expense,
  ];

  const onEdit = (e: CellValueChangedEvent<Expense>) => {
    const patch: Record<string, unknown> = { ...e.data, amount: Number(e.data.amount) || 0 };
    if (e.colDef.field === "date") patch.month = monthOf(e.data.date) || e.data.month;
    updateRow("expenses", e.data.id, patch);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DataGrid
        title={`Expenses — ${db.expenses[0]?.month ?? ""}`}
        rowData={db.expenses}
        columnDefs={cols}
        editable
        getRowId={(r) => r.id}
        onCellValueChanged={onEdit}
        pinnedBottomRowData={totalsRow}
        fill
        toolbarActions={
          <button
            onClick={addExpense}
            className="h-11 rounded-lg bg-brand-600 px-4 text-base font-bold text-white transition-colors hover:bg-brand-700"
          >
            + Add row
          </button>
        }
      />
    </div>
  );
}
