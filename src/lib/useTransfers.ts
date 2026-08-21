"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import type { TransferRecord } from "@/lib/db";
import { useStore, type Transfer } from "@/lib/store";

export type NewTransfer = { product: string; qtyKg: number; from: string; to: string; dispatchedBy: string };

export type TransfersData = {
  loading: boolean;
  transfers: TransferRecord[];
  products: string[];
  locations: string[];
  staff: string[];
  addTransfer: (t: NewTransfer) => void | Promise<void>;
  updateTransfer: (id: string, patch: Partial<Transfer>) => void | Promise<void>;
  deleteTransfer: (id: string) => void | Promise<void>;
};

/** Stock transfers between locations — Supabase-backed when configured. */
export function useTransfers(): TransfersData {
  const store = useStore();
  const [transfers, setTransfers] = useState<TransferRecord[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [staff, setStaff] = useState<string[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [t, p, l, prof] = await Promise.all([
        api.listTransfers(),
        api.listProducts(),
        api.listLocations(),
        api.listProfiles(),
      ]);
      setTransfers(t);
      setProducts(p.map((x) => x.name));
      setLocations(l);
      setStaff(prof.map((x) => x.name));
    } catch (err) {
      console.error("Failed to load transfers from Supabase:", err);
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
    return {
      loading: false,
      transfers: store.db.transfers.map((t) => ({ ...t, ref: t.id })),
      products: store.db.products.map((p) => p.name),
      locations: store.db.locations,
      staff: store.db.users.map((u) => u.name),
      addTransfer: (t) =>
        store.addRow("transfers", {
          date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          product: t.product,
          batch: "—",
          qtyKg: t.qtyKg,
          from: t.from,
          to: t.to,
          dispatchedBy: t.dispatchedBy,
          receivedBy: "—",
          status: "Sent",
        }),
      updateTransfer: (id, patch) => store.updateRow("transfers", id, patch),
      deleteTransfer: (id) => store.deleteRow("transfers", id),
    };
  }

  return {
    loading,
    transfers,
    products,
    locations,
    staff,
    addTransfer: async (t) => {
      await api.createTransfer(t);
      await refresh();
    },
    updateTransfer: async (id, patch) => {
      await api.updateTransfer(id, patch);
      await refresh();
    },
    deleteTransfer: async (id) => {
      await api.deleteTransfer(id);
      await refresh();
    },
  };
}
