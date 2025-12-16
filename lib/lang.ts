/**
 * Auto Language v0.1
 * 
 * Language detection from user input text
 * Simple, deterministic heuristics
 */

export type UILang = "en" | "he" | "ar" | "es" | "fr" | "auto";

/**
 * Detect language from user input text
 * Returns detected language or "en" as fallback
 */
export function detectLangFromText(text: string): UILang {
  if (!text || text.trim().length === 0) return "en";

  // Hebrew: Unicode range for Hebrew characters
  if (/[א-ת]/.test(text)) return "he";

  // Arabic: Unicode range for Arabic characters
  if (/[؀-ۿ]/.test(text)) return "ar";

  // Spanish: Common Spanish-specific characters
  if (/[ñ¿¡]/i.test(text)) return "es";

  // French: Common French-specific characters
  if (/[àâçéèêëîïôûùüÿœ]/i.test(text)) return "fr";

  // Default: English
  return "en";
}

