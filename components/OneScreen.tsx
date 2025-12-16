/**
 * ONE01 Screen - Life Loop Engine
 * 
 * PRINCIPLES:
 * - One screen only
 * - One active action at a time
 * - No feeds, no dashboards, no menus
 * - Calm, intentional transitions
 * - Nobody is a system mediator, not a character
 */

"use client";

import { useState, useEffect } from "react";
import { LifeState, LifeAction, LifeContext, LifeFocus, Mode } from "@/lib/types";
import {
  getOrCreateOneID,
  getActiveLifeState,
  getActiveLifeAction,
  createLifeState,
  generateLifeAction,
  updateLifeStateStatus,
  updateLifeActionStatus,
  loadLifeActions,
} from "@/lib/life-engine";

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

// Nobody messages (calm, short, max 12 words)
const NOBODY_MESSAGES = {
  generating: "Finding what makes sense next.",
  noAction: "What matters for you right now?",
  actionReady: "Here's one step forward.",
};

// Load mode from localStorage
function loadMode(): Mode {
  if (typeof window === "undefined") return "private";
  const stored = localStorage.getItem("one_mode");
  return (stored as Mode) || "private";
}

// Save mode to localStorage
function saveMode(mode: Mode) {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_mode", mode);
}

// Welcome flow management
type WelcomeStep = "initial" | "choice" | "completed";

function hasCompletedWelcome(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("one_welcome_completed") === "true";
}

function markWelcomeCompleted() {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_welcome_completed", "true");
}

function getWelcomeChoice(): "want" | "offer" | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("one_welcome_choice");
  return (stored as "want" | "offer") || null;
}

function saveWelcomeChoice(choice: "want" | "offer") {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_welcome_choice", choice);
}

