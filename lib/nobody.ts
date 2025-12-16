/**
 * Nobody Helper - AI fetch, validation, and caching
 * 
 * Handles:
 * - Fetching from /api/nobody
 * - Strict JSON validation
 * - Local caching (nobody:last)
 * - Timeout handling
 */

interface NobodySay {
  title: string;
  subtitle: string;
}

interface NobodyChoice {
  id: string;
  label: string;
}

interface NobodyCard {
  title: string;
  intent: string;
  scope: "private" | "global" | "bridge";
  nextAt?: string;
}

export interface NobodyResponse {
  say: NobodySay;
  choices: NobodyChoice[];
  card: NobodyCard;
}

const CACHE_KEY = "nobody:last";
const TIMEOUT_MS = 2500;

// Validate Nobody response structure
function validateResponse(data: any): data is NobodyResponse {
  if (!data || typeof data !== "object") return false;
  
  // Validate say
  if (!data.say || typeof data.say !== "object") return false;
  if (typeof data.say.title !== "string" || !data.say.title.trim()) return false;
  if (typeof data.say.subtitle !== "string") return false;
  
  // Validate choices
  if (!Array.isArray(data.choices) || data.choices.length === 0) return false;
  if (data.choices.length > 2) return false; // Max 2 choices
  for (const choice of data.choices) {
    if (typeof choice.id !== "string" || typeof choice.label !== "string") {
      return false;
    }
  }
  
  // Validate card
  if (!data.card || typeof data.card !== "object") return false;
  if (typeof data.card.title !== "string" || !data.card.title.trim()) return false;
  if (typeof data.card.intent !== "string") return false;
  if (typeof data.card.scope !== "string") return false;
  
  const validIntents = ["health", "money", "work", "relationship", "self", "other"];
  if (!validIntents.includes(data.card.intent)) return false;
  
  return true;
}

// Get cached response
export function getCachedResponse(): NobodyResponse | null {
  if (typeof window === "undefined") return null;
  
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const parsed = JSON.parse(cached);
    if (validateResponse(parsed)) {
      return parsed;
    }
    
    // Invalid cache - remove it
    localStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

// Cache response
export function cacheResponse(response: NobodyResponse): void {
  if (typeof window === "undefined") return;
  
  try {
    if (validateResponse(response)) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(response));
    }
  } catch (error) {
    console.error("Error caching Nobody response:", error);
  }
}

// Fetch from API with timeout
export async function fetchNobodyPrompt(
  timeoutMs: number = TIMEOUT_MS
): Promise<NobodyResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch("/api/nobody", {
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!validateResponse(data)) {
      throw new Error("Invalid response structure");
    }
    
    // Cache valid response
    cacheResponse(data);
    
    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("TIMEOUT");
    }
    
    throw error;
  }
}

// Fallback response
export function getFallbackResponse(): NobodyResponse {
  return {
    say: {
      title: "What matters for you right now?",
      subtitle: "Choose one direction to move forward.",
    },
    choices: [
      { id: "focus", label: "Focus" },
      { id: "explore", label: "Explore" },
    ],
    card: {
      title: "Take one step forward",
      intent: "other",
      scope: "private",
    },
  };
}

