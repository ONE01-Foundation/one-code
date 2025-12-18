/**
 * Command Engine - Validate and apply actions
 * 
 * PRINCIPLES:
 * - Only allowlisted actions are valid
 * - All actions are logged to ledger
 * - Actions are deterministic and reversible (for future undo)
 */

import { Action } from "./types";

// Allowlist of valid action types
const ALLOWED_ACTION_TYPES: Action["type"][] = [
  "ONE_TEXT_SET",
  "ONE_TEXT_TRANSLATE",
  "ONE_COLOR_SET",
  "ONE_IMAGE_REPLACE",
  "ONE_SPHERE_CREATE",
  "ONE_VIEW_NAVIGATE",
  "ONE_CARD_CREATE",
  "ONE_CARD_UPDATE",
];

/**
 * Validate actions against allowlist
 * Returns array of invalid actions (empty if all valid)
 */
export function validateActions(actions: Action[]): Action[] {
  const invalid: Action[] = [];
  
  actions.forEach((action) => {
    if (!ALLOWED_ACTION_TYPES.includes(action.type)) {
      invalid.push(action);
    }
    
    // Type-specific validation
    switch (action.type) {
      case "ONE_TEXT_SET":
        if (!action.nodeId || typeof action.text !== "string") {
          invalid.push(action);
        }
        break;
        
      case "ONE_TEXT_TRANSLATE":
        if (!action.nodeId || typeof action.lang !== "string") {
          invalid.push(action);
        }
        break;
        
      case "ONE_COLOR_SET":
        if (!action.targetId || typeof action.hex !== "string") {
          invalid.push(action);
        }
        break;
        
      case "ONE_IMAGE_REPLACE":
        if (!action.targetId || typeof action.assetKey !== "string") {
          invalid.push(action);
        }
        break;
        
      case "ONE_SPHERE_CREATE":
        if (typeof action.name !== "string" || typeof action.iconKey !== "string") {
          invalid.push(action);
        }
        break;
        
      case "ONE_VIEW_NAVIGATE":
        if (typeof action.sphereId !== "string") {
          invalid.push(action);
        }
        break;
        
      case "ONE_CARD_CREATE":
        if (!action.sphereId || typeof action.title !== "string" || typeof action.summary !== "string") {
          invalid.push(action);
        }
        break;
        
      case "ONE_CARD_UPDATE":
        if (!action.cardId || typeof action.patch !== "object") {
          invalid.push(action);
        }
        break;
    }
  });
  
  return invalid;
}

/**
 * Apply actions to store
 * This is called by the store's applyActions method
 * Validation should happen before calling this
 */
export function applyActions(actions: Action[], store: any) {
  const invalid = validateActions(actions);
  
  if (invalid.length > 0) {
    console.warn("Invalid actions rejected:", invalid);
    return { valid: false, invalid };
  }
  
  // Apply valid actions
  store.applyActions(actions);
  
  return { valid: true, invalid: [] };
}

