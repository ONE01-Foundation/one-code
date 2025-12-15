/**
 * Server-side Supabase client using service role key
 * For use in API routes only - bypasses RLS
 */

import { createClient } from "@supabase/supabase-js";

// Use placeholder values during build, will be replaced at runtime
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder-key";

export const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

