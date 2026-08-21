"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import { useStore, type Product, type Vendor } from "@/lib/store";

export type Catalog = {
  loading: boolean;
  products: Product[];
  vendors: Vendor[];
  addProduct: (name: string, rate: number, expiryDays: number) => void | Promise<void>;
  updateProduct: (id: string, patch: Partial<Product>) => void | Promise<void>;
  deleteProduct: (id: string) => void | Promise<void>;
  addVendor: (name: string, category: string, contact: string) => void | Promise<void>;
  updateVendor: (id: string, patch: Partial<Vendor>) => void | Promise<void>;
  deleteVendor: (id: string) => void | Promise<void>;
};

/** Products & vendors catalogue — Supabase-backed when configured, else demo store. */
export function useCatalog(): Catalog {
  const store = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [p, v] = await Promise.all([api.listProducts(), api.listVendors()]);
      setProducts(p);
      setVendors(v);
    } catch (e) {
      console.error("Failed to load catalog from Supabase:", e);
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
      products: store.db.products,
      vendors: store.db.vendors,
      addProduct: store.addProduct,
      updateProduct: (id, patch) => store.updateRow("products", id, patch),
      deleteProduct: (id) => store.deleteRow("products", id),
      addVendor: store.addVendor,
      updateVendor: (id, patch) => store.updateRow("vendors", id, patch),
      deleteVendor: (id) => store.deleteRow("vendors", id),
    };
  }

  return {
    loading,
    products,
    vendors,
    addProduct: async (name, rate, exp) => {
      await api.createProduct(name, rate, exp);
      await refresh();
    },
    updateProduct: async (id, patch) => {
      await api.updateProduct(id, patch);
      await refresh();
    },
    deleteProduct: async (id) => {
      await api.deleteProduct(id);
      await refresh();
    },
    addVendor: async (name, cat, contact) => {
      await api.createVendor(name, cat, contact);
      await refresh();
    },
    updateVendor: async (id, patch) => {
      await api.updateVendor(id, patch);
      await refresh();
    },
    deleteVendor: async (id) => {
      await api.deleteVendor(id);
      await refresh();
    },
  };
}
