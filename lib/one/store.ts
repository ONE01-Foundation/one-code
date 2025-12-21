/**
 * OneView Store - V1
 * 
 * In-memory state management
 * TODO: Migrate to Supabase persistence
 */

import { Sphere, Card, Unit, Summary } from "./types";

interface OneStore {
  // Spheres
  spheres: Record<string, Sphere>;
  
  // Cards
  cards: Record<string, Card>;
  
  // Units (derived from card events)
  units: Record<string, Unit>;
  
  // Summaries
  summaries: Record<string, Summary>;
  
  // Actions
  createSphere: (sphere: Omit<Sphere, "id" | "stats">) => Sphere;
  updateSphere: (id: string, updates: Partial<Sphere>) => void;
  getSphereChildren: (parentId: string | null) => Sphere[];
  
  createCard: (card: Omit<Card, "id" | "createdAt" | "updatedAt">) => Card;
  updateCard: (id: string, updates: Partial<Card>) => void;
  getCardsForSphere: (sphereId: string) => Card[];
  completeCard: (id: string) => void;
  
  // Units are auto-generated from card events
  getUnitsForSphere: (sphereId: string) => Unit[];
  
  // Summaries
  updateSummary: (sphereId: string, text: string) => void;
  getSummary: (sphereId: string) => Summary | null;
}

// In-memory store
let store: {
  spheres: Record<string, Sphere>;
  cards: Record<string, Card>;
  units: Record<string, Unit>;
  summaries: Record<string, Summary>;
} = {
  spheres: {},
  cards: {},
  units: {},
  summaries: {},
};

// Generate ID
function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Create sphere
export function createSphere(data: Omit<Sphere, "id" | "stats">): Sphere {
  const sphere: Sphere = {
    id: generateId(),
    ...data,
    stats: {
      cards: 0,
      completed: 0,
      lastActivity: null,
    },
  };
  store.spheres[sphere.id] = sphere;
  return sphere;
}

// Update sphere
export function updateSphere(id: string, updates: Partial<Sphere>): void {
  if (store.spheres[id]) {
    store.spheres[id] = { ...store.spheres[id], ...updates };
  }
}

// Get sphere children
export function getSphereChildren(parentId: string | null): Sphere[] {
  return Object.values(store.spheres).filter(s => s.parentId === parentId);
}

// Create card
export function createCard(data: Omit<Card, "id" | "createdAt" | "updatedAt">): Card {
  const now = new Date().toISOString();
  const card: Card = {
    id: generateId(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  store.cards[card.id] = card;
  
  // Update sphere stats
  const sphere = store.spheres[data.sphereId];
  if (sphere) {
    sphere.stats.cards += 1;
    sphere.stats.lastActivity = now;
  }
  
  // Generate unit for card creation
  const unit: Unit = {
    id: generateId(),
    cardId: card.id,
    sphereId: card.sphereId,
    event: "created",
    timestamp: now,
    value: 1,
  };
  store.units[unit.id] = unit;
  
  return card;
}

// Update card
export function updateCard(id: string, updates: Partial<Card>): void {
  if (store.cards[id]) {
    const card = store.cards[id];
    const updated = {
      ...card,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    store.cards[id] = updated;
    
    // Update sphere stats
    const sphere = store.spheres[card.sphereId];
    if (sphere) {
      sphere.stats.lastActivity = updated.updatedAt;
      
      // If status changed to done, update completed count
      if (updates.status === "done" && card.status !== "done") {
        sphere.stats.completed += 1;
        
        // Generate unit for completion
        const unit: Unit = {
          id: generateId(),
          cardId: card.id,
          sphereId: card.sphereId,
          event: "completed",
          timestamp: updated.updatedAt,
          value: 1,
        };
        store.units[unit.id] = unit;
      } else if (updates.status !== "done" && card.status === "done") {
        // If un-done, decrement completed
        sphere.stats.completed = Math.max(0, sphere.stats.completed - 1);
      }
    }
  }
}

// Get cards for sphere
export function getCardsForSphere(sphereId: string): Card[] {
  return Object.values(store.cards).filter(c => c.sphereId === sphereId);
}

// Complete card
export function completeCard(id: string): void {
  updateCard(id, { status: "done" });
}

// Get units for sphere
export function getUnitsForSphere(sphereId: string): Unit[] {
  return Object.values(store.units).filter(u => u.sphereId === sphereId);
}

// Update summary
export function updateSummary(sphereId: string, text: string): void {
  store.summaries[sphereId] = {
    sphereId,
    text,
    updatedAt: new Date().toISOString(),
  };
}

// Get summary
export function getSummary(sphereId: string): Summary | null {
  return store.summaries[sphereId] || null;
}

// Get all spheres (for global mode)
export function getAllSpheres(mode: "private" | "global"): Sphere[] {
  return Object.values(store.spheres).filter(s => s.mode === mode);
}

// Initialize with seed data
export function initializeStore(): void {
  // Create root spheres
  const health = createSphere({
    parentId: null,
    name: "Health",
    mode: "private",
  });
  
  const money = createSphere({
    parentId: null,
    name: "Money",
    mode: "private",
  });
  
  const career = createSphere({
    parentId: null,
    name: "Career",
    mode: "private",
  });
  
  // Create some child spheres
  createSphere({ parentId: health.id, name: "Nutrition", mode: "private" });
  createSphere({ parentId: health.id, name: "Fitness", mode: "private" });
  createSphere({ parentId: money.id, name: "Income", mode: "private" });
  createSphere({ parentId: money.id, name: "Expenses", mode: "private" });
}

