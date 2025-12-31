/**
 * Card Ingestion API Route
 * 
 * POST /api/cards/ingest
 * 
 * Persists cards from AI interactions to Supabase.
 * Called from client after receiving AI response.
 */

import { NextResponse } from "next/server";
import { ingestCardFromAI } from "@/lib/card-persistence";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const {
      sessionId,
      bubbleId,
      userMessage,
      aiResponse,
      suggestedCard,
    } = body;

    // Validate required fields
    if (!sessionId || typeof sessionId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'sessionId'" },
        { status: 400 }
      );
    }

    if (!bubbleId || typeof bubbleId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'bubbleId'" },
        { status: 400 }
      );
    }

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'userMessage'" },
        { status: 400 }
      );
    }

    if (!aiResponse || typeof aiResponse !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'aiResponse'" },
        { status: 400 }
      );
    }

    // Validate suggestedCard structure if provided
    if (suggestedCard) {
      if (
        typeof suggestedCard !== "object" ||
        !suggestedCard.title ||
        !suggestedCard.intent
      ) {
        return NextResponse.json(
          { error: "Invalid 'suggestedCard' structure. Requires title and intent." },
          { status: 400 }
        );
      }
    }

    // Call persistence helper
    const result = await ingestCardFromAI({
      sessionId,
      bubbleId,
      userMessage,
      aiResponse,
      suggestedCard,
    });

    if (result.error) {
      console.error("Card ingestion error:", result.error);
      // Return 200 with error in body (non-fatal - persistence shouldn't block UI)
      return NextResponse.json({ error: result.error }, { status: 200 });
    }

    return NextResponse.json({
      success: true,
      cardId: result.cardId,
    });
  } catch (err) {
    console.error("Card ingestion API error:", err);
    // Return 200 even on error (non-fatal - persistence shouldn't block UI)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 200 }
    );
  }
}

