"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseEnabled } from "@/lib/supabase/config";
import * as api from "@/lib/db";
import { useStore, type User } from "@/lib/store";

export type UsersData = {
  loading: boolean;
  users: User[];
  locations: string[];
  /** Whether new login accounts can be created here. Only in demo mode —
      real auth accounts are created via Supabase invite/admin API. */
  canCreateAccounts: boolean;
  addUser: (name: string, role: string, location: string) => void | Promise<void>;
  updateUser: (id: string, patch: Partial<User>) => void | Promise<void>;
  deleteUser: (id: string) => void | Promise<void>;
  addLocation: (name: string) => void | Promise<void>;
  removeLocation: (name: string) => void | Promise<void>;
};

/** Users & Roles — Supabase-backed when configured, else the demo store. */
export function useUsers(): UsersData {
  const store = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(supabaseEnabled);

  const refresh = useCallback(async () => {
    if (!supabaseEnabled) return;
    try {
      const [u, l] = await Promise.all([api.listProfiles(), api.listLocations()]);
      setUsers(u);
      setLocations(l);
    } catch (err) {
      console.error("Failed to load users from Supabase:", err);
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
      users: store.db.users,
      locations: store.db.locations,
      canCreateAccounts: true,
      addUser: store.addUser,
      updateUser: (id, patch) => store.updateRow("users", id, patch),
      deleteUser: (id) => store.deleteRow("users", id),
      addLocation: store.addLocation,
      removeLocation: store.removeLocation,
    };
  }

  return {
    loading,
    users,
    locations,
    canCreateAccounts: false,
    addUser: () => {
      // Real login accounts are provisioned via Supabase invite / admin API,
      // which the browser (publishable key) can't do. UI hides this in real mode.
    },
    updateUser: async (id, patch) => {
      await api.updateProfile(id, patch);
      await refresh();
    },
    deleteUser: async (id) => {
      await api.deleteProfile(id);
      await refresh();
    },
    addLocation: async (name) => {
      await api.createLocation(name);
      await refresh();
    },
    removeLocation: async (name) => {
      await api.deleteLocation(name);
      await refresh();
    },
  };
}
