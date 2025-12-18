/**
 * Mock Data Seeds for OneView Core MVP
 */

import { Bubble, Card, BubbleMode } from "./core-types";

// ============================================================================
// PRIVATE SEED DATA
// ============================================================================

export const PRIVATE_SEED: Record<string, Bubble> = {
  // Root level spheres
  "private_health": {
    id: "private_health",
    title: "Health",
    icon: "❤️",
    parentId: null,
    mode: "private",
    stats: { progress: 60, lastUpdated: new Date().toISOString() },
    childrenIds: ["private_health_fitness", "private_health_nutrition"],
  },
  "private_money": {
    id: "private_money",
    title: "Money",
    icon: "💰",
    parentId: null,
    mode: "private",
    stats: { progress: 40, lastUpdated: new Date().toISOString() },
    childrenIds: ["private_money_budget", "private_money_invest"],
  },
  "private_career": {
    id: "private_career",
    title: "Career",
    icon: "💼",
    parentId: null,
    mode: "private",
    stats: { progress: 75, lastUpdated: new Date().toISOString() },
    childrenIds: ["private_career_skills", "private_career_network"],
  },
  
  // Health children
  "private_health_fitness": {
    id: "private_health_fitness",
    title: "Fitness",
    icon: "🏃",
    parentId: "private_health",
    mode: "private",
    stats: { progress: 80, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  "private_health_nutrition": {
    id: "private_health_nutrition",
    title: "Nutrition",
    icon: "🥗",
    parentId: "private_health",
    mode: "private",
    stats: { progress: 50, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  
  // Money children
  "private_money_budget": {
    id: "private_money_budget",
    title: "Budget",
    icon: "📊",
    parentId: "private_money",
    mode: "private",
    stats: { progress: 30, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  "private_money_invest": {
    id: "private_money_invest",
    title: "Invest",
    icon: "📈",
    parentId: "private_money",
    mode: "private",
    stats: { progress: 20, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  
  // Career children
  "private_career_skills": {
    id: "private_career_skills",
    title: "Skills",
    icon: "🎓",
    parentId: "private_career",
    mode: "private",
    stats: { progress: 90, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  "private_career_network": {
    id: "private_career_network",
    title: "Network",
    icon: "🤝",
    parentId: "private_career",
    mode: "private",
    stats: { progress: 60, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
};

// ============================================================================
// GLOBAL SEED DATA
// ============================================================================

export const GLOBAL_SEED: Record<string, Bubble> = {
  "global_health": {
    id: "global_health",
    title: "Health",
    icon: "❤️",
    parentId: null,
    mode: "global",
    stats: { progress: 65, lastUpdated: new Date().toISOString() },
    childrenIds: ["global_health_meditation", "global_health_sleep"],
    tags: ["Hot"],
  },
  "global_money": {
    id: "global_money",
    title: "Money",
    icon: "💰",
    parentId: null,
    mode: "global",
    stats: { progress: 55, lastUpdated: new Date().toISOString() },
    childrenIds: ["global_money_savings", "global_money_side"],
    tags: ["Trending"],
  },
  "global_career": {
    id: "global_career",
    title: "Career",
    icon: "💼",
    parentId: null,
    mode: "global",
    stats: { progress: 70, lastUpdated: new Date().toISOString() },
    childrenIds: ["global_career_remote", "global_career_freelance"],
    tags: ["Hot"],
  },
  
  // Global children
  "global_health_meditation": {
    id: "global_health_meditation",
    title: "Meditation",
    icon: "🧘",
    parentId: "global_health",
    mode: "global",
    stats: { progress: 45, lastUpdated: new Date().toISOString() },
    childrenIds: [],
    tags: ["Trending"],
  },
  "global_health_sleep": {
    id: "global_health_sleep",
    title: "Sleep",
    icon: "😴",
    parentId: "global_health",
    mode: "global",
    stats: { progress: 60, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  "global_money_savings": {
    id: "global_money_savings",
    title: "Savings",
    icon: "🏦",
    parentId: "global_money",
    mode: "global",
    stats: { progress: 50, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  "global_money_side": {
    id: "global_money_side",
    title: "Side Hustle",
    icon: "🚀",
    parentId: "global_money",
    mode: "global",
    stats: { progress: 35, lastUpdated: new Date().toISOString() },
    childrenIds: [],
    tags: ["Hot"],
  },
  "global_career_remote": {
    id: "global_career_remote",
    title: "Remote Work",
    icon: "🏠",
    parentId: "global_career",
    mode: "global",
    stats: { progress: 80, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
  "global_career_freelance": {
    id: "global_career_freelance",
    title: "Freelance",
    icon: "✍️",
    parentId: "global_career",
    mode: "global",
    stats: { progress: 55, lastUpdated: new Date().toISOString() },
    childrenIds: [],
  },
};

// ============================================================================
// MOCK CARDS
// ============================================================================

export const MOCK_CARDS: Record<string, Card> = {
  "card_fitness": {
    id: "card_fitness",
    bubbleId: "private_health_fitness",
    summary: "Completed 3 workouts this week. Feeling stronger.",
    createdAt: new Date().toISOString(),
    tags: ["progress"],
    metrics: { workouts: 3, week: "current" },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getBubblesByMode(mode: BubbleMode, parentId: string | null = null): Bubble[] {
  const seed = mode === "private" ? PRIVATE_SEED : GLOBAL_SEED;
  return Object.values(seed).filter((b) => b.parentId === parentId);
}

export function getBubbleById(id: string, mode: BubbleMode): Bubble | null {
  const seed = mode === "private" ? PRIVATE_SEED : GLOBAL_SEED;
  return seed[id] || null;
}

export function getAllBubbles(mode: BubbleMode): Record<string, Bubble> {
  return mode === "private" ? PRIVATE_SEED : GLOBAL_SEED;
}

