/**
 * Style Memory v0.1
 * 
 * Stores only "style memory", not personal data:
 * - preferred UI language
 * - response length preference (short/standard)
 * - step difficulty preference (easier/standard)
 * - last active scope (private/global)
 * - last used input mode (ask vs choose domain)
 * 
 * NO EMAIL. NO PASSWORD. NO PROFILE.
 * Local-only. Versioned keys. Reset-safe.
 */

export type StyleMemory = {
  uiLang?: "en" | "he" | "ar" | "es" | "fr";
  answerStyle?: "short" | "standard";
  stepDifficulty?: "easier" | "standard";
  lastScope?: "private" | "global";
  lastEntry?: "ask" | "domain";
  updatedAt?: number;
};

const KEY = "one_style_v1";

/**
 * Load style memory from localStorage
 */
export function loadStyle(): StyleMemory {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(KEY);
    if (!stored) return {};
    return JSON.parse(stored);
  } catch {
    return {};
  }
}

/**
 * Save style memory (partial update)
 */
export function saveStyle(patch: Partial<StyleMemory>) {
  if (typeof window === "undefined") return;
  const prev = loadStyle();
  const next = { ...prev, ...patch, updatedAt: Date.now() };
  localStorage.setItem(KEY, JSON.stringify(next));
}

/**
 * Clear style memory
 */
export function clearStyle() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY);
}
