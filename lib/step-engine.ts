/**
 * Step Engine (v0.1)
 * 
 * PRINCIPLES:
 * - Steps are the smallest unit of interaction
 * - System plans 5-7 steps ahead internally
 * - Only current step is revealed
 * - Each step produces immediate visible result
 * - Never ask open-ended questions
 * - Never present more than 2 choices
 */

import { Step, StepContext, StepIntent, StepAction, Card, LifeState, LifeAction } from "@/lib/types";
import { createLifeState, createLifeAction, generateLifeAction } from "./life-engine";

// Step plan (5-7 steps ahead)
export interface StepPlan {
  steps: Step[];
  currentStepIndex: number;
  context: StepContext;
}

// Load step plan from localStorage
export function loadStepPlan(userId: string): StepPlan | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem(`step_plan_${userId}`);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save step plan to localStorage
export function saveStepPlan(userId: string, plan: StepPlan) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`step_plan_${userId}`, JSON.stringify(plan));
}

// Clear step plan
export function clearStepPlan(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`step_plan_${userId}`);
}

// Get current step from plan
export function getCurrentStep(plan: StepPlan): Step | null {
  if (plan.currentStepIndex >= plan.steps.length) return null;
  return plan.steps[plan.currentStepIndex];
}

// Execute action and move to next step
export async function executeStepAction(
  plan: StepPlan,
  actionId: string
): Promise<{ plan: StepPlan; result: "card" | "state" | "transition" | null }> {
  const currentStep = getCurrentStep(plan);
  if (!currentStep) return { plan, result: null };
  
  const action = currentStep.actions.find((a) => a.id === actionId);
  if (!action) return { plan, result: null };
  
  // Store user choice
  plan.context.userChoices[currentStep.id] = actionId;
  
  // Execute side effects (async)
  if (currentStep.onComplete) {
    await currentStep.onComplete(plan.context);
  }
  
  // Determine next step
  let nextStepId: string | undefined;
  
  if (action.nextStepId) {
    nextStepId = action.nextStepId;
  } else if (action.onSelect) {
    const nextStep = action.onSelect(plan.context);
    nextStepId = nextStep?.id;
  } else if (currentStep.nextStepId) {
    nextStepId = currentStep.nextStepId;
  }
  
  // Move to next step
  if (nextStepId) {
    const nextIndex = plan.steps.findIndex((s) => s.id === nextStepId);
    if (nextIndex !== -1) {
      plan.currentStepIndex = nextIndex;
    } else {
      // Step not found, advance to next
      plan.currentStepIndex++;
    }
  } else {
    // No next step, advance
    plan.currentStepIndex++;
  }
  
  return {
    plan,
    result: action.result || null,
  };
}

// Create onboarding flow (Entry → First choice → First card → Home)
export function createOnboardingPlan(userId: string, welcomeChoice?: "want" | "offer"): StepPlan {
  const context: StepContext = {
    userId,
    currentStepId: "",
    previousSteps: [],
    userChoices: {},
    cards: [],
    lifeStates: [],
  };
  
  // Step 1: Entry
  const entryStep: Step = {
    id: "entry",
    intent: "entry",
    message: "Welcome.\nThis is a space to act — not to scroll.",
    pause: 400,
    actions: [
      {
        id: "continue",
        label: "Continue",
        type: "primary",
        nextStepId: "welcome_choice",
      },
    ],
  };
  
  // Step 2: First choice
  const welcomeChoiceStep: Step = {
    id: "welcome_choice",
    intent: "choice",
    message: "What brings you here right now?",
    pause: 300,
    actions: [
      {
        id: "want",
        label: "I want something",
        type: "choice",
        nextStepId: "first_card",
        result: "state",
      },
      {
        id: "offer",
        label: "I can offer something",
        type: "choice",
        nextStepId: "first_card",
        result: "state",
      },
    ],
    onComplete: (ctx) => {
      // Store welcome choice
      const choice = ctx.userChoices["welcome_choice"];
      if (typeof window !== "undefined") {
        localStorage.setItem("one_welcome_choice", choice);
      }
    },
  };
  
  // Step 3: First card creation
  const firstCardStep: Step = {
    id: "first_card",
    intent: "card_creation",
    message: "Let's start with one small step.",
    pause: 500,
    actions: [
      {
        id: "create_card",
        label: "OK",
        type: "primary",
        nextStepId: "transition",
        result: "card",
      },
    ],
    onComplete: async (ctx) => {
      // Create first LifeState based on welcome choice
      const choice = ctx.userChoices["welcome_choice"] || "want";
      const focus: "health" | "money" | "work" | "relationships" | "self" | "other" = 
        choice === "want" ? "other" : "relationships";
      
      const lifeState = createLifeState("private", focus);
      ctx.lifeStates.push(lifeState);
      
      // Generate first action
      try {
        const lifeAction = await generateLifeAction(lifeState, null);
        
        // Map LifeFocus to IntentCategory (relationship vs relationships)
        const category: "health" | "money" | "work" | "relationship" | "self" | "other" = 
          focus === "relationships" ? "relationship" : focus;
        
        // Create card from action
        const card: Card = {
          id: `card_${Date.now()}`,
          title: lifeAction.title,
          action: lifeAction.description,
          status: "ready",
          scope: "private",
          category: category,
          createdAt: new Date().toISOString(),
        };
        
        ctx.cards.push(card);
        
        // Save card to localStorage
        if (typeof window !== "undefined") {
          const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
          cards.push(card);
          localStorage.setItem("one_cards", JSON.stringify(cards));
        }
      } catch (error) {
        console.error("Error creating first card:", error);
        // Continue even if card creation fails
      }
    },
  };
  
  // Step 4: Transition
  const transitionStep: Step = {
    id: "transition",
    intent: "transition",
    message: "You're all set.",
    pause: 600,
    actions: [
      {
        id: "go_home",
        label: "Continue",
        type: "primary",
        nextStepId: "home",
        result: "transition",
      },
    ],
  };
  
  // Step 5: Home (completion)
  const homeStep: Step = {
    id: "home",
    intent: "home",
    message: "",
    actions: [],
    onComplete: (ctx) => {
      // Mark onboarding complete
      if (typeof window !== "undefined") {
        localStorage.setItem("one_welcome_completed", "true");
        localStorage.setItem("one_onboarding_complete", "true");
      }
    },
  };
  
  const steps: Step[] = [entryStep, welcomeChoiceStep, firstCardStep, transitionStep, homeStep];
  
  // If welcome choice already exists, skip to first card
  if (welcomeChoice) {
    context.userChoices["welcome_choice"] = welcomeChoice;
    return {
      steps,
      currentStepIndex: 2, // Start at first_card
      context,
    };
  }
  
  return {
    steps,
    currentStepIndex: 0,
    context,
  };
}

// Check if onboarding is complete
export function isOnboardingComplete(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("one_onboarding_complete") === "true";
}

// Create step plan for returning users (if needed)
export function createHomePlan(userId: string): StepPlan | null {
  // Returning users go directly to home state
  // No step plan needed, they use Life Loop Engine
  return null;
}

