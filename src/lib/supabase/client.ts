"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { SUPABASE_ANON_KEY, SUPABASE_URL, supabaseEnabled } from "./config";

type Client = ReturnType<typeof createBrowserClient<Database>>;

let cached: Client | null = null;

/**
 * Returns the (lazily created) Supabase browser client. Only call this when
 * `supabaseEnabled` is true — it throws otherwise so we never construct a
 * client with empty credentials during the demo build.
 */
export function getSupabase(): Client {
  if (!supabaseEnabled) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
  if (!cached) {
    cached = createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return cached;
}
