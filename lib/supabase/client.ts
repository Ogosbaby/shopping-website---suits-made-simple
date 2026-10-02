import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client (anon key). Returns `null` when the project
 * is not configured yet, so the UI can degrade gracefully.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createBrowserClient(url, anonKey);
}
