"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import { useStore, type Kind } from "@/lib/store";

/** One flat row for every record type, shown together in All Records.
 *  `id` is the uuid (used for edit/delete); `ref` is the human code (display). */
export type AnyRecord = {
  key: string;
  kind: Kind;
  id: string;
  ref: string;
  type: "Bill" | "Order" | "Raw material";
  date: string;
  location: string;
  party: string;
  item: string;
  qtyKg: number;
  amount: number | "";
  payment: string;
  status: string;
};

export type AllRecordsData = {
  loading: boolean;
  rows: AnyRecord[];
  locations: string[];
  updateRecord: (kind: Kind, id: string, patch: Record<string, unknown>) => void | Promise<void>;
  deleteRecord: (kind: Kind, id: string) => void | Promise<void>;
};

export function useAllRecords(): AllRecordsData {
  const store = useStore();
  const [rows, setRows] = useState<AnyRecord[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [bills, orders, raw, locs] = await Promise.all([
        api.listAllBills(),
        api.listAllOrders(),
        api.listRawRequests(),
        api.listLocations(),
      ]);
      const b: AnyRecord[] = bills.map((x) => ({
        key: `bills:${x.id}`, kind: "bills", id: x.id, ref: x.ref, type: "Bill",
        date: x.time, location: x.shop, party: x.customer, item: x.items, qtyKg: x.qtyKg, amount: x.amount, payment: x.pay, status: "",
      }));
      const o: AnyRecord[] = orders.map((x) => ({
        key: `orders:${x.id}`, kind: "orders", id: x.id, ref: x.ref, type: "Order",
        date: x.date, location: x.shop, party: "—", item: x.products, qtyKg: x.qtyKg, amount: "", payment: "", status: x.status,
      }));
      const r: AnyRecord[] = raw.map((x) => ({
        key: `raw:${x.id}`, kind: "raw", id: x.id, ref: x.ref, type: "Raw material",
        date: x.date, location: "Factory", party: x.source, item: x.material, qtyKg: x.neededKg, amount: "", payment: "", status: x.status,
      }));
      setRows([...b, ...o, ...r]);
      setLocations(locs);
    } catch (e) {
      console.error("Failed to load all records from Supabase:", e);
    }
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) return;
    let active = true;
    setLoading(true);
    refresh().finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  if (!supabaseEnabled) {
    const bills: AnyRecord[] = store.db.bills.map((b) => ({
      key: `bills:${b.id}`, kind: "bills", id: b.id, ref: b.id, type: "Bill",
      date: b.time, location: b.shop, party: b.customer, item: b.items.map((i) => i.item).join(", "), qtyKg: b.qtyKg, amount: b.amount, payment: b.pay, status: "",
    }));
    const orders: AnyRecord[] = store.db.orders.map((o) => ({
      key: `orders:${o.id}`, kind: "orders", id: o.id, ref: o.id, type: "Order",
      date: o.date, location: o.shop, party: "—", item: o.items.map((i) => i.product).join(", "), qtyKg: o.qtyKg, amount: "", payment: "", status: o.status,
    }));
    const raw: AnyRecord[] = store.db.raw.map((r) => ({
      key: `raw:${r.id}`, kind: "raw", id: r.id, ref: r.id, type: "Raw material",
      date: r.date, location: "Factory", party: r.source, item: r.material, qtyKg: r.neededKg, amount: "", payment: "", status: r.status,
    }));
    return {
      loading: false,
      rows: [...bills, ...orders, ...raw],
      locations: store.db.locations,
      updateRecord: (kind, id, patch) => store.updateRow(kind, id, patch),
      deleteRecord: (kind, id) => store.deleteRow(kind, id),
    };
  }

  return {
    loading,
    rows,
    locations,
    updateRecord: async (kind, id, patch) => {
      if (kind === "bills") await api.updateBillFields(id, patch);
      else if (kind === "orders") await api.updateOrderFields(id, patch);
      else if (kind === "raw") await api.updateRawFields(id, patch);
      await refresh();
    },
    deleteRecord: async (kind, id) => {
      if (kind === "bills") await api.deleteBill(id);
      else if (kind === "orders") await api.deleteOrder(id);
      else if (kind === "raw") await api.deleteRaw(id);
      await refresh();
    },
  };
}
