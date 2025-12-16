/**
 * Core system types for ONE
 * 
 * PRINCIPLES:
 * - One user, private by default
 * - Everything starts from a single intent
 * - Actions over explanations
 */

// Card status for the action loop
export type CardStatus = "ready" | "in_progress" | "done";
export type CardScope = "private" | "global";
export type IntentCategory = "health" | "money" | "work" | "relationship" | "self" | "other";

// Minimal data model
export interface Session {
  id: string;
  createdAt: string;
  lastActivityAt: string;
}

// Card schema for the core action loop
export interface Card {
  id: string;
  type?: string; // Optional card type
  title: string; // Short title (e.g., "Lower friction")
  action: string; // One suggested action (e.g., "Prepare clothes for tomorrow")
  status: CardStatus; // ready | in_progress | done
  scope: CardScope; // private | global
  time?: number; // Estimated time in minutes (optional)
  category?: IntentCategory;
  createdAt: string; // ISO string
}

// Legacy types (kept for compatibility)
export type CardState = "pending" | "done" | "skipped"; // @deprecated - use CardStatus

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




