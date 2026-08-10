"use client";

import AppShell from "@/components/AppShell";
import LoginScreen from "@/components/auth/LoginScreen";
import { useAuth } from "@/components/auth/AuthProvider";

function FullScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100 text-sm font-medium text-ink-500">
      {children}
    </div>
  );
}

/**
 * Decides what to show:
 *   - No Supabase project configured  → the in-memory demo (unchanged).
 *   - Configured, not signed in        → the login screen.
 *   - Configured and signed in         → the app, using the profile's role/location.
 */
export default function AppGate() {
  const { enabled, loading, session, profile, signOut } = useAuth();

  if (!enabled) return <AppShell />;
  if (loading) return <FullScreen>Loading…</FullScreen>;
  if (!session) return <LoginScreen />;
  if (!profile) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-ink-100 p-4 text-center">
        <p className="text-sm font-medium text-ink-600">Setting up your profile…</p>
        <button
          onClick={signOut}
          className="h-9 rounded-lg border border-ink-200 bg-surface px-3 text-sm font-medium text-ink-700 hover:bg-ink-50"
        >
          Log out
        </button>
      </div>
    );
  }

  return (
    <AppShell
      authProfile={{ name: profile.name, role: profile.role, location: profile.location }}
      onSignOut={signOut}
    />
  );
}
