/**
 * OneView + OneEngine - Data Model
 * 
 * MVP types for bubble navigation and command engine
 */

// ============================================================================
// ENTITIES
// ============================================================================

export interface Sphere {
  id: string;
  parentId: string | null;
  name: string;
  iconKey: string; // e.g., "health", "work", "money"
  childrenSphereIds: string[];
  cardIds: string[];
  stats?: {
    count?: number;
    trend?: "up" | "down" | "stable";
  };
}

export interface Card {
  id: string;
  sphereId: string;
  title: string;
  summary: string;
  metrics?: {
    key: string;
    value: string | number;
    trend?: "up" | "down" | "stable";
  };
  updatedAt: string; // ISO date
}

export interface ViewState {
  mode: "private" | "global";
  currentSphereId: string | null;
  navigationStack: string[]; // Stack of sphere IDs
  centeredBubbleId: string | null; // Currently centered bubble (sphere or card)
  timeCursor: string; // ISO date
}

// ============================================================================
// UI NODES (for OneText/OneColor/OneImage)
// ============================================================================

export type UINodeType = "text" | "color" | "image";

export interface UINode {
  nodeId: string;
  type: UINodeType;
  value: string; // text content, hex color, or asset key
  targetId: string; // ID of sphere/card this node targets
}

// ============================================================================
// COMMAND ENGINE - ACTIONS
// ============================================================================

export type Action =
  | { type: "ONE_TEXT_SET"; nodeId: string; text: string }
  | { type: "ONE_TEXT_TRANSLATE"; nodeId: string; lang: string }
  | { type: "ONE_COLOR_SET"; targetId: string; hex: string; opacity?: number }
  | { type: "ONE_IMAGE_REPLACE"; targetId: string; assetKey: string }
  | { type: "ONE_SPHERE_CREATE"; parentId: string | null; name: string; iconKey: string }
  | { type: "ONE_VIEW_NAVIGATE"; sphereId: string }
  | { type: "ONE_CARD_CREATE"; sphereId: string; title: string; summary: string; metrics?: any }
  | { type: "ONE_CARD_UPDATE"; cardId: string; patch: any };

// ============================================================================
// AI STUB OUTPUT
// ============================================================================

export interface StagedOutput {
  intent: string;
  plan: string[];
  actions: Action[];
  ask?: string;
}

