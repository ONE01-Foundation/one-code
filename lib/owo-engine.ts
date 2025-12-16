/**
 * Onboarding Without Onboarding (OWO) v0.1
 * 
 * PRINCIPLES:
 * - Zero friction entry
 * - No signup, no forms, no credentials
 * - User enters through action, not identity
 * - Never block progress for missing data
 * - Identity is optional and deferred
 */

import { OWOState, OWOChoice, CardScope } from "@/lib/types";
import { getOrCreateOneID } from "./life-engine";
import { createCard } from "./card-engine";

// Check if OWO is complete
export function isOWOComplete(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("one_owo_complete") === "true";
}

// Mark OWO as complete
export function markOWOComplete() {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_owo_complete", "true");
}

// Get OWO choice
export function getOWOChoice(): OWOChoice | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("one_owo_choice");
  return (stored as OWOChoice) || null;
}

// Save OWO choice
export function saveOWOChoice(choice: OWOChoice) {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_owo_choice", choice);
}

// Get OWO input (optional text input)
export function getOWOInput(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("one_owo_input") || null;
}

// Save OWO input
export function saveOWOInput(input: string) {
  if (typeof window === "undefined") return;
  if (input.trim()) {
    localStorage.setItem("one_owo_input", input.trim());
  } else {
    localStorage.removeItem("one_owo_input");
  }
}

// Create anonymous session
export function createAnonymousSession(): string {
  // Generate or get anonymous user ID
  const userId = getOrCreateOneID();
  
  // Create session record (local)
  const session = {
    id: `session_${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
    anonymous: true,
  };
  
  if (typeof window !== "undefined") {
    localStorage.setItem("one_session", JSON.stringify(session));
  }
  
  // TODO: Store session server-side (optional, non-blocking)
  // This would be an async call that doesn't block the flow
  
  return userId;
}

// Create first card from input (implicit)
export function createFirstCardFromInput(input: string, choice: OWOChoice): void {
  if (!input.trim()) return;
  
  // Determine card type and scope based on choice
  const cardType = choice === "my_life" ? "goal" : "offer";
  const scope: CardScope = choice === "my_life" ? "private" : "global";
  
  // Create card implicitly
  createCard(
    cardType,
    input.trim(),
    scope,
    "owo_input" // originStepId
  );
}

// Initialize OWO flow
export function initializeOWO(): {
  userId: string;
  needsOWO: boolean;
} {
  // Create anonymous session automatically
  const userId = createAnonymousSession();
  
  // Check if OWO is needed
  const needsOWO = !isOWOComplete();
  
  return {
    userId,
    needsOWO,
  };
}

