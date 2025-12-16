/**
 * Card System v0.1
 * 
 * PRINCIPLES:
 * - Cards represent persistent truth or intent
 * - Cards are created by Steps and evolve over time
 * - Cards cannot be freely edited by users
 * - Cards are updated via system actions only
 * - No hard deletion — archive only
 * - Cards must persist across sessions
 */

import { Card, CardType, CardState, CardScope } from "@/lib/types";

// Load all cards from localStorage
export function loadCards(scope?: CardScope): Card[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem("one_cards");
  if (!stored) return [];
  
  try {
    const cards: Card[] = JSON.parse(stored);
    
    // Migrate legacy cards to new format
    const migrated = cards.map((c) => {
      // If card has old format, migrate it
      if (!c.title) {
        return {
          ...c,
          title: c.content || "Untitled",
          intent: c.type || c.category || c.intent || "other",
        };
      }
      // Ensure required fields exist
      return {
        ...c,
        title: c.title || "Untitled",
        intent: c.intent || c.type || c.category || "other",
      };
    });
    
    // Filter by scope if provided
    if (scope) {
      return migrated.filter((c) => c.scope === scope);
    }
    
    return migrated;
  } catch {
    return [];
  }
}

// Save cards to localStorage
export function saveCards(cards: Card[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_cards", JSON.stringify(cards));
}

// Create a new card (Cards Lifecycle v0.1)
export function createCard(
  title: string,
  intent: string,
  scope: CardScope = "private",
  source?: string
): Card {
  const now = new Date().toISOString();
  
  const card: Card = {
    id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title,
    intent,
    state: "draft",
    scope,
    createdAt: now,
    source: source || "user",
  };
  
  // Save to localStorage
  const cards = loadCards();
  cards.push(card);
  saveCards(cards);
  
  return card;
}

// Legacy createCard (for backward compatibility)
export function createCardLegacy(
  type: CardType,
  content: string,
  scope: CardScope = "private",
  originStepId?: string
): Card {
  return createCard(content, type, scope, originStepId);
}

// Update card state (system action only)
export function updateCardState(cardId: string, newState: CardState): Card | null {
  const cards = loadCards();
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  
  if (cardIndex === -1) return null;
  
  const card = cards[cardIndex];
  card.state = newState;
  card.updatedAt = new Date().toISOString();
  
  cards[cardIndex] = card;
  saveCards(cards);
  
  return card;
}

// Update card content (system action only)
export function updateCardContent(cardId: string, newContent: string): Card | null {
  const cards = loadCards();
  const cardIndex = cards.findIndex((c) => c.id === cardId);
  
  if (cardIndex === -1) return null;
  
  const card = cards[cardIndex];
  card.content = newContent;
  card.updatedAt = new Date().toISOString();
  
  cards[cardIndex] = card;
  saveCards(cards);
  
  return card;
}

// Archive card (no hard deletion) - mark as done instead
export function archiveCard(cardId: string): Card | null {
  return updateCardState(cardId, "done");
}

// Get active cards (not done)
export function getActiveCards(scope?: CardScope): Card[] {
  const cards = loadCards(scope);
  return cards.filter((c) => c.state !== "done");
}

// Get cards that need attention
// Cards request attention based on time and state
export function getCardsNeedingAttention(scope?: CardScope): Card[] {
  const activeCards = getActiveCards(scope);
  const now = Date.now();
  
  return activeCards.filter((card) => {
    const updatedAt = new Date(card.updatedAt || card.createdAt).getTime();
    const daysSinceUpdate = (now - updatedAt) / (1000 * 60 * 60 * 24);
    
    // Cards in "draft" state need attention if older than 1 day
    if (card.state === "draft" && daysSinceUpdate > 1) {
      return true;
    }
    
    // Cards in "active" state need attention if older than 3 days
    if (card.state === "active" && daysSinceUpdate > 3) {
      return true;
    }
    
    return false;
  });
}

// Get most relevant card for current context
// Only a small number of Cards should be active at any moment
export function getMostRelevantCard(scope?: CardScope): Card | null {
  const activeCards = getActiveCards(scope);
  
  if (activeCards.length === 0) return null;
  
  // Prioritize: active > draft
  const sorted = activeCards.sort((a, b) => {
    const statePriority: Record<CardState, number> = {
      active: 2,
      draft: 1,
      done: 0,
    };
    
    const priorityDiff = statePriority[b.state] - statePriority[a.state];
    if (priorityDiff !== 0) return priorityDiff;
    
    // If same priority, prefer more recently created/updated
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
  });
  
  return sorted[0];
}

// Check if card can trigger a step
// Cards may trigger future Steps
export function canCardTriggerStep(card: Card): boolean {
  // Cards in draft or active state can trigger steps
  return card.state === "draft" || card.state === "active";
}

// Get cards by origin step
export function getCardsByOriginStep(originStepId: string): Card[] {
  const cards = loadCards();
  return cards.filter((c) => c.originStepId === originStepId);
}

