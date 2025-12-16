/**
 * Signal & Timing Engine v0.1
 * 
 * PRINCIPLES:
 * - Signals are soft, contextual suggestions for a single next action
 * - Signals are not notifications - minimal, optional, rare
 * - Only one Signal may be active at any time
 * - Maximum 3 Signals per day
 * - Signals must never interrupt an active user action
 * - Every Signal must lead to at most one possible Step
 */

import { Signal, SignalType, SignalStatus, CardScope, Card } from "@/lib/types";
import { getCardsNeedingAttention, getMostRelevantCard } from "./card-engine";

// Load signals from localStorage
export function loadSignals(scope?: CardScope): Signal[] {
  if (typeof window === "undefined") return [];
  
  const stored = localStorage.getItem("one_signals");
  if (!stored) return [];
  
  try {
    const signals: Signal[] = JSON.parse(stored);
    
    // Filter by scope if provided
    if (scope) {
      return signals.filter((s) => s.scope === scope);
    }
    
    return signals;
  } catch {
    return [];
  }
}

// Save signals to localStorage
export function saveSignals(signals: Signal[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_signals", JSON.stringify(signals));
}

// Get signals for today
export function getSignalsToday(scope?: CardScope): Signal[] {
  const signals = loadSignals(scope);
  const today = new Date().toISOString().split("T")[0];
  
  return signals.filter((s) => {
    const signalDate = s.createdAt.split("T")[0];
    return signalDate === today;
  });
}

// Check if we can create a new signal (max 3 per day)
export function canCreateSignal(scope?: CardScope): boolean {
  const signalsToday = getSignalsToday(scope);
  return signalsToday.length < 3;
}

// Get active signal (only one may be active at any time)
export function getActiveSignal(scope?: CardScope): Signal | null {
  const signals = loadSignals(scope);
  const active = signals.find((s) => s.status === "active");
  return active || null;
}

// Create a new signal
export function createSignal(
  type: SignalType,
  message: string,
  scope: CardScope = "private",
  cardId?: string,
  stepId?: string
): Signal | null {
  // Check if we can create a signal (max 3 per day)
  if (!canCreateSignal(scope)) {
    return null;
  }
  
  // Check if there's already an active signal (only one at a time)
  const activeSignal = getActiveSignal(scope);
  if (activeSignal) {
    return null;
  }
  
  const now = new Date().toISOString();
  
  const signal: Signal = {
    id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    status: "pending",
    message,
    cardId,
    stepId,
    scope,
    createdAt: now,
    triggeredAt: now,
  };
  
  // Save to localStorage
  const signals = loadSignals();
  signals.push(signal);
  saveSignals(signals);
  
  return signal;
}

// Activate a signal (only if no other signal is active)
export function activateSignal(signalId: string, scope?: CardScope): Signal | null {
  // Check if there's already an active signal
  const activeSignal = getActiveSignal(scope);
  if (activeSignal && activeSignal.id !== signalId) {
    return null; // Cannot activate - another signal is active
  }
  
  const signals = loadSignals();
  const signalIndex = signals.findIndex((s) => s.id === signalId);
  
  if (signalIndex === -1) return null;
  
  const signal = signals[signalIndex];
  signal.status = "active";
  signal.triggeredAt = new Date().toISOString();
  
  signals[signalIndex] = signal;
  saveSignals(signals);
  
  return signal;
}

// Dismiss a signal (provides learning signal to the system)
export function dismissSignal(signalId: string, reason?: string): Signal | null {
  const signals = loadSignals();
  const signalIndex = signals.findIndex((s) => s.id === signalId);
  
  if (signalIndex === -1) return null;
  
  const signal = signals[signalIndex];
  signal.status = "dismissed";
  signal.dismissedAt = new Date().toISOString();
  signal.reason = reason; // Learning signal
  
  signals[signalIndex] = signal;
  saveSignals(signals);
  
  return signal;
}

// Defer a signal (move to pending)
export function deferSignal(signalId: string): Signal | null {
  const signals = loadSignals();
  const signalIndex = signals.findIndex((s) => s.id === signalId);
  
  if (signalIndex === -1) return null;
  
  const signal = signals[signalIndex];
  signal.status = "deferred";
  
  signals[signalIndex] = signal;
  saveSignals(signals);
  
  return signal;
}

// Complete a signal (user acted on it)
export function completeSignal(signalId: string): Signal | null {
  const signals = loadSignals();
  const signalIndex = signals.findIndex((s) => s.id === signalId);
  
  if (signalIndex === -1) return null;
  
  const signal = signals[signalIndex];
  signal.status = "completed";
  
  signals[signalIndex] = signal;
  saveSignals(signals);
  
  return signal;
}

// Check if user has active action (signals must not interrupt)
// This is a helper - actual check should be done in component with current state
export function hasActiveUserAction(): boolean {
  // This function is a placeholder - actual check is done in component
  // where we have access to showSteps and currentLifeAction state
  return false;
}

// Generate time-based signal (triggered on app open, specific times)
export function generateTimeBasedSignal(scope: CardScope = "private", hasActiveAction: boolean = false): Signal | null {
  // Don't interrupt active user action
  if (hasActiveAction) {
    return null;
  }
  
  // Check if we can create a signal
  if (!canCreateSignal(scope)) {
    return null;
  }
  
  // Check if there's already an active signal
  if (getActiveSignal(scope)) {
    return null;
  }
  
  const hour = new Date().getHours();
  
  // Morning signal (8-10 AM)
  if (hour >= 8 && hour < 10) {
    return createSignal(
      "time-based",
      "What matters most today?",
      scope
    );
  }
  
  // Evening signal (6-8 PM)
  if (hour >= 18 && hour < 20) {
    return createSignal(
      "time-based",
      "How did today go?",
      scope
    );
  }
  
  return null;
}

// Generate state-based signal (triggered by Card state changes)
export function generateStateBasedSignal(card: Card, hasActiveAction: boolean = false): Signal | null {
  // Don't interrupt active user action
  if (hasActiveAction) {
    return null;
  }
  
  // Check if we can create a signal
  if (!canCreateSignal(card.scope)) {
    return null;
  }
  
  // Check if there's already an active signal
  if (getActiveSignal(card.scope)) {
    return null;
  }
  
  // Draft card needs attention (older than 1 day)
  if (card.state === "draft") {
    const updatedAt = new Date(card.updatedAt).getTime();
    const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate > 1) {
      return createSignal(
        "state-based",
        `"${card.content}" — ready to start?`,
        card.scope,
        card.id
      );
    }
  }
  
  // Active card needs progress (older than 3 days)
  if (card.state === "active") {
    const updatedAt = new Date(card.updatedAt).getTime();
    const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
    
    if (daysSinceUpdate > 3) {
      return createSignal(
        "state-based",
        `"${card.content}" — time to move forward?`,
        card.scope,
        card.id
      );
    }
  }
  
  return null;
}

