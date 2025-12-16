/**
 * Nobody Header Copy System
 * 
 * Localized, deterministic header text
 * No AI, no fluff, calm and direct
 */

export type Lang = "he" | "en";

/**
 * Detect language from text input
 * If input contains Hebrew characters => "he", else "en"
 */
export function detectLangFromText(input?: string): Lang {
  if (!input) {
    // Load from localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("one_lang");
      if (stored === "he" || stored === "en") {
        return stored;
      }
    }
    return "en"; // Default fallback
  }

  // Check for Hebrew characters (Unicode range: \u0590-\u05FF)
  const hebrewPattern = /[\u0590-\u05FF]/;
  const detected = hebrewPattern.test(input) ? "he" : "en";

  // Persist to localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem("one_lang", detected);
  }

  return detected;
}

export type SkyMood = "night" | "dawn" | "day" | "dusk";
export type HomeState = "loading" | "empty" | "suggestion" | "active" | "completed";
export type Scope = "private" | "global";

export interface HomeHeaderContext {
  lang: Lang;
  mood: SkyMood;
  state: HomeState;
  scope: Scope;
}

export interface HeaderText {
  title: string;
  subtitle: string;
}

/**
 * Get Nobody header text based on context
 */
export function getNobodyHeader(ctx: HomeHeaderContext): HeaderText {
  const { lang, mood, state, scope } = ctx;

  // Loading state
  if (state === "loading") {
    return {
      title: lang === "he" ? "חושב…" : "Thinking…",
      subtitle: lang === "he" ? "" : "",
    };
  }

  // Completed state
  if (state === "completed") {
    return {
      title: lang === "he" ? "סגור." : "Closed.",
      subtitle: lang === "he" ? "" : "",
    };
  }

  // Empty state
  if (state === "empty") {
    if (scope === "global") {
      return {
        title: lang === "he" ? "מה קורה בעולם?" : "What's happening?",
        subtitle: lang === "he" ? "תצוגה בלבד." : "View only.",
      };
    }
    // Private empty
    return {
      title: lang === "he" ? "מה הדבר הבא?" : "What's next?",
      subtitle: lang === "he" ? "בחר תחום כדי להתחיל." : "Pick a domain to start.",
    };
  }

  // Suggestion state
  if (state === "suggestion") {
    return {
      title: lang === "he" ? "צעד אחד קדימה." : "One step forward.",
      subtitle: lang === "he" ? "רק 10 דקות." : "Just 10 minutes.",
    };
  }

  // Active state
  if (state === "active") {
    // Subtle mood variation (optional, very subtle)
    const moodGreeting = mood === "dawn" 
      ? (lang === "he" ? "בוקר טוב. " : "Good morning. ")
      : mood === "dusk"
      ? (lang === "he" ? "ערב טוב. " : "Good evening. ")
      : "";

    return {
      title: moodGreeting + (lang === "he" ? "פוקוס." : "Focus."),
      subtitle: lang === "he" ? "סיים או דחה." : "Finish or defer.",
    };
  }

  // Fallback (should not reach here)
  return {
    title: lang === "he" ? "מה הדבר הבא?" : "What's next?",
    subtitle: lang === "he" ? "" : "",
  };
}

