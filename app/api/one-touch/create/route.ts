/**
 * POST /api/one-touch/create
 * Creates a new one-touch session with QR code
 */

import { NextRequest, NextResponse } from "next/server";

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getBaseUrl(request: NextRequest): string {
  // Prefer NEXT_PUBLIC_APP_URL env var (never hardcode localhost)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Check if we're on Vercel and use the preview URL
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || 
                   (request.nextUrl.protocol === "https:" ? "https" : "http");
  
  // If on Vercel preview URL, use it directly
  if (host && host.includes("vercel.app") && !host.includes("localhost")) {
    return `${protocol}://${host}`;
  }

  // Fallback to request origin (but skip localhost)
  if (host && !host.includes("localhost") && !host.includes("127.0.0.1")) {
    return `${protocol}://${host}`;
  }

  // Final fallback: use nextUrl origin (but warn if it's localhost)
  const origin = request.nextUrl.origin;
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
    console.warn("WARNING: Using localhost origin. Set NEXT_PUBLIC_APP_URL for production.");
  }
  return origin;
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return NextResponse.json(
        { error: "Missing NEXT_PUBLIC_SUPABASE_URL environment variable" },
        { status: 500 }
      );
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Missing SUPABASE_SERVICE_ROLE_KEY environment variable" },
        { status: 500 }
      );
    }

    // Create Supabase client with validated env vars
    const { createClient } = await import("@supabase/supabase-js");
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

    const code = generateCode();
    const baseUrl = getBaseUrl(request);
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes from now

    const { data, error } = await supabaseClient
      .from("one_touch_sessions")
      .insert({
        code,
        status: "pending",
        expires_at: expiresAt.toISOString(),
        desktop_client_id: "web",
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating session:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to create session", details: error.message },
        { status: 500 }
      );
    }

    // Warn if baseUrl is localhost
    const isLocalhost = baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1");
    
    const claimUrl = `${baseUrl}/claim?code=${code}`;

    return NextResponse.json({
      code,
      claimUrl,
      baseUrl, // Include for debugging
      warning: isLocalhost ? "Using localhost. Set NEXT_PUBLIC_APP_URL for production." : null,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: errorMessage,
        ...(process.env.NODE_ENV === "development" && errorStack ? { stack: errorStack } : {})
      },
      { status: 500 }
    );
  }
}

