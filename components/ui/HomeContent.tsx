/**
 * Home Content - Unified UI Structure
 * 
 * Single layout wrapper that switches content based on state
 * Header (minimal) + Center (card/message) + Bottom (buttons)
 */

import { HomeState } from "@/lib/home-state";
import { Card } from "@/lib/types";
import { CenterCard } from "./CenterCard";
import { NobodyPrompt } from "./NobodyPrompt";
import { NobodyResponse } from "@/lib/nobody";
import { ActionLoopState } from "@/lib/types";
import { ActionLoopPlan } from "@/lib/action-loop-engine";
import { DomainChoice } from "./DomainChoice";
import { NobodyPresence } from "./NobodyPresence";
import { StepPrompt, StepOption } from "./StepPrompt";
import { AskNobodyInput } from "./AskNobodyInput";
import { StepSuggestion } from "./StepSuggestion";
import { OneNextStep } from "@/app/api/nobody/step/route";

interface HomeContentProps {
  state: HomeState;
  // Loading
  isLoading?: boolean;
  // Empty
  onFindNextStep?: () => void;
  isGenerating?: boolean;
  showDomainChoice?: boolean;
  onDomainSelect?: (domain: string) => void;
  // Active
  activeCard?: Card | null;
  onCompleteCard?: (cardId: string) => void;
  onDeferCard?: (cardId: string) => void;
  activeStepCard?: any; // StepCard from step-card-storage
  onStepCardDone?: () => void;
  showNobody?: boolean;
  onNobodyYes?: () => void;
  onNobodyNotNow?: () => void;
  showStepPrompt?: boolean;
  onStepSelect?: (option: string) => void;
  // Suggestion
  showPrompt?: boolean;
  promptData?: NobodyResponse | null;
  promptState?: "idle" | "loading" | "ready" | "timeout";
  onPromptChoice?: (choiceId: string) => void;
  onPromptRetry?: () => void;
  onPromptUseLast?: () => void;
  actionLoopPlan?: ActionLoopPlan | null;
  actionLoopState?: ActionLoopState;
  onActionChoice?: (choice: "yes" | "not_now" | "change") => void;
  onActionComplete?: () => void;
  actionInProgress?: boolean;
  // Completed
  completedMessage?: string;
  // AI Step Suggestion
  stepSuggestion?: OneNextStep | null;
  onStepDo?: () => void;
  onStepNotNow?: () => void;
  onStepChange?: () => void;
  onAskNobodySubmit?: (text: string) => void;
  // Debug
  isDev?: boolean;
}

