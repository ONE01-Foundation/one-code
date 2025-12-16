/**
 * Home State Machine
 * 
 * Strict state machine: Only ONE state renders at a time
 * - loading: Initial fetch, shows nothing else
 * - empty: No active card + CTA "Find next step"
 * - suggestion: Show one suggested card + buttons
 * - active: Active card view
 */

export type HomeState = "loading" | "empty" | "suggestion" | "active";

export interface HomeStateContext {
  hasActiveCard: boolean;
  hasSuggestion: boolean;
  hasPrompt: boolean;
  isLoading: boolean;
}

export function determineHomeState(context: HomeStateContext): HomeState {
  // Loading wraps initial fetch
  if (context.isLoading) {
    return "loading";
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

