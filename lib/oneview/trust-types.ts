/**
 * Trust / Verification Types
 * 
 * Light MVP trust signals:
 * 1) Self-declared (default)
 * 2) Environment-linked (time/location/device confirmed)
 * 3) Human-confirmed (future: proximity / mutual confirmation)
 */

export type TrustLevel = "self-declared" | "environment-linked" | "human-confirmed";

export interface TrustMetadata {
  level: TrustLevel;
  verifiedAt?: string; // ISO date
  verifiedBy?: string; // Device ID, location hash, or human ID
  notes?: string; // Optional verification notes
}

/**
 * Default trust metadata (self-declared)
 */
export function createDefaultTrust(): TrustMetadata {
  return {
    level: "self-declared",
    verifiedAt: new Date().toISOString(),
  };
}

/**
 * Create environment-linked trust (time/location/device confirmed)
 */
export function createEnvironmentTrust(deviceId?: string, locationHash?: string): TrustMetadata {
  return {
    level: "environment-linked",
    verifiedAt: new Date().toISOString(),
    verifiedBy: deviceId || locationHash || "device",
    notes: "Verified by routine (repeated over time)",
  };
}

