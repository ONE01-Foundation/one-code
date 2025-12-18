/**
 * Tree Update Logic - Apply OneStep to Private Tree
 * 
 * Creates/updates bubbles and cards based on AI response
 */

import { OneStep } from "./onestep-types";
import { Bubble, Card } from "./core-types";
import { useUnitsStore } from "./units-store";
import { useOneViewCoreStore } from "./core-store";

/**
 * Apply OneStep to private tree
 * 
 * Rules:
 * - Create bubblePath if it doesn't exist
 * - Update bubble.stats.lastUpdated
 * - Create card under deepest bubble if card provided
 * - Return created/updated bubble IDs
 */
export function applyOneStepToPrivateTree(
  oneStep: OneStep,
  store: ReturnType<typeof useOneViewCoreStore.getState>
): {
  createdBubbles: string[];
  updatedBubbles: string[];
  createdCardId: string | null;
} {
  const { privateBubbles } = store;
  
  const createdBubbles: string[] = [];
  const updatedBubbles: string[] = [];
  let createdCardId: string | null = null;
  
  // Build bubble path (create if doesn't exist)
  let currentParentId: string | null = null;
  const bubbleIds: string[] = [];
  
  for (let i = 0; i < oneStep.bubblePath.length; i++) {
    const bubbleName = oneStep.bubblePath[i];
    const isRoot = i === 0;
    
    // Find existing bubble with this name and parent
    let existingBubble = Object.values(privateBubbles).find(
      (b) => b.title === bubbleName && b.parentId === currentParentId
    );
    
    if (!existingBubble) {
      // Check Units (creating a sphere costs 1 Unit) - only for root-level bubbles
      if (i === 0) {
        try {
          const unitsStore = useUnitsStore.getState();
          unitsStore.initialize();
          
          if (!unitsStore.canAfford(1)) {
            console.warn(`Cannot create sphere "${bubbleName}": insufficient Units`);
            // Continue with existing bubbles only
            break;
          }
          
          // Spend 1 Unit
          const spent = unitsStore.spend(1, `Create sphere: ${bubbleName}`);
          if (!spent) {
            break;
          }
        } catch (error) {
          console.error("Failed to check Units:", error);
          // Continue without Units check (fallback)
        }
      }
      
      // Create new bubble
      const newBubble: Bubble = {
        id: `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: bubbleName,
        icon: getDomainIcon(oneStep.domain),
        parentId: currentParentId,
        mode: "private",
        stats: {
          progress: 0,
          lastUpdated: new Date().toISOString(),
        },
        childrenIds: [],
        trust: {
          level: "self-declared",
          verifiedAt: new Date().toISOString(),
        },
      };
      
      // Add to store
      store.privateBubbles = { ...store.privateBubbles, [newBubble.id]: newBubble };
      
      // Update parent's childrenIds
      if (currentParentId) {
        const parent = store.privateBubbles[currentParentId];
        if (parent) {
          parent.childrenIds = [...parent.childrenIds, newBubble.id];
          store.privateBubbles = { ...store.privateBubbles, [currentParentId]: parent };
          updatedBubbles.push(currentParentId);
        }
      }
      
      createdBubbles.push(newBubble.id);
      bubbleIds.push(newBubble.id);
      currentParentId = newBubble.id;
    } else {
      // Update existing bubble
      existingBubble.stats = {
        ...existingBubble.stats,
        lastUpdated: new Date().toISOString(),
      };
      store.privateBubbles = { ...store.privateBubbles, [existingBubble.id]: existingBubble };
      updatedBubbles.push(existingBubble.id);
      bubbleIds.push(existingBubble.id);
      currentParentId = existingBubble.id;
    }
  }
  
  // Create card if provided
  if (oneStep.card && currentParentId) {
    const newCard: Card = {
      id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      bubbleId: currentParentId,
      summary: oneStep.card.summary,
      createdAt: new Date().toISOString(),
      tags: [oneStep.card.type],
      metrics: oneStep.card.energyLevel === "high" ? { energy: "high" } : undefined,
    };
    
    // Store card in store
    store.cards = { ...store.cards, [newCard.id]: newCard };
    createdCardId = newCard.id;
  }
  
  // Persist to localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("oneview_private_bubbles", JSON.stringify(store.privateBubbles));
      // Also persist cards if needed
      if (createdCardId) {
        localStorage.setItem("oneview_cards", JSON.stringify(store.cards));
      }
    } catch {
      // Ignore errors
    }
  }
  
  return {
    createdBubbles,
    updatedBubbles,
    createdCardId,
  };
}

/**
 * Get domain icon
 */
function getDomainIcon(domain: string): string {
  const icons: Record<string, string> = {
    health: "❤️",
    money: "💰",
    career: "💼",
    relationships: "🤝",
    learning: "📚",
    other: "✨",
  };
  return icons[domain] || "✨";
}

