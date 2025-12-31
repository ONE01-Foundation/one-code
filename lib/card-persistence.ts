/**
 * Card Persistence Helper
 * 
 * Server-side utility for persisting cards from AI interactions.
 * Uses Supabase service role key (bypasses RLS).
 */

import { supabase } from "@/lib/supabase/server";

export interface SuggestedCard {
  title: string;
  intent: string;
  world?: string;
  confidence?: number;
}

export interface IngestCardParams {
  sessionId: string;
  bubbleId: string;
  userMessage: string;
  aiResponse: string;
  suggestedCard?: SuggestedCard;
}

export interface IngestCardResult {
  cardId?: string;
  error?: string;
}

/**
 * Get or create a session in the database
 */
async function getOrCreateSession(sessionId: string): Promise<{ id: string; error?: string }> {
  try {
    // Try to get existing session
    const { data: existing, error: fetchError } = await supabase
      .from("sessions")
      .select("id")
      .eq("session_id", sessionId)
      .single();

    if (existing) {
      return { id: existing.id };
    }

    // Create new session if doesn't exist
    const { data: newSession, error: insertError } = await supabase
      .from("sessions")
      .insert({
        session_id: sessionId,
      })
      .select("id")
      .single();

    if (insertError) {
      // If insert fails but session might exist (race condition), try to fetch again
      const { data: retry, error: retryError } = await supabase
        .from("sessions")
        .select("id")
        .eq("session_id", sessionId)
        .single();

      if (retry) {
        return { id: retry.id };
      }

      return { id: "", error: retryError?.message || insertError.message };
    }

    return { id: newSession.id };
  } catch (err) {
    return {
      id: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Ingest a card from an AI interaction
 * 
 * If suggestedCard is provided, creates a card and card_event.
 * Optionally stores chat messages if chat_messages table exists.
 */
export async function ingestCardFromAI({
  sessionId,
  bubbleId,
  userMessage,
  aiResponse,
  suggestedCard,
}: IngestCardParams): Promise<IngestCardResult> {
  try {
    // Get or create session
    const { id: sessionDbId, error: sessionError } = await getOrCreateSession(sessionId);
    if (sessionError || !sessionDbId) {
      return { error: `Session error: ${sessionError || "unknown"}` };
    }

    let cardId: string | undefined;

    // If suggestedCard exists, create the card
    if (suggestedCard && suggestedCard.title && suggestedCard.intent) {
      // Insert card
      const { data: card, error: cardError } = await supabase
        .from("cards")
        .insert({
          session_id: sessionId,
          bubble_id: bubbleId,
          title: suggestedCard.title,
          intent: suggestedCard.intent,
          world: suggestedCard.world || null,
          state: "draft",
          source: "ai",
        })
        .select("id")
        .single();

      if (cardError) {
        console.error("Error creating card:", cardError);
        return { error: `Card creation error: ${cardError.message}` };
      }

      cardId = card.id;

      // Create card_event for audit log
      const { error: eventError } = await supabase.from("card_events").insert({
        card_id: cardId,
        session_id: sessionId,
        event_type: "created",
        metadata: {
          userMessage,
          aiResponse: aiResponse.substring(0, 500), // Limit stored response length
          suggestedCard,
          bubbleId,
        },
      });

      if (eventError) {
        console.error("Error creating card_event:", eventError);
        // Non-fatal - card was created, event log failed
      }
    }

    // Optionally store chat messages (non-blocking)
    try {
      await supabase.from("chat_messages").insert([
        {
          session_id: sessionId,
          bubble_id: bubbleId,
          role: "user",
          content: userMessage,
        },
        {
          session_id: sessionId,
          bubble_id: bubbleId,
          role: "assistant",
          content: aiResponse,
        },
      ]);
      // Ignore errors - chat persistence is optional for MVP
    } catch (chatError) {
      console.error("Chat message persistence failed (non-fatal):", chatError);
    }

    return { cardId };
  } catch (err) {
    console.error("Error in ingestCardFromAI:", err);
    return {
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

