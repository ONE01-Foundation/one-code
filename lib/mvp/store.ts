/**
 * MVP Store - Zustand
 * 
 * In-memory state management
 * TODO: Persist to Supabase
 */

import { create } from "zustand";
import { World, SphereNode, Card, Moment, WorldId, NodeType } from "./types";

interface MVPStore {
  // Data
  worlds: World[];
  nodes: Record<string, SphereNode>;
  cards: Record<string, Card>;
  moments: Moment[];
  
  // UI State
  focusedNodeId: string | null;
  currentPath: string[]; // Breadcrumb path
  viewMode: "home" | "drill" | "cards";
  
  // Actions
  initialize: () => void;
  createNode: (node: Omit<SphereNode, "id" | "createdAt" | "lastActivityAt">) => SphereNode;
  updateNode: (id: string, updates: Partial<SphereNode>) => void;
  createCard: (card: Omit<Card, "id" | "createdAt" | "updatedAt">) => Card;
  createMoment: (moment: Omit<Moment, "id" | "createdAt">) => Moment;
  setFocusedNode: (id: string | null) => void;
  enterNode: (id: string) => void;
  goBack: () => void;
  getChildren: (parentId: string | null) => SphereNode[];
  getCardsForNode: (nodeId: string) => Card[];
  getMetrics: (nodeId: string) => { openCards: number; momentsToday: number };
  updateCard: (id: string, updates: Partial<Card>) => void;
}

