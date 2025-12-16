/**
 * Core system types for ONE
 * 
 * PRINCIPLES:
 * - One user, private by default
 * - Everything starts from a single intent
 * - Actions over explanations
 */

// Card status for the action loop
export type CardStatus = "ready" | "in_progress" | "done";
export type CardScope = "private" | "global";
export type IntentCategory = "health" | "money" | "work" | "relationship" | "self" | "other";

// Minimal data model
export interface Session {
  id: string;
  createdAt: string;
  lastActivityAt: string;
}

// Card schema for the core action loop
export interface Card {
  id: string;
  type?: string; // Optional card type
  title: string; // Short title (e.g., "Lower friction")
  action: string; // One suggested action (e.g., "Prepare clothes for tomorrow")
  status: CardStatus; // ready | in_progress | done
  scope: CardScope; // private | global
  time?: number; // Estimated time in minutes (optional)
  category?: IntentCategory;
  createdAt: string; // ISO string
}

// Legacy types (kept for compatibility)
export type CardState = "pending" | "done" | "skipped"; // @deprecated - use CardStatus

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




