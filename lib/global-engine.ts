/**
 * Global Engine - Live Mirror Data Pipeline
 * 
 * PRINCIPLES:
 * - Aggregates local data as placeholder
 * - Later: Replace with Supabase aggregated queries
 * - Privacy-safe: Only aggregates, no personal data
 * - Read-only: Global is for consumption, not action
 */

import {
  GlobalSnapshot,
  GlobalPulseItem,
  GlobalNeedBucket,
  GlobalOfferBucket,
  GlobalMission,
  GLOBAL_THRESHOLDS,
  isBucketSafe,
  isMissionSafe,
} from "./global-types";

// Re-export GlobalSnapshot for convenience
export type { GlobalSnapshot };
import { Domain } from "./ledger-types";
import { loadStepCards } from "./step-card";
import { loadDecks } from "./deck";

/**
 * Get global snapshot (placeholder implementation)
 * 
 * For now: Computes from local step-cards + decks as mock aggregates
 * Later: Replace with Supabase aggregated queries
 */
export function getGlobalSnapshot(): GlobalSnapshot {
  // Load local data (as placeholder for global aggregates)
  const stepCards = loadStepCards();
  const decks = loadDecks();

  // Compute pulse items
  const pulse = computePulse(stepCards, decks);

  // Compute need buckets
  const needs = computeNeedBuckets(stepCards, decks);

  // Compute offer buckets
  const offers = computeOfferBuckets(stepCards, decks);

  // Compute missions
  const missions = computeMissions(needs, offers);

  return {
    pulse: pulse.slice(0, GLOBAL_THRESHOLDS.MAX_PULSE_ITEMS),
    needs: needs.slice(0, GLOBAL_THRESHOLDS.MAX_NEEDS),
    offers: offers.slice(0, GLOBAL_THRESHOLDS.MAX_OFFERS),
    missions: missions.slice(0, GLOBAL_THRESHOLDS.MAX_MISSIONS),
    lastUpdated: Date.now(),
  };
}

/**
 * Compute pulse items from activity
 */
function computePulse(stepCards: any[], decks: any[]): GlobalPulseItem[] {
  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const weekStart = now - 7 * 24 * 60 * 60 * 1000;

  // Count active cards
  const activeCards = stepCards.filter((c) => c.status === "active").length;
  const activeDecks = decks.filter((d) => d.status === "active").length;

  // Count completed today
  const completedToday = stepCards.filter(
    (c) => c.status === "done" && new Date(c.updatedAt).getTime() >= todayStart
  ).length;

  // Count completed this week
  const completedWeek = stepCards.filter(
    (c) => c.status === "done" && new Date(c.updatedAt).getTime() >= weekStart
  ).length;

  const pulse: GlobalPulseItem[] = [];

  if (activeCards > 0) {
    pulse.push({
      id: "pulse_active_cards",
      title: "People taking action",
      metric: `${activeCards} active steps`,
      delta: activeCards > 5 ? 1 : 0,
      timeWindow: "now",
      domain: "life",
      intensity: Math.min(1.0, activeCards / 20),
    });
  }

  if (completedToday > 0) {
    pulse.push({
      id: "pulse_completed_today",
      title: "Steps completed today",
      metric: `${completedToday} done`,
      delta: completedToday > 3 ? 1 : 0,
      timeWindow: "today",
      domain: "life",
      intensity: Math.min(1.0, completedToday / 10),
    });
  }

  if (activeDecks > 0) {
    pulse.push({
      id: "pulse_active_decks",
      title: "Processes in progress",
      metric: `${activeDecks} active`,
      delta: activeDecks > 2 ? 1 : 0,
      timeWindow: "now",
      domain: "life",
      intensity: Math.min(1.0, activeDecks / 5),
    });
  }

  // Add domain-specific pulses
  const domainCounts: Record<Domain, number> = {
    health: 0,
    money: 0,
    work: 0,
    relationships: 0,
    learning: 0,
    life: 0,
    other: 0,
  };

  stepCards.forEach((card) => {
    if (card.domain && domainCounts[card.domain as Domain] !== undefined) {
      domainCounts[card.domain as Domain]++;
    }
  });

  Object.entries(domainCounts).forEach(([domain, count]) => {
    if (count >= 3) {
      pulse.push({
        id: `pulse_${domain}`,
        title: `${domain} activity`,
        metric: `${count} steps`,
        delta: count > 5 ? 1 : 0,
        timeWindow: "this_week",
        domain: domain as Domain,
        intensity: Math.min(1.0, count / 15),
      });
    }
  });

  return pulse.sort((a, b) => b.intensity - a.intensity);
}

