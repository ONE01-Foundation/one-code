/**
 * Identity Without Exposure (IWE) v0.1
 * 
 * PRINCIPLES:
 * - Preserve anonymity while enabling continuity
 * - No forced identity creation
 * - Identity emerges from action, not input
 * - Private data never leaves user scope
 * - Global view only uses aggregated, anonymized signals
 */

import { Identity, IdentityTier, IdentityStatus } from "@/lib/types";
import { getOrCreateOneID } from "./life-engine";

// Load identity from localStorage
export function loadIdentity(): Identity | null {
  if (typeof window === "undefined") return null;
  
  const stored = localStorage.getItem("one_identity");
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save identity to localStorage
export function saveIdentity(identity: Identity) {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_identity", JSON.stringify(identity));
}

// Initialize identity (Presence ID always exists)
export function initializeIdentity(): Identity {
  // Presence ID is the OneID (already exists)
  const presenceId = getOrCreateOneID();
  
  // Check if identity already exists
  const existing = loadIdentity();
  if (existing && existing.presenceId === presenceId) {
    return existing;
  }
  
  // Create new identity with Presence ID
  const now = new Date().toISOString();
  const identity: Identity = {
    presenceId,
    createdAt: now,
    lastActivityAt: now,
    activityCount: 0,
    pathEligible: false,
    anchorEligible: false,
  };
  
  saveIdentity(identity);
  return identity;
}

// Track activity (for Path ID eligibility)
export function trackActivity(): Identity {
  const identity = loadIdentity() || initializeIdentity();
  
  identity.activityCount++;
  identity.lastActivityAt = new Date().toISOString();
  
  // Path ID eligibility: 5+ activities over 3+ days
  const createdAt = new Date(identity.createdAt).getTime();
  const daysSinceCreation = (Date.now() - createdAt) / (1000 * 60 * 60 * 24);
  
  if (identity.activityCount >= 5 && daysSinceCreation >= 3) {
    identity.pathEligible = true;
  }
  
  saveIdentity(identity);
  return identity;
}

// Create Path ID (when user shows consistent activity)
export function createPathID(): Identity | null {
  const identity = loadIdentity();
  if (!identity || !identity.pathEligible || identity.pathId) {
    return null; // Not eligible or already exists
  }
  
  // Generate Path ID (based on Presence ID + activity pattern)
  const pathId = `path_${identity.presenceId}_${Date.now().toString(36)}`;
  identity.pathId = pathId;
  identity.lastActivityAt = new Date().toISOString();
  
  saveIdentity(identity);
  return identity;
}

// Check if user can "Keep this path" (Path ID creation)
export function canKeepPath(): boolean {
  const identity = loadIdentity();
  if (!identity) return false;
  
  return identity.pathEligible && !identity.pathId;
}

// Keep this path (user-initiated Path ID creation)
export function keepPath(): Identity | null {
  return createPathID();
}

// Check if Anchor ID is needed (cross-device or economic action)
export function needsAnchorID(reason: "cross_device" | "economic"): boolean {
  const identity = loadIdentity();
  if (!identity) return false;
  
  // Anchor ID needed for cross-device sync or economic actions
  if (reason === "cross_device") {
    identity.anchorEligible = true;
    saveIdentity(identity);
    return !identity.anchorId;
  }
  
  if (reason === "economic") {
    identity.anchorEligible = true;
    saveIdentity(identity);
    return !identity.anchorId;
  }
  
  return false;
}

// Create Anchor ID (optional, only when needed)
export function createAnchorID(reason: "cross_device" | "economic"): Identity | null {
  const identity = loadIdentity();
  if (!identity || !identity.anchorEligible) {
    return null; // Not eligible
  }
  
  // Generate Anchor ID (more persistent, can be synced)
  const anchorId = `anchor_${identity.presenceId}_${Date.now().toString(36)}`;
  identity.anchorId = anchorId;
  identity.lastActivityAt = new Date().toISOString();
  
  saveIdentity(identity);
  return identity;
}

// Get current identity tier
export function getCurrentTier(): IdentityTier {
  const identity = loadIdentity();
  if (!identity) return "presence";
  
  if (identity.anchorId) return "anchor";
  if (identity.pathId) return "path";
  return "presence";
}

// Get identity status
export function getIdentityStatus(): IdentityStatus {
  const identity = loadIdentity();
  if (!identity) return "active"; // Presence ID always active
  
  if (identity.pathEligible && !identity.pathId) {
    return "pending"; // Path ID available but not created
  }
  
  if (identity.anchorEligible && !identity.anchorId) {
    return "available"; // Anchor ID available but not created
  }
  
  return "active";
}

// Get activity summary (for State Panel)
export function getActivitySummary(): {
  totalActivities: number;
  daysActive: number;
  currentTier: IdentityTier;
  pathEligible: boolean;
  anchorEligible: boolean;
} {
  const identity = loadIdentity() || initializeIdentity();
  
  const createdAt = new Date(identity.createdAt).getTime();
  const daysActive = Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24));
  
  return {
    totalActivities: identity.activityCount,
    daysActive: Math.max(1, daysActive),
    currentTier: getCurrentTier(),
    pathEligible: identity.pathEligible,
    anchorEligible: identity.anchorEligible,
  };
}

// Check if identity should be offered (only when user benefits)
export function shouldOfferIdentity(): boolean {
  const identity = loadIdentity();
  if (!identity) return false;
  
  // Offer Path ID when eligible (user benefits from continuity)
  if (identity.pathEligible && !identity.pathId) {
    return true;
  }
  
  return false;
}

