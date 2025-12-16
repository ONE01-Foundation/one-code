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

// Theme types
type ThemeOverride = "auto" | "light" | "dark";
type ActiveTheme = "light" | "dark";

// Theme detection based on local time
function getTimeBasedTheme(): ActiveTheme {
  const now = new Date();
  const hour = now.getHours();
  // 07:00 to 18:59 -> Light, 19:00 to 06:59 -> Dark
  return hour >= 7 && hour < 19 ? "light" : "dark";
}

// Load theme override from localStorage
function loadThemeOverride(): ThemeOverride {
  if (typeof window === "undefined") return "auto";
  const stored = localStorage.getItem("one_theme_override");
  return (stored as ThemeOverride) || "auto";
}

// Save theme override to localStorage
function saveThemeOverride(override: ThemeOverride) {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_theme_override", override);
}

// Get active theme (override or time-based)
function getActiveTheme(override: ThemeOverride): ActiveTheme {
  if (override === "auto") {
    return getTimeBasedTheme();
  }
  return override;
}

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
  const [themeOverride, setThemeOverride] = useState<ThemeOverride>(loadThemeOverride());
  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(getActiveTheme(themeOverride));

  const isPrivate = memoryState.mode === "private";
  const isGlobal = memoryState.mode === "global";

  // Load state on mount
  useEffect(() => {
    const sessionId = localStorage.getItem("one_session_id");
    if (!sessionId) {
      localStorage.setItem("one_session_id", `session_${Date.now()}`);
    }
    setMemoryState(loadState());
    
    // Set initial theme
    const initialTheme = getActiveTheme(themeOverride);
    setActiveTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  // Update theme when override changes
  useEffect(() => {
    const newTheme = getActiveTheme(themeOverride);
    setActiveTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    saveThemeOverride(themeOverride);
  }, [themeOverride]);

  // Check for time-based theme changes (if override is "auto")
  useEffect(() => {
    if (themeOverride !== "auto") return;

    const checkTheme = () => {
      const newTheme = getTimeBasedTheme();
      if (newTheme !== activeTheme) {
        setActiveTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    };

    // Check immediately
    checkTheme();

    // Check every minute
    const interval = setInterval(checkTheme, 60000);

    return () => clearInterval(interval);
  }, [themeOverride, activeTheme]);

  // Handle theme override toggle
  const handleThemeToggle = () => {
    const nextOverride: ThemeOverride =
      themeOverride === "auto" ? "light" : themeOverride === "light" ? "dark" : "auto";
    setThemeOverride(nextOverride);
  };

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
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {/* Top: Theme Toggle (subtle corner) + Mode Toggle */}
      <div className="flex items-center justify-between pt-4 pb-2 px-4">
        {/* Theme Toggle (minimal, top-left) */}
        <button
          onClick={handleThemeToggle}
          className="w-8 h-8 flex items-center justify-center text-xs opacity-40 hover:opacity-100 transition-opacity rounded-full"
          style={{ color: "var(--foreground)" }}
          title={themeOverride === "auto" ? "Auto (tap to override)" : themeOverride === "light" ? "Light (tap for dark)" : "Dark (tap for auto)"}
        >
          {themeOverride === "auto" ? "○" : activeTheme === "light" ? "●" : "○"}
        </button>

        {/* Mode Toggle (center) */}
        <div className="flex gap-1 rounded-full px-1 py-1" style={{ border: "1px solid var(--border)" }}>
          <button
            onClick={() => handleModeSwitch("private")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-opacity duration-200 ${
              isPrivate
                ? "text-white"
                : "hover:opacity-70"
            }`}
            style={{
              backgroundColor: isPrivate ? "var(--foreground)" : "transparent",
              color: isPrivate ? "var(--background)" : "var(--foreground)",
            }}
          >
            Private
          </button>
          <button
            onClick={() => handleModeSwitch("global")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-opacity duration-200 ${
              isGlobal
                ? "text-white"
                : "hover:opacity-70"
            }`}
            style={{
              backgroundColor: isGlobal ? "var(--foreground)" : "transparent",
              color: isGlobal ? "var(--background)" : "var(--foreground)",
            }}
          >
            Global
          </button>
        </div>

        {/* Spacer for balance */}
        <div className="w-8" />
      </div>

      {/* Center: Focus Zone */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Nobody Presence - Subtle Light Movement */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl"
            style={{
              backgroundColor: "var(--neutral-50)",
              animation: "subtle-pulse 4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Center Content */}
        <div className="relative z-10 w-full max-w-md text-center">
          {isGlobal ? (
            /* Global Mode: View Only */
            <div className="space-y-4">
              <p className="text-lg mb-4" style={{ color: "var(--neutral-600)" }}>
                {globalData
                  ? `${globalData.totalCards} people completed a small action today`
                  : "Anonymous aggregates"}
              </p>
              {globalData && (
                <div className="space-y-2">
                  <div className="p-4 rounded-lg" style={{ border: "1px solid var(--border)" }}>
                    <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                      {globalData.cardsByStatus.done}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--neutral-500)" }}>
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
                  <p className="text-2xl sm:text-3xl leading-relaxed font-normal" style={{ color: "var(--foreground)" }}>
                    What matters for you right now?
                  </p>
                  <button
                    onClick={handleContinue}
                    className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                    style={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--background)",
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}

              {loopState === "reduce" && (
                /* REDUCE: Exactly two options */
                <div className="space-y-6">
                  <p className="text-xl sm:text-2xl leading-relaxed" style={{ color: "var(--foreground)" }}>
                    Choose what you want to work on now.
                  </p>
                  <div className="space-y-3">
                    {REDUCTION_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        className="w-full px-6 py-4 rounded-lg text-left transition-colors duration-200"
                        style={{
                          backgroundColor: "var(--background)",
                          border: "2px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--foreground)";
                          e.currentTarget.style.color = "var(--background)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "var(--background)";
                          e.currentTarget.style.color = "var(--foreground)";
                        }}
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
                  <div className="p-6 rounded-lg text-left" style={{ border: "2px solid var(--border)" }}>
                    <div className="text-sm mb-2" style={{ color: "var(--neutral-500)" }}>Status: {currentCard.status}</div>
                    <div className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
                      {currentCard.title}
                    </div>
                    <div className="text-lg sm:text-xl mb-2" style={{ color: "var(--neutral-700)" }}>
                      {currentCard.action}
                    </div>
                    {currentCard.time && (
                      <div className="text-sm" style={{ color: "var(--neutral-500)" }}>
                        {currentCard.time} min
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setLoopState("act")}
                    className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                    style={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--background)",
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}

              {loopState === "act" && currentCard && (
                /* ACT: Do it / Not now */
                <div className="space-y-6">
                  <div className="p-6 rounded-lg text-left" style={{ border: "2px solid var(--border)" }}>
                    <div className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
                      {currentCard.title}
                    </div>
                    <div className="text-lg sm:text-xl" style={{ color: "var(--neutral-700)" }}>
                      {currentCard.action}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={handleDoIt}
                      className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                      style={{
                        backgroundColor: "var(--foreground)",
                        color: "var(--background)",
                      }}
                    >
                      Do it
                    </button>
                    <button
                      onClick={handleNotNow}
                      className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                      style={{
                        backgroundColor: "var(--background)",
                        border: "2px solid var(--border)",
                        color: "var(--foreground)",
                      }}
                    >
                      Not now
                    </button>
                  </div>
                </div>
              )}

              {loopState === "reflect" && (
                /* REFLECT: Reflection sentence + Next step */
                <div className="space-y-6">
                  <p className="text-xl sm:text-2xl leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {reflectionMessage}
                  </p>
                  <button
                    onClick={handleNextStep}
                    className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                    style={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--background)",
                    }}
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
        <div className="text-xs" style={{ color: "var(--neutral-400)" }}>ONE01</div>
      </div>
    </div>
  );
}
