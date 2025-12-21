/**
 * MVP Store - Zustand
 * 
 * In-memory state management
 * TODO: Persist to Supabase
 */

import { create } from "zustand";
import { World, SphereNode, Card, Moment, WorldId, NodeType, DraftMoment } from "./types";

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
  draftMoment: DraftMoment | null;
  showMomentPreview: boolean;
  isListening: boolean; // Voice-ready UI state
  
  // Actions
  initialize: () => void;
  createNode: (node: Omit<SphereNode, "id" | "createdAt" | "lastActivityAt">) => SphereNode;
  updateNode: (id: string, updates: Partial<SphereNode>) => void;
  createCard: (card: Omit<Card, "id" | "createdAt" | "updatedAt">) => Card;
  createMoment: (moment: Omit<Moment, "id" | "createdAt" | "units">) => Moment;
  createDraftMoment: (draft: DraftMoment) => void;
  commitDraftMoment: (options: { createCard?: boolean; cardTitle?: string; selectedNodeIds: string[] }) => void;
  cancelDraftMoment: () => void;
  setFocusedNode: (id: string | null) => void;
  enterNode: (id: string) => void;
  goBack: () => void;
  getChildren: (parentId: string | null) => SphereNode[];
  getCardsForNode: (nodeId: string) => Card[];
  getMetrics: (nodeId: string) => { openCards: number; momentsToday: number };
  getUnitsToday: (nodeId: string) => number;
  getNodeHeat: (nodeId: string) => number; // 0..1 heat value
  updateCard: (id: string, updates: Partial<Card>) => void;
  setListening: (listening: boolean) => void;
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
  draftMoment: null,
  showMomentPreview: false,
  isListening: false,
  
  initialize: () => {
    const worlds: World[] = [
      { id: "health", name: "Health", icon: "❤️" },
      { id: "money", name: "Money", icon: "💰" },
      { id: "career", name: "Career", icon: "💼" },
    ];
    
    const nodes: Record<string, SphereNode> = {};
    const now = new Date().toISOString();
    
    // Create World nodes (these are the top-level nodes shown on Home)
    const worldNodeIds: Record<WorldId, string> = {} as any;
    
    worlds.forEach((world) => {
      const worldNodeId = `world_${world.id}`;
      worldNodeIds[world.id] = worldNodeId;
      nodes[worldNodeId] = {
        id: worldNodeId,
        type: "world",
        name: world.name,
        icon: world.icon,
        parentId: null, // Worlds are root level
        worldId: world.id,
        createdAt: now,
        lastActivityAt: now,
      };
    });
    
    // Create Health children: Nutrition, Fitness, Sleep
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Nutrition",
      icon: "🥗",
      parentId: worldNodeIds.health,
      worldId: "health",
      createdAt: now,
      lastActivityAt: now,
    };
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Fitness",
      icon: "💪",
      parentId: worldNodeIds.health,
      worldId: "health",
      createdAt: now,
      lastActivityAt: now,
    };
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Sleep",
      icon: "😴",
      parentId: worldNodeIds.health,
      worldId: "health",
      createdAt: now,
      lastActivityAt: now,
    };
    
    // Create Money children: Income, Expenses, Debts
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Income",
      icon: "📈",
      parentId: worldNodeIds.money,
      worldId: "money",
      createdAt: now,
      lastActivityAt: now,
    };
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Expenses",
      icon: "📉",
      parentId: worldNodeIds.money,
      worldId: "money",
      createdAt: now,
      lastActivityAt: now,
    };
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Debts",
      icon: "💳",
      parentId: worldNodeIds.money,
      worldId: "money",
      createdAt: now,
      lastActivityAt: now,
    };
    
    // Create Career children: Projects, Clients, Skills
    const projectsId = generateId();
    nodes[projectsId] = {
      id: projectsId,
      type: "cluster",
      name: "Projects",
      icon: "🚀",
      parentId: worldNodeIds.career,
      worldId: "career",
      createdAt: now,
      lastActivityAt: now,
    };
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Clients",
      icon: "🤝",
      parentId: worldNodeIds.career,
      worldId: "career",
      createdAt: now,
      lastActivityAt: now,
    };
    nodes[generateId()] = {
      id: generateId(),
      type: "sphere",
      name: "Skills",
      icon: "🎯",
      parentId: worldNodeIds.career,
      worldId: "career",
      createdAt: now,
      lastActivityAt: now,
    };
    
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
    // Calculate units (word count)
    const wordCount = data.rawText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    const moment: Moment = {
      id: generateId(),
      ...data,
      units: wordCount,
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
  
  createDraftMoment: (draft) => {
    set({
      draftMoment: draft,
      showMomentPreview: true,
    });
  },
  
  commitDraftMoment: (options) => {
    const { draftMoment } = get();
    if (!draftMoment) return;
    
    // Create the actual moment
    const moment = get().createMoment({
      rawText: draftMoment.text,
      intent: "log",
      domain: draftMoment.proposedWorldIds[0] || "other",
      nodeIds: options.selectedNodeIds,
    });
    
    // Create card if requested
    if (options.createCard && options.cardTitle) {
      // Determine best parent node
      let parentNodeId: string | null = null;
      
      // Default parent = current focused node if not root
      const { focusedNodeId, viewMode } = get();
      if (focusedNodeId && viewMode !== "home") {
        const focusedNode = get().nodes[focusedNodeId];
        if (focusedNode && focusedNode.type !== "world") {
          parentNodeId = focusedNodeId;
        }
      }
      
      // Else parent = first selected node (if it's a sphere/cluster)
      if (!parentNodeId && options.selectedNodeIds.length > 0) {
        const firstNode = get().nodes[options.selectedNodeIds[0]];
        if (firstNode && (firstNode.type === "sphere" || firstNode.type === "cluster")) {
          parentNodeId = firstNode.id;
        }
      }
      
      if (parentNodeId) {
        const card = get().createCard({
          nodeId: parentNodeId,
          title: options.cardTitle,
          status: "open",
        });
        
        // Link moment to card
        moment.cardId = card.id;
        set((state) => ({
          moments: state.moments.map((m) => m.id === moment.id ? moment : m),
        }));
      }
    }
    
    // Clear draft
    set({
      draftMoment: null,
      showMomentPreview: false,
    });
  },
  
  cancelDraftMoment: () => {
    set({
      draftMoment: null,
      showMomentPreview: false,
    });
  },
  
  setFocusedNode: (id) => {
    set({ focusedNodeId: id });
  },
  
  enterNode: (id) => {
    const node = get().nodes[id];
    if (!node) return;
    
    // Only allow entering if node is actually focused (centered)
    const { focusedNodeId } = get();
    if (focusedNodeId !== id) return;
    
    const children = get().getChildren(id);
    
    if (children.length > 0) {
      // Has children - drill down
      set({
        currentPath: [...get().currentPath, node.name],
        viewMode: "drill",
        focusedNodeId: children[0]?.id || null,
      });
    } else {
      // No children - show cards (for clusters/projects)
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
    
    // If parentId is null, return only World nodes (top-level)
    if (parentId === null) {
      return Object.values(nodes).filter(
        (n) => n.type === "world" && !n.hidden
      );
    }
    
    // Otherwise return direct children
    return Object.values(nodes).filter(
      (n) => n.parentId === parentId && !n.hidden
    );
  },
  
  getCardsForNode: (nodeId) => {
    const { cards } = get();
    return Object.values(cards).filter((c) => c.nodeId === nodeId);
  },
  
  getUnitsToday: (nodeId) => {
    const { moments, nodes } = get();
    const node = nodes[nodeId];
    if (!node) return 0;
    
    const todayStart = getTodayStart();
    
    // If World, aggregate from descendants
    if (node.type === "world") {
      const allDescendants = Object.values(nodes).filter((n) => {
        const isDescendant = (nid: string): boolean => {
          const n = nodes[nid];
          if (!n) return false;
          if (n.id === nodeId) return true;
          if (n.parentId === nodeId) return true;
          if (n.parentId && isDescendant(n.parentId)) return true;
          return false;
        };
        return n.id !== nodeId && isDescendant(n.id);
      });
      const descendantIds = [nodeId, ...allDescendants.map((n) => n.id)];
      const allMoments = moments.filter((m) =>
        m.nodeIds.some((nid) => descendantIds.includes(nid)) &&
        m.createdAt >= todayStart
      );
      return allMoments.reduce((sum, m) => sum + m.units, 0);
    }
    
    // For non-World nodes
    const nodeMoments = moments.filter(
      (m) => m.nodeIds.includes(nodeId) && m.createdAt >= todayStart
    );
    return nodeMoments.reduce((sum, m) => sum + m.units, 0);
  },
  
  getMetrics: (nodeId) => {
    const { cards, moments, nodes } = get();
    const node = nodes[nodeId];
    if (!node) return { openCards: 0, momentsToday: 0 };
    
    // If it's a World, aggregate from all descendants
    if (node.type === "world") {
      const allDescendants = Object.values(nodes).filter((n) => {
        const isDescendant = (nid: string): boolean => {
          const n = nodes[nid];
          if (!n) return false;
          if (n.id === nodeId) return true;
          if (n.parentId === nodeId) return true;
          if (n.parentId && isDescendant(n.parentId)) return true;
          return false;
        };
        return n.id !== nodeId && isDescendant(n.id);
      });
      
      const descendantIds = allDescendants.map((n) => n.id);
      const allCards = Object.values(cards).filter((c) => 
        descendantIds.includes(c.nodeId)
      );
      const openCards = allCards.filter((c) => c.status === "open").length;
      
      const todayStart = getTodayStart();
      const allMoments = moments.filter((m) => 
        m.nodeIds.some((nid) => descendantIds.includes(nid) || nid === nodeId) && 
        m.createdAt >= todayStart
      );
      
      return {
        openCards,
        momentsToday: allMoments.length,
      };
    }
    
    // For non-World nodes, calculate normally
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
  
  setListening: (listening) => {
    set({ isListening: listening });
  },
  
  getNodeHeat: (nodeId) => {
    const { nodes, moments, cards } = get();
    const node = nodes[nodeId];
    if (!node) return 0;
    
    // Don't apply heat to Worlds (too strong)
    if (node.type === "world") return 0.5; // Fixed moderate value
    
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const lastActivity = new Date(node.lastActivityAt).getTime();
    
    // Recent activity (within 7 days) => 0..1
    const recent = lastActivity >= sevenDaysAgo 
      ? 1 - (now - lastActivity) / (7 * 24 * 60 * 60 * 1000)
      : 0;
    
    // Moments today
    const todayStart = getTodayStart();
    const nodeMoments = moments.filter(
      (m) => m.nodeIds.includes(nodeId) && m.createdAt >= todayStart
    );
    const momentsScore = Math.min(1, nodeMoments.length / 5);
    
    // Open cards
    const nodeCards = Object.values(cards).filter((c) => c.nodeId === nodeId);
    const openCards = nodeCards.filter((c) => c.status === "open").length;
    const cardsScore = Math.min(1, openCards / 5);
    
    // Weighted heat: 0.5*recent + 0.3*moments + 0.2*openCards
    const heat = 0.5 * recent + 0.3 * momentsScore + 0.2 * cardsScore;
    
    return Math.max(0, Math.min(1, heat));
  },
}));

