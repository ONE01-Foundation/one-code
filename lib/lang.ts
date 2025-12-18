/**
 * Language Detection Utilities
 */

export type UILang = "en" | "he" | "ar" | "es" | "fr";
export type UILangWithAuto = UILang | "auto";

/**
 * Detect language from text (simple heuristic)
 */
export function detectLangFromText(text: string): UILang {
  // Check for Hebrew characters
  const hebrewPattern = /[\u0590-\u05FF]/;
  if (hebrewPattern.test(text)) {
    return "he";
  }
  return "en";
}
