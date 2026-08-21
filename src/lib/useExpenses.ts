"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import { useStore, type Expense } from "@/lib/store";

export type ExpensesData = {
  loading: boolean;
  expenses: Expense[];
  vendors: string[]; // for the "Purchased from" dropdown
  staff: string[]; // for received-by / checked-by dropdowns
  locations: string[]; // for the "Received at" dropdown + per-location columns
  addExpense: () => void | Promise<void>;
  updateExpense: (id: string, patch: Partial<Expense>) => void | Promise<void>;
  deleteExpense: (id: string) => void | Promise<void>;
};

/** Expenses ledger — Supabase-backed when configured, else the demo store. */
export function useExpenses(): ExpensesData {
  const store = useStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);
  const [staff, setStaff] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [e, v, p, l] = await Promise.all([
        api.listExpenses(),
        api.listVendors(),
        api.listProfiles(),
        api.listLocations(),
      ]);
      setExpenses(e);
      setVendors(["NA", ...v.map((x) => x.name)]);
      setStaff(p.map((x) => x.name));
      setLocations(l);
    } catch (err) {
      console.error("Failed to load expenses from Supabase:", err);
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
      expenses: store.db.expenses,
      vendors: ["NA", ...store.db.vendors.map((v) => v.name)],
      staff: store.db.users.map((u) => u.name),
      locations: store.db.locations,
      addExpense: store.addExpense,
      updateExpense: (id, patch) => store.updateRow("expenses", id, patch),
      deleteExpense: (id) => store.deleteRow("expenses", id),
    };
  }

  return {
    loading,
    expenses,
    vendors,
    staff,
    locations,
    addExpense: async () => {
      await api.createExpense();
      await refresh();
    },
    updateExpense: async (id, patch) => {
      await api.updateExpense(id, patch);
      await refresh();
    },
    deleteExpense: async (id) => {
      await api.deleteExpense(id);
      await refresh();
    },
  };
}
