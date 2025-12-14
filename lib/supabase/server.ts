/**
 * Server-side Supabase client using service role key
 * For use in API routes only - bypasses RLS
 */

import { createClient } from "@supabase/supabase-js";

// Get environment variables at runtime
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      `Missing Supabase credentials. NEXT_PUBLIC_SUPABASE_URL: ${!!url}, SUPABASE_SERVICE_ROLE_KEY: ${!!key}`
    );
  }

  // Validate URL format
  if (!url.startsWith("https://") && !url.startsWith("http://")) {
    throw new Error(`Invalid Supabase URL format: ${url}`);
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  });
}

// Create client lazily to ensure env vars are available
let supabaseClient: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    if (!supabaseClient) {
      supabaseClient = getSupabaseClient();
    }
    return supabaseClient[prop as keyof ReturnType<typeof createClient>];
  },
});

