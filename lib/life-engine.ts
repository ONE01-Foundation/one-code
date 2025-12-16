/**
 * Life Loop Engine
 * 
 * Powers the One Screen experience with LifeState and LifeAction models.
 * 
 * PRINCIPLES:
 * - One active action at a time
 * - No feeds, no dashboards, no menus
 * - Calm, intentional transitions
 */

import { LifeState, LifeAction, LifeContext, LifeFocus, LifeStateStatus, LifeActionStatus, LifeActionType } from "@/lib/types";

// Generate stable anonymous OneID
export function getOrCreateOneID(): string {
  if (typeof window === "undefined") return "anonymous";
  
  let oneId = localStorage.getItem("one_id");
  if (!oneId) {
    // Generate stable ID based on browser fingerprint + timestamp
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width,
      screen.height,
      new Date().getTime(),
    ].join("-");
    
    // Simple hash (not cryptographically secure, but stable)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    oneId = `one_${Math.abs(hash).toString(36)}`;
    localStorage.setItem("one_id", oneId);
  }
  
  return oneId;
}

// Load LifeStates from localStorage
export function loadLifeStates(context: LifeContext): LifeState[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(`life_states_${context}`);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save LifeStates to localStorage
export function saveLifeStates(context: LifeContext, states: LifeState[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`life_states_${context}`, JSON.stringify(states));
}

// Load LifeActions from localStorage
export function loadLifeActions(lifeStateId: string): LifeAction[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem(`life_actions_${lifeStateId}`);
  if (!stored) return [];
  
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Save LifeActions to localStorage
export function saveLifeActions(lifeStateId: string, actions: LifeAction[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`life_actions_${lifeStateId}`, JSON.stringify(actions));
}

// Get active LifeState (most recent active or suggested)
export function getActiveLifeState(context: LifeContext): LifeState | null {
  const states = loadLifeStates(context);
  const active = states.find((s) => s.status === "active");
  if (active) return active;
  
  const suggested = states.find((s) => s.status === "suggested");
  if (suggested) return suggested;
  
  return null;
}

// Get active LifeAction for a LifeState
export function getActiveLifeAction(lifeStateId: string): LifeAction | null {
  const actions = loadLifeActions(lifeStateId);
  const pending = actions.find((a) => a.status === "pending");
  return pending || null;
}

// Create a new LifeState
export function createLifeState(
  context: LifeContext,
  focus: LifeFocus
): LifeState {
  const state: LifeState = {
    id: `life_state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    context,
    focus,
    status: "suggested",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const states = loadLifeStates(context);
  states.push(state);
  saveLifeStates(context, states);
  
  return state;
}

// Create a new LifeAction
export function createLifeAction(
  lifeStateId: string,
  title: string,
  description: string,
  actionType: LifeActionType
): LifeAction {
  const action: LifeAction = {
    id: `life_action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    lifeStateId,
    title,
    description,
    actionType,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  
  const actions = loadLifeActions(lifeStateId);
  actions.push(action);
  saveLifeActions(lifeStateId, actions);
  
  return action;
}

// Update LifeState status
export function updateLifeStateStatus(
  stateId: string,
  context: LifeContext,
  status: LifeStateStatus
) {
  const states = loadLifeStates(context);
  const updated = states.map((s) =>
    s.id === stateId ? { ...s, status, updatedAt: new Date().toISOString() } : s
  );
  saveLifeStates(context, updated);
}

// Update LifeAction status
export function updateLifeActionStatus(
  actionId: string,
  lifeStateId: string,
  status: LifeActionStatus
) {
  const actions = loadLifeActions(lifeStateId);
  const updated = actions.map((a) =>
    a.id === actionId ? { ...a, status } : a
  );
  saveLifeActions(lifeStateId, updated);
}

// TODO: AI integration - Generate LifeAction based on LifeState
// This will use AI to suggest appropriate actions based on:
// - Current LifeState focus and status
// - Last completed or skipped action
// - Context (private/global)
export async function generateLifeAction(
  lifeState: LifeState,
  lastAction?: LifeAction | null
): Promise<LifeAction> {
  // For now, return a simple default action
  // TODO: Integrate with AI to generate contextual actions
  
  const defaultActions: Record<LifeActionType, { title: string; description: string }> = {
    reflect: {
      title: "Take a moment",
      description: "Consider what matters most right now.",
    },
    decide: {
      title: "Make a choice",
      description: "Choose one direction to move forward.",
    },
    do: {
      title: "Take action",
      description: "Complete one small step.",
    },
    connect: {
      title: "Reach out",
      description: "Connect with someone who matters.",
    },
  };
  
  // Simple logic: choose action type based on focus
  let actionType: LifeActionType = "do";
  if (lifeState.focus === "relationships") {
    actionType = "connect";
  } else if (lifeState.status === "suggested") {
    actionType = "decide";
  }
  
  const template = defaultActions[actionType];
  
  return createLifeAction(
    lifeState.id,
    template.title,
    template.description,
    actionType
  );
}

