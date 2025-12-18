/**
 * AI Stub - Deterministic intent parser and action generator
 * 
 * For MVP: Simple pattern matching, no real LLM
 * Later: Replace with actual AI API
 */

import { Action, StagedOutput } from "./types";

/**
 * Parse user input and generate staged output
 */
export function processUserInput(input: string, currentSphereId: string | null = null): StagedOutput {
  const lowerInput = input.toLowerCase();
  
  // Intent detection
  let intent = "unknown";
  const plan: string[] = [];
  const actions: Action[] = [];
  
  // Pattern: "create project X" or "מצגת X"
  if (lowerInput.includes("project") || lowerInput.includes("מצגת") || lowerInput.includes("פרויקט")) {
    intent = "create_sphere";
    
    // Extract project name
    const nameMatch = input.match(/(?:project|מצגת|פרויקט)\s+(.+)/i);
    const projectName = nameMatch ? nameMatch[1].trim() : "New Project";
    
    plan.push(`Create sphere: ${projectName}`);
    plan.push("Add initial card");
    plan.push("Navigate to new sphere");
    
    const sphereId = `sphere_${Date.now()}`;
    actions.push({
      type: "ONE_SPHERE_CREATE",
      parentId: currentSphereId,
      name: projectName,
      iconKey: "project",
    });
    
    actions.push({
      type: "ONE_CARD_CREATE",
      sphereId: sphereId,
      title: `${projectName} - Start`,
      summary: "Initial card for this project",
      metrics: { key: "progress", value: 0, trend: "stable" },
    });
    
    actions.push({
      type: "ONE_VIEW_NAVIGATE",
      sphereId: sphereId,
    });
  }
  
  // Pattern: "add card" or "כרטיס"
  else if (lowerInput.includes("card") || lowerInput.includes("כרטיס")) {
    intent = "create_card";
    
    const cardTitleMatch = input.match(/(?:card|כרטיס)\s+(.+)/i);
    const cardTitle = cardTitleMatch ? cardTitleMatch[1].trim() : "New Card";
    
    plan.push(`Create card: ${cardTitle}`);
    
    if (currentSphereId) {
      actions.push({
        type: "ONE_CARD_CREATE",
        sphereId: currentSphereId,
        title: cardTitle,
        summary: "New card created",
      });
    }
  }
  
  // Pattern: "go to X" or "לך ל-X"
  else if (lowerInput.includes("go to") || lowerInput.includes("לך ל")) {
    intent = "navigate";
    
    const targetMatch = input.match(/(?:go to|לך ל)\s+(.+)/i);
    const targetName = targetMatch ? targetMatch[1].trim() : "";
    
    plan.push(`Navigate to: ${targetName}`);
    // Note: Would need to find sphere by name - simplified for MVP
  }
  
  // Default: create a simple card
  else {
    intent = "create_note";
    
    plan.push("Create note card");
    
    if (currentSphereId) {
      actions.push({
        type: "ONE_CARD_CREATE",
        sphereId: currentSphereId,
        title: input.substring(0, 30),
        summary: input,
      });
    }
  }
  
  // Generate ask if needed
  let ask: string | undefined;
  if (actions.length === 0) {
    ask = "What would you like to do?";
  }
  
  return {
    intent,
    plan,
    actions,
    ask,
  };
}

