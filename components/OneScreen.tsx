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
import { LifeState, LifeAction, LifeContext, LifeFocus, Mode, Step, Card, Signal, ActionLoopState, ActionChoice, ActionClosure, Scope } from "@/lib/types";
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
  createCard,
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
import {
  ActionLoopPlan,
  createActionLoopPlan,
  getCurrentActionStep,
  handleActionChoice,
  completeAction,
  moveToNextStep,
  isActionSmall,
  saveActionLoopPlan,
  loadActionLoopPlan,
} from "@/lib/action-loop-engine";
import { useScope } from "@/hooks/useScope";
import { SideBubbles } from "@/components/ui/SideBubbles";
import { DebugPanel } from "@/components/ui/DebugPanel";
import { useCards } from "@/hooks/useCards";
import { CenterCard } from "@/components/ui/CenterCard";
import { useNobody } from "@/hooks/useNobody";
import { NobodyPrompt } from "@/components/ui/NobodyPrompt";
import { determineHomeState, HomeState } from "@/lib/home-state";
import { handleResetParam } from "@/lib/reset";
import { HomeContent } from "@/components/ui/HomeContent";
import {
  StepCard,
  loadStepCards,
  saveStepCard,
  updateStepCardStatus,
  getActiveStepCard,
  getLastStepCards,
  setActiveCardId,
  getActiveCardId,
  createStepCardFromSuggestion,
} from "@/lib/step-card";
import { DeckView } from "@/components/ui/DeckView";
import { CardDetailView } from "@/components/ui/CardDetailView";

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
  
  // Action Loop v0.1 state
  const [actionLoopPlan, setActionLoopPlan] = useState<ActionLoopPlan | null>(null);
  const [actionLoopState, setActionLoopState] = useState<ActionLoopState>("prompt");
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // Completed state (short confirmation before reset)
  const [isCompleted, setIsCompleted] = useState(false);

  const isPrivate = mode === "private";
  const isGlobal = mode === "global";
  const context: LifeContext = isPrivate ? "private" : "global";
  
  // Scope layer (Global ↔ Private Mirror)
  const { scope, toggleScope, mounted: scopeMounted } = useScope();
  
  // Cards Lifecycle v0.1
  const { activeCard, visibleCards, completeCard, deferCard, refresh: refreshCards } = useCards(scope);
  
  // Nobody Interaction v0.1
  const { showPrompt, promptData, promptState, handleChoice, openPrompt, retryPrompt, useLastPrompt } = useNobody();
  
  // Domain Choice state (First Meaningful Step)
  const [showDomainChoice, setShowDomainChoice] = useState(false);
  
  // Nobody Presence state
  const [showNobody, setShowNobody] = useState(false);
  const [showStepPrompt, setShowStepPrompt] = useState(false);
  
  // AI Step Suggestion state
  const [stepSuggestion, setStepSuggestion] = useState<any>(null);
  const [isGeneratingStep, setIsGeneratingStep] = useState(false);
  const [lastUserText, setLastUserText] = useState("");
  
  // Step Card state (persisted)
  const [activeStepCard, setActiveStepCard] = useState<any>(null);
  const [showDeck, setShowDeck] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [showCompletedMessage, setShowCompletedMessage] = useState(false);
  
  // Hydrate cards on mount
  useEffect(() => {
    const { getActiveCardId, getActiveStepCard, setActiveCardId } = require("@/lib/step-card");
    const activeId = getActiveCardId();
    if (activeId) {
      const card = getActiveStepCard();
      if (card) {
        setActiveStepCard(card);
      } else {
        setActiveCardId(null);
      }
    }
  }, []);
  
  // Handle reset param on mount
  useEffect(() => {
    handleResetParam();
  }, []);
  
  // Determine home state (strict state machine)
  const hasActiveStepCard = !!activeStepCard;
  const hasSuggestion = (actionLoopPlan && actionLoopState === "prompt") || showPrompt || !!stepSuggestion;
  const homeState: HomeState = determineHomeState({
    hasActiveCard: hasActiveStepCard || !!activeCard,
    hasSuggestion,
    hasPrompt: showPrompt,
    isLoading: (promptState === "loading" || isGenerating || isGeneratingStep) && !isCompleted && !showCompletedMessage,
    isCompleted: isCompleted || showCompletedMessage,
  });
  
  // Show Nobody when active card first loads
  useEffect(() => {
    if (activeCard && homeState === "active" && !showStepPrompt) {
      // Show Nobody on first load of active card
      setShowNobody(true);
    } else if (!activeCard) {
      // Reset Nobody when no active card
      setShowNobody(false);
      setShowStepPrompt(false);
    }
  }, [activeCard, homeState, showStepPrompt]);
  
  // Auto-reset completed state after short delay
  useEffect(() => {
    if (isCompleted) {
      const timer = setTimeout(() => {
        setIsCompleted(false);
        setActionLoopPlan(null);
        setActionLoopState("prompt");
        setActionInProgress(false);
        refreshCards();
      }, 2000); // 2 second confirmation
      return () => clearTimeout(timer);
    }
  }, [isCompleted, refreshCards]);
  
  // Debug markers (dev only)
  const isDev = process.env.NODE_ENV === "development";

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

  // Action Loop v0.1 handlers
  const handleActionLoopChoice = async (choice: ActionChoice) => {
    if (!actionLoopPlan || !currentLifeState) return;
    
    // Track activity (IWE)
    trackActivity();
    
    const { plan, closure } = handleActionChoice(actionLoopPlan, choice);
    setActionLoopPlan(plan);
    saveActionLoopPlan(plan);
    
    if (closure === "skipped") {
      // User skipped - close loop with silence
      setActionLoopState("prompt");
      setActionLoopPlan(null);
      setCurrentLifeAction(null);
      setNobodyMessage(NOBODY_MESSAGES.noAction);
      return;
    }
    
    if (closure === "changed") {
      // User wants different action - regenerate
      const newPlan = await createActionLoopPlan(currentLifeState, contextualCard || undefined);
      setActionLoopPlan(newPlan);
      saveActionLoopPlan(newPlan);
      setActionLoopState("prompt");
      return;
    }
    
    // User accepted - move to action phase
    setActionLoopState("action");
    setActionInProgress(true);
  };

  const handleActionComplete = async () => {
    if (!actionLoopPlan || !currentLifeState) return;
    
    // Track activity (IWE)
    trackActivity();
    
    // Check if Path ID should be offered
    if (shouldOfferIdentity() && canKeepPath()) {
      setShowKeepPath(true);
    }
    
    // Complete action and close loop
    const { plan, closure } = completeAction(actionLoopPlan);
    const { plan: updatedPlan, hasMore } = await moveToNextStep(plan, closure);
    
    // Show completed state
    setIsCompleted(true);
    
    setActionLoopPlan(updatedPlan);
    saveActionLoopPlan(updatedPlan);
    setActionInProgress(false);
    
    if (hasMore) {
      // Move to closure, then next prompt
      setActionLoopState("closure");
      setTimeout(() => {
        setActionLoopState("prompt");
      }, 1000); // Brief closure, then silence
    } else {
      // No more steps - close loop with silence
      setActionLoopState("prompt");
      setActionLoopPlan(null);
      setCurrentLifeAction(null);
      setNobodyMessage(NOBODY_MESSAGES.noAction);
    }
  };

  // Initialize Action Loop when LifeAction is available
  useEffect(() => {
    if (!currentLifeAction || !currentLifeState || actionLoopPlan) return;
    
    // Create action loop plan
    createActionLoopPlan(currentLifeState, contextualCard || undefined).then((plan) => {
      setActionLoopPlan(plan);
      saveActionLoopPlan(plan);
      setActionLoopState("prompt");
    });
  }, [currentLifeAction, currentLifeState, contextualCard]);

  // Legacy Accept handler (for backward compatibility)
  const handleAccept = async () => {
    if (!currentLifeAction || !currentLifeState) return;
    
    // Use Action Loop if available
    if (actionLoopPlan) {
      await handleActionLoopChoice("yes");
      return;
    }
    
    // Fallback to legacy behavior
    trackActivity();
    
    if (shouldOfferIdentity() && canKeepPath()) {
      setShowKeepPath(true);
    }
    
    updateLifeActionStatus(currentLifeAction.id, currentLifeState.id, "done");
    
    if (currentLifeState.status === "suggested") {
      updateLifeStateStatus(currentLifeState.id, context, "active");
      setCurrentLifeState({ ...currentLifeState, status: "active" });
    }
    
    setCurrentLifeAction(null);
    
    const allActions = loadLifeActions(currentLifeState.id);
    const nextPending = allActions.find((a) => a.status === "pending");
    
    if (nextPending) {
      setCurrentLifeAction(nextPending);
      setNobodyMessage(NOBODY_MESSAGES.actionReady);
    } else {
      generateActionForState(currentLifeState);
    }
  };

  // Legacy Skip handler (for backward compatibility)
  const handleSkip = async () => {
    if (!currentLifeAction || !currentLifeState) return;
    
    // Use Action Loop if available
    if (actionLoopPlan) {
      await handleActionLoopChoice("not_now");
      return;
    }
    
    // Fallback to legacy behavior
    trackActivity();
    
    updateLifeActionStatus(currentLifeAction.id, currentLifeState.id, "skipped");
    setCurrentLifeAction(null);
    
    const allActions = loadLifeActions(currentLifeState.id);
    const nextPending = allActions.find((a) => a.status === "pending");
    
    if (nextPending) {
      setCurrentLifeAction(nextPending);
      setNobodyMessage(NOBODY_MESSAGES.actionReady);
    } else {
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

  // AI Step Suggestion handlers
  const handleAskNobodySubmit = async (text: string) => {
    setIsGeneratingStep(true);
    setLastUserText(text);
    setStepSuggestion(null);

    try {
      const response = await fetch("/api/nobody/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const step = await response.json();
      setStepSuggestion(step);
    } catch (error) {
      console.error("Error fetching step suggestion:", error);
      setStepSuggestion({
        title: "Take one small step forward",
        why: "Start with something simple and clear.",
        durationMinutes: 10,
        energy: "low",
        domain: "life",
        buttons: [
          { id: "do", label: "Do it" },
          { id: "not_now", label: "Not now" },
          { id: "change", label: "Change" },
        ],
      });
    } finally {
      setIsGeneratingStep(false);
    }
  };

  const handleStepDo = () => {
    if (!stepSuggestion) return;
    const card = createStepCardFromSuggestion(stepSuggestion, "active");
    saveStepCard(card);
    setActiveCardId(card.id);
    setActiveStepCard(card);
    setStepSuggestion(null);
  };

  const handleStepNotNow = () => {
    if (!stepSuggestion) return;
    const card = createStepCardFromSuggestion(stepSuggestion, "skipped");
    saveStepCard(card);
    setStepSuggestion(null);
  };

  const handleStepChange = async () => {
    if (!lastUserText) return;
    if (stepSuggestion) {
      const card = createStepCardFromSuggestion(stepSuggestion, "skipped");
      saveStepCard(card);
    }
    setIsGeneratingStep(true);
    setStepSuggestion(null);

    try {
      const response = await fetch("/api/nobody/step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: lastUserText, makeEasier: true }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const step = await response.json();
      setStepSuggestion(step);
    } catch (error) {
      console.error("Error fetching changed step:", error);
      setStepSuggestion({
        title: "Take one small step forward",
        why: "Start with something simple and clear.",
        durationMinutes: 10,
        energy: "low",
        domain: "life",
        buttons: [
          { id: "do", label: "Do it" },
          { id: "not_now", label: "Not now" },
          { id: "change", label: "Change" },
        ],
      });
    } finally {
      setIsGeneratingStep(false);
    }
  };

  const handleStepDone = () => {
    if (!activeStepCard) return;
    updateStepCardStatus(activeStepCard.id, "done");
    setActiveCardId(null);
    setActiveStepCard(null);
    setShowCompletedMessage(true);
    setTimeout(() => {
      setShowCompletedMessage(false);
    }, 2000);
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

  // Compute state panel data before return (no IIFE in JSX)
  const summary = getActivitySummary();
  const canShowPath = summary.pathEligible && canKeepPath();
  const showDebug = process.env.NODE_ENV === "development";

  return (
    <div className="fixed inset-0 flex flex-col" style={{ backgroundColor: "var(--background)", color: "var(--foreground)" }}>
      {/* Top: Theme Toggle (subtle corner) + Mode Toggle - Hidden during steps, OWO, and action loop */}
      {!showSteps && !showOwo && actionLoopState !== "action" && (
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

          {/* Scope Toggle (only render when mounted to prevent flicker) */}
          {scopeMounted && (
            <button
              onClick={toggleScope}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-opacity duration-200 hover:opacity-70"
              style={{
                backgroundColor: scope === "private" ? "var(--foreground)" : "transparent",
                color: scope === "private" ? "var(--background)" : "var(--foreground)",
                border: "1px solid var(--border)",
              }}
            >
              {scope === "private" ? "Private" : "Global"}
            </button>
          )}

          {/* Dev menu (development only) */}
          {isDev && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm("Reset all app data?")) {
                    const { clearAppData } = require("@/lib/reset");
                    clearAppData();
                    window.location.reload();
                  }
                }}
                className="text-xs opacity-30 hover:opacity-60 transition-opacity"
                style={{ color: "var(--foreground)" }}
                title="Reset (dev only)"
              >
                Reset
              </button>
              {/* Debug state marker */}
              <span className="text-xs opacity-20" style={{ color: "var(--foreground)" }}>
                [{homeState.toUpperCase()}]
              </span>
            </div>
          )}

          {/* Spacer for balance */}
          <div className="w-8" />
        </div>
      )}

      {/* Center: Focus Zone - Strict State Machine (ONE state only) */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Side Bubbles (next/context/last done - max 3) - Only show in active state */}
        {homeState === "active" && <SideBubbles cards={visibleCards} />}
        
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

        {/* Unified UI Structure - Single state only */}
        <div className="relative z-20 w-full">
          <HomeContent
            state={homeState}
            isLoading={promptState === "loading" || isGenerating}
            onFindNextStep={() => {
              if (homeState === "empty") {
                setShowDomainChoice(true);
              } else {
                openPrompt();
              }
            }}
            isGenerating={isGenerating}
            showDomainChoice={showDomainChoice}
            onDomainSelect={(domain) => {
              // Map domain to card title and intent
              const domainMap: Record<string, { title: string; intent: string }> = {
                work: { title: "Work", intent: "work" },
                health: { title: "Health", intent: "health" },
                mind: { title: "Mind", intent: "self" },
                relationships: { title: "Relationships", intent: "relationship" },
                other: { title: "Something else", intent: "other" },
              };
              
              const { title, intent } = domainMap[domain] || { title: domain, intent: "other" };
              
              // Create active card
              const newCard = createCard(title, intent, "private", "user_choice");
              
              // Promote to active
              updateCardState(newCard.id, "active");
              
              // Close choice modal and refresh
              setShowDomainChoice(false);
              refreshCards();
            }}
            activeCard={activeCard || undefined}
            onCompleteCard={(cardId) => completeCard(cardId)}
            onDeferCard={(cardId) => deferCard(cardId)}
            showNobody={showNobody}
            onNobodyYes={() => {
              setShowNobody(false);
              setShowStepPrompt(true);
            }}
            onNobodyNotNow={() => {
              setShowNobody(false);
            }}
            showStepPrompt={showStepPrompt}
            onStepSelect={(option) => {
              // Handle step selection (static for now, no AI)
              console.log("Step selected:", option);
              // For now, just hide the prompt and return to calm view
              setShowStepPrompt(false);
              // TODO: Create a step card or action based on selection
            }}
            showPrompt={showPrompt}
            promptData={promptData || undefined}
            promptState={promptState}
            onPromptChoice={(choiceId) => {
              handleChoice(choiceId);
              setTimeout(() => refreshCards(), 100);
            }}
            onPromptRetry={retryPrompt}
            onPromptUseLast={useLastPrompt}
            actionLoopPlan={actionLoopPlan || undefined}
            actionLoopState={actionLoopState}
            onActionChoice={handleActionLoopChoice}
            onActionComplete={handleActionComplete}
            actionInProgress={actionInProgress}
            completedMessage="Done"
            isDev={isDev}
            stepSuggestion={stepSuggestion}
            onStepDo={handleStepDo}
            onStepNotNow={handleStepNotNow}
            onStepChange={handleStepChange}
            onAskNobodySubmit={handleAskNobodySubmit}
            activeStepCard={activeStepCard || undefined}
            onStepDone={handleStepDone}
          />
        </div>

        {/* Step Engine Flow - Only renders during onboarding */}
        {showSteps && currentStep && (
          <div className="relative z-20 w-full max-w-md text-center space-y-8 transition-all duration-500">
            {isPausing ? (
              <div className="space-y-4">
                <p className="text-2xl sm:text-3xl leading-relaxed font-normal opacity-50" style={{ color: "var(--foreground)" }}>
                  {currentStep.message.split("\n")[0]}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
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
                <div className="space-y-4">
                  {currentStep.actions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => handleStepAction(action.id)}
                      disabled={isPausing}
                      className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-all duration-300 disabled:opacity-50"
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
        )}

        {/* Global Mode - View Only */}
        {isGlobal && !showSteps && (
          <div className="relative z-20 w-full max-w-md text-center space-y-4">
            <p className="text-lg mb-4" style={{ color: "var(--neutral-600)" }}>
              {globalData
                ? `${globalData.completedActions} actions completed today`
                : "Anonymous aggregates"}
            </p>
          </div>
        )}
      </div>

      {/* Bottom: State Panel toggle and "Keep this path" - Hidden during steps, OWO, and action loop */}
      {!showSteps && !showOwo && actionLoopState !== "action" && (
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

      {/* State Panel (neutral progress indicators) - Hidden during action loop */}
      {showStatePanel && !showSteps && !showOwo && actionLoopState !== "action" && (
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
                  {canShowPath && (
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
          </div>
        </div>
      )}

      {/* Debug Panel (dev only) - Single instance */}
      {showDebug && (
        <DebugPanel
          scope={scope}
          cards={visibleCards.map((c) => ({
            id: c.id,
            title: c.title,
            subtitle: c.intent || "",
            status: c.state === "done" ? "completed" : "active",
            createdAt: c.createdAt,
            scope: c.scope as Scope,
          }))}
          dataSource="useCards()"
        />
      )}
    </div>
  );
}
