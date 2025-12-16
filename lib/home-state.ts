/**
 * Home State Machine
 * 
 * Strict state machine: Only ONE state renders at a time
 * - loading: Initial fetch, shows nothing else
 * - empty: No active card + CTA "Find next step"
 * - suggestion: System suggests next step
 * - active: User is doing a step
 * - completed: Step done → short confirmation
 */

export type HomeState = "loading" | "empty" | "suggestion" | "active" | "completed";

export interface HomeStateContext {
  hasActiveCard: boolean;
  hasSuggestion: boolean;
  hasPrompt: boolean;
  isLoading: boolean;
  isCompleted: boolean;
}

export function determineHomeState(context: HomeStateContext): HomeState {
  // Loading wraps initial fetch
  if (context.isLoading) {
    return "loading";
  }
  
  // Completed state (after action done, before reset)
  if (context.isCompleted) {
    return "completed";
  }
  
  // Active card takes priority
  if (context.hasActiveCard) {
    return "active";
  }
  
  // Suggestion (Action Loop or Nobody prompt)
  if (context.hasSuggestion || context.hasPrompt) {
    return "suggestion";
  }
  
  // Default: empty
  return "empty";
}

