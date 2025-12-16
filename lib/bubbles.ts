/**
 * Bubble System - SideBubbles v0.1
 * 
 * ONE source of truth for 3 bubbles: NEXT, LATER, DONE
 * Mirrors card system, no parallel storage
 */

import { StepCard, loadStepCards } from "./step-card";
import { OneNextStep } from "@/app/api/nobody/step/route";

export type BubbleKind = "next" | "later" | "done";

export interface Bubble {
  id: string;
  kind: BubbleKind;
  title: string;
  meta?: string; // Optional metadata (e.g., "5 min", "suggested")
}

interface BuildBubblesInput {
  activeStepCard: StepCard | null;
  stepSuggestion: OneNextStep | null;
  stepCards: StepCard[];
}

/**
 * Build bubbles from ONE source of truth
 * Priority: DONE (last completed) -> LATER (deferred) -> NEXT (suggested)
 */
export function buildBubbles({
  activeStepCard,
  stepSuggestion,
  stepCards,
}: BuildBubblesInput): Bubble[] {
  const bubbles: Bubble[] = [];

  // DONE: Last card with status="done" (most recent)
  const doneCards = stepCards.filter((c) => c.status === "done");
  if (doneCards.length > 0) {
    const lastDone = doneCards.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )[0];
    bubbles.push({
      id: `done_${lastDone.id}`,
      kind: "done",
      title: lastDone.title,
      meta: `${lastDone.durationMinutes} min`,
    });
  }

  // LATER: Most recent deferred/not_now card (skipped only, not suggested)
  const laterCards = stepCards.filter(
    (c) => c.status === "skipped" && c.id !== activeStepCard?.id
  );
  if (laterCards.length > 0) {
    const lastLater = laterCards.sort(
      (a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
    )[0];
    bubbles.push({
      id: `later_${lastLater.id}`,
      kind: "later",
      title: lastLater.title,
      meta: "deferred",
    });
  }

  // NEXT: 
  // a) If stepSuggestion exists -> use it as NEXT preview
  // b) Else use most relevant suggested card (not active)
  if (stepSuggestion) {
    bubbles.push({
      id: `next_suggestion`,
      kind: "next",
      title: stepSuggestion.title,
      meta: `${stepSuggestion.durationMinutes} min`,
    });
  } else {
    // Find most relevant suggested card (not active)
    const suggestedCards = stepCards.filter(
      (c) => c.status === "suggested" && c.id !== activeStepCard?.id
    );
    if (suggestedCards.length > 0) {
      const mostRecent = suggestedCards.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
      bubbles.push({
        id: `next_${mostRecent.id}`,
        kind: "next",
        title: mostRecent.title,
        meta: `${mostRecent.durationMinutes} min`,
      });
    }
  }

  // Return max 3 bubbles, in priority order: DONE, LATER, NEXT
  return bubbles.slice(0, 3);
}

