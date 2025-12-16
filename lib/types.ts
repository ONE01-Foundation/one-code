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

// Closure Types - Every interaction must end in ONE of these
export type ClosureType = "DONE" | "PAUSED" | "REDIRECTED";

// Mode Types
export type Mode = "private" | "global";

// Shared Context (read-only, available in both modes)
export interface SharedContext {
  // No personal data, only system-level info
  systemTime: string; // ISO timestamp
  activeDomains?: string[]; // Anonymous domain categories (e.g., ["health", "work"])
}

// Private Context (isolated, only in private mode)
export interface PrivateContext {
  openThread: string | null; // Set when DESIRE/REQUEST intent appears
  lastSuggestedAction: string | null; // Set when suggestion is explicitly made
  pendingQuestion: string | null; // Set when system asks a question
  userCards?: Card[]; // User's personal cards (never in Global)
}

// State Memory - Minimal session-based state with mode separation
export interface State {
  mode: Mode; // "private" | "global"
  sharedContext: SharedContext; // Read-only, available in both modes
  privateContext: PrivateContext; // Isolated, only in private mode
  updatedAt: string; // ISO timestamp
}

// Legacy types (kept for compatibility, will be removed later)
export type CardStatus = "pending" | "done" | "delayed"; // @deprecated - use CardState



