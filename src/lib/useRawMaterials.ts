"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import { RAW_MATERIALS, useStore, type RawReq } from "@/lib/store";

export type RawRow = RawReq & { ref: string };

export type RawMaterialsData = {
  loading: boolean;
  rows: RawRow[];
  materials: string[];
  addRawReq: (material: string, neededKg: number, availableKg: number) => void | Promise<void>;
  setRaw: (id: string, patch: Partial<RawReq>) => void | Promise<void>;
  deleteRaw: (id: string) => void | Promise<void>;
};

/** Raw-material requests — Supabase-backed when configured, else the demo store. */
export function useRawMaterials(): RawMaterialsData {
  const store = useStore();
  const [rows, setRows] = useState<RawRow[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const r = await api.listRawRequests();
      setRows(
        r.map((x) => ({
          id: x.id,
          ref: x.ref,
          date: x.date,
          material: x.material,
          neededKg: x.neededKg,
          availableKg: x.availableKg,
          source: x.source as RawReq["source"],
          status: x.status as RawReq["status"],
          forOrder: x.forOrder,
        })),
      );
    } catch (err) {
      console.error("Failed to load raw requests from Supabase:", err);
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
      rows: store.db.raw.map((r) => ({ ...r, ref: r.id })),
      materials: RAW_MATERIALS,
      addRawReq: store.addRawReq,
      setRaw: store.setRaw,
      deleteRaw: (id) => store.deleteRow("raw", id),
    };
  }

  return {
    loading,
    rows,
    materials: RAW_MATERIALS,
    addRawReq: async (material, neededKg, availableKg) => {
      await api.createRawRequest(material, neededKg, availableKg);
      await refresh();
    },
    setRaw: async (id, patch) => {
      await api.updateRawFields(id, patch as Record<string, unknown>);
      await refresh();
    },
    deleteRaw: async (id) => {
      await api.deleteRaw(id);
      await refresh();
    },
  };
}
