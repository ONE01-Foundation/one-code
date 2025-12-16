/**
 * Nobody Interaction Hook v0.1
 * 
 * Manages prompt state, firstRun flag, and card creation
 */

import { useState, useEffect, useCallback } from "react";
import { createCard } from "@/lib/card-engine";
import { CardScope } from "@/lib/types";

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
  scope: CardScope;
  nextAt?: string;
}

interface NobodyResponse {
  say: NobodySay;
  choices: NobodyChoice[];
  card: NobodyCard;
}

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
  const [isLoading, setIsLoading] = useState(false);

  // Load initial state
  useEffect(() => {
    const { showPrompt: shouldShow, promptData: stored } = loadPromptState();
    if (shouldShow && stored) {
      setShowPrompt(true);
      setPromptData(stored);
    } else if (shouldShow) {
      // First run but no stored data - fetch it
      fetchPrompt();
    }
  }, []);

  // Fetch prompt from API
  const fetchPrompt = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/nobody");
      if (!response.ok) throw new Error("Failed to fetch prompt");
      
      const data: NobodyResponse = await response.json();
      setPromptData(data);
      savePromptData(data);
      setShowPrompt(true);
    } catch (error) {
      console.error("Error fetching Nobody prompt:", error);
      // Use fallback
      const fallback: NobodyResponse = {
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
      setPromptData(fallback);
      setShowPrompt(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    if (promptData) {
      setShowPrompt(true);
    } else {
      fetchPrompt();
    }
  }, [promptData, fetchPrompt]);

  return {
    showPrompt,
    promptData,
    isLoading,
    handleChoice,
    openPrompt,
    refreshPrompt: fetchPrompt,
  };
}

