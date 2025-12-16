/**
 * Reset Flow
 * 
 * Handles ?reset=1 URL param and dev menu reset
 */

const VERSIONED_KEYS = [
  "one_nobody_first_run",
  "one_cards",
  "one_mode",
  "one_scope",
  "one_welcome_completed",
  "one_onboarding_complete",
  "one_theme_override",
  "one_step_plan",
  "one_signals",
  "one_nobody_prompt_data",
  "nobody:last",
  "one01:v1:cards",
  "one01:v1:activeCardId",
];

// Clear all versioned localStorage keys
export function clearAppData(): void {
  if (typeof window === "undefined") return;
  
  VERSIONED_KEYS.forEach((key) => {
    localStorage.removeItem(key);
  });
  
  // Clear identity keys (they have user ID suffix)
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("iwe_identity_")) {
      localStorage.removeItem(key);
    }
  });
}

// Check for reset param and handle it
export function handleResetParam(): boolean {
  if (typeof window === "undefined") return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("reset") === "1") {
    clearAppData();
    // Remove query param and reload
    window.history.replaceState({}, "", window.location.pathname);
    window.location.reload();
    return true;
  }
  
  return false;
}

