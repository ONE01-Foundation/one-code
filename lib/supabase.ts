import { createClient } from "@supabase/supabase-js";

// Use placeholder values during build, will be replaced at runtime
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

export const supabase = createClient(url, key);