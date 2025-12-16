/**
 * ONE01 Screen - Core Loop Implementation
 * 
 * FLOW:
 * 1. Entry State: Nobody presence + "What do you need right now?"
 * 2. Input: 2 options OR type (max 120 chars)
 * 3. AI Distillation: intent → category → ONE action
 * 4. Card Creation: create card with action_text
 * 5. Action Presentation: "Do you want to do this now?" (Do / Not now)
 * 6. Resolution: mark done/skipped, return to entry
 * 
 * PRINCIPLES:
 * - One screen only (state-based)
 * - Max 2 choices at any moment
 * - Short text only (1-2 lines)
 * - No explanations, only actions
 * - User always has control
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardState, State, ClosureType } from "@/lib/types";

type AppState = "entry" | "processing" | "action" | "closure";

interface DistillationResult {
  intent: string;
  category: string;
  action_text: string;
  needs_clarification?: boolean;
  clarification_question?: string;
  isDesireOrRequest?: boolean;
  shouldSetPendingQuestion?: boolean;
}

// Generate 2 suggested options based on context
function getSuggestedOptions(): { id: string; label: string }[] {
  // Simple suggestions - will be dynamic later
  return [
    { id: "suggest-1", label: "I need to focus" },
    { id: "suggest-2", label: "I need to decide" },
  ];
}

// State management functions
function loadState(): State {
  if (typeof window === "undefined") {
    // SSR: return default state
    return {
      openThread: null,
      lastSuggestedAction: null,
      pendingQuestion: null,
      updatedAt: new Date().toISOString(),
    };
  }
  const stored = localStorage.getItem("one_state");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Invalid state, return default
    }
  }
  return {
    openThread: null,
    lastSuggestedAction: null,
    pendingQuestion: null,
    updatedAt: new Date().toISOString(),
  };
}

function saveState(state: State) {
  if (typeof window === "undefined") return; // SSR: skip
  state.updatedAt = new Date().toISOString();
  localStorage.setItem("one_state", JSON.stringify(state));
}

function clearState() {
  if (typeof window === "undefined") return; // SSR: skip
  localStorage.removeItem("one_state");
}

export default function OneScreen() {
  const [state, setState] = useState<AppState>("entry");
  const [userInput, setUserInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [distillationResult, setDistillationResult] = useState<DistillationResult | null>(null);
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null);
  const [memoryState, setMemoryState] = useState<State>(loadState());
  const [closureType, setClosureType] = useState<ClosureType | null>(null);
  const [closureMessage, setClosureMessage] = useState<string | null>(null);

  // Load session and state from localStorage
  useEffect(() => {
    const sessionId = localStorage.getItem("one_session_id");
    if (!sessionId) {
      localStorage.setItem("one_session_id", `session_${Date.now()}`);
    }
    // Load state on mount
    setMemoryState(loadState());
  }, []);

  // Closure: DONE
  const applyDoneClosure = () => {
    const newState: State = {
      openThread: null,
      lastSuggestedAction: null,
      pendingQuestion: null,
      updatedAt: new Date().toISOString(),
    };
    saveState(newState);
    setMemoryState(newState);
    setClosureType("DONE");
    setClosureMessage("Action completed.");
  };

  // Closure: PAUSED
  const applyPausedClosure = () => {
    const newState = { ...memoryState };
    newState.pendingQuestion = null;
    // Keep lastSuggestedAction (don't clear it)
    saveState(newState);
    setMemoryState(newState);
    setClosureType("PAUSED");
    setClosureMessage("Action paused.");
  };

  // Closure: REDIRECTED
  const applyRedirectedClosure = (newThread: string) => {
    const newState: State = {
      openThread: newThread,
      lastSuggestedAction: null,
      pendingQuestion: null,
      updatedAt: new Date().toISOString(),
    };
    saveState(newState);
    setMemoryState(newState);
    setClosureType("REDIRECTED");
    setClosureMessage("Topic changed.");
  };

  // Handle option selection
  const handleOptionSelect = async (optionLabel: string) => {
    await processInput(optionLabel);
  };

  // Handle text input submission
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userInput.trim().length > 0 && userInput.trim().length <= 120) {
      await processInput(userInput.trim());
    }
  };

  // Process input through AI distillation
  const processInput = async (input: string) => {
    setState("processing");
    setShowTextInput(false);
    setUserInput("");

    // Check if user is switching topic (ignore pending question)
    const isSwitchingTopic = memoryState.pendingQuestion && 
      !input.toLowerCase().includes(memoryState.pendingQuestion.toLowerCase().split(' ')[0]);

    // Update state: clear pendingQuestion if answered or switching topic
    const currentState = { ...memoryState };
    if (memoryState.pendingQuestion) {
      if (isSwitchingTopic) {
        // User switched topic, clear thread
        currentState.pendingQuestion = null;
        currentState.openThread = null;
      } else {
        // User answered, clear pending question
        currentState.pendingQuestion = null;
      }
    }

    try {
      const response = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input,
          state: currentState.openThread || currentState.pendingQuestion ? currentState : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Distillation failed");
      }

      const result: DistillationResult = await response.json();

      // Update state based on result
      const newState = { ...currentState };

      // If clarification needed, set pendingQuestion
      if (result.needs_clarification && result.clarification_question) {
        newState.pendingQuestion = result.clarification_question;
        saveState(newState);
        setMemoryState(newState);
        setClarificationQuestion(result.clarification_question);
        setState("entry");
        return;
      }

      // Check for REDIRECTED closure before updating state
      const hadOpenThread = newState.openThread !== null;
      let shouldShowRedirected = false;

      // If desire/request, set openThread (unless switching topic)
      if (result.isDesireOrRequest && !isSwitchingTopic) {
        // Check if thread changed
        if (hadOpenThread && newState.openThread !== result.intent) {
          shouldShowRedirected = true;
        }
        newState.openThread = result.intent;
      } else if (isSwitchingTopic) {
        // Topic changed
        if (result.isDesireOrRequest && hadOpenThread) {
          // New topic with desire/request - REDIRECTED
          shouldShowRedirected = true;
          newState.openThread = result.intent;
        } else {
          newState.openThread = null;
        }
      }

      // Clear lastSuggestedAction (user responded)
      newState.lastSuggestedAction = null;

      saveState(newState);
      setMemoryState(newState);

      // Create card
      const card: Card = {
        id: `card_${Date.now()}`,
        intent: result.intent,
        action_text: result.action_text,
        state: "pending",
        category: result.category as any,
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save card to localStorage
      const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
      cards.push(card);
      localStorage.setItem("one_cards", JSON.stringify(cards));

      setCurrentCard(card);
      setDistillationResult(result);
      
      // If REDIRECTED closure should be shown, display it briefly before action
      if (shouldShowRedirected) {
        setClosureType("REDIRECTED");
        setClosureMessage("Topic changed.");
        setState("closure");
        setTimeout(() => {
          setClosureType(null);
          setClosureMessage(null);
          setState("action");
        }, 1500);
      } else {
        setState("action");
      }
    } catch (error) {
      console.error("Error processing input:", error);
      // Fallback: create simple card
      const card: Card = {
        id: `card_${Date.now()}`,
        intent: input,
        action_text: `Complete: ${input}`,
        state: "pending",
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
      cards.push(card);
      localStorage.setItem("one_cards", JSON.stringify(cards));
      setCurrentCard(card);
      setState("action");
    }
  };

  // Handle action resolution
  const handleDo = () => {
    if (!currentCard) return;

    // Update card state to "done"
    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    const updated = cards.map((c: Card) =>
      c.id === currentCard.id ? { ...c, state: "done" as CardState } : c
    );
    localStorage.setItem("one_cards", JSON.stringify(updated));

    // Apply DONE closure
    applyDoneClosure();

    // Show closure, then return to entry
    setCurrentCard(null);
    setDistillationResult(null);
    setState("closure");
    
    // Auto-return to entry after showing closure
    setTimeout(() => {
      setClosureType(null);
      setClosureMessage(null);
      setState("entry");
    }, 1500);
  };

  const handleNotNow = () => {
    if (!currentCard) return;

    // Update card state to "skipped"
    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    const updated = cards.map((c: Card) =>
      c.id === currentCard.id ? { ...c, state: "skipped" as CardState } : c
    );
    localStorage.setItem("one_cards", JSON.stringify(updated));

    // Apply PAUSED closure
    applyPausedClosure();

    // Show closure, then return to entry
    setCurrentCard(null);
    setDistillationResult(null);
    setState("closure");
    
    // Auto-return to entry after showing closure
    setTimeout(() => {
      setClosureType(null);
      setClosureMessage(null);
      setState("entry");
    }, 1500);
  };

  // Handle clearing pending question (user ignores it)
  const handleClearPendingQuestion = () => {
    const newState = { ...memoryState };
    newState.pendingQuestion = null;
    saveState(newState);
    setMemoryState(newState);
    setClarificationQuestion(null);
  };

  const suggestedOptions = getSuggestedOptions();

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Top: Context Line */}
      <div className="flex items-center justify-center pt-8 pb-6 px-6">
        <h1 className="text-4xl sm:text-5xl font-normal text-black text-center">
          {state === "entry"
            ? "What do you need right now?"
            : state === "processing"
            ? "Processing..."
            : state === "action"
            ? "Do you want to do this now?"
            : state === "closure"
            ? ""
            : "Next step available."}
        </h1>
      </div>

      {/* Center: Focus Zone */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Nobody Presence - Subtle Light Movement */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-neutral-50 blur-3xl"
            style={{
              animation: "subtle-pulse 4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Center Content */}
        <div className="relative z-10 w-full max-w-md text-center">
          {state === "entry" && (
            <div className="space-y-6">
              {/* Clarification question if needed */}
              {clarificationQuestion && (
                <div className="space-y-4">
                  <p className="text-lg text-neutral-700 leading-relaxed">
                    {clarificationQuestion}
                  </p>
                  <button
                    onClick={handleClearPendingQuestion}
                    className="text-sm text-neutral-500 hover:text-black"
                  >
                    Clear
                  </button>
                </div>
              )}

              {/* 2 Suggested Options */}
              {!showTextInput && !clarificationQuestion && (
                <div className="space-y-3">
                  {suggestedOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.label)}
                      className="w-full px-6 py-4 bg-white border-2 border-black rounded-lg text-left hover:bg-black hover:text-white transition-colors duration-200"
                    >
                      <div className="font-medium text-lg">{option.label}</div>
                    </button>
                  ))}
                </div>
              )}

              {/* Text Input (explicitly invoked) */}
              {showTextInput ? (
                <form onSubmit={handleTextSubmit} className="space-y-4">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.length <= 120) {
                        setUserInput(val);
                      }
                    }}
                    placeholder="Type your intent (max 120 chars)..."
                    className="w-full px-4 py-3 border-2 border-black rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-black"
                    autoFocus
                    maxLength={120}
                  />
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={userInput.trim().length === 0}
                      className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowTextInput(false);
                        setUserInput("");
                      }}
                      className="flex-1 px-6 py-3 bg-white border-2 border-black text-black rounded-lg font-medium hover:opacity-90"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="text-xs text-neutral-400">
                    {userInput.length}/120
                  </div>
                </form>
              ) : (
                !clarificationQuestion && (
                  <button
                    onClick={() => setShowTextInput(true)}
                    className="text-sm text-neutral-500 hover:text-black transition-colors"
                  >
                    Or type your intent
                  </button>
                )
              )}
            </div>
          )}

          {state === "processing" && (
            <div className="space-y-4">
              <div className="w-12 h-12 border-4 border-neutral-200 border-t-black rounded-full mx-auto animate-spin" />
              <p className="text-base text-neutral-600">
                Distilling your intent...
              </p>
            </div>
          )}

          {state === "action" && currentCard && (
            <div className="space-y-6">
              {/* Action text (1-2 lines) */}
              <p className="text-xl sm:text-2xl text-neutral-800 leading-relaxed font-medium">
                {currentCard.action_text}
              </p>

              {/* 2 Choices: Do / Not now */}
              <div className="space-y-3">
                <button
                  onClick={handleDo}
                  className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                >
                  Do
                </button>
                <button
                  onClick={handleNotNow}
                  className="w-full px-6 py-4 bg-white border-2 border-black text-black rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {state === "closure" && closureMessage && (
            <div className="space-y-4">
              <p className="text-lg text-neutral-700 leading-relaxed">
                {closureMessage}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Minimal anchor (optional, can be removed) */}
      <div className="flex items-center justify-center pb-6 pt-4">
        <div className="text-xs text-neutral-400">
          ONE01
        </div>
      </div>
    </div>
  );
}