export default function OneScreen() {
  const [mode, setMode] = useState<Mode>(loadMode());
  const [currentLifeState, setCurrentLifeState] = useState<LifeState | null>(null);
  const [currentLifeAction, setCurrentLifeAction] = useState<LifeAction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nobodyMessage, setNobodyMessage] = useState<string>(NOBODY_MESSAGES.noAction);
  const [themeOverride, setThemeOverride] = useState<ThemeOverride>(loadThemeOverride());
  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(getActiveTheme(themeOverride));
  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>(
    hasCompletedWelcome() ? "completed" : "initial"
  );
  const [showWelcome, setShowWelcome] = useState(!hasCompletedWelcome());

  const isPrivate = mode === "private";
  const isGlobal = mode === "global";
  const context: LifeContext = isPrivate ? "private" : "global";

  // Initialize OneID on mount
  useEffect(() => {
    getOrCreateOneID();
    
    // Set initial theme
    const initialTheme = getActiveTheme(themeOverride);
    setActiveTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
  }, []);

  // Generate action for a LifeState
  const generateActionForState = async (state: LifeState) => {
    if (isGlobal) return;
    
    setIsGenerating(true);
    setNobodyMessage(NOBODY_MESSAGES.generating);
    
    try {
      // Get last action for context
      const allActions = loadLifeActions(state.id);
      const lastAction = allActions.length > 0 ? allActions[allActions.length - 1] : null;
      
      // TODO: AI integration - Generate contextual action based on:
      // - Current LifeState focus and status
      // - Last completed or skipped action
      // - Context (private/global)
      const newAction = await generateLifeAction(state, lastAction);
      
      setCurrentLifeAction(newAction);
      setNobodyMessage(NOBODY_MESSAGES.actionReady);
    } catch (error) {
      console.error("Error generating action:", error);
      setNobodyMessage(NOBODY_MESSAGES.noAction);
    } finally {
      setIsGenerating(false);
    }
  };

  // Load active LifeState and LifeAction on mount and when mode changes
  // Skip if welcome flow is active
  useEffect(() => {
    if (showWelcome) return; // Don't load main state during welcome
    
    if (isGlobal) {
      // Global mode: view only, no actions
      setCurrentLifeState(null);
      setCurrentLifeAction(null);
      return;
    }

    // Private mode: find or create active state/action
    const activeState = getActiveLifeState(context);
    
    if (activeState) {
      setCurrentLifeState(activeState);
      const activeAction = getActiveLifeAction(activeState.id);
      if (activeAction) {
        setCurrentLifeAction(activeAction);
        setNobodyMessage(NOBODY_MESSAGES.actionReady);
      } else {
        // State exists but no action - generate one
        generateActionForState(activeState);
      }
    } else {
      // No active state - ask Nobody to generate
      setCurrentLifeState(null);
      setCurrentLifeAction(null);
      setNobodyMessage(NOBODY_MESSAGES.noAction);
    }
  }, [mode, isPrivate, isGlobal, context, showWelcome]);

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

  // Handle mode switch
  const handleModeSwitch = (newMode: Mode) => {
    if (newMode === mode) return;
    setMode(newMode);
    saveMode(newMode);
  };

  // Handle Accept action
  const handleAccept = () => {
    if (!currentLifeAction || !currentLifeState) return;
    
    // Mark action as done
    updateLifeActionStatus(currentLifeAction.id, currentLifeState.id, "done");
    
    // Update state to active if it was suggested
    if (currentLifeState.status === "suggested") {
      updateLifeStateStatus(currentLifeState.id, context, "active");
      setCurrentLifeState({ ...currentLifeState, status: "active" });
    }
    
    // Clear current action and find next
    setCurrentLifeAction(null);
    
    // Find next pending action or generate new one
    const allActions = loadLifeActions(currentLifeState.id);
    const nextPending = allActions.find((a) => a.status === "pending");
    
    if (nextPending) {
      setCurrentLifeAction(nextPending);
      setNobodyMessage(NOBODY_MESSAGES.actionReady);
    } else {
      // Generate new action
      generateActionForState(currentLifeState);
    }
  };

  // Handle Skip action
  const handleSkip = () => {
    if (!currentLifeAction || !currentLifeState) return;
    
    // Mark action as skipped
    updateLifeActionStatus(currentLifeAction.id, currentLifeState.id, "skipped");
    
    // Clear current action and find next
    setCurrentLifeAction(null);
    
    // Find next pending action or generate new one
    const allActions = loadLifeActions(currentLifeState.id);
    const nextPending = allActions.find((a) => a.status === "pending");
    
    if (nextPending) {
      setCurrentLifeAction(nextPending);
      setNobodyMessage(NOBODY_MESSAGES.actionReady);
    } else {
      // Generate new action
      generateActionForState(currentLifeState);
    }
  };

  // Handle Ask for another action
  const handleAskAnother = async () => {
    if (!currentLifeState) {
      // No state - create one with default focus
      // TODO: AI integration - Determine focus based on context
      const newState = createLifeState(context, "other");
      setCurrentLifeState(newState);
      await generateActionForState(newState);
    } else {
      // Generate new action for current state
      await generateActionForState(currentLifeState);
    }
  };

  // Welcome flow handlers
  const handleWelcomeContinue = () => {
    setWelcomeStep("choice");
  };

  const handleWelcomeChoice = (choice: "want" | "offer") => {
    saveWelcomeChoice(choice);
    markWelcomeCompleted();
    
    // Smooth transition to main state
    setTimeout(() => {
      setShowWelcome(false);
      setWelcomeStep("completed");
      
      // Initialize main state after welcome
      if (!isGlobal) {
        const activeState = getActiveLifeState(context);
        if (activeState) {
          setCurrentLifeState(activeState);
          const activeAction = getActiveLifeAction(activeState.id);
          if (activeAction) {
            setCurrentLifeAction(activeAction);
            setNobodyMessage(NOBODY_MESSAGES.actionReady);
          } else {
            generateActionForState(activeState);
          }
        } else {
          setCurrentLifeState(null);
          setCurrentLifeAction(null);
          setNobodyMessage(NOBODY_MESSAGES.noAction);
        }
      }
    }, 300); // Calm transition delay
  };

  // Get global data (aggregated, anonymous)
  const getGlobalData = () => {
    // TODO: Aggregate LifeStates and LifeActions across all users
    // For now, return placeholder
    return {
      totalActions: 0,
      completedActions: 0,
    };
  };

  const globalData = isGlobal ? getGlobalData() : null;

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {/* Top: Theme Toggle (subtle corner) + Mode Toggle - Hidden during welcome */}
      {!showWelcome && (
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
      )}

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
          {showWelcome ? (
            /* Welcome Flow */
            <div className="space-y-8 transition-all duration-500">
              {welcomeStep === "initial" && (
                /* Step 1: Initial Welcome */
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-3xl sm:text-4xl leading-relaxed font-normal" style={{ color: "var(--foreground)" }}>
                      Welcome.
                    </p>
                    <p className="text-xl sm:text-2xl leading-relaxed opacity-80" style={{ color: "var(--foreground)" }}>
                      This is a space to act — not to scroll.
                    </p>
                  </div>
                  <button
                    onClick={handleWelcomeContinue}
                    className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-all duration-300"
                    style={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--background)",
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}

              {welcomeStep === "choice" && (
                /* Step 2: Choice */
                <div className="space-y-8">
                  <p className="text-2xl sm:text-3xl leading-relaxed font-normal" style={{ color: "var(--foreground)" }}>
                    What brings you here right now?
                  </p>
                  <div className="space-y-4">
                    <button
                      onClick={() => handleWelcomeChoice("want")}
                      className="w-full px-6 py-5 rounded-lg font-medium text-lg hover:opacity-90 transition-all duration-300 text-left"
                      style={{
                        backgroundColor: "var(--foreground)",
                        color: "var(--background)",
                      }}
                    >
                      I want something
                    </button>
                    <button
                      onClick={() => handleWelcomeChoice("offer")}
                      className="w-full px-6 py-5 rounded-lg font-medium text-lg hover:opacity-90 transition-all duration-300 text-left"
                      style={{
                        backgroundColor: "var(--foreground)",
                        color: "var(--background)",
                      }}
                    >
                      I can offer something
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : isGlobal ? (
            /* Global Mode: View Only */
            <div className="space-y-4">
              <p className="text-lg mb-4" style={{ color: "var(--neutral-600)" }}>
                {globalData
                  ? `${globalData.completedActions} actions completed today`
                  : "Anonymous aggregates"}
              </p>
            </div>
          ) : (
            /* Private Mode: Life Loop Engine */
            <div className="space-y-6">
              {/* Nobody message (calm, short) */}
              {nobodyMessage && (
                <p className="text-lg sm:text-xl leading-relaxed opacity-70" style={{ color: "var(--foreground)" }}>
                  {nobodyMessage}
                </p>
              )}

              {/* ONE active LifeAction in center */}
              {currentLifeAction ? (
                <div className="space-y-6">
                  <div className="p-6 rounded-lg text-left transition-all duration-500" style={{ border: "2px solid var(--border)" }}>
                    <div className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
                      {currentLifeAction.title}
                    </div>
                    <div className="text-lg sm:text-xl mb-2" style={{ color: "var(--neutral-700)" }}>
                      {currentLifeAction.description}
                    </div>
                    {currentLifeState && (
                      <div className="text-xs mt-4 opacity-50" style={{ color: "var(--neutral-500)" }}>
                        {currentLifeState.focus}
                      </div>
                    )}
                  </div>

                  {/* Action buttons: Accept, Skip, Ask for another */}
                  <div className="space-y-3">
                    <button
                      onClick={handleAccept}
                      disabled={isGenerating}
                      className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                      style={{
                        backgroundColor: "var(--foreground)",
                        color: "var(--background)",
                      }}
                    >
                      Accept
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={handleSkip}
                        disabled={isGenerating}
                        className="flex-1 px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--background)",
                          border: "2px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleAskAnother}
                        disabled={isGenerating}
                        className="flex-1 px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--background)",
                          border: "2px solid var(--border)",
                          color: "var(--foreground)",
                        }}
                      >
                        Another
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* No action - ask Nobody to generate */
                <div className="space-y-6">
                  <button
                    onClick={handleAskAnother}
                    disabled={isGenerating}
                    className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--foreground)",
                      color: "var(--background)",
                    }}
                  >
                    {isGenerating ? "Generating..." : "Find next step"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Minimal anchor - Hidden during welcome */}
      {!showWelcome && (
        <div className="flex items-center justify-center pb-6 pt-4">
          <div className="text-xs" style={{ color: "var(--neutral-400)" }}>ONE01</div>
        </div>
      )}
    </div>
  );
}
