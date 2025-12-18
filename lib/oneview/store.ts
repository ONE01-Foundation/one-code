/**
 * OneView Store - Zustand state management
 */

import { create } from "zustand";
import { Sphere, Card, ViewState, Action, UINode } from "./types";

interface OneViewStore {
  // Data
  spheres: Record<string, Sphere>;
  cards: Record<string, Card>;
  uiNodes: Record<string, UINode>;
  
  // View State
  viewState: ViewState;
  
  // Ledger (action log)
  ledger: Action[];
  
  // Actions
  addSphere: (sphere: Sphere) => void;
  updateSphere: (id: string, patch: Partial<Sphere>) => void;
  addCard: (card: Card) => void;
  updateCard: (id: string, patch: Partial<Card>) => void;
  addUINode: (node: UINode) => void;
  updateUINode: (nodeId: string, patch: Partial<UINode>) => void;
  
  // Navigation
  navigateToSphere: (sphereId: string) => void;
  navigateBack: () => void;
  navigateHome: () => void;
  setCenteredBubble: (bubbleId: string | null) => void;
  toggleMode: () => void;
  
  // Command Engine
  applyActions: (actions: Action[]) => void;
  addToLedger: (action: Action) => void;
  
  // Time
  setTimeCursor: (time: string) => void;
}

// Generate ID helper
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Initial state
const initialViewState: ViewState = {
  mode: "private",
  currentSphereId: null,
  navigationStack: [],
  centeredBubbleId: null,
  timeCursor: new Date().toISOString(),
};

// Create root sphere
const rootSphere: Sphere = {
  id: "root",
  parentId: null,
  name: "Home",
  iconKey: "home",
  childrenSphereIds: [],
  cardIds: [],
};

export const useOneViewStore = create<OneViewStore>((set, get) => ({
  // Initial data
  spheres: { root: rootSphere },
  cards: {},
  uiNodes: {},
  viewState: initialViewState,
  ledger: [],
  
  // Sphere actions
  addSphere: (sphere) => {
    set((state) => ({
      spheres: { ...state.spheres, [sphere.id]: sphere },
    }));
    
    // Update parent's children list
    if (sphere.parentId) {
      const parent = get().spheres[sphere.parentId];
      if (parent) {
        get().updateSphere(sphere.parentId, {
          childrenSphereIds: [...parent.childrenSphereIds, sphere.id],
        });
      }
    }
  },
  
  updateSphere: (id, patch) => {
    set((state) => {
      const sphere = state.spheres[id];
      if (!sphere) return state;
      return {
        spheres: {
          ...state.spheres,
          [id]: { ...sphere, ...patch },
        },
      };
    });
  },
  
  // Card actions
  addCard: (card) => {
    set((state) => ({
      cards: { ...state.cards, [card.id]: card },
    }));
    
    // Update sphere's card list
    const sphere = get().spheres[card.sphereId];
    if (sphere) {
      get().updateSphere(card.sphereId, {
        cardIds: [...sphere.cardIds, card.id],
      });
    }
  },
  
  updateCard: (id, patch) => {
    set((state) => {
      const card = state.cards[id];
      if (!card) return state;
      return {
        cards: {
          ...state.cards,
          [id]: { ...card, ...patch, updatedAt: new Date().toISOString() },
        },
      };
    });
  },
  
  // UI Node actions
  addUINode: (node) => {
    set((state) => ({
      uiNodes: { ...state.uiNodes, [node.nodeId]: node },
    }));
  },
  
  updateUINode: (nodeId, patch) => {
    set((state) => {
      const node = state.uiNodes[nodeId];
      if (!node) return state;
      return {
        uiNodes: {
          ...state.uiNodes,
          [nodeId]: { ...node, ...patch },
        },
      };
    });
  },
  
  // Navigation
  navigateToSphere: (sphereId) => {
    set((state) => ({
      viewState: {
        ...state.viewState,
        currentSphereId: sphereId,
        navigationStack: [...state.viewState.navigationStack, sphereId],
        centeredBubbleId: null, // Reset centered when navigating
      },
    }));
  },
  
  navigateBack: () => {
    set((state) => {
      const stack = [...state.viewState.navigationStack];
      stack.pop();
      const prevSphereId = stack.length > 0 ? stack[stack.length - 1] : null;
      
      return {
        viewState: {
          ...state.viewState,
          currentSphereId: prevSphereId,
          navigationStack: stack,
          centeredBubbleId: null,
        },
      };
    });
  },
  
  navigateHome: () => {
    set((state) => ({
      viewState: {
        ...state.viewState,
        currentSphereId: null,
        navigationStack: [],
        centeredBubbleId: null,
      },
    }));
  },
  
  setCenteredBubble: (bubbleId) => {
    set((state) => ({
      viewState: {
        ...state.viewState,
        centeredBubbleId: bubbleId,
      },
    }));
  },
  
  toggleMode: () => {
    set((state) => ({
      viewState: {
        ...state.viewState,
        mode: state.viewState.mode === "private" ? "global" : "private",
      },
    }));
  },
  
  // Command Engine
  applyActions: (actions) => {
    actions.forEach((action) => {
      const store = get();
      
      switch (action.type) {
        case "ONE_TEXT_SET":
          store.updateUINode(action.nodeId, { value: action.text });
          break;
          
        case "ONE_TEXT_TRANSLATE":
          // Translation would be handled by AI stub
          store.addToLedger(action);
          break;
          
        case "ONE_COLOR_SET":
          // Color changes would affect UI nodes or spheres
          store.addToLedger(action);
          break;
          
        case "ONE_IMAGE_REPLACE":
          // Image replacement would affect UI nodes
          store.addToLedger(action);
          break;
          
        case "ONE_SPHERE_CREATE":
          const newSphere: Sphere = {
            id: generateId("sphere"),
            parentId: action.parentId,
            name: action.name,
            iconKey: action.iconKey,
            childrenSphereIds: [],
            cardIds: [],
          };
          store.addSphere(newSphere);
          store.addToLedger(action);
          break;
          
        case "ONE_VIEW_NAVIGATE":
          store.navigateToSphere(action.sphereId);
          store.addToLedger(action);
          break;
          
        case "ONE_CARD_CREATE":
          const newCard: Card = {
            id: generateId("card"),
            sphereId: action.sphereId,
            title: action.title,
            summary: action.summary,
            metrics: action.metrics,
            updatedAt: new Date().toISOString(),
          };
          store.addCard(newCard);
          store.addToLedger(action);
          break;
          
        case "ONE_CARD_UPDATE":
          store.updateCard(action.cardId, action.patch);
          store.addToLedger(action);
          break;
      }
    });
  },
  
  addToLedger: (action) => {
    set((state) => ({
      ledger: [...state.ledger, action],
    }));
  },
  
  // Time
  setTimeCursor: (time) => {
    set((state) => ({
      viewState: {
        ...state.viewState,
        timeCursor: time,
      },
    }));
  },
}));

