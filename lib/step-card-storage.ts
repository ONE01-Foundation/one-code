/**
 * Step Card Storage - Versioned Local Persistence
 * 
 * Stores AI-generated step cards with versioned keys
 * one01:v1:cards
 * one01:v1:activeCardId
 */

import { OneNextStep } from "@/app/api/nobody/step/route";

export type StepCardStatus = "suggested" | "active" | "done" | "skipped";

export interface StepCard {
  id: string; // UUID
  title: string;
  why: string;
  durationMinutes: number;
  energy: "low" | "medium" | "high";
  domain: "life" | "health" | "career" | "money" | "relationships" | "learning";
  status: StepCardStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

const STORAGE_KEYS = {
  cards: "one01:v1:cards",
  activeCardId: "one01:v1:activeCardId",
};

// Generate UUID
function generateId(): string {
  return `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load all cards
export function loadStepCards(): StepCard[] {
  if (typeof window === "undefined") return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.cards);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save all cards
export function saveStepCards(cards: StepCard[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.cards, JSON.stringify(cards));
}

// Get active card ID
export function getActiveCardId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEYS.activeCardId);
}

// Set active card ID
export function setActiveCardId(cardId: string | null) {
  if (typeof window === "undefined") return;
  if (cardId) {
    localStorage.setItem(STORAGE_KEYS.activeCardId, cardId);
  } else {
    localStorage.removeItem(STORAGE_KEYS.activeCardId);
  }
}

// Create card from OneNextStep
export function createStepCard(step: OneNextStep, status: StepCardStatus = "suggested"): StepCard {
  const now = new Date().toISOString();
  
  const card: StepCard = {
    id: generateId(),
    title: step.title,
    why: step.why,
    durationMinutes: step.durationMinutes,
    energy: step.energy,
    domain: step.domain,
    status,
    createdAt: now,
    updatedAt: now,
  };
  
  const cards = loadStepCards();
  cards.push(card);
  saveStepCards(cards);
  
  return card;
}

// Update card status
export function updateStepCardStatus(cardId: string, status: StepCardStatus): StepCard | null {
  const cards = loadStepCards();
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  
  if (cardIndex === -1) return null;
  
  cards[cardIndex] = {
    ...cards[cardIndex],
    status,
    updatedAt: new Date().toISOString(),
  };
  
  saveStepCards(cards);
  return cards[cardIndex];
}

// Get card by ID
export function getStepCardById(cardId: string): StepCard | null {
  const cards = loadStepCards();
  return cards.find((c) => c.id === cardId) || null;
}

// Get active card
export function getActiveStepCard(): StepCard | null {
  const activeId = getActiveCardId();
  if (!activeId) return null;
  return getStepCardById(activeId);
}

// Get last N cards (for Deck view)
export function getLastStepCards(limit: number = 10): StepCard[] {
  const cards = loadStepCards();
  return cards
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

