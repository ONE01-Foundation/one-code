/**
 * POST /api/one-touch/claim
 * Claims a one-touch session (mobile side)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Missing code" },
        { status: 400 }
      );
    }

    // First, check if session exists and is valid
    const { data: session, error: fetchError } = await supabase
      .from("one_touch_sessions")
      .select("status, expires_at, claimed_at")
      .eq("code", code)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }
      console.error("Error fetching session:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch session" },
        { status: 500 }
      );
    }

    // Validate status
    if (session.status !== "pending") {
      return NextResponse.json(
        { error: "Session already claimed or invalid" },
        { status: 400 }
      );
    }

    // Validate expiration
    if (session.expires_at && new Date(session.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Session expired" },
        { status: 400 }
      );
    }

    // Update session
    const { error: updateError } = await supabase
      .from("one_touch_sessions")
      .update({
        status: "claimed",
        claimed_at: new Date().toISOString(),
        mobile_client_id: "mobile-web",
      })
      .eq("code", code)
      .eq("status", "pending"); // Double-check status hasn't changed

    if (updateError) {
      console.error("Error claiming session:", updateError);
      console.error("Error details:", JSON.stringify(updateError, null, 2));
      return NextResponse.json(
        { error: "Failed to claim session", details: updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

