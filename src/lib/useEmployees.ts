"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import { useStore, type Employee } from "@/lib/store";

export type EmployeesData = {
  loading: boolean;
  employees: Employee[];
  locations: string[]; // for the "Assigned to" dropdown
  clubs: string[]; // owner-managed salary clubs (for the dropdown + summary)
  addEmployee: () => void | Promise<void>;
  updateEmployee: (id: string, patch: Partial<Employee>) => void | Promise<void>;
  deleteEmployee: (id: string) => void | Promise<void>;
  addClub: (name: string) => void | Promise<void>;
  removeClub: (name: string) => void | Promise<void>;
};

/** Merge, de-dupe and sort club names from several sources. */
function mergeClubs(...lists: string[][]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of lists) {
    for (const raw of list) {
      const name = (raw ?? "").trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      out.push(name);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

/** Payroll employees + owner-managed salary clubs. Supabase-backed when
    configured, else the demo store. Clubs come from the salary_clubs table
    when present, and always include clubs already used by employees; locally
    added clubs show immediately even if the table isn't set up yet. */
export function useEmployees(): EmployeesData {
  const store = useStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [dbClubs, setDbClubs] = useState<string[]>([]);
  const [localClubs, setLocalClubs] = useState<string[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [e, l, c] = await Promise.all([api.listEmployees(), api.listLocations(), api.listSalaryClubs()]);
      setEmployees(e);
      setLocations(l);
      setDbClubs(c);
    } catch (err) {
      console.error("Failed to load payroll from Supabase:", err);
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

  // Demo mode: derive everything from the in-memory store.
  const demoEmpClubs = useMemo(
    () => (supabaseEnabled ? [] : store.db.employees.map((e) => e.club)),
    [store.db.employees],
  );
  const supaEmpClubs = useMemo(() => employees.map((e) => e.club), [employees]);

  if (!supabaseEnabled) {
    return {
      loading: false,
      employees: store.db.employees,
      locations: store.db.locations,
      clubs: mergeClubs(localClubs, demoEmpClubs),
      addEmployee: store.addEmployeeRow,
      updateEmployee: (id, patch) => store.updateRow("employees", id, patch),
      deleteEmployee: (id) => store.deleteRow("employees", id),
      addClub: (name) => setLocalClubs((p) => mergeClubs(p, [name])),
      removeClub: (name) => setLocalClubs((p) => p.filter((c) => c !== name)),
    };
  }

  return {
    loading,
    employees,
    locations,
    clubs: mergeClubs(dbClubs, localClubs, supaEmpClubs),
    addEmployee: async () => {
      await api.createEmployee();
      await refresh();
    },
    updateEmployee: async (id, patch) => {
      await api.updateEmployee(id, patch);
      await refresh();
    },
    deleteEmployee: async (id) => {
      await api.deleteEmployee(id);
      await refresh();
    },
    addClub: async (name) => {
      const clean = name.trim();
      if (!clean) return;
      // Show immediately, then try to persist (table may not exist yet).
      setLocalClubs((p) => mergeClubs(p, [clean]));
      try {
        await api.createSalaryClub(clean);
        await refresh();
      } catch (err) {
        console.warn("Salary club not persisted (create the salary_clubs table to enable):", err);
      }
    },
    removeClub: async (name) => {
      setLocalClubs((p) => p.filter((c) => c !== name));
      try {
        await api.deleteSalaryClub(name);
        await refresh();
      } catch {
        /* table may not exist; local removal already applied */
      }
    },
  };
}
