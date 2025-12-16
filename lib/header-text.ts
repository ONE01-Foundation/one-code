/**
 * Dynamic Header Text
 * 
 * Single line header based on time phase + home state + language
 */

import { UILang } from "./lang";
import { HomeState } from "./home-state";
import { Scope } from "./types";

type TimePhase = "dawn" | "day" | "sunset" | "night";

interface GetHeaderTextParams {
  phase: TimePhase;
  homeState: HomeState;
  scope: Scope;
  uiLang: UILang;
}

export function getHeaderText({
  phase,
  homeState,
  scope,
  uiLang,
}: GetHeaderTextParams): string {
  // State-based overrides (highest priority)
  if (homeState === "loading") {
    return uiLang === "he" ? "חושב…" : "Thinking…";
  }
  if (homeState === "empty") {
    return uiLang === "he" ? "בחר את הצעד הבא." : "Pick your next step.";
  }
  if (homeState === "suggestion") {
    return uiLang === "he" ? "הנה אפשרות נקייה." : "Here's a clean option.";
  }
  if (homeState === "active") {
    return uiLang === "he" ? "הישאר עם זה." : "Stay with this.";
  }
  if (homeState === "completed") {
    return uiLang === "he" ? "זה נעשה." : "That's done.";
  }

  // Phase-based defaults
  const phrases: Record<TimePhase, { en: string; he: string }> = {
    dawn: {
      en: "Start gently.",
      he: "התחל בעדינות.",
    },
    day: {
      en: "One clear move.",
      he: "מהלך אחד ברור.",
    },
    sunset: {
      en: "Close one loop.",
      he: "סגור לולאה אחת.",
    },
    night: {
      en: "Slow down. One step.",
      he: "האט. צעד אחד.",
    },
  };

  const phasePhrases = phrases[phase];
  return uiLang === "he" ? phasePhrases.he : phasePhrases.en;
}

