/**
 * OneView Core Store - Minimal state management
 * 
 * Handles navigation, bubbles, and persistence
 */

import { create } from "zustand";
import { Bubble, Card, NavigationState, BubbleMode, BubblePreview } from "./core-types";
import { getBubblesByMode, getBubbleById, getAllBubbles } from "./mock-data";

interface OneViewCoreStore {
  // Data
  privateBubbles: Record<string, Bubble>;
  globalBubbles: Record<string, Bubble>;
  cards: Record<string, Card>;
  
  // Navigation
  navigation: NavigationState;
  
  // Actions
  initialize: () => void;
  setMode: (mode: BubbleMode) => void;
  setCenteredBubble: (bubbleId: string | null) => void;
  enterBubble: (bubbleId: string) => void;
  goBack: () => void;
  goHome: () => void;
  importToPrivate: (bubbleId: string) => void;
  
  // Getters
  getCurrentBubbles: () => Bubble[];
  getCenteredBubble: () => Bubble | null;
  getBubblePreview: (bubbleId: string) => BubblePreview | null;
  getCurrentParentId: () => string | null;
}

const STORAGE_KEYS = {
  privateBubbles: "oneview_private_bubbles",
  lastMode: "oneview_last_mode",
  lastPath: "oneview_last_path",
};

// Load from localStorage
function loadPrivateBubbles(): Record<string, Bubble> {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.privateBubbles);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return {};
}

function savePrivateBubbles(bubbles: Record<string, Bubble>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.privateBubbles, JSON.stringify(bubbles));
  } catch {
    // Ignore errors
  }
}

function loadLastMode(): BubbleMode {
  if (typeof window === "undefined") return "private";
  const stored = localStorage.getItem(STORAGE_KEYS.lastMode);
  return (stored as BubbleMode) || "private";
}

function saveLastMode(mode: BubbleMode) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.lastMode, mode);
}

function loadLastPath(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.lastPath);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return [];
}

function saveLastPath(path: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEYS.lastPath, JSON.stringify(path));
  } catch {
    // Ignore errors
  }
}

export const useOneViewCoreStore = create<OneViewCoreStore>((set, get) => ({
  // Initial state
  privateBubbles: {},
  globalBubbles: getAllBubbles("global"),
  cards: {},
  navigation: {
    stack: [],
    centeredBubbleId: null,
    mode: "private",
  },
  
  // Initialize
  initialize: () => {
    const privateBubbles = loadPrivateBubbles();
    const lastMode = loadLastMode();
    const lastPath = loadLastPath();
    
    // If no private bubbles saved, use seed
    if (Object.keys(privateBubbles).length === 0) {
      const seed = getAllBubbles("private");
      set({ privateBubbles: seed });
      savePrivateBubbles(seed);
    } else {
      set({ privateBubbles });
    }
    
    set({
      navigation: {
        stack: lastPath,
        centeredBubbleId: null,
        mode: lastMode,
      },
    });
  },
  
  // Set mode
  setMode: (mode) => {
    set((state) => ({
      navigation: {
        ...state.navigation,
        mode,
        centeredBubbleId: null, // Reset centered when switching modes
      },
    }));
    saveLastMode(mode);
  },
  
  // Set centered bubble
  setCenteredBubble: (bubbleId) => {
    set((state) => ({
      navigation: {
        ...state.navigation,
        centeredBubbleId: bubbleId,
      },
    }));
  },
  
  // Enter bubble (go inside)
  enterBubble: (bubbleId) => {
    set((state) => {
      const newStack = [...state.navigation.stack, bubbleId];
      saveLastPath(newStack);
      return {
        navigation: {
          ...state.navigation,
          stack: newStack,
          centeredBubbleId: null, // Reset centered when entering
        },
      };
    });
  },
  
  // Go back
  goBack: () => {
    set((state) => {
      const newStack = [...state.navigation.stack];
      newStack.pop();
      saveLastPath(newStack);
      return {
        navigation: {
          ...state.navigation,
          stack: newStack,
          centeredBubbleId: null, // Reset centered when going back
        },
      };
    });
  },
  
  // Go home
  goHome: () => {
    set((state) => ({
      navigation: {
        ...state.navigation,
        stack: [],
        centeredBubbleId: null,
      },
    }));
    saveLastPath([]);
  },
  
  // Import global bubble to private
  importToPrivate: (bubbleId) => {
    const { globalBubbles, privateBubbles } = get();
    const globalBubble = globalBubbles[bubbleId];
    
    if (!globalBubble) return;
    
    // Create private copy
    const privateCopy: Bubble = {
      ...globalBubble,
      id: `private_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      mode: "private",
      parentId: null, // Import as root level
    };
    
    // Add to private bubbles
    const updated = { ...privateBubbles, [privateCopy.id]: privateCopy };
    set({ privateBubbles: updated });
    savePrivateBubbles(updated);
  },
  
  // Get current bubbles (based on mode and parent)
  getCurrentBubbles: () => {
    const { navigation, privateBubbles, globalBubbles } = get();
    const bubbles = navigation.mode === "private" ? privateBubbles : globalBubbles;
    const parentId = get().getCurrentParentId();
    return Object.values(bubbles).filter((b) => b.parentId === parentId);
  },
  
  // Get centered bubble
  getCenteredBubble: () => {
    const { navigation, privateBubbles, globalBubbles } = get();
    if (!navigation.centeredBubbleId) return null;
    const bubbles = navigation.mode === "private" ? privateBubbles : globalBubbles;
    return bubbles[navigation.centeredBubbleId] || null;
  },
  
  // Get bubble preview
  getBubblePreview: (bubbleId) => {
    const { navigation, privateBubbles, globalBubbles } = get();
    const bubbles = navigation.mode === "private" ? privateBubbles : globalBubbles;
    const bubble = bubbles[bubbleId];
    
    if (!bubble) return null;
    
    return {
      title: bubble.title,
      metric: bubble.stats?.progress ? `${bubble.stats.progress}% complete` : `${bubble.childrenIds.length} items`,
      aiSummary: `Focus on ${bubble.title.toLowerCase()} to move forward.`, // Mock AI summary
    };
  },
  
  // Get current parent ID
  getCurrentParentId: () => {
    const { navigation } = get();
    if (navigation.stack.length === 0) return null;
    return navigation.stack[navigation.stack.length - 1];
  },
}));

