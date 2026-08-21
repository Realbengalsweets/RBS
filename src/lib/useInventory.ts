"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import { useStore, type InvRow } from "@/lib/store";

export type InventoryData = {
  loading: boolean;
  inventory: InvRow[];
  products: string[];
  locations: string[];
  addInventory: () => void | Promise<void>;
  updateInventory: (id: string, patch: Partial<InvRow>) => void | Promise<void>;
  deleteInventory: (id: string) => void | Promise<void>;
};

/** Live product inventory per location — Supabase-backed when configured. */
export function useInventory(): InventoryData {
  const store = useStore();
  const [inventory, setInventory] = useState<InvRow[]>([]);
  const [products, setProducts] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [inv, p, l] = await Promise.all([api.listInventory(), api.listProducts(), api.listLocations()]);
      setInventory(inv);
      setProducts(p.map((x) => x.name));
      setLocations(l);
    } catch (err) {
      console.error("Failed to load inventory from Supabase:", err);
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
      inventory: store.db.inventory,
      products: store.db.products.map((p) => p.name),
      locations: store.db.locations,
      addInventory: () =>
        store.addRow("inventory", {
          product: "",
          location: "",
          batch: "",
          mfgDate: "",
          expiry: "",
          opening: 0,
          inQty: 0,
          outQty: 0,
          closing: 0,
          status: "In stock",
        }),
      updateInventory: (id, patch) => store.updateRow("inventory", id, patch),
      deleteInventory: (id) => store.deleteRow("inventory", id),
    };
  }

  return {
    loading,
    inventory,
    products,
    locations,
    addInventory: async () => {
      await api.createInventory();
      await refresh();
    },
    updateInventory: async (id, patch) => {
      await api.updateInventory(id, patch);
      await refresh();
    },
    deleteInventory: async (id) => {
      await api.deleteInventory(id);
      await refresh();
    },
  };
}
