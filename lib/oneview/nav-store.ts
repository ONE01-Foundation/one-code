/**
 * OneNav Store - Navigation state management
 * 
 * Handles:
 * - pathStack (navigation hierarchy)
 * - focusedNodeId (currently centered sphere)
 * - panOffset (joystick panning)
 * - mode (private/global)
 */

import { create } from "zustand";
import { BubbleMode } from "./core-types";

interface NavState {
  // Navigation stack
  pathStack: string[]; // nodeId[] - current path in hierarchy
  
  // Focus state
  focusedNodeId: string | null; // Currently centered/focused sphere
  
  // Joystick panning
  panOffset: { x: number; y: number }; // Pan offset for sphere cloud
  
  // Mode
  mode: BubbleMode;
  
  // Actions
  setMode: (mode: BubbleMode) => void;
  setFocusedNode: (nodeId: string | null) => void;
  enterNode: (nodeId: string) => void;
  goBack: () => void;
  goHome: () => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  
  // Getters
  getCurrentContext: () => string | null; // Last node in stack, or null for root
  isEntered: (nodeId: string) => boolean; // Check if node is in stack
  canGoBack: () => boolean; // Check if back is available
}

export const useNavStore = create<NavState>((set, get) => ({
  // Initial state
  pathStack: [],
  focusedNodeId: null,
  panOffset: { x: 0, y: 0 },
  mode: "private",
  
  // Set mode (resets stack)
  setMode: (mode) => {
    set({
      mode,
      pathStack: [],
      focusedNodeId: null,
      panOffset: { x: 0, y: 0 },
    });
  },
  
  // Set focused node (preview state)
  setFocusedNode: (nodeId) => {
    set({ focusedNodeId: nodeId });
  },
  
  // Enter node (push to stack)
  enterNode: (nodeId) => {
    const { pathStack } = get();
    const newStack = [...pathStack, nodeId];
    set({
      pathStack: newStack,
      focusedNodeId: null, // Reset focus when entering (will auto-focus first child)
    });
  },
  
  // Go back (pop stack)
  goBack: () => {
    const { pathStack } = get();
    if (pathStack.length === 0) return; // Already at root
    
    const newStack = [...pathStack];
    newStack.pop();
    set({
      pathStack: newStack,
      focusedNodeId: null, // Reset focus (will auto-focus parent or first visible)
    });
  },
  
  // Go home (clear stack)
  goHome: () => {
    set({
      pathStack: [],
      focusedNodeId: null,
      panOffset: { x: 0, y: 0 },
    });
  },
  
  // Set pan offset (joystick)
  setPanOffset: (offset) => {
    set({ panOffset: offset });
  },
  
  // Get current context
  getCurrentContext: () => {
    const { pathStack } = get();
    return pathStack.length > 0 ? pathStack[pathStack.length - 1] : null;
  },
  
  // Check if node is entered
  isEntered: (nodeId) => {
    const { pathStack } = get();
    return pathStack.includes(nodeId);
  },
  
  // Check if back is available
  canGoBack: () => {
    const { pathStack } = get();
    return pathStack.length > 0;
  },
}));