export function HomeContent({
  state,
  isLoading = false,
  onFindNextStep,
  isGenerating = false,
  showDomainChoice = false,
  onDomainSelect,
  activeCard,
  onCompleteCard,
  onDeferCard,
  activeStepCard,
  onStepCardDone,
  showNobody = false,
  onNobodyYes,
  onNobodyNotNow,
  showStepPrompt = false,
  onStepSelect,
  showPrompt = false,
  promptData,
  promptState = "idle",
  onPromptChoice,
  onPromptRetry,
  onPromptUseLast,
  actionLoopPlan,
  actionLoopState = "prompt",
  onActionChoice,
  onActionComplete,
  actionInProgress = false,
  completedMessage = "Done",
  isDev = false,
  stepSuggestion,
  onStepDo,
  onStepNotNow,
  onStepChange,
  onAskNobodySubmit,
}: HomeContentProps) {
  // Unified layout structure
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Debug state marker (dev only) */}
      {isDev && (
        <div className="text-xs opacity-20 mb-4 text-center">
          [{state.toUpperCase()}]
        </div>
      )}

      {/* Center Content - switches based on state */}
      <div className="space-y-6">
        {state === "loading" ? (
          /* LOADING: Minimal, calm */
          <div className="text-center py-12">
            <div className="text-sm opacity-40" style={{ color: "var(--foreground)" }}>
              Loading...
            </div>
          </div>
        ) : state === "completed" ? (
          /* COMPLETED: Short confirmation, auto-reset */
          <div className="text-center py-12">
            <div className="text-2xl mb-2" style={{ color: "var(--foreground)" }}>
              ✓
            </div>
            <div className="text-sm opacity-60" style={{ color: "var(--foreground)" }}>
              {completedMessage}
            </div>
          </div>
        ) : state === "active" && activeCard ? (
          /* ACTIVE: Minimal active card view + Nobody presence */
          showStepPrompt ? (
            /* Step Prompt: What feels easiest to do next? */
            <StepPrompt onSelect={(option) => onStepSelect?.(option)} />
          ) : showNobody ? (
            /* Nobody Presence: First message */
            <NobodyPresence
              message="Let's take one small step."
              onYes={() => onNobodyYes?.()}
              onNotNow={() => onNobodyNotNow?.()}
            />
          ) : (
            /* Calm active card view (Nobody hidden) */
            <div className="space-y-8 py-12">
              <div className="text-center space-y-4">
                <h2
                  className="text-3xl sm:text-4xl font-normal"
                  style={{ color: "var(--foreground)" }}
                >
                  {activeCard.title}
                </h2>
                <p
                  className="text-base sm:text-lg opacity-60"
                  style={{ color: "var(--foreground)" }}
                >
                  We'll take this one step at a time.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => onFindNextStep?.()}
                  disabled={isGenerating}
                  className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                  style={{
                    backgroundColor: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  What's the next small step?
                </button>
                <button
                  onClick={() => {
                    // Defer current card (set to draft) to allow choosing a new focus
                    onDeferCard?.(activeCard.id);
                  }}
                  className="w-full px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "2px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Change focus
                </button>
              </div>
            </div>
          )
        ) : state === "suggestion" ? (
          /* SUGGESTION: System suggests next step */
          <>
            {showPrompt && promptData ? (
              <NobodyPrompt
                response={promptData}
                state={promptState}
                onChoice={onPromptChoice || (() => {})}
                onRetry={onPromptRetry}
                onUseLast={onPromptUseLast}
              />
            ) : actionLoopPlan && actionLoopState === "prompt" ? (
              (() => {
                // Import getCurrentActionStep dynamically to avoid circular deps
                const { getCurrentActionStep } = require("@/lib/action-loop-engine");
                const currentStep = getCurrentActionStep(actionLoopPlan);
                if (!currentStep) return null;

                return (
                  <div className="space-y-6">
                    {/* Prompt: single clear suggestion */}
                    <div
                      className="p-6 rounded-lg text-left transition-all duration-500"
                      style={{ border: "2px solid var(--border)" }}
                    >
                      <div
                        className="text-2xl sm:text-3xl font-bold mb-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        {currentStep.prompt}
                      </div>
                      <div
                        className="text-lg sm:text-xl mb-2"
                        style={{ color: "var(--neutral-700)" }}
                      >
                        {currentStep.action}
                      </div>
                      {currentStep.estimatedTime && (
                        <div
                          className="text-xs mt-4 opacity-50"
                          style={{ color: "var(--neutral-500)" }}
                        >
                          {currentStep.estimatedTime} min
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions: Primary (Yes) + Secondary (Not now / Change) */}
                    <div className="space-y-3">
                      <button
                        onClick={() => onActionChoice?.("yes")}
                        disabled={isGenerating}
                        className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--foreground)",
                          color: "var(--background)",
                        }}
                      >
                        Yes
                      </button>
                      <div className="flex gap-3">
                        <button
                          onClick={() => onActionChoice?.("not_now")}
                          disabled={isGenerating}
                          className="flex-1 px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--background)",
                            border: "2px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        >
                          Not now
                        </button>
                        <button
                          onClick={() => onActionChoice?.("change")}
                          disabled={isGenerating}
                          className="flex-1 px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                          style={{
                            backgroundColor: "var(--background)",
                            border: "2px solid var(--border)",
                            color: "var(--foreground)",
                          }}
                        >
                          Change
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : actionLoopPlan && actionLoopState === "action" && actionInProgress ? (
              /* Action in progress */
              (() => {
                const { getCurrentActionStep } = require("@/lib/action-loop-engine");
                const currentStep = getCurrentActionStep(actionLoopPlan);
                if (!currentStep) return null;

                return (
                  <div className="space-y-6">
                    <div
                      className="p-6 rounded-lg text-left transition-all duration-500"
                      style={{ border: "2px solid var(--border)" }}
                    >
                      <div
                        className="text-2xl sm:text-3xl font-bold mb-3"
                        style={{ color: "var(--foreground)" }}
                      >
                        {currentStep.prompt}
                      </div>
                      <div
                        className="text-lg sm:text-xl mb-2"
                        style={{ color: "var(--neutral-700)" }}
                      >
                        {currentStep.action}
                      </div>
                    </div>

                    {/* Bottom Action: Done button */}
                    <button
                      onClick={onActionComplete}
                      className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                      style={{
                        backgroundColor: "var(--foreground)",
                        color: "var(--background)",
                      }}
                    >
                      Done
                    </button>
                  </div>
                );
              })()
            ) : null}
          </>
        ) : state === "empty" ? (
          /* EMPTY: No active card + CTA + Ask Nobody input */
          <>
            <div className="text-center py-12 pb-24">
              <button
                onClick={onFindNextStep}
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
            <AskNobodyInput
              onSubmit={(text) => onAskNobodySubmit?.(text)}
              isGenerating={isGenerating}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

