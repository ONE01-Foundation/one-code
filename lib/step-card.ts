/**
 * Step Card Model & Storage
 * 
 * Client-side first persistence for AI-generated step cards
 * Versioned localStorage keys: one01:v1:cards, one01:v1:activeCardId
 */

export type StepCardStatus = "suggested" | "active" | "done" | "skipped";
export type StepCardDomain = "life" | "health" | "career" | "money" | "relationships" | "learning";
export type StepCardEnergy = "low" | "medium" | "high";

export interface StepCard {
  id: string; // UUID
  title: string;
  why: string;
  durationMinutes: number;
  energy: StepCardEnergy;
  domain: StepCardDomain;
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
  return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load all step cards
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

// Save step cards
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

// Create step card from AI suggestion
export function createStepCardFromSuggestion(
  suggestion: {
    title: string;
    why: string;
    durationMinutes: number;
    energy: StepCardEnergy;
    domain: StepCardDomain;
  },
  status: StepCardStatus = "suggested"
): StepCard {
  const now = new Date().toISOString();
  
  return {
    id: generateId(),
    title: suggestion.title,
    why: suggestion.why,
    durationMinutes: suggestion.durationMinutes,
    energy: suggestion.energy,
    domain: suggestion.domain,
    status,
    createdAt: now,
    updatedAt: now,
  };
}

// Save step card
export function saveStepCard(card: StepCard) {
  const cards = loadStepCards();
  const index = cards.findIndex((c) => c.id === card.id);
  
  if (index >= 0) {
    cards[index] = { ...card, updatedAt: new Date().toISOString() };
  } else {
    cards.push(card);
  }
  
  saveStepCards(cards);
}

// Update step card status
export function updateStepCardStatus(cardId: string, status: StepCardStatus) {
  const cards = loadStepCards();
  const card = cards.find((c) => c.id === cardId);
  
  if (card) {
    card.status = status;
    card.updatedAt = new Date().toISOString();
    saveStepCards(cards);
  }
}

// Get active step card
export function getActiveStepCard(): StepCard | null {
  const activeId = getActiveCardId();
  if (!activeId) return null;
  
  const cards = loadStepCards();
  return cards.find((c) => c.id === activeId && c.status === "active") || null;
}

// Get last N cards (for Deck view)
export function getLastStepCards(limit: number = 10): StepCard[] {
  const cards = loadStepCards();
  return cards
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// Get recent step cards for SideBubbles (max 3)
// Order: done (newest first), skipped, active (older)
export function getRecentStepCards(limit: number = 3): StepCard[] {
  const cards = loadStepCards();
  const activeId = getActiveCardId();
  
  // Separate by status
  const done = cards.filter((c) => c.status === "done");
  const skipped = cards.filter((c) => c.status === "skipped");
  const active = cards.filter((c) => c.status === "active" && c.id !== activeId); // Exclude current active
  
  // Sort done by updatedAt (newest first)
  done.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  // Sort skipped by updatedAt (newest first)
  skipped.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  
  // Sort active by createdAt (older first)
  active.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  // Combine: done first, then skipped, then active
  const result = [...done, ...skipped, ...active];
  
  return result.slice(0, limit);
}
