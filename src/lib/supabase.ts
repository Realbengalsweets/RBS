/**
 * Supabase browser client (placeholder for Phase 1).
 *
 * Reads public env vars. Real keys live in .env.local (git-ignored) and, in
 * production, under the owner's Supabase project. Until Phase 1 wires the
 * schema + auth, `getSupabase()` returns null when env vars are absent so the
 * app still runs against demo data.
 *
 * When we start Phase 1, install `@supabase/supabase-js` and uncomment the
 * client creation below.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Phase 1:
// import { createClient } from "@supabase/supabase-js";
// export const supabase = isSupabaseConfigured
//   ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
//   : null;
