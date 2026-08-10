"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { supabaseEnabled } from "@/lib/supabase/config";
import { getSupabase } from "@/lib/supabase/client";
import type { ProfileRow } from "@/lib/database.types";

type AuthState = {
  /** True when a Supabase project is configured (else the app runs in demo mode). */
  enabled: boolean;
  /** True while we resolve the initial session/profile. */
  loading: boolean;
  session: Session | null;
  profile: ProfileRow | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  // Only "loading" if we actually have a backend to check against.
  const [loading, setLoading] = useState(supabaseEnabled);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data } = await getSupabase()
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      setProfile((data as ProfileRow) ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    if (!supabaseEnabled) return;
    const supabase = getSupabase();
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadProfile(data.session.user.id);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      if (!active) return;
      setSession(next);
      if (next?.user) await loadProfile(next.user.id);
      else setProfile(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabaseEnabled) return { error: "Supabase is not configured." };
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabaseEnabled) return;
    await getSupabase().auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value: AuthState = { enabled: supabaseEnabled, loading, session, profile, signIn, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
