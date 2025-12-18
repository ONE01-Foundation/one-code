/**
 * OneView Core - Minimal Data Model
 * 
 * MVP types for bubble navigation
 */

// ============================================================================
// CORE ENTITIES
// ============================================================================

export type BubbleMode = "private" | "global";

export interface Bubble {
  id: string;
  title: string;
  icon: string; // emoji or icon key
  parentId: string | null;
  mode: BubbleMode;
  stats?: {
    progress?: number; // 0-100
    lastUpdated?: string; // ISO date
  };
  childrenIds: string[];
  tags?: string[]; // e.g., ["Hot", "Trending"]
  // Import metadata (if imported from Global)
  importedFrom?: string; // Original global sphere ID (reference only, not linked)
  referenceSummary?: string; // AI-generated summary from Global (read-only reference)
  trust?: import("./trust-types").TrustMetadata; // Trust level
}

export interface Card {
  id: string;
  bubbleId: string;
  summary: string;
  createdAt: string; // ISO date
  tags?: string[];
  metrics?: Record<string, string | number>;
}

// ============================================================================
// NAVIGATION STATE
// ============================================================================

export interface NavigationState {
  stack: string[]; // bubbleId path
  centeredBubbleId: string | null;
  mode: BubbleMode;
}

// ============================================================================
// PREVIEW DATA
// ============================================================================

export interface BubblePreview {
  title: string;
  metric?: string; // e.g., "5 items", "80% complete"
  aiSummary?: string; // Mock AI summary line
}

