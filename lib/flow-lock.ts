/**
 * Flow Lock v0.1
 * 
 * ONE continuation rule: User should never ask "what now?"
 * Determines the next intent based on current state
 */

import { HomeState } from "./home-state";
import { StepCard } from "./step-card";
import { OneNextStep } from "@/app/api/nobody/step/route";

export type NextIntent = "show_active" | "show_step" | "ask_nobody" | "silence";

export interface FlowLockContext {
  homeState: HomeState;
  activeCard?: any | null; // Legacy Card from useCards (if still used)
  activeStepCard?: StepCard | null;
  stepSuggestion?: OneNextStep | null;
  actionLoopState?: string; // Legacy ActionLoop state (if still used)
}

/**
 * Get next intent based on current state
 * 
 * Rules (strict order):
 * - If activeStepCard exists -> show_active
 * - Else if activeCard exists -> show_active
 * - Else if stepSuggestion exists -> show_step
 * - Else if homeState === "empty" -> ask_nobody
 * - Else -> silence
 */
export function getNextIntent(context: FlowLockContext): NextIntent {
  // Priority 1: Active step card
  if (context.activeStepCard) {
    return "show_active";
  }
  
  // Priority 2: Legacy active card (if still used)
  if (context.activeCard) {
    return "show_active";
  }
  
  // Priority 3: Step suggestion exists
  if (context.stepSuggestion) {
    return "show_step";
  }
  
  // Priority 4: Empty state -> ask Nobody
  if (context.homeState === "empty") {
    return "ask_nobody";
  }
  
  // Default: silence (calm empty, no CTA)
  return "silence";
}

