/**
 * Core system types for ONE
 * 
 * PRINCIPLES:
 * - One user, private by default
 * - Everything starts from a single intent
 * - Actions over explanations
 */

export type CardStatus = "pending" | "done" | "delayed";

export interface Intent {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
}

export interface DecompositionOption {
  id: string;
  label: string;
  description?: string;
}

export interface Card {
  id: string;
  intentId: string;
  action: string; // Single, clear action
  status: CardStatus;
  createdAt: Date;
  completedAt?: Date;
  delayedUntil?: Date;
  userId: string;
}

export interface Loop {
  id: string;
  cardId: string;
  frequency: "daily" | "weekly" | "monthly";
  lastRunAt?: Date;
  nextRunAt: Date;
  userId: string;
}

export interface GlobalMirror {
  // Anonymous aggregate data
  totalIntents: number;
  totalCards: number;
  cardsByStatus: {
    pending: number;
    done: number;
    delayed: number;
  };
  // No user-specific data
}



