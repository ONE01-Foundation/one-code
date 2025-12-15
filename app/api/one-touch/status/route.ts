/**
 * GET /api/one-touch/status?code=
 * Gets the status of a one-touch session
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing code parameter" },
        { status: 400 }
      );
    }

    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Missing Supabase configuration" },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { data, error } = await supabaseClient
      .from("one_touch_sessions")
      .select("status, expires_at, claimed_at")
      .eq("code", code)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching session:", error);
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }

    // Check if expired (override status if expired)
    if (data.expires_at && new Date(data.expires_at) < new Date() && !data.claimed_at) {
      return NextResponse.json({
        status: "expired",
        expires_at: data.expires_at,
        claimed_at: data.claimed_at,
      });
    }

    return NextResponse.json({
      status: data.status,
      expires_at: data.expires_at,
      claimed_at: data.claimed_at,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

