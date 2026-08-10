/**
 * Supabase configuration.
 *
 * These NEXT_PUBLIC_ values are inlined at build time. When they are absent
 * (e.g. before the owner's project is set up) `supabaseEnabled` is false and
 * the app runs in the in-memory demo mode instead of talking to a backend.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
