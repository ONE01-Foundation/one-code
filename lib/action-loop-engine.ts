/**
 * Action Loop v0.1
 * 
 * PRINCIPLES:
 * - One suggestion at a time
 * - Minimal choice: Yes / Not now / Change
 * - Actions must be small (<2 minutes)
 * - Every action must close the loop
 * - Plan multiple steps internally, reveal only next step
 */

import { LifeAction, LifeState, Card, ActionClosure } from "@/lib/types";
import { generateLifeAction, loadLifeActions } from "./life-engine";
import { createCard } from "./card-engine";

// Action Loop Plan (multiple steps planned internally)
export interface ActionLoopPlan {
  steps: ActionLoopStep[];
  currentStepIndex: number;
  stateId: string;
  createdAt: string;
}

// Single step in action loop (only one revealed at a time)
export interface ActionLoopStep {
  id: string;
  prompt: string; // Single clear suggestion
  action: string; // Immediate, simple action (<2 minutes)
  estimatedTime: number; // In minutes (must be <2)
  cardId?: string; // Card this step relates to
  nextStepId?: string; // Next step in plan (internal)
}

// Create action loop plan (AI plans multiple steps internally)
export async function createActionLoopPlan(
  lifeState: LifeState,
  card?: Card | null
): Promise<ActionLoopPlan> {
  // Plan 3-5 steps internally
  const steps: ActionLoopStep[] = [];
  
  // Generate first action
  const firstAction = await generateLifeAction(lifeState, null);
  
  // Create first step (only this one is revealed)
  // Actions must be small (<2 minutes)
  const firstStep: ActionLoopStep = {
    id: `step_${Date.now()}`,
    prompt: firstAction.title,
    action: firstAction.description,
    estimatedTime: 1, // Default to 1 minute, cap at 2 minutes
    cardId: card?.id,
  };
  
  steps.push(firstStep);
  
  // Plan next steps internally (not revealed yet)
  // TODO: AI integration - Generate 2-4 more steps based on context
  // For now, we'll generate them on-demand
  
  return {
    steps,
    currentStepIndex: 0,
    stateId: lifeState.id,
    createdAt: new Date().toISOString(),
  };
}

// Get current step from plan (only one revealed at a time)
export function getCurrentActionStep(plan: ActionLoopPlan): ActionLoopStep | null {
  if (plan.currentStepIndex >= plan.steps.length) return null;
  return plan.steps[plan.currentStepIndex];
}

// Validate action is small (<2 minutes)
export function isActionSmall(estimatedTime: number): boolean {
  return estimatedTime < 2;
}

// Move to next step in plan
export async function moveToNextStep(
  plan: ActionLoopPlan,
  closure: "completed" | "skipped" | "changed"
): Promise<{ plan: ActionLoopPlan; hasMore: boolean }> {
  // Mark current step based on closure
  const currentStep = getCurrentActionStep(plan);
  if (currentStep) {
    // Update card if exists
    if (currentStep.cardId && closure === "completed") {
      // Card action completed
      // This would update the card state
    }
  }
  
  // Move to next step
  plan.currentStepIndex++;
  
  // Check if we need to generate more steps
  if (plan.currentStepIndex >= plan.steps.length && closure === "completed") {
    // Generate next step on-demand
    // TODO: AI integration - Generate next step based on progress
    // For now, we'll just mark as complete
    return { plan, hasMore: false };
  }
  
  const hasMore = plan.currentStepIndex < plan.steps.length;
  return { plan, hasMore };
}

// Handle action choice
export function handleActionChoice(
  plan: ActionLoopPlan,
  choice: "yes" | "not_now" | "change"
): { plan: ActionLoopPlan; closure: ActionClosure | null } {
  if (choice === "yes") {
    // User accepts - move to action phase
    return { plan, closure: null };
  }
  
  if (choice === "not_now") {
    // User skips - close loop
    return { plan, closure: "skipped" };
  }
  
  if (choice === "change") {
    // User wants different action - regenerate
    return { plan, closure: "changed" };
  }
  
  return { plan, closure: null };
}

// Complete action and close loop
export function completeAction(
  plan: ActionLoopPlan
): { plan: ActionLoopPlan; closure: "completed" } {
  // Action completed - close loop
  return { plan, closure: "completed" };
}

// Save action loop plan
export function saveActionLoopPlan(plan: ActionLoopPlan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`action_loop_${plan.stateId}`, JSON.stringify(plan));
}

// Load action loop plan
export function loadActionLoopPlan(stateId: string): ActionLoopPlan | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(`action_loop_${stateId}`);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

