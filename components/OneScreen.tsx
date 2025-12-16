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
import { LifeState, LifeAction, LifeContext, LifeFocus, Mode, Step, Card, Signal } from "@/lib/types";
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
import {
  StepPlan,
  loadStepPlan,
  saveStepPlan,
  clearStepPlan,
  getCurrentStep,
  executeStepAction,
  createOnboardingPlan,
  isOnboardingComplete,
} from "@/lib/step-engine";
import {
  getMostRelevantCard,
  getCardsNeedingAttention,
  updateCardState,
} from "@/lib/card-engine";
import {
  getActiveSignal,
  checkSignalsOnAppOpen,
  dismissSignal,
  completeSignal,
  generateStateBasedSignal,
  activateSignal,
} from "@/lib/signal-engine";
import {
  isOWOComplete,
  markOWOComplete,
  saveOWOChoice,
  saveOWOInput,
  createFirstCardFromInput,
  initializeOWO,
  getOWOChoice,
} from "@/lib/owo-engine";
import {
  initializeIdentity,
  trackActivity,
  canKeepPath,
  keepPath,
  getActivitySummary,
  shouldOfferIdentity,
  getCurrentTier,
} from "@/lib/iwe-engine";

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

// Helper to get welcome choice (for step engine initialization)
function getWelcomeChoice(): "want" | "offer" | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("one_welcome_choice");
  return (stored as "want" | "offer") || null;
}

