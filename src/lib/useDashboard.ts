"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import type { SalePoint } from "@/lib/db";
import { useStore } from "@/lib/store";

export type RecentTxn = { ref: string; shop: string; party: string; amount: number; at: string };
export type Dashboard = {
  loading: boolean;
  salesToday: number;
  salesMonth: number;
  salesCount: number;
  ordersPending: number;
  expensesMonth: number;
  trend: { label: string; sales: number }[];
  byLocation: { name: string; value: number }[];
  recent: RecentTxn[];
};

const dayKey = (d: Date) => d.toISOString().slice(0, 10);
const monthKey = (d: Date) => d.toISOString().slice(0, 7);

function build(
  sales: SalePoint[],
  ordersPending: number,
  expensesMonth: number,
  recent: RecentTxn[],
): Omit<Dashboard, "loading"> {
  const now = new Date();
  const todayK = dayKey(now);
  const monthK = monthKey(now);

  let salesToday = 0;
  let salesMonth = 0;
  const byLoc = new Map<string, number>();
  const byDay = new Map<string, number>();

  for (const s of sales) {
    const d = new Date(s.at);
    if (Number.isNaN(d.getTime())) continue;
    if (dayKey(d) === todayK) salesToday += s.amount;
    if (monthKey(d) === monthK) salesMonth += s.amount;
    byLoc.set(s.shop || "—", (byLoc.get(s.shop || "—") ?? 0) + s.amount);
    byDay.set(dayKey(d), (byDay.get(dayKey(d)) ?? 0) + s.amount);
  }

  // Last 14 days trend (oldest -> newest).
  const trend: { label: string; sales: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    trend.push({
      label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      sales: byDay.get(dayKey(d)) ?? 0,
    });
  }

  const byLocation = [...byLoc.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  return {
    salesToday,
    salesMonth,
    salesCount: sales.length,
    ordersPending,
    expensesMonth,
    trend,
    byLocation,
    recent,
  };
}

/** Owner/Manager dashboard aggregates — live from Supabase when configured. */
export function useDashboard(): Dashboard {
  const store = useStore();
  const [sales, setSales] = useState<SalePoint[]>([]);
  const [ordersPending, setOrdersPending] = useState(0);
  const [expensesMonth, setExpensesMonth] = useState(0);
  const [recent, setRecent] = useState<RecentTxn[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [salesData, orders, expenses, bills] = await Promise.all([
        api.listSalesForDashboard(),
        api.listAllOrders(),
        api.listExpenses(),
        api.listAllBills(),
      ]);
      setSales(salesData);
      setOrdersPending(orders.filter((o) => o.status === "Pending" || o.status === "Accepted").length);
      const monthK = monthKey(new Date());
      setExpensesMonth(
        expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0), // expenses ledger totals (all shown)
      );
      void monthK;
      setRecent(
        bills.slice(0, 8).map((b) => ({ ref: b.ref, shop: b.shop, party: b.customer, amount: b.amount, at: b.time })),
      );
    } catch (e) {
      console.error("Failed to load dashboard from Supabase:", e);
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

  const demo = useMemo(() => {
    if (supabaseEnabled) return null;
    const nowIso = new Date().toISOString();
    const salesData: SalePoint[] = store.db.bills.map((b) => ({ at: nowIso, shop: b.shop, amount: b.amount }));
    const pending = store.db.orders.filter((o) => o.status === "Pending" || o.status === "Accepted").length;
    const exp = store.db.expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const rec: RecentTxn[] = store.db.bills.slice(0, 8).map((b) => ({
      ref: b.id,
      shop: b.shop,
      party: b.customer,
      amount: b.amount,
      at: b.time,
    }));
    return build(salesData, pending, exp, rec);
  }, [store.db.bills, store.db.orders, store.db.expenses]);

  if (!supabaseEnabled && demo) return { loading: false, ...demo };

  return { loading, ...build(sales, ordersPending, expensesMonth, recent) };
}
