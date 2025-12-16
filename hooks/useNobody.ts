/**
 * Nobody Interaction Hook v0.1 - "Feels Live" Loading
 * 
 * States: idle | loading | ready | timeout
 * - Shows cached response instantly
 * - Background fetch with staged reveal
 * - Timeout fallback with retry
 */

import { useState, useEffect, useCallback } from "react";
import { createCard } from "@/lib/card-engine";
import { CardScope } from "@/lib/types";
import {
  NobodyResponse,
  getCachedResponse,
  fetchNobodyPrompt,
  getFallbackResponse,
  cacheResponse,
} from "@/lib/nobody";

type PromptState = "idle" | "loading" | "ready" | "timeout";

// Check if first run
function isFirstRun(): boolean {
  if (typeof window === "undefined") return false;
  const flag = localStorage.getItem("one_nobody_first_run");
  return flag !== "false";
}

// Mark first run as complete
function markFirstRunComplete() {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_nobody_first_run", "false");
}

// Load prompt state
function loadPromptState(): { showPrompt: boolean; promptData: NobodyResponse | null } {
  if (typeof window === "undefined") return { showPrompt: false, promptData: null };
  
  const stored = localStorage.getItem("one_nobody_prompt_data");
  const promptData = stored ? JSON.parse(stored) : null;
  const showPrompt = isFirstRun() || false;
  
  return { showPrompt, promptData };
}

// Save prompt state
function savePromptData(data: NobodyResponse | null) {
  if (typeof window === "undefined") return;
  if (data) {
    localStorage.setItem("one_nobody_prompt_data", JSON.stringify(data));
  } else {
    localStorage.removeItem("one_nobody_prompt_data");
  }
}

export function useNobody() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [promptData, setPromptData] = useState<NobodyResponse | null>(null);
  const [promptState, setPromptState] = useState<PromptState>("idle");
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Load initial state
  useEffect(() => {
    const { showPrompt: shouldShow } = loadPromptState();
    if (shouldShow) {
      openPrompt();
    }
  }, []);

  // Fetch prompt from API with timeout
  const fetchPrompt = useCallback(async (useCache: boolean = true) => {
    // Show cached response instantly if available
    if (useCache) {
      const cached = getCachedResponse();
      if (cached) {
        setPromptData(cached);
        setPromptState("ready");
        setShowPrompt(true);
      } else {
        setPromptState("loading");
        setShowPrompt(true);
      }
    } else {
      setPromptState("loading");
    }
    
    // Set timeout
    const timeout = setTimeout(() => {
      setPromptState((prev) => {
        if (prev === "loading") {
          return "timeout";
        }
        return prev;
      });
    }, 2500);
    setTimeoutId(timeout);
    
    try {
      const data = await fetchNobodyPrompt(2500);
      
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(timeout);
      
      setPromptData(data);
      setPromptState("ready");
      savePromptData(data);
    } catch (error) {
      // Clear timeout
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(timeout);
      
      if (error instanceof Error && error.message === "TIMEOUT") {
        setPromptState("timeout");
      } else {
        console.error("Error fetching Nobody prompt:", error);
        // Use fallback
        const fallback = getFallbackResponse();
        setPromptData(fallback);
        setPromptState("ready");
        cacheResponse(fallback);
      }
    }
  }, [promptState, timeoutId]);

  // Handle choice selection
  const handleChoice = useCallback((choiceId: string) => {
    if (!promptData) return;
    
    // Create card from prompt data
    const { card } = promptData;
    const newCard = createCard(
      card.title,
      card.intent,
      card.scope,
      "nobody"
    );
    
    // If no active card exists, promote this one to active
    // (This will be handled by useCards hook's auto-promotion)
    
    // Close prompt and mark first run complete
    setShowPrompt(false);
    markFirstRunComplete();
    savePromptData(null);
  }, [promptData]);

  // Open prompt manually (for "Ask Nobody" button)
  const openPrompt = useCallback(() => {
    fetchPrompt(true); // Use cache if available
  }, [fetchPrompt]);

  // Retry fetch (from timeout UI)
  const retryPrompt = useCallback(() => {
    fetchPrompt(false); // Don't use cache, force fresh fetch
  }, [fetchPrompt]);

  // Use last cached response (from timeout UI)
  const useLastPrompt = useCallback(() => {
    const cached = getCachedResponse();
    if (cached) {
      setPromptData(cached);
      setPromptState("ready");
    } else {
      // No cache - use fallback
      const fallback = getFallbackResponse();
      setPromptData(fallback);
      setPromptState("ready");
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);

  return {
    showPrompt,
    promptData,
    promptState,
    handleChoice,
    openPrompt,
    refreshPrompt: () => fetchPrompt(false),
    retryPrompt,
    useLastPrompt,
  };
}

