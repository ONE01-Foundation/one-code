/**
 * Global Layer - Live Mirror Types
 * 
 * PRINCIPLES:
 * - Global is read-only, aggregated, anonymous
 * - No personal data, no raw text, no social mechanics
 * - Actions happen in Private, Global is for consumption
 * - Privacy-safe: k-anonymity style thresholds
 */

import { Domain } from "./ledger-types";

// ============================================================================
// 1. GLOBAL PULSE
// ============================================================================

/**
 * GlobalPulseItem - What's happening right now (aggregated)
 * 
 * Shows current activity patterns without exposing individuals
 */
export interface GlobalPulseItem {
  id: string;
  title: string; // Short description (max 6 words)
  metric: string; // What we're measuring (e.g., "people starting", "cards completed")
  delta?: number; // Change from previous window (positive = rising, negative = falling)
  timeWindow: "now" | "today" | "this_week"; // When this pulse is from
  domain: Domain;
  intensity: number; // 0.0 - 1.0 (how strong this pulse is)
}

// ============================================================================
// 2. GLOBAL BUCKETS (Needs & Offers)
// ============================================================================

/**
 * Trend direction for buckets
 */
export type BucketTrend = "rising" | "stable" | "falling";

/**
 * GlobalNeedBucket - Aggregated needs (what people want)
 * 
 * Privacy: Only shown if count >= threshold (e.g., 10+ people)
 */
export interface GlobalNeedBucket {
  id: string;
  label: string; // Short label (max 4 words)
  domain: Domain;
  subDomain?: string;
  count: number; // How many people (anonymized count)
  trend: BucketTrend;
  minThreshold: number; // Minimum count to show (k-anonymity)
}

/**
 * GlobalOfferBucket - Aggregated offers (what people can give)
 * 
 * Privacy: Only shown if count >= threshold (e.g., 10+ people)
 */
export interface GlobalOfferBucket {
  id: string;
  label: string; // Short label (max 4 words)
  domain: Domain;
  subDomain?: string;
  count: number; // How many people (anonymized count)
  trend: BucketTrend;
  minThreshold: number; // Minimum count to show (k-anonymity)
}

// ============================================================================
// 3. GLOBAL MISSIONS
// ============================================================================

/**
 * MissionDifficulty - How hard the mission is
 */
export type MissionDifficulty = "easy" | "medium" | "hard";

/**
 * GlobalMission - A collective action opportunity
 * 
 * Derived from patterns in GlobalNeedBucket + GlobalOfferBucket
 * Represents a "mission" that many people could benefit from
 */
export interface GlobalMission {
  id: string;
  title: string; // Mission name (max 6 words)
  why: string; // Why this matters (max 12 words)
  estimatedMinutes: number; // How long it takes
  domain: Domain;
  subDomain?: string;
  difficulty: MissionDifficulty;
  participantCount: number; // How many people (anonymized)
  createdAt: number; // When mission was created
}

// ============================================================================
// 4. GLOBAL SNAPSHOT
// ============================================================================

/**
 * GlobalSnapshot - Complete global state at a moment
 * 
 * This is what the Global view consumes
 * Updated periodically (e.g., every 5 minutes)
 */
export interface GlobalSnapshot {
  pulse: GlobalPulseItem[]; // 3-6 items
  needs: GlobalNeedBucket[]; // Top 5
  offers: GlobalOfferBucket[]; // Top 5
  missions: GlobalMission[]; // Top 3-5
  lastUpdated: number; // Unix timestamp
}

// ============================================================================
// 5. PRIVACY RULES
// ============================================================================

/**
 * Privacy thresholds for global data
 */
export const GLOBAL_THRESHOLDS = {
  MIN_BUCKET_COUNT: 10, // Minimum people in a bucket to show it (k-anonymity)
  MIN_MISSION_PARTICIPANTS: 5, // Minimum people for a mission
  MAX_PULSE_ITEMS: 6, // Maximum pulse items to show
  MAX_NEEDS: 5, // Maximum need buckets to show
  MAX_OFFERS: 5, // Maximum offer buckets to show
  MAX_MISSIONS: 5, // Maximum missions to show
} as const;

/**
 * Check if a bucket is safe to show globally
 */
export function isBucketSafe(count: number): boolean {
  return count >= GLOBAL_THRESHOLDS.MIN_BUCKET_COUNT;
}

/**
 * Check if a mission is safe to show globally
 */
export function isMissionSafe(participantCount: number): boolean {
  return participantCount >= GLOBAL_THRESHOLDS.MIN_MISSION_PARTICIPANTS;
}

