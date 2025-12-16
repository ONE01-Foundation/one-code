/**
 * Nobody Prompt Component v0.1 - "Feels Live" Loading
 * 
 * States: idle | loading | ready | timeout
 * - Skeleton shimmer on load
 * - Staged reveal (title → subtitle → choices)
 * - Timeout fallback with retry
 */

import { useState, useEffect } from "react";
import { NobodyResponse } from "@/lib/nobody";

type PromptState = "idle" | "loading" | "ready" | "timeout";

interface NobodyPromptProps {
  response: NobodyResponse | null;
  state: PromptState;
  onChoice: (choiceId: string) => void;
  onRetry?: () => void;
  onUseLast?: () => void;
}

export function NobodyPrompt({
  response,
  state,
  onChoice,
  onRetry,
  onUseLast,
}: NobodyPromptProps) {
  const [revealStage, setRevealStage] = useState<"title" | "subtitle" | "choices" | "complete">("title");
  
  // Staged reveal animation
  useEffect(() => {
    if (state !== "ready" || !response) {
      setRevealStage("title");
      return;
    }
    
    // Reset and start reveal
    setRevealStage("title");
    
    const subtitleTimer = setTimeout(() => {
      setRevealStage("subtitle");
    }, 180);
    
    const choicesTimer = setTimeout(() => {
      setRevealStage("choices");
    }, 360);
    
    const completeTimer = setTimeout(() => {
      setRevealStage("complete");
    }, 540);
    
    return () => {
      clearTimeout(subtitleTimer);
      clearTimeout(choicesTimer);
      clearTimeout(completeTimer);
    };
  }, [state, response]);
  
  // Skeleton shimmer animation
  const shimmerClass = "animate-pulse bg-gradient-to-r from-transparent via-opacity-20 to-transparent";
  
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Title and Subtitle */}
      <div className="text-center space-y-2">
        {state === "loading" || state === "idle" ? (
          <>
            {/* Skeleton title */}
            <div className={`h-8 w-3/4 mx-auto rounded ${shimmerClass}`} style={{ backgroundColor: "var(--neutral-200)" }} />
            {/* Skeleton subtitle */}
            <div className={`h-5 w-2/3 mx-auto rounded ${shimmerClass}`} style={{ backgroundColor: "var(--neutral-200)" }} />
          </>
        ) : state === "ready" && response ? (
          <>
            {/* Revealed title */}
            <h2 
              className={`text-2xl sm:text-3xl font-bold transition-opacity duration-300 ${
                revealStage === "title" || revealStage === "subtitle" || revealStage === "choices" || revealStage === "complete"
                  ? "opacity-100"
                  : "opacity-0"
              }`}
              style={{ color: "var(--foreground)" }}
            >
              {response.say.title}
            </h2>
            {/* Revealed subtitle */}
            {response.say.subtitle && (
              <p 
                className={`text-base sm:text-lg opacity-70 transition-opacity duration-300 ${
                  revealStage === "subtitle" || revealStage === "choices" || revealStage === "complete"
                    ? "opacity-70"
                    : "opacity-0"
                }`}
                style={{ color: "var(--foreground)" }}
              >
                {response.say.subtitle}
              </p>
            )}
          </>
        ) : null}
      </div>

      {/* Choice Buttons or Timeout UI */}
      {state === "loading" || state === "idle" ? (
        /* Skeleton buttons */
        <div className="space-y-3">
          <div className={`h-12 w-full rounded-lg ${shimmerClass}`} style={{ backgroundColor: "var(--neutral-200)" }} />
          <div className={`h-12 w-full rounded-lg ${shimmerClass}`} style={{ backgroundColor: "var(--neutral-200)" }} />
        </div>
      ) : state === "timeout" ? (
        /* Timeout fallback */
        <div className="space-y-4">
          <p className="text-sm opacity-60 text-center" style={{ color: "var(--foreground)" }}>
            Still thinking…
          </p>
          <div className="space-y-3">
            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                ↻ Try again
              </button>
            )}
            {onUseLast && (
              <button
                onClick={onUseLast}
                className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
                style={{
                  backgroundColor: "var(--background)",
                  border: "2px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Use last
              </button>
            )}
          </div>
        </div>
      ) : state === "ready" && response ? (
        /* Revealed choice buttons */
        <div className="space-y-3">
          {response.choices.slice(0, 2).map((choice, index) => (
            <button
              key={choice.id}
              onClick={() => onChoice(choice.id)}
              className={`w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-all duration-300 ${
                revealStage === "choices" || revealStage === "complete"
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
              style={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              {choice.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

