/**
 * Cards Lifecycle Hook v0.1
 * 
 * PRINCIPLES:
 * - Only ONE active card at a time per scope
 * - Limit visible cards to max 3 at once
 * - Completing a card auto-promotes the next draft to active
 * - Done cards are stored but only last one is shown
 */

import { useState, useEffect, useCallback } from "react";
import { Card, CardState, CardScope, Scope } from "@/lib/types";
import { loadCards, saveCards, updateCardState } from "@/lib/card-engine";

interface UseCardsResult {
  activeCard: Card | null; // Center bubble - only ONE per scope
  visibleCards: Card[]; // Side bubbles - max 3 (next/context/last done)
  completeCard: (cardId: string) => void;
  deferCard: (cardId: string) => void;
  refresh: () => void;
}

// Get active card for scope (only ONE)
function getActiveCardForScope(cards: Card[], scope: Scope): Card | null {
  const scopeCards = cards.filter((c) => c.scope === scope || c.scope === "bridge");
  return scopeCards.find((c) => c.state === "active") || null;
}

// Get next draft card (for promotion)
function getNextDraftCard(cards: Card[], scope: Scope): Card | null {
  const scopeCards = cards.filter((c) => c.scope === scope || c.scope === "bridge");
  const drafts = scopeCards.filter((c) => c.state === "draft");
  if (drafts.length === 0) return null;
  
  // Sort by createdAt (oldest first)
  drafts.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  return drafts[0];
}

// Get last done card
function getLastDoneCard(cards: Card[], scope: Scope): Card | null {
  const scopeCards = cards.filter((c) => c.scope === scope || c.scope === "bridge");
  const doneCards = scopeCards.filter((c) => c.state === "done");
  if (doneCards.length === 0) return null;
  
  // Sort by createdAt (newest first)
  doneCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return doneCards[0];
}

// Get visible cards for side bubbles (max 3)
function getVisibleCards(cards: Card[], scope: Scope, activeCard: Card | null): Card[] {
  const scopeCards = cards.filter((c) => c.scope === scope || c.scope === "bridge");
  const visible: Card[] = [];
  
  // 1. Next draft (if not active)
  if (!activeCard) {
    const nextDraft = getNextDraftCard(cards, scope);
    if (nextDraft) visible.push(nextDraft);
  } else {
    // If active exists, get next draft for context
    const nextDraft = getNextDraftCard(cards, scope);
    if (nextDraft && nextDraft.id !== activeCard.id) visible.push(nextDraft);
  }
  
  // 2. Last done card (only one shown)
  const lastDone = getLastDoneCard(cards, scope);
  if (lastDone) visible.push(lastDone);
  
  // Limit to max 3
  return visible.slice(0, 3);
}

// Ensure only ONE active card per scope
function enforceSingleActive(cards: Card[], scope: Scope): Card[] {
  const scopeCards = cards.filter((c) => c.scope === scope || c.scope === "bridge");
  const activeCards = scopeCards.filter((c) => c.state === "active");
  
  // If more than one active, keep the most recent, set others to draft
  if (activeCards.length > 1) {
    activeCards.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const keepActive = activeCards[0];
    
    return cards.map((c) => {
      if (c.id === keepActive.id) return c;
      if (activeCards.some((ac) => ac.id === c.id)) {
        return { ...c, state: "draft" as CardState };
      }
      return c;
    });
  }
  
  return cards;
}

export function useCards(scope: Scope): UseCardsResult {
  const [cards, setCards] = useState<Card[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [visibleCards, setVisibleCards] = useState<Card[]>([]);
  
  // Load cards and enforce single active rule
  const refresh = useCallback(() => {
    const loaded = loadCards();
    const enforced = enforceSingleActive(loaded, scope);
    if (JSON.stringify(enforced) !== JSON.stringify(loaded)) {
      saveCards(enforced);
    }
    
    setCards(enforced);
    const active = getActiveCardForScope(enforced, scope);
    setActiveCard(active);
    setVisibleCards(getVisibleCards(enforced, scope, active));
  }, [scope]);
  
  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);
  
  // Complete card: mark as done, auto-promote next draft
  const completeCard = useCallback((cardId: string) => {
    const updated = updateCardState(cardId, "done");
    if (!updated) return;
    
    // Auto-promote next draft to active
    const allCards = loadCards();
    const nextDraft = getNextDraftCard(allCards, scope);
    
    if (nextDraft) {
      updateCardState(nextDraft.id, "active");
    }
    
    refresh();
  }, [scope, refresh]);
  
  // Defer card: set nextAt to future, move to draft
  const deferCard = useCallback((cardId: string) => {
    const allCards = loadCards();
    const card = allCards.find((c) => c.id === cardId);
    if (!card) return;
    
    // Set nextAt to 1 hour from now
    const nextAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const updated = { ...card, state: "draft" as CardState, nextAt };
    
    const updatedCards = allCards.map((c) => (c.id === cardId ? updated : c));
    saveCards(updatedCards);
    
    // Auto-promote next draft to active
    const nextDraft = getNextDraftCard(updatedCards, scope);
    if (nextDraft && nextDraft.id !== cardId) {
      updateCardState(nextDraft.id, "active");
    }
    
    refresh();
  }, [scope, refresh]);
  
  return {
    activeCard,
    visibleCards,
    completeCard,
    deferCard,
    refresh,
  };
}

