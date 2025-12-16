/**
 * Core system types for ONE
 * 
 * PRINCIPLES:
 * - One user, private by default
 * - Everything starts from a single intent
 * - Actions over explanations
 */

// Card System v0.1
export type CardType = "goal" | "step" | "insight" | "offer" | "need" | "action";
export type CardState = "draft" | "active" | "progressing" | "done" | "archived";
export type CardScope = "private" | "global" | "bridge";
export type IntentCategory = "health" | "money" | "work" | "relationship" | "self" | "other";

// Minimal data model
export interface Session {
  id: string;
  createdAt: string;
  lastActivityAt: string;
}

// Card schema v0.1 - represents persistent truth or intent
export interface Card {
  id: string;
  type: CardType; // goal, step, insight, offer, need, action
  state: CardState; // draft, active, progressing, done, archived
  scope: CardScope; // private, global, bridge
  content: string; // Single concise sentence
  originStepId?: string; // Step that created this card
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  
  // Legacy fields (for backward compatibility)
  title?: string; // @deprecated - use content
  action?: string; // @deprecated - use content
  status?: "ready" | "in_progress" | "done"; // @deprecated - use state
  time?: number; // Estimated time in minutes (optional)
  category?: IntentCategory;
}

// Legacy types (kept for compatibility)
// Note: CardState is now defined above for Card System v0.1
// Old CardState type was: "pending" | "done" | "skipped" (deprecated)

// Closure Types - Every interaction must end in ONE of these
export type ClosureType = "DONE" | "PAUSED" | "REDIRECTED";

// Mode Types
export type Mode = "private" | "global";

// Shared Context (read-only, available in both modes)
export interface SharedContext {
  // No personal data, only system-level info
  systemTime: string; // ISO timestamp
  activeDomains?: string[]; // Anonymous domain categories (e.g., ["health", "work"])
}

// Private Context (isolated, only in private mode)
export interface PrivateContext {
  openThread: string | null; // Set when DESIRE/REQUEST intent appears
  lastSuggestedAction: string | null; // Set when suggestion is explicitly made
  pendingQuestion: string | null; // Set when system asks a question
  userCards?: Card[]; // User's personal cards (never in Global)
}

// Life Loop Engine Models
export type LifeContext = "private" | "global";
export type LifeFocus = "health" | "money" | "work" | "relationships" | "self" | "other";
export type LifeStateStatus = "idle" | "suggested" | "active" | "completed" | "dismissed";
export type LifeActionType = "reflect" | "decide" | "do" | "connect";
export type LifeActionStatus = "pending" | "done" | "skipped";

export interface LifeState {
  id: string;
  context: LifeContext; // private | global
  focus: LifeFocus; // e.g. "health", "money", "work", "relationships"
  status: LifeStateStatus; // idle | suggested | active | completed | dismissed
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface LifeAction {
  id: string;
  lifeStateId: string;
  title: string; // Short, human (e.g., "Lower friction")
  description: string; // 1 sentence max
  actionType: LifeActionType; // reflect | decide | do | connect
  status: LifeActionStatus; // pending | done | skipped
  createdAt: string; // ISO timestamp
}

// Signal & Timing Engine v0.1
export type SignalType = "time-based" | "state-based" | "context-based";
export type SignalStatus = "pending" | "active" | "deferred" | "dismissed" | "completed";

export interface Signal {
  id: string;
  type: SignalType; // time-based, state-based, context-based
  status: SignalStatus; // pending, active, deferred, dismissed, completed
  message: string; // Subtle text suggestion (1 sentence max)
  cardId?: string; // Card that triggered this signal
  stepId?: string; // Step this signal leads to (at most one)
  scope: CardScope; // private, global, bridge
  createdAt: string; // ISO timestamp
  triggeredAt?: string; // When signal was triggered
  dismissedAt?: string; // When signal was dismissed
  reason?: string; // Why signal was dismissed (learning signal)
}

// Onboarding Without Onboarding (OWO) v0.1
export type OWOState = "loading" | "presence" | "choice" | "input" | "complete";
export type OWOChoice = "my_life" | "the_world";

// Identity Without Exposure (IWE) v0.1
export type IdentityTier = "presence" | "path" | "anchor";
export type IdentityStatus = "active" | "pending" | "available";

// Action Loop v0.1
export type ActionLoopState = "prompt" | "choice" | "action" | "closure";
export type ActionChoice = "yes" | "not_now" | "change";
export type ActionClosure = "completed" | "skipped" | "changed";

export interface Identity {
  presenceId: string; // Auto-generated anonymous session ID (always exists)
  pathId?: string; // Created when user shows consistent activity
  anchorId?: string; // Optional, only when cross-device or economic action required
  createdAt: string; // ISO timestamp
  lastActivityAt: string; // ISO timestamp
  activityCount: number; // Track activity for Path ID creation
  pathEligible: boolean; // Whether user is eligible for Path ID
  anchorEligible: boolean; // Whether user is eligible for Anchor ID
}

// Step Engine Models
export type StepActionType = "primary" | "choice";
export type StepIntent = "entry" | "welcome" | "choice" | "card_creation" | "transition" | "home";

export interface StepAction {
  id: string;
  label: string;
  type: StepActionType;
  nextStepId?: string; // Deterministic next step
  onSelect?: (context: StepContext) => Step | null; // Dynamic next step logic
  result?: "card" | "state" | "transition"; // What this action produces
}

export interface StepContext {
  userId: string;
  currentStepId: string;
  previousSteps: string[];
  userChoices: Record<string, string>; // Store user choices by step
  cards: Card[];
  lifeStates: LifeState[];
}

export interface Step {
  id: string;
  intent: StepIntent; // Internal intent
  message: string; // 1-2 lines max, short presence message
  pause?: number; // Optional pause in ms (300-700ms)
  actions: StepAction[]; // 1 primary action or up to 2 choices
  nextStepId?: string; // Default next step if no action selected
  onComplete?: (context: StepContext) => void; // Side effects (card creation, state updates)
  streaming?: boolean; // Support partial reveal
}

// State Memory - Minimal session-based state with mode separation
export interface State {
  mode: Mode; // "private" | "global"
  sharedContext: SharedContext; // Read-only, available in both modes
  privateContext: PrivateContext; // Isolated, only in private mode
  updatedAt: string; // ISO timestamp
}




