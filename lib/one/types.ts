/**
 * OneView Types - V1
 * 
 * Core data structures
 */

/**
 * Sphere = Domain of intent
 */
export interface Sphere {
  id: string;
  parentId: string | null;
  name: string;
  mode: "private" | "global";
  stats: {
    cards: number;
    completed: number;
    lastActivity: string | null; // ISO timestamp
  };
}

/**
 * Card = Action or request
 * 
 * Only cards generate Units (derived from card events).
 */
export interface Card {
  id: string;
  sphereId: string;
  text: string;
  status: "active" | "done" | "paused";
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/**
 * Unit = Moment of Intent
 * 
 * Derived from card events (completion, creation, etc.)
 * Not shown as currency in UI v1.
 * Used for summaries + progression only.
 */
export interface Unit {
  id: string;
  cardId: string;
  sphereId: string;
  event: "created" | "completed" | "paused" | "resumed";
  timestamp: string; // ISO timestamp
  value: number; // For progression calculation
}

/**
 * Summary
 * 
 * AI-generated summary of sphere activity
 */
export interface Summary {
  sphereId: string;
  text: string;
  updatedAt: string; // ISO timestamp
}

