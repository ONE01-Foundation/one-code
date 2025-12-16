/**
 * Human Action Ledger - Core Data Model
 * 
 * PRINCIPLES:
 * - Raw human input → Distilled intent → Private ledger → Global signals
 * - Cards are atomic actions/logs
 * - Processes are sequences of cards over time
 * - Global view is aggregated, anonymous, no personal data
 */

// ============================================================================
// 1. RAW INPUT
// ============================================================================

/**
 * RawInput - What the user actually said or typed
 * 
 * No structure, no interpretation, just the source material
 * 
 * NOTE: Full RawInput definition is in lib/input-types.ts
 * This is a minimal reference for the ledger flow
 */
export interface RawInput {
  id: string; // Unique identifier
  text: string; // The actual input text (speech-to-text or typed)
  language: import("./input-types").LanguageContext; // Detected language
  source: "voice" | "keyboard" | "import" | "api"; // How it was captured
  timestamp: number; // Unix timestamp
  sessionId: string; // Anonymous session identifier
  scope: "private" | "global"; // Where it was captured (context)
  isValid: boolean; // Is this input valid for processing?
}

// ============================================================================
// 2. DISTILLED INTENT
// ============================================================================

/**
 * Domain - High-level life area
 */
export type Domain = "health" | "money" | "work" | "relationships" | "learning" | "life" | "other";

/**
 * SubDomain - Specific area within a domain
 * Examples:
 * - health: "nutrition", "fitness", "sleep", "mental"
 * - money: "expenses", "income", "savings", "investments"
 * - work: "tasks", "projects", "career", "skills"
 */
export type SubDomain = string; // Flexible string for now, can be enum later

/**
 * ActionType - What kind of human action this represents
 */
export type ActionType =
  | "log" // Recorded fact/event ("I spent 30₪ on falafel")
  | "desire" // Want/wish ("I want to lose weight")
  | "blocker" // Obstacle/problem ("I'm too tired to exercise")
  | "step" // Single actionable step ("Take a 10-minute walk")
  | "process"; // Multi-step sequence ("Start a weight loss journey")

/**
 * TimeContext - When this matters
 */
export type TimeContext =
  | "now" // Immediate action
  | "today" // Today's scope
  | "this_week" // This week
  | "this_month" // This month
  | "ongoing"; // Continuous/recurring

/**
 * DistilledIntent - Structured interpretation of raw input
 * 
 * This is what the system extracts from RawInput
 * No personal identifiers, just semantic structure
 */
export interface DistilledIntent {
  id: string; // Links back to RawInput.id
  rawInputId: string; // Reference to source
  
  // Classification
  domain: Domain;
  subDomain?: SubDomain; // Optional, inferred if possible
  actionType: ActionType;
  timeContext: TimeContext;
  
  // Extracted content (minimal, structured)
  summary: string; // One-line summary (max 12 words)
  keywords: string[]; // Key terms (max 5)
  
  // Process detection
  isProcessStart: boolean; // Does this initiate a new process?
  processId?: string; // If part of existing process
  processStepIndex?: number; // Position in process sequence
  
  // Confidence (for future AI improvements)
  confidence: number; // 0.0 - 1.0 (how sure we are about classification)
  
  timestamp: number; // When distilled
}

// ============================================================================
// 3. PRIVATE LEDGER - CARDS
// ============================================================================

/**
 * LedgerCardStatus - Lifecycle state
 */
export type LedgerCardStatus =
  | "draft" // Created but not active
  | "active" // Currently in focus
  | "done" // Completed
  | "skipped" // Deferred/not done (NOT failure)
  | "archived"; // Historical record

/**
 * LedgerCard - Atomic unit of human action/log
 * 
 * A card represents ONE thing:
 * - A log entry (what happened)
 * - A desire (what I want)
 * - A blocker (what's in the way)
 * - A step (one action to take)
 * 
 * Cards can stand alone OR belong to a process
 */
export interface LedgerCard {
  id: string;
  
  // Source
  rawInputId: string; // Original input
  distilledIntentId: string; // How we interpreted it
  
  // Content
  title: string; // Short, human-readable (max 6 words)
  summary: string; // One sentence (max 12 words)
  
  // Classification (from DistilledIntent)
  domain: Domain;
  subDomain?: SubDomain;
  actionType: ActionType;
  timeContext: TimeContext;
  
  // Lifecycle
  status: LedgerCardStatus;
  createdAt: number;
  updatedAt: number;
  completedAt?: number; // When marked done
  skippedAt?: number; // When deferred
  
  // Process relationship (optional)
  processId?: string; // If part of a process
  processStepIndex?: number; // Position in process
  
  // Scope
  scope: "private"; // Cards are always private
  
  // Metadata (for future use)
  tags?: string[]; // User or system tags
  notes?: string; // Optional user notes
}

// ============================================================================
// 4. PRIVATE LEDGER - PROCESSES
// ============================================================================

/**
 * ProcessStatus - Process lifecycle
 */
export type ProcessStatus =
  | "draft" // Created but not started
  | "active" // In progress
  | "paused" // Temporarily stopped
  | "completed" // Finished
  | "abandoned"; // Stopped without completion (NOT failure)

/**
 * Process - Sequence of cards over time
 * 
 * A process is a guided journey:
 * - "Lose weight" → sequence of health cards
 * - "Save money" → sequence of money cards
 * - "Learn Spanish" → sequence of learning cards
 * 
 * Cards in a process are linked but can be skipped
 * Skipping a card does NOT fail the process
 */
export interface Process {
  id: string;
  
  // Source
  rawInputId: string; // What started this process
  distilledIntentId: string;
  
