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
import { StepCard } from "@/lib/step-card";

interface HomeContentProps {
  state: HomeState;
  // Loading
  isLoading?: boolean;
  // Empty
  onFindNextStep?: () => void;
  isGenerating?: boolean;
  scope?: "private" | "global";
  nextIntent?: "show_active" | "show_step" | "ask_nobody" | "silence";
  // Active
  activeStepCard?: StepCard | null;
  onStepDone?: () => void;
  // Suggestion
  stepSuggestion?: OneNextStep | null;
  onStepDo?: () => void;
  onStepNotNow?: () => void;
  onStepChange?: () => void;
  onAskNobodySubmit?: (text: string) => void;
  // Completed
  completedMessage?: string;
  // Debug
  isDev?: boolean;
}

export function HomeContent({
  state,
  isLoading = false,
  onFindNextStep,
  isGenerating = false,
  scope = "private",
  nextIntent = "ask_nobody",
  activeStepCard,
  onStepDone,
  stepSuggestion,
  onStepDo,
  onStepNotNow,
  onStepChange,
  onAskNobodySubmit,
  completedMessage = "Done",
  isDev = false,
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

      {/* Center Content - StepCard flow only */}
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
        ) : state === "active" && activeStepCard ? (
          /* ACTIVE: Show active StepCard + Done button */
          <div className="space-y-8 py-12">
            <div className="text-center space-y-4">
              <h2
                className="text-3xl sm:text-4xl font-bold"
                style={{ color: "var(--foreground)" }}
              >
                {activeStepCard.title}
              </h2>
              <p
                className="text-base sm:text-lg opacity-70"
                style={{ color: "var(--foreground)" }}
              >
                {activeStepCard.why}
              </p>
            </div>
            <div className="flex justify-center gap-4 text-sm opacity-80" style={{ color: "var(--foreground)" }}>
              <span className="px-3 py-1 rounded-full" style={{ backgroundColor: "var(--neutral-100)" }}>
                {activeStepCard.durationMinutes} min
              </span>
              <span className="px-3 py-1 rounded-full" style={{ backgroundColor: "var(--neutral-100)" }}>
                {activeStepCard.energy} energy
              </span>
              <span className="px-3 py-1 rounded-full" style={{ backgroundColor: "var(--neutral-100)" }}>
                {activeStepCard.domain}
              </span>
            </div>
            <button
              onClick={onStepDone}
              className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
              style={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              Done
            </button>
          </div>
        ) : state === "suggestion" && stepSuggestion ? (
          /* SUGGESTION: Show stepSuggestion + buttons */
          <StepSuggestion
            step={stepSuggestion}
            onDo={onStepDo || (() => {})}
            onNotNow={onStepNotNow || (() => {})}
            onChange={onStepChange || (() => {})}
          />
        ) : state === "empty" ? (
          /* EMPTY: Show button + input (private) or view-only message (global) */
          <>
            {scope === "private" ? (
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
                {onAskNobodySubmit && (
                  <AskNobodyInput
                    onSubmit={onAskNobodySubmit}
                    isGenerating={isGenerating}
                  />
                )}
              </>
            ) : (
              /* Global scope: view-only */
              <div className="text-center py-12">
                <p className="text-base opacity-60" style={{ color: "var(--foreground)" }}>
                  Global is view-only
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}