function generateId(): string {
  return `_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getTodayStart(): string {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.toISOString();
}

export const useMVPStore = create<MVPStore>((set, get) => ({
  worlds: [],
  nodes: {},
  cards: {},
  moments: [],
  focusedNodeId: null,
  currentPath: [],
  viewMode: "home",
  
  initialize: () => {
    const worlds: World[] = [
      { id: "health", name: "Health", icon: "❤️" },
      { id: "money", name: "Money", icon: "💰" },
      { id: "career", name: "Career", icon: "💼" },
    ];
    
    const nodes: Record<string, SphereNode> = {};
    const now = new Date().toISOString();
    
    // Create initial spheres under each world
    worlds.forEach((world) => {
      if (world.id === "health") {
        nodes[generateId()] = {
          id: generateId(),
          type: "sphere",
          name: "Nutrition",
          icon: "🥗",
          parentId: null,
          worldId: world.id,
          createdAt: now,
          lastActivityAt: now,
        };
        nodes[generateId()] = {
          id: generateId(),
          type: "sphere",
          name: "Fitness",
          icon: "💪",
          parentId: null,
          worldId: world.id,
          createdAt: now,
          lastActivityAt: now,
        };
      } else if (world.id === "money") {
        nodes[generateId()] = {
          id: generateId(),
          type: "sphere",
          name: "Income",
          icon: "📈",
          parentId: null,
          worldId: world.id,
          createdAt: now,
          lastActivityAt: now,
        };
        nodes[generateId()] = {
          id: generateId(),
          type: "sphere",
          name: "Expenses",
          icon: "📉",
          parentId: null,
          worldId: world.id,
          createdAt: now,
          lastActivityAt: now,
        };
      } else if (world.id === "career") {
        const projectsId = generateId();
        nodes[projectsId] = {
          id: projectsId,
          type: "cluster",
          name: "Projects",
          icon: "🚀",
          parentId: null,
          worldId: world.id,
          createdAt: now,
          lastActivityAt: now,
        };
        nodes[generateId()] = {
          id: generateId(),
          type: "sphere",
          name: "Skills",
          icon: "🎯",
          parentId: null,
          worldId: world.id,
          createdAt: now,
          lastActivityAt: now,
        };
      }
    });
    
    set({ worlds, nodes });
  },
  
  createNode: (data) => {
    const now = new Date().toISOString();
    const node: SphereNode = {
      id: generateId(),
      ...data,
      createdAt: now,
      lastActivityAt: now,
    };
    set((state) => ({
      nodes: { ...state.nodes, [node.id]: node },
    }));
    return node;
  },
  
  updateNode: (id, updates) => {
    set((state) => {
      if (!state.nodes[id]) return state;
      return {
        nodes: {
          ...state.nodes,
          [id]: {
            ...state.nodes[id],
            ...updates,
            lastActivityAt: new Date().toISOString(),
          },
        },
      };
    });
  },
  
  createCard: (data) => {
    const now = new Date().toISOString();
    const card: Card = {
      id: generateId(),
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({
      cards: { ...state.cards, [card.id]: card },
    }));
    
    // Update node activity
    get().updateNode(data.nodeId, {});
    
    return card;
  },
  
  createMoment: (data) => {
    const moment: Moment = {
      id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      moments: [...state.moments, moment],
    }));
    
    // Update node activity for attached nodes
    data.nodeIds.forEach((nodeId) => {
      get().updateNode(nodeId, {});
    });
    
    return moment;
  },
  
  setFocusedNode: (id) => {
    set({ focusedNodeId: id });
  },
  
  enterNode: (id) => {
    const node = get().nodes[id];
    if (!node) return;
    
    const children = get().getChildren(id);
    
    if (children.length > 0) {
      // Has children - drill down
      set({
        currentPath: [...get().currentPath, node.name],
        viewMode: "drill",
        focusedNodeId: children[0]?.id || null,
      });
    } else {
      // No children - show cards
      set({
        currentPath: [...get().currentPath, node.name],
        viewMode: "cards",
        focusedNodeId: id,
      });
    }
  },
  
  goBack: () => {
    const { currentPath, viewMode } = get();
    
    if (currentPath.length === 0) return;
    
    if (viewMode === "cards") {
      // Go back from cards to drill
      const newPath = currentPath.slice(0, -1);
      const parentNodeName = newPath[newPath.length - 1];
      const parentNode = Object.values(get().nodes).find(
        (n) => n.name === parentNodeName
      );
      
      if (parentNode) {
        const children = get().getChildren(parentNode.id);
        set({
          currentPath: newPath,
          viewMode: "drill",
          focusedNodeId: children[0]?.id || null,
        });
      }
    } else if (viewMode === "drill") {
      // Go back from drill to home or parent drill
      const newPath = currentPath.slice(0, -1);
      
      if (newPath.length === 0) {
        // Back to home
        set({
          currentPath: [],
          viewMode: "home",
          focusedNodeId: null,
        });
      } else {
        // Back to parent drill
        const parentNodeName = newPath[newPath.length - 1];
        const parentNode = Object.values(get().nodes).find(
          (n) => n.name === parentNodeName
        );
        
        if (parentNode) {
          const children = get().getChildren(parentNode.id);
          set({
            currentPath: newPath,
            viewMode: "drill",
            focusedNodeId: children[0]?.id || null,
          });
        }
      }
    }
  },
  
  getChildren: (parentId) => {
    const { nodes } = get();
    return Object.values(nodes).filter(
      (n) => n.parentId === parentId && !n.hidden
    );
  },
  
  getCardsForNode: (nodeId) => {
    const { cards } = get();
    return Object.values(cards).filter((c) => c.nodeId === nodeId);
  },
  
  getMetrics: (nodeId) => {
    const { cards, moments } = get();
    const nodeCards = Object.values(cards).filter((c) => c.nodeId === nodeId);
    const openCards = nodeCards.filter((c) => c.status === "open").length;
    
    const todayStart = getTodayStart();
    const nodeMoments = moments.filter(
      (m) => m.nodeIds.includes(nodeId) && m.createdAt >= todayStart
    );
    
    return {
      openCards,
      momentsToday: nodeMoments.length,
    };
  },
  
  updateCard: (id, updates) => {
    set((state) => {
      if (!state.cards[id]) return state;
      return {
        cards: {
          ...state.cards,
          [id]: {
            ...state.cards[id],
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    });
  },
}));

