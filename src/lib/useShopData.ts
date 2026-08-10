"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import {
  useStore,
  type Bill,
  type BillItem,
  type FactoryOrder,
  type OrderItem,
  type PayMode,
  type Product,
} from "@/lib/store";

export type ShopData = {
  loading: boolean;
  products: Product[];
  locations: string[];
  bills: Bill[];
  orders: FactoryOrder[];
  createBill: (customer: string, items: BillItem[], pay: PayMode) => void | Promise<void>;
  createOrder: (source: string, items: OrderItem[]) => void | Promise<void>;
};

/**
 * Data for the shop-admin screens. Backed by Supabase when a project is
 * configured (real, persisted, shared), or the in-memory store in demo mode.
 */
export function useShopData(shop: string): ShopData {
  const store = useStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [orders, setOrders] = useState<FactoryOrder[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [p, l, b, o] = await Promise.all([
        api.listProducts(),
        api.listLocations(),
        api.listBillsForShop(shop),
        api.listOrdersForShop(shop),
      ]);
      setProducts(p);
      setLocations(l);
      setBills(b);
      setOrders(o);
    } catch (err) {
      console.error("Failed to load shop data from Supabase:", err);
    }
  }, [shop]);

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
    // Demo mode — read/write the in-memory store.
    return {
      loading: false,
      products: store.db.products,
      locations: store.db.locations,
      bills: store.db.bills.filter((b) => b.shop === shop),
      orders: store.db.orders.filter((o) => o.shop === shop),
      createBill: (customer, items, pay) => store.addBill(shop, customer, items, pay),
      createOrder: (source, items) => store.placeOrder(shop, source, items),
    };
  }

  return {
    loading,
    products,
    locations,
    bills,
    orders,
    createBill: async (customer, items, pay) => {
      await api.createBill(shop, customer, items, pay);
      await refresh();
    },
    createOrder: async (source, items) => {
      await api.createOrder(shop, source, items);
      await refresh();
    },
  };
}
