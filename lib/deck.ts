/**
 * Deck System v0.1
 * 
 * A Deck is 3-5 Steps (micro-actions)
 * Only ONE step is active at a time
 */

import { OneNextStep } from "@/app/api/nobody/step/route";
import { Scope } from "@/lib/types";

export type DeckStepType = "timer" | "breath" | "check";

export interface DeckStep {
  id: string;
  title: string;
  type: DeckStepType;
  minutes?: number; // for timer/breath
  reps?: number; // optional for breath (e.g., 6 cycles)
  items?: string[]; // for check
}

export type DeckStatus = "suggested" | "active" | "done" | "skipped";

export interface Deck {
  id: string;
  title: string;
  why: string;
  domain: string;
  steps: DeckStep[]; // 3-5
  createdAt: number;
  scope: Scope;
  status: DeckStatus;
  activeStepIndex: number; // 0-based index
}

const DECKS_STORAGE_KEY = "one_decks_v1";
const ACTIVE_DECK_ID_KEY = "one_active_deck_id";

/**
 * Load all decks from localStorage
 */
export function loadDecks(): Deck[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(DECKS_STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save a deck to localStorage
 */
export function saveDeck(deck: Deck): void {
  if (typeof window === "undefined") return;
  const decks = loadDecks();
  const index = decks.findIndex((d) => d.id === deck.id);
  if (index >= 0) {
    decks[index] = deck;
  } else {
    decks.push(deck);
  }
  localStorage.setItem(DECKS_STORAGE_KEY, JSON.stringify(decks));
}

/**
 * Update a deck (alias for saveDeck)
 */
export function updateDeck(deck: Deck): void {
  saveDeck(deck);
}

/**
 * Set active deck ID
 */
export function setActiveDeckId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_DECK_ID_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_DECK_ID_KEY);
  }
}

/**
 * Get active deck
 */
export function getActiveDeck(): Deck | null {
  if (typeof window === "undefined") return null;
  const activeId = localStorage.getItem(ACTIVE_DECK_ID_KEY);
  if (!activeId) return null;
  const decks = loadDecks();
  return decks.find((d) => d.id === activeId) || null;
}

/**
 * Create a deck from a step suggestion
 */
export function createDeckFromSuggestion(
  suggestion: OneNextStep,
  scope: Scope
): Deck {
  const deckId = `deck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const steps: DeckStep[] = [];

  // Determine step types based on domain and suggestion
  const domain = suggestion.domain || "life";
  const isHealthRelated = domain === "health" || suggestion.title.toLowerCase().includes("breath") || suggestion.title.toLowerCase().includes("meditate");

  if (isHealthRelated) {
    // Health-related: breath + timer + close
    steps.push({
      id: `${deckId}_step_0`,
      title: "Prepare",
      type: "check",
      items: ["Find a quiet space", "Sit comfortably"],
    });
    steps.push({
      id: `${deckId}_step_1`,
      title: "Breathe",
      type: "breath",
      reps: 6,
    });
    steps.push({
      id: `${deckId}_step_2`,
      title: "Focus",
      type: "timer",
      minutes: suggestion.durationMinutes || 10,
    });
    steps.push({
      id: `${deckId}_step_3`,
      title: "Close",
      type: "check",
      items: ["Mark done", "Next time"],
    });
  } else {
    // Default: prepare + do + close
    const duration = suggestion.durationMinutes || 10;
    steps.push({
      id: `${deckId}_step_0`,
      title: "Prepare",
      type: "check",
      items: ["Clear distractions", "Set intention"],
    });
    steps.push({
      id: `${deckId}_step_1`,
      title: "Do",
      type: "timer",
      minutes: duration,
    });
    steps.push({
      id: `${deckId}_step_2`,
      title: "Close",
      type: "check",
      items: ["Mark done", "Reflect briefly"],
    });
  }

  // Ensure 3-5 steps
  if (steps.length < 3) {
    // Add a simple timer step if needed
    steps.splice(1, 0, {
      id: `${deckId}_step_1b`,
      title: "Do",
      type: "timer",
      minutes: 10,
    });
  }

  return {
    id: deckId,
    title: suggestion.title,
    why: suggestion.why,
    domain: domain,
    steps: steps.slice(0, 5), // Max 5 steps
    createdAt: Date.now(),
    scope,
    status: "suggested",
    activeStepIndex: 0,
  };
}

