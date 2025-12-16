/**
 * Core system types for ONE
 * 
 * PRINCIPLES:
 * - One user, private by default
 * - Everything starts from a single intent
 * - Actions over explanations
 */

export type CardState = "pending" | "done" | "skipped";
export type IntentCategory = "health" | "money" | "work" | "relationship" | "self" | "other";

// Minimal data model
export interface Session {
  id: string;
  createdAt: string;
  lastActivityAt: string;
}

export interface Card {
  id: string;
  intent: string; // Single, reduced intent
  action_text: string; // Short imperative sentence
  state: CardState; // pending | done | skipped
  category?: IntentCategory;
  timestamp: string; // ISO string
  createdAt: string;
}

// State Memory - Minimal session-based state
export interface State {
  openThread: string | null; // Set when DESIRE/REQUEST intent appears
  lastSuggestedAction: string | null; // Set when suggestion is explicitly made
  pendingQuestion: string | null; // Set when system asks a question
  updatedAt: string; // ISO timestamp
}

// Legacy types (kept for compatibility, will be removed later)
export type CardStatus = "pending" | "done" | "delayed"; // @deprecated - use CardState