export default function OneScreen() {
  const [mode, setMode] = useState<Mode>(loadMode());
  const [currentLifeState, setCurrentLifeState] = useState<LifeState | null>(null);
  const [currentLifeAction, setCurrentLifeAction] = useState<LifeAction | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nobodyMessage, setNobodyMessage] = useState<string>(NOBODY_MESSAGES.noAction);
  const [themeOverride, setThemeOverride] = useState<ThemeOverride>(loadThemeOverride());
  const [activeTheme, setActiveTheme] = useState<ActiveTheme>(getActiveTheme(themeOverride));
  
  // Step Engine state
  const [stepPlan, setStepPlan] = useState<StepPlan | null>(null);
  const [currentStep, setCurrentStep] = useState<Step | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  
  // Card System state
  const [contextualCard, setContextualCard] = useState<Card | null>(null);
  const [cardHighlight, setCardHighlight] = useState(false);
  
  // Signal & Timing Engine state
  const [activeSignal, setActiveSignal] = useState<Signal | null>(null);
  const [signalVisible, setSignalVisible] = useState(false);
  
  // Onboarding Without Onboarding (OWO) state
  const [owoState, setOwoState] = useState<"loading" | "presence" | "choice" | "input" | "complete">("loading");
  const [owoInput, setOwoInput] = useState("");
  const [showOwo, setShowOwo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Identity Without Exposure (IWE) state
  const [showStatePanel, setShowStatePanel] = useState(false);
  const [showKeepPath, setShowKeepPath] = useState(false);

  const isPrivate = mode === "private";
  const isGlobal = mode === "global";
  const context: LifeContext = isPrivate ? "private" : "global";

  // Initialize OWO and Step Engine on mount
  useEffect(() => {
    // Set initial theme
    const initialTheme = getActiveTheme(themeOverride);
    setActiveTheme(initialTheme);
    document.documentElement.setAttribute("data-theme", initialTheme);
    
    // Initialize Identity Without Exposure (IWE)
    initializeIdentity();
    
    // Initialize OWO (Onboarding Without Onboarding)
    const { userId, needsOWO } = initializeOWO();
    
    if (needsOWO) {
      // Show OWO flow
      setShowOwo(true);
      
      // Short loading screen (minimal, calm)
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setOwoState("presence");
      }, 800); // Short loading
    } else {
      // OWO complete, check for Step Engine onboarding
      if (!isOnboardingComplete(userId)) {
        // Check if welcome choice exists (from old flow)
        const welcomeChoice = getWelcomeChoice();
        const plan = createOnboardingPlan(userId, welcomeChoice || undefined);
        setStepPlan(plan);
        setShowSteps(true);
        
        // Load first step with pause
        const step = getCurrentStep(plan);
        if (step) {
          setCurrentStep(step);
          if (step.pause) {
            setIsPausing(true);
            setTimeout(() => {
              setIsPausing(false);
            }, step.pause);
          }
        }
      } else {
        // All onboarding complete, use Life Loop Engine
        setShowSteps(false);
        
        // Check for signals on app open (Signal & Timing Engine)
        // Only if no active user action
        if (!showSteps && !currentLifeAction) {
          const signal = checkSignalsOnAppOpen(context, false);
          if (signal) {
            setActiveSignal(signal);
            setSignalVisible(true);
          }
        }
      }
    }
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
  // Skip if step flow is active
  useEffect(() => {
    if (showSteps) return; // Don't load main state during steps
    
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
  }, [mode, isPrivate, isGlobal, context, showSteps]);

  // Load contextual card (Card System v0.1)
  useEffect(() => {
    if (showSteps) return; // Don't show cards during steps
    
    // Get most relevant card for current context
    const relevantCard = getMostRelevantCard(context);
    
    if (relevantCard) {
      setContextualCard(relevantCard);
      
      // Check if card needs attention
      const cardsNeedingAttention = getCardsNeedingAttention(context);
      const needsAttention = cardsNeedingAttention.some((c) => c.id === relevantCard.id);
      
      if (needsAttention) {
        // Gently highlight card
        setCardHighlight(true);
        setTimeout(() => setCardHighlight(false), 2000);
        
        // Generate state-based signal if card needs attention and no active signal
        if (!activeSignal && !showSteps && !currentLifeAction) {
          const hasActiveAction = showSteps || !!currentLifeAction;
          const signal = generateStateBasedSignal(relevantCard, hasActiveAction);
          if (signal) {
            activateSignal(signal.id, context);
            setActiveSignal(signal);
            setSignalVisible(true);
          }
        }
      }
    } else {
      setContextualCard(null);
    }
  }, [mode, context, showSteps, activeSignal, currentLifeAction]);

  // Check for active signal periodically (but don't interrupt user actions)
  useEffect(() => {
    if (showSteps || currentLifeAction) return; // Don't show signals during active actions
    
    const checkSignal = () => {
      const signal = getActiveSignal(context);
      if (signal && !activeSignal) {
        setActiveSignal(signal);
        setSignalVisible(true);
      } else if (!signal && activeSignal) {
        setActiveSignal(null);
        setSignalVisible(false);
      }
    };
    
    // Check immediately
    checkSignal();
    
    // Check every 30 seconds
    const interval = setInterval(checkSignal, 30000);
    
    return () => clearInterval(interval);
  }, [showSteps, currentLifeAction, context, activeSignal]);

  // Handle signal dismissal
  const handleDismissSignal = (reason?: string) => {
    if (!activeSignal) return;
    
    dismissSignal(activeSignal.id, reason);
    setActiveSignal(null);
    setSignalVisible(false);
  };

  // Handle signal completion (user acted on it)
  const handleCompleteSignal = () => {
    if (!activeSignal) return;
    
    completeSignal(activeSignal.id);
    setActiveSignal(null);
    setSignalVisible(false);
    
    // If signal has a stepId, trigger that step
    if (activeSignal.stepId) {
      // TODO: Trigger step from signal
      // This would integrate with Step Engine
    }
  };

  // OWO handlers
  const handleOWOPresenceContinue = () => {
    setOwoState("choice");
  };

  const handleOWOChoice = (choice: "my_life" | "the_world") => {
    saveOWOChoice(choice);
    setOwoState("input");
  };

  const handleOWOInputSubmit = () => {
    if (owoInput.trim()) {
      saveOWOInput(owoInput);
      const choice = getOWOChoice() || "my_life";
      createFirstCardFromInput(owoInput, choice);
    }
    
    // Seamless transition to main One Screen
    markOWOComplete();
    setOwoState("complete");
    setShowOwo(false);
    
    // Initialize main state
    setTimeout(() => {
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
    }, 300);
  };

  const handleOWOInputSkip = () => {
    // Skip input, seamless transition
    markOWOComplete();
    setOwoState("complete");
    setShowOwo(false);
    
    // Initialize main state
    setTimeout(() => {
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
    }, 300);
  };

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
    
    // Track activity (IWE)
    trackActivity();
    
    // Check if Path ID should be offered
    if (shouldOfferIdentity() && canKeepPath()) {
      setShowKeepPath(true);
    }
    
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
    
    // Track activity (IWE)
    trackActivity();
    
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
    // Track activity (IWE)
    trackActivity();
    
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

  // Handle "Keep this path" (IWE)
  const handleKeepPath = () => {
    keepPath();
    setShowKeepPath(false);
    // No success message - identity emerges from action
  };

  // Handle State Panel toggle
  const handleToggleStatePanel = () => {
    setShowStatePanel(!showStatePanel);
  };

  // Step Engine handlers
  const handleStepAction = async (actionId: string) => {
    if (!stepPlan) return;
    
    // Execute action (async)
    const { plan, result } = await executeStepAction(stepPlan, actionId);
    setStepPlan(plan);
    saveStepPlan(plan.context.userId, plan);
    
    // Handle result
    if (result === "card" || result === "state") {
      // Card or state created, continue to next step
    } else if (result === "transition") {
      // Transitioning to home
    }
    
    // Get next step
    const nextStep = getCurrentStep(plan);
    
    if (!nextStep || nextStep.intent === "home") {
      // Onboarding complete, transition to home
      setTimeout(() => {
        setShowSteps(false);
        clearStepPlan(plan.context.userId);
        
        // Initialize main state
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
      }, 400);
      return;
    }
    
    // Show next step with pause
    if (nextStep.pause) {
      setIsPausing(true);
      setTimeout(() => {
        setIsPausing(false);
        setCurrentStep(nextStep);
      }, nextStep.pause);
    } else {
      setCurrentStep(nextStep);
    }
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
      {/* Top: Theme Toggle (subtle corner) + Mode Toggle - Hidden during steps and OWO */}
      {!showSteps && !showOwo && (
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
          {/* Signal UI (subtle, no popups/banners) - only when no active user action */}
          {activeSignal && signalVisible && !showSteps && !currentLifeAction && (
            <div className="mb-6 transition-all duration-500">
              <div
                className="p-4 rounded-lg text-center"
                style={{
                  backgroundColor: "var(--neutral-50)",
                  border: "1px solid var(--border)",
                  opacity: 0.8,
                }}
              >
                <p className="text-sm leading-relaxed mb-2" style={{ color: "var(--foreground)" }}>
                  {activeSignal.message}
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={handleCompleteSignal}
                    className="text-xs px-3 py-1 rounded opacity-70 hover:opacity-100 transition-opacity"
                    style={{ color: "var(--foreground)" }}
                  >
                    Act
                  </button>
                  <button
                    onClick={() => handleDismissSignal("not now")}
                    className="text-xs px-3 py-1 rounded opacity-50 hover:opacity-70 transition-opacity"
                    style={{ color: "var(--neutral-500)" }}
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          )}

          {showSteps && currentStep ? (
            /* Step Engine Flow */
            <div className="space-y-8 transition-all duration-500">
              {isPausing ? (
                /* Subtle pause (no spinner) */
                <div className="space-y-4">
                  <p className="text-2xl sm:text-3xl leading-relaxed font-normal opacity-50" style={{ color: "var(--foreground)" }}>
                    {currentStep.message.split("\n")[0]}
                  </p>
                </div>
              ) : (
                /* Current Step */
                <div className="space-y-8">
                  {/* Step message (1-2 lines max) */}
                  <div className="space-y-2">
                    {currentStep.message.split("\n").map((line, idx) => (
                      <p
                        key={idx}
                        className={`${idx === 0 ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl"} leading-relaxed font-normal`}
                        style={{ color: "var(--foreground)" }}
                      >
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Step actions (1 primary or up to 2 choices) */}
                  <div className="space-y-4">
                    {currentStep.actions.map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleStepAction(action.id)}
                        disabled={isPausing}
                        className={`w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-all duration-300 ${
                          action.type === "choice" ? "text-left" : ""
                        } disabled:opacity-50`}
                        style={{
                          backgroundColor: "var(--foreground)",
                          color: "var(--background)",
                        }}
                      >
                        {action.label}
                      </button>
                    ))}
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

              {/* Contextual Card (Card System v0.1) - appears when relevant */}
              {contextualCard && !currentLifeAction && (
                <div
                  className={`p-4 rounded-lg text-left transition-all duration-500 ${
                    cardHighlight ? "opacity-100" : "opacity-60"
                  }`}
                  style={{
                    border: "1px solid var(--border)",
                    backgroundColor: cardHighlight ? "var(--neutral-50)" : "transparent",
                  }}
                >
                  <div className="text-xs mb-1 opacity-50" style={{ color: "var(--neutral-500)" }}>
                    {contextualCard.type}
                  </div>
                  <div className="text-base leading-relaxed" style={{ color: "var(--foreground)" }}>
                    {contextualCard.content}
                  </div>
                </div>
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

      {/* Bottom: State Panel toggle and "Keep this path" - Hidden during steps and OWO */}
      {!showSteps && !showOwo && (
        <div className="flex items-center justify-center pb-6 pt-4 gap-4">
          {/* State Panel toggle */}
          <button
            onClick={handleToggleStatePanel}
            className="text-xs opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: "var(--neutral-400)" }}
          >
            State
          </button>
          
          {/* "Keep this path" offer (only when eligible) */}
          {showKeepPath && canKeepPath() && (
            <button
              onClick={handleKeepPath}
              className="text-xs px-3 py-1 rounded opacity-60 hover:opacity-100 transition-opacity"
              style={{
                backgroundColor: "var(--neutral-100)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              Keep this path
            </button>
          )}
          
          <div className="text-xs" style={{ color: "var(--neutral-400)" }}>ONE01</div>
        </div>
      )}

      {/* State Panel (neutral progress indicators) */}
      {showStatePanel && !showSteps && !showOwo && (
        <div
          className="fixed inset-x-0 bottom-0 p-6 rounded-t-lg transition-all duration-300"
          style={{
            backgroundColor: "var(--background)",
            borderTop: "1px solid var(--border)",
            maxHeight: "40vh",
            overflowY: "auto",
          }}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                State
              </h3>
              <button
                onClick={handleToggleStatePanel}
                className="text-xs opacity-50 hover:opacity-100 transition-opacity"
                style={{ color: "var(--foreground)" }}
              >
                Close
              </button>
            </div>
            
            {/* Activity summary (neutral, no personal data) */}
            {(() => {
              const summary = getActivitySummary();
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60" style={{ color: "var(--foreground)" }}>
                      Activities
                    </span>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>
                      {summary.totalActivities}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60" style={{ color: "var(--foreground)" }}>
                      Days active
                    </span>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>
                      {summary.daysActive}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs opacity-60" style={{ color: "var(--foreground)" }}>
                      Tier
                    </span>
                    <span className="text-sm capitalize" style={{ color: "var(--foreground)" }}>
                      {summary.currentTier}
                    </span>
                  </div>
                  
                  {/* Path ID eligibility indicator */}
                  {summary.pathEligible && (
                    <div className="pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                      <p className="text-xs opacity-60 mb-2" style={{ color: "var(--foreground)" }}>
                        Path available
                      </p>
                      {canKeepPath() && (
                        <button
                          onClick={handleKeepPath}
                          className="w-full px-4 py-2 rounded text-sm transition-opacity hover:opacity-90"
                          style={{
                            backgroundColor: "var(--foreground)",
                            color: "var(--background)",
                          }}
                        >
                          Keep this path
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