/**
 * Compute need buckets (what people want)
 */
function computeNeedBuckets(stepCards: any[], decks: any[]): GlobalNeedBucket[] {
  // Group by domain and action type
  const domainNeeds: Record<string, number> = {};

  stepCards.forEach((card) => {
    if (card.status === "active" || card.status === "suggested") {
      const key = card.domain || "life";
      domainNeeds[key] = (domainNeeds[key] || 0) + 1;
    }
  });

  const buckets: GlobalNeedBucket[] = [];

  Object.entries(domainNeeds).forEach(([domain, count]) => {
    if (isBucketSafe(count)) {
      buckets.push({
        id: `need_${domain}`,
        label: getDomainLabel(domain as Domain),
        domain: domain as Domain,
        count,
        trend: count > 10 ? "rising" : "stable",
        minThreshold: GLOBAL_THRESHOLDS.MIN_BUCKET_COUNT,
      });
    }
  });

  return buckets.sort((a, b) => b.count - a.count);
}

/**
 * Compute offer buckets (what people can give)
 * 
 * For now: Derived from completed cards (people who finished X can help others)
 * Later: Explicit offers from users
 */
function computeOfferBuckets(stepCards: any[], decks: any[]): GlobalOfferBucket[] {
  // Group completed cards by domain
  const domainOffers: Record<string, number> = {};

  stepCards.forEach((card) => {
    if (card.status === "done") {
      const key = card.domain || "life";
      domainOffers[key] = (domainOffers[key] || 0) + 1;
    }
  });

  const buckets: GlobalOfferBucket[] = [];

  Object.entries(domainOffers).forEach(([domain, count]) => {
    if (isBucketSafe(count)) {
      buckets.push({
        id: `offer_${domain}`,
        label: `${getDomainLabel(domain as Domain)} help`,
        domain: domain as Domain,
        count,
        trend: count > 10 ? "rising" : "stable",
        minThreshold: GLOBAL_THRESHOLDS.MIN_BUCKET_COUNT,
      });
    }
  });

  return buckets.sort((a, b) => b.count - a.count);
}

/**
 * Compute missions from needs + offers
 */
function computeMissions(
  needs: GlobalNeedBucket[],
  offers: GlobalOfferBucket[]
): GlobalMission[] {
  const missions: GlobalMission[] = [];

  // Match needs with offers to create missions
  needs.forEach((need) => {
    const matchingOffer = offers.find((o) => o.domain === need.domain);
    if (matchingOffer && isMissionSafe(need.count + matchingOffer.count)) {
      missions.push({
        id: `mission_${need.domain}`,
        title: `Support ${need.label}`,
        why: `${need.count} people need help with ${need.label}`,
        estimatedMinutes: 15,
        domain: need.domain,
        difficulty: need.count > 20 ? "medium" : "easy",
        participantCount: need.count + matchingOffer.count,
        createdAt: Date.now(),
      });
    }
  });

  // Add standalone missions from high-need buckets
  needs.forEach((need) => {
    if (need.count >= 15 && !missions.find((m) => m.domain === need.domain)) {
      missions.push({
        id: `mission_standalone_${need.domain}`,
        title: `Join ${need.label} effort`,
        why: `${need.count} people are working on ${need.label}`,
        estimatedMinutes: 10,
        domain: need.domain,
        difficulty: "easy",
        participantCount: need.count,
        createdAt: Date.now(),
      });
    }
  });

  return missions.sort((a, b) => b.participantCount - a.participantCount);
}

/**
 * Get domain label (human-readable)
 */
function getDomainLabel(domain: Domain): string {
  const labels: Record<Domain, string> = {
    health: "Health",
    money: "Money",
    work: "Work",
    relationships: "Relationships",
    learning: "Learning",
    life: "Life",
    other: "Other",
  };
  return labels[domain] || domain;
}

