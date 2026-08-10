"use client";

import { useMemo } from "react";
import type { ColDef, ICellRendererParams } from "ag-grid-community";
import DataGrid from "@/components/DataGrid";
import { GridButton, chipRenderer, kg, rightNum } from "@/lib/gridCells";
import { useStore, type FactoryOrder } from "@/lib/store";

export default function ShopOrders() {
  const { db, setOrderStatus, requestRawForOrder } = useStore();

  const cols = useMemo<ColDef<FactoryOrder>[]>(
    () => [
      { field: "id", headerName: "Order #", width: 110 },
      { field: "date", headerName: "Date", width: 100 },
      { field: "shop", headerName: "From shop", minWidth: 130 },
      { field: "source", headerName: "Ordered from", minWidth: 130 },
      {
        headerName: "Products",
        minWidth: 220,
        valueGetter: (p) => p.data?.items.map((i) => `${i.product} (${i.qtyKg} kg)`).join(", ") ?? "",
      },
      { field: "qtyKg", headerName: "Total qty", width: 120, valueFormatter: kg, ...rightNum },
      {
        field: "status",
        headerName: "Status",
        width: 140,
        cellRenderer: chipRenderer({ Pending: "warn", Accepted: "info", Dispatched: "info", Received: "ok" }),
      },
      { field: "note", headerName: "Note", minWidth: 150 },
      {
        headerName: "Actions",
        minWidth: 230,
        sortable: false,
        filter: false,
        editable: false,
        cellRenderer: (p: ICellRendererParams<FactoryOrder>) => {
          const o = p.data;
          if (!o) return null;
          if (o.status === "Dispatched" || o.status === "Received")
            return <span className="text-ink-400">—</span>;
          return (
            <div className="flex items-center">
              {o.status === "Pending" && (
                <GridButton label="Accept" onClick={() => setOrderStatus(o.id, "Accepted")} />
              )}
              <GridButton label="Dispatch" tone="brand" onClick={() => setOrderStatus(o.id, "Dispatched")} />
              <GridButton label="Need raw" onClick={() => requestRawForOrder(o)} />
            </div>
          );
        },
      },
    ],
    [setOrderStatus, requestRawForOrder],
  );

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-500">
        Incoming shop orders. Dispatch what you can fulfil; if a product isn&apos;t available,
        tap <b>Need raw</b> to raise a raw-material request (warehouse or vendor).
      </p>
      <DataGrid
        title="Shop Orders — incoming"
        rowData={db.orders}
        columnDefs={cols}
        getRowId={(r) => r.id}
        height={480}
      />
    </div>
  );
}
