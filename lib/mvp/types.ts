/**
 * MVP Data Model
 */

export type WorldId = "health" | "money" | "career";
export type NodeType = "world" | "sphere" | "cluster" | "card";

export interface World {
  id: WorldId;
  name: string;
  icon?: string;
}

export interface SphereNode {
  id: string;
  type: NodeType;
  name: string;
  icon?: string;
  parentId: string | null; // null for worlds
  worldId: WorldId;
  pinned?: boolean;
  hidden?: boolean;
  createdAt: string;
  lastActivityAt: string; // ISO timestamp for opacity calculation
}

export interface Card {
  id: string;
  nodeId: string; // Parent sphere/cluster
  title: string;
  notes?: string;
  status: "open" | "done" | "paused";
  createdAt: string;
  updatedAt: string;
}

export interface Moment {
  id: string;
  rawText: string;
  intent?: string;
  domain?: string;
  nodeIds: string[]; // Attached sphere nodes
  cardId?: string; // Optional link to card
  units: number; // Word count
  createdAt: string;
}

export interface DraftMoment {
  text: string;
  proposedTags: string[]; // Node names
  proposedWorldIds: WorldId[];
  proposedNodeIds: string[]; // Node IDs
  confidence?: number;
  suggestedCardTitle?: string;
  suggestedCardType?: string;
  suggestedNextStep?: string;
}

