/**
 * Bubble System - 3-Slot Navigation v0.1
 * 
 * LAST | NOW | NEXT
 * Fixed slots, deterministic
 */

import { StepCard, loadStepCards } from "./step-card";
import { OneNextStep } from "@/app/api/nobody/step/route";

export type BubbleSlot = "last" | "now" | "next";

export type BubbleState = "done" | "active" | "queued";

export interface BubbleItem {
  id: string;
  title: string;
  state: BubbleState;
  slot: BubbleSlot;
  card?: StepCard; // Reference to the actual card (for detail view)
}

export interface BubbleSlots {
  last?: BubbleItem;
  now?: BubbleItem;
  next?: BubbleItem;
}

interface BuildBubblesInput {
  activeStepCard: StepCard | null;
  stepSuggestion: OneNextStep | null;
  stepCards: StepCard[];
}

/**
 * Build 3-slot bubbles: LAST | NOW | NEXT
 */
export function buildBubbles({
  activeStepCard,
  stepSuggestion,
  stepCards,
}: BuildBubblesInput): BubbleSlots {
  const slots: BubbleSlots = {};

  // NOW: Active card (center)
  if (activeStepCard) {
    slots.now = {
      id: activeStepCard.id,
      title: activeStepCard.title,
      state: "active",
      slot: "now",
      card: activeStepCard,
    };
  }

  // Filter out active card from pool
  const nonActiveCards = stepCards.filter(
    (c) => !activeStepCard || c.id !== activeStepCard.id
  );

  // LAST: Most recent done card
  const doneCards = nonActiveCards.filter((c) => c.status === "done");
  if (doneCards.length > 0) {
    const lastDone = doneCards.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    slots.last = {
      id: lastDone.id,
      title: lastDone.title,
      state: "done",
      slot: "last",
      card: lastDone,
    };
  }

  // NEXT: First queued/deferred/pending
  // Priority: stepSuggestion > suggested > skipped
  if (stepSuggestion) {
    slots.next = {
      id: "next_suggestion",
      title: stepSuggestion.title,
      state: "queued",
      slot: "next",
    };
  } else {
    // Find first suggested card
    const suggestedCards = nonActiveCards.filter((c) => c.status === "suggested");
    if (suggestedCards.length > 0) {
      const firstSuggested = suggestedCards.sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )[0];
      slots.next = {
        id: firstSuggested.id,
        title: firstSuggested.title,
        state: "queued",
        slot: "next",
        card: firstSuggested,
      };
    } else {
      // Fallback: first skipped card (deferred)
      const skippedCards = nonActiveCards.filter((c) => c.status === "skipped");
      if (skippedCards.length > 0) {
        const firstSkipped = skippedCards.sort(
          (a, b) => new Date(a.updatedAt || a.createdAt).getTime() - new Date(b.updatedAt || b.createdAt).getTime()
        )[0];
        slots.next = {
          id: firstSkipped.id,
          title: firstSkipped.title,
          state: "queued",
          slot: "next",
          card: firstSkipped,
        };
      }
    }
  }

  return slots;
}
