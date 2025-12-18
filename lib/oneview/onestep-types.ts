/**
 * OneStep AI Contract - Strict JSON Schema
 * 
 * AI MUST return ONE actionable step only. No lists, no multi-step dumps.
 */

import { z } from "zod";

// ============================================================================
// ONE_STEP SCHEMA
// ============================================================================

export const OneStepSchema = z.object({
  assistantLine: z.string().max(100), // Short reply line
  intent: z.enum(["create_card", "log", "plan", "import_global", "clarify"]),
  domain: z.enum(["health", "money", "career", "relationships", "learning", "other"]),
  bubblePath: z.array(z.string()), // Hierarchical path, e.g. ["Health", "Nutrition"]
  card: z.object({
    title: z.string().max(50),
    summary: z.string().max(200),
    estimatedMinutes: z.number().min(1).max(60),
    energyLevel: z.enum(["low", "mid", "high"]),
    type: z.enum(["task", "log", "habit"]),
  }).nullable(),
  metricsHint: z.object({
    kcal: z.number().optional(),
    amount: z.number().optional(),
    currency: z.string().optional(),
  }).nullable(),
  needsClarification: z.boolean(),
  clarifyingQuestion: z.string().max(100).nullable(),
});

export type OneStep = z.infer<typeof OneStepSchema>;

// ============================================================================
// API REQUEST
// ============================================================================

export interface OneStepRequest {
  userText: string;
  mode: "private" | "global";
  currentPath: string[]; // Current navigation stack
  userLocale?: string; // e.g., "en", "he"
}

// ============================================================================
// API RESPONSE
// ============================================================================

export interface OneStepResponse {
  success: boolean;
  step?: OneStep;
  error?: string;
}