  // Content
  title: string; // Process name (max 6 words)
  why: string; // Purpose (max 12 words)
  domain: Domain;
  subDomain?: SubDomain;
  
  // Structure
  cardIds: string[]; // Ordered list of card IDs in this process
  activeCardIndex: number; // Which card is current (0-based)
  
  // Lifecycle
  status: ProcessStatus;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  pausedAt?: number;
  
  // Scope
  scope: "private"; // Processes are always private
  
  // Metadata
  totalSteps: number; // Total cards in process
  completedSteps: number; // Cards marked done
  skippedSteps: number; // Cards marked skipped (valid!)
}

// ============================================================================
// 5. GLOBAL SIGNALS (ANONYMOUS, AGGREGATED)
// ============================================================================

/**
 * GlobalSignal - Aggregated, anonymous pattern
 * 
 * Rules:
 * - NO raw text
 * - NO personal identifiers
 * - NO process structure
 * - NO timeline per user
 * - ONLY counts, trends, patterns
 */
export interface GlobalSignal {
  id: string;
  
  // What we're measuring (anonymous)
  domain: Domain;
  subDomain?: SubDomain;
  actionType: ActionType;
  timeContext: TimeContext;
  
  // Aggregated metrics (no personal data)
  count: number; // How many people have this pattern
  trend: "rising" | "stable" | "falling"; // Direction over time
  intensity: number; // 0.0 - 1.0 (how common/strong this signal is)
  
  // Time window
  windowStart: number; // Unix timestamp
  windowEnd: number; // Unix timestamp
  
  // Metadata
  createdAt: number;
  updatedAt: number;
  
  // Scope
  scope: "global"; // Always global
}

/**
 * GlobalSignalSummary - High-level view of global patterns
 * 
 * Used for "what's happening in the world" view
 */
export interface GlobalSignalSummary {
  domain: Domain;
  signals: GlobalSignal[]; // Top signals for this domain
  totalCount: number; // Total anonymous participants
  lastUpdated: number;
}

// ============================================================================
// 6. TRANSFORMATION RULES
// ============================================================================

/**
 * How RawInput becomes LedgerCard
 * 
 * Rules (deterministic logic, not AI prompts yet):
 * 
 * 1. LOG cards:
 *    - ActionType: "log"
 *    - Created when: Input describes past event/fact
 *    - Examples: "I spent 30₪", "I ran 5km", "I called mom"
 *    - Standalone (no process)
 * 
 * 2. DESIRE cards:
 *    - ActionType: "desire"
 *    - Created when: Input expresses want/wish/goal
 *    - Examples: "I want to lose weight", "I need more money"
 *    - Can start a process OR stand alone
 * 
 * 3. BLOCKER cards:
 *    - ActionType: "blocker"
 *    - Created when: Input describes obstacle/problem
 *    - Examples: "I'm too tired", "I don't have time"
 *    - Can link to existing process OR stand alone
 * 
 * 4. STEP cards:
 *    - ActionType: "step"
 *    - Created when: Input is one actionable thing
 *    - Examples: "Take a walk", "Call the bank"
 *    - Can be part of process OR stand alone
 * 
 * 5. PROCESS cards:
 *    - ActionType: "process"
 *    - Created when: Input suggests multi-step journey
 *    - Examples: "I want to lose weight" → creates process + first step
 *    - Always creates a Process, may create first card
 * 
 * Process detection:
 * - If actionType is "desire" + domain suggests journey → start process
 * - If actionType is "step" + processId exists → add to process
 * - If actionType is "blocker" + processId exists → note blocker, continue process
 * 
 * Skipping rules:
 * - User can skip any card (status: "skipped")
 * - Skipped cards are NOT failures
 * - Process continues with next card
 * - Skipped cards remain in process for context
 */

// ============================================================================
// 7. GLOBAL VIEW RULES
// ============================================================================

/**
 * What is allowed in GlobalSignal:
 * 
 * ✅ ALLOWED:
 * - Domain classification (health, money, etc.)
 * - Sub-domain classification (nutrition, expenses, etc.)
 * - Action type counts (how many logs, desires, etc.)
 * - Time context patterns (now vs ongoing trends)
 * - Aggregated counts (how many people, not who)
 * - Trends (rising/falling patterns)
 * - Intensity (how common a pattern is)
 * 
 * ❌ FORBIDDEN:
 * - Raw text (never)
 * - Personal identifiers (never)
 * - Process structure (never)
 * - Individual card details (never)
 * - Timeline per user (never)
 * - Any data that could identify a person (never)
 * 
 * Aggregation method:
 * - Collect DistilledIntent data (already anonymized)
 * - Group by: domain + subDomain + actionType + timeContext
 * - Count occurrences in time window
 * - Calculate trends (compare windows)
 * - Store as GlobalSignal
 * 
 * Example:
 * - 1000 people have: domain="health", actionType="desire", subDomain="fitness"
 * - GlobalSignal: { domain: "health", subDomain: "fitness", actionType: "desire", count: 1000, trend: "rising" }
 * - NO way to know who those 1000 people are
 */

// ============================================================================
// 8. TYPE GUARDS & HELPERS
// ============================================================================

/**
 * Check if a card can be skipped (all cards can be skipped)
 */
export function canSkipCard(card: LedgerCard): boolean {
  return card.status === "active" || card.status === "draft";
}

/**
 * Check if a process can continue after skipped card
 */
export function canContinueProcess(process: Process): boolean {
  return process.status === "active" && process.activeCardIndex < process.cardIds.length;
}

/**
 * Check if data is safe for global view
 */
export function isSafeForGlobal(intent: DistilledIntent): boolean {
  // All DistilledIntent data is safe (no personal identifiers)
  // Only aggregated counts go to GlobalSignal
  return true;
}

