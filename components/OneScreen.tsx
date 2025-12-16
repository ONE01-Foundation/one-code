/**
 * ONE01 Screen - Core Action Loop
 * 
 * LOOP: Observe → Reduce → Offer → Act → Reflect
 * 
 * PRINCIPLES:
 * - One screen only
 * - One sentence at a time
 * - One choice at a time
 * - One action at a time
 * - Nobody is a system mediator, not a character
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardStatus, State, Mode } from "@/lib/types";

// Loop states
type LoopState = "observe" | "reduce" | "offer" | "act" | "reflect";

// Reflection messages (calm, neutral, one thought)
const REFLECTION_MESSAGES = [
  "Small actions create stability.",
  "Progress happens in steps.",
  "One thing at a time.",
  "Clarity comes from action.",
];

// Reduction options (exactly two)
const REDUCTION_OPTIONS = [
  { id: "health", label: "Health" },
  { id: "work", label: "Work" },
];

// State management functions
function loadState(): State {
  if (typeof window === "undefined") {
    return {
      mode: "private",
      sharedContext: {
        systemTime: new Date().toISOString(),
      },
      privateContext: {
        openThread: null,
        lastSuggestedAction: null,
        pendingQuestion: null,
      },
      updatedAt: new Date().toISOString(),
    };
  }
  const stored = localStorage.getItem("one_state");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.mode) {
        return {
          mode: "private",
          sharedContext: {
            systemTime: new Date().toISOString(),
          },
          privateContext: {
            openThread: parsed.openThread || null,
            lastSuggestedAction: parsed.lastSuggestedAction || null,
            pendingQuestion: parsed.pendingQuestion || null,
          },
          updatedAt: parsed.updatedAt || new Date().toISOString(),
        };
      }
      return parsed;
    } catch {
      // Invalid state, return default
    }
  }
  return {
    mode: "private",
    sharedContext: {
      systemTime: new Date().toISOString(),
    },
    privateContext: {
      openThread: null,
      lastSuggestedAction: null,
      pendingQuestion: null,
    },
    updatedAt: new Date().toISOString(),
  };
}

function saveState(state: State) {
  if (typeof window === "undefined") return;
  state.updatedAt = new Date().toISOString();
  state.sharedContext.systemTime = new Date().toISOString();
  localStorage.setItem("one_state", JSON.stringify(state));
}

export default function OneScreen() {
  const [loopState, setLoopState] = useState<LoopState>("observe");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [currentCard, setCurrentCard] = useState<Card | null>(null);
  const [memoryState, setMemoryState] = useState<State>(loadState());
  const [reflectionMessage, setReflectionMessage] = useState<string>("");

  const isPrivate = memoryState.mode === "private";
  const isGlobal = memoryState.mode === "global";

  // Load state on mount
  useEffect(() => {
    const sessionId = localStorage.getItem("one_session_id");
    if (!sessionId) {
      localStorage.setItem("one_session_id", `session_${Date.now()}`);
    }
    setMemoryState(loadState());
  }, []);

  // Handle mode switch (user-initiated only)
  const handleModeSwitch = (newMode: Mode) => {
    if (newMode === memoryState.mode) return;
    const updatedState = { ...memoryState };
    updatedState.mode = newMode;
    updatedState.sharedContext.systemTime = new Date().toISOString();
    saveState(updatedState);
    setMemoryState(updatedState);
    // Reset to observe when switching modes
    setLoopState("observe");
    setSelectedOption(null);
    setCurrentCard(null);
  };

  // OBSERVE → REDUCE: Continue button
  const handleContinue = () => {
    if (isGlobal) return; // Global mode is view-only
    setLoopState("reduce");
  };

  // REDUCE → OFFER: Select option
  const handleOptionSelect = async (optionId: string) => {
    if (isGlobal) return;
    setSelectedOption(optionId);
    setLoopState("offer");

    // Generate card using AI distillation
    try {
      const response = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: REDUCTION_OPTIONS.find((o) => o.id === optionId)?.label || optionId,
          state: isPrivate && memoryState.privateContext.openThread
            ? memoryState
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Distillation failed");
      }

      const result = await response.json();

      // Create card
      const card: Card = {
        id: `card_${Date.now()}`,
        title: result.title || result.intent || "Next step",
        action: result.action || result.action_text || `Complete: ${optionId}`,
        status: "ready",
        scope: "private",
        time: result.time,
        category: result.category as any,
        createdAt: new Date().toISOString(),
      };

      // Save card
      const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
      cards.push(card);
      localStorage.setItem("one_cards", JSON.stringify(cards));

      setCurrentCard(card);
    } catch (error) {
      console.error("Error generating card:", error);
      // Fallback card
      const card: Card = {
        id: `card_${Date.now()}`,
        title: "Next step",
        action: `Work on ${optionId}`,
        status: "ready",
        scope: "private",
        time: 5,
        createdAt: new Date().toISOString(),
      };
      const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
      cards.push(card);
      localStorage.setItem("one_cards", JSON.stringify(cards));
      setCurrentCard(card);
    }
  };

  // ACT: Do it
  const handleDoIt = () => {
    if (!currentCard) return;

    // Update card status to "in_progress"
    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    const updated = cards.map((c: Card) =>
      c.id === currentCard.id ? { ...c, status: "in_progress" as CardStatus } : c
    );
    localStorage.setItem("one_cards", JSON.stringify(updated));

    // Move to reflect state
    setCurrentCard({ ...currentCard, status: "in_progress" });
    setLoopState("reflect");
    setReflectionMessage(
      REFLECTION_MESSAGES[Math.floor(Math.random() * REFLECTION_MESSAGES.length)]
    );
  };

  // ACT: Not now
  const handleNotNow = () => {
    if (!currentCard) return;

    // Mark card as done (skipped)
    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    const updated = cards.map((c: Card) =>
      c.id === currentCard.id ? { ...c, status: "done" as CardStatus } : c
    );
    localStorage.setItem("one_cards", JSON.stringify(updated));

    // Return to observe
    setCurrentCard(null);
    setSelectedOption(null);
    setLoopState("observe");
  };

  // REFLECT: Next step
  const handleNextStep = () => {
    if (!currentCard) return;

    // Mark card as done
    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    const updated = cards.map((c: Card) =>
      c.id === currentCard.id ? { ...c, status: "done" as CardStatus } : c
    );
    localStorage.setItem("one_cards", JSON.stringify(updated));

    // Return to observe
    setCurrentCard(null);
    setSelectedOption(null);
    setLoopState("observe");
  };

  // Get global data (aggregated, anonymous)
  const getGlobalData = () => {
    const allCards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    const totalCards = allCards.length;
    const cardsByStatus = {
      ready: allCards.filter((c: Card) => c.status === "ready").length,
      in_progress: allCards.filter((c: Card) => c.status === "in_progress").length,
      done: allCards.filter((c: Card) => c.status === "done").length,
    };
    return { totalCards, cardsByStatus };
  };

  const globalData = isGlobal ? getGlobalData() : null;

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Top: Mode Toggle */}
      <div className="flex items-center justify-center pt-4 pb-2">
        <div className="flex gap-1 border border-black rounded-full px-1 py-1">
          <button
            onClick={() => handleModeSwitch("private")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-opacity duration-200 ${
              isPrivate
                ? "bg-black text-white"
                : "text-black hover:opacity-70"
            }`}
          >
            Private
          </button>
          <button
            onClick={() => handleModeSwitch("global")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-opacity duration-200 ${
              isGlobal
                ? "bg-black text-white"
                : "text-black hover:opacity-70"
            }`}
          >
            Global
          </button>
        </div>
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
          {isGlobal ? (
            /* Global Mode: View Only */
            <div className="space-y-4">
              <p className="text-lg text-neutral-600 mb-4">
                {globalData
                  ? `${globalData.totalCards} people completed a small action today`
                  : "Anonymous aggregates"}
              </p>
              {globalData && (
                <div className="space-y-2">
                  <div className="p-4 border border-black rounded-lg">
                    <div className="text-2xl font-bold text-black">
                      {globalData.cardsByStatus.done}
                    </div>
                    <div className="text-xs text-neutral-500 mt-1">
                      Actions completed
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Private Mode: Action Loop */
            <>
              {loopState === "observe" && (
                /* OBSERVE: One sentence, one Continue button */
                <div className="space-y-6">
                  <p className="text-xl sm:text-2xl text-neutral-800 leading-relaxed">
                    What matters for you right now?
                  </p>
                  <button
                    onClick={handleContinue}
                    className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                  >
                    Continue
                  </button>
                </div>
              )}

              {loopState === "reduce" && (
                /* REDUCE: Exactly two options */
                <div className="space-y-6">
                  <p className="text-xl sm:text-2xl text-neutral-800 leading-relaxed">
                    Choose what you want to work on now.
                  </p>
                  <div className="space-y-3">
                    {REDUCTION_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        className="w-full px-6 py-4 bg-white border-2 border-black rounded-lg text-left hover:bg-black hover:text-white transition-colors duration-200"
                      >
                        <div className="font-medium text-lg">{option.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loopState === "offer" && currentCard && (
                /* OFFER: One Card */
                <div className="space-y-6">
                  <div className="p-6 border-2 border-black rounded-lg text-left">
                    <div className="text-sm text-neutral-500 mb-2">Status: {currentCard.status}</div>
                    <div className="text-xl font-bold text-black mb-3">
                      {currentCard.title}
                    </div>
                    <div className="text-lg text-neutral-700 mb-2">
                      {currentCard.action}
                    </div>
                    {currentCard.time && (
                      <div className="text-sm text-neutral-500">
                        {currentCard.time} min
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setLoopState("act")}
                    className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                  >
                    Continue
                  </button>
                </div>
              )}

              {loopState === "act" && currentCard && (
                /* ACT: Do it / Not now */
                <div className="space-y-6">
                  <div className="p-6 border-2 border-black rounded-lg text-left">
                    <div className="text-xl font-bold text-black mb-3">
                      {currentCard.title}
                    </div>
                    <div className="text-lg text-neutral-700">
                      {currentCard.action}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={handleDoIt}
                      className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                    >
                      Do it
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

              {loopState === "reflect" && (
                /* REFLECT: Reflection sentence + Next step */
                <div className="space-y-6">
                  <p className="text-xl sm:text-2xl text-neutral-800 leading-relaxed">
                    {reflectionMessage}
                  </p>
                  <button
                    onClick={handleNextStep}
                    className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                  >
                    Next step
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bottom: Minimal anchor */}
      <div className="flex items-center justify-center pb-6 pt-4">
        <div className="text-xs text-neutral-400">ONE01</div>
      </div>
    </div>
  );
}