// Generate context-based signal (triggered by context changes)
export function generateContextBasedSignal(scope: CardScope = "private", hasActiveAction: boolean = false): Signal | null {
  // Don't interrupt active user action
  if (hasActiveAction) {
    return null;
  }
  
  // Check if we can create a signal
  if (!canCreateSignal(scope)) {
    return null;
  }
  
  // Check if there's already an active signal
  if (getActiveSignal(scope)) {
    return null;
  }
  
  // Check for cards needing attention
  const cardsNeedingAttention = getCardsNeedingAttention(scope);
  if (cardsNeedingAttention.length > 0) {
    const mostRelevant = getMostRelevantCard(scope);
    if (mostRelevant) {
      return createSignal(
        "context-based",
        `"${mostRelevant.content}" — needs your attention`,
        scope,
        mostRelevant.id
      );
    }
  }
  
  return null;
}

// Check for signals on app open
export function checkSignalsOnAppOpen(scope: CardScope = "private", hasActiveAction: boolean = false): Signal | null {
  // Don't interrupt active user action
  if (hasActiveAction) {
    return null;
  }
  
  // Check if there's already an active signal
  const activeSignal = getActiveSignal(scope);
  if (activeSignal) {
    return activeSignal;
  }
  
  // Try time-based signal first
  const timeSignal = generateTimeBasedSignal(scope, hasActiveAction);
  if (timeSignal) {
    activateSignal(timeSignal.id, scope);
    return timeSignal;
  }
  
  // Try context-based signal
  const contextSignal = generateContextBasedSignal(scope, hasActiveAction);
  if (contextSignal) {
    activateSignal(contextSignal.id, scope);
    return contextSignal;
  }
  
  return null;
}

