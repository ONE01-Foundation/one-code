/**
 * GET /api/health
 * Health check endpoint - confirms env variables exist
 */

import { NextResponse } from "next/server";

export async function GET() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    ok: true,
    env: {
      hasSupabaseUrl,
      hasServiceRoleKey,
    },
  });
}

