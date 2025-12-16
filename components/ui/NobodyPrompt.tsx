/**
 * Nobody Prompt Component v0.1
 * 
 * Minimal guided dialog that produces cards
 * - title (1 line)
 * - subtitle (1 line)
 * - 2 choice buttons max
 * - optional small refresh action (↻)
 */

import { useState } from "react";

interface NobodySay {
  title: string;
  subtitle: string;
}

interface NobodyChoice {
  id: string;
  label: string;
}

interface NobodyPromptProps {
  say: NobodySay;
  choices: NobodyChoice[];
  onChoice: (choiceId: string) => void;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export function NobodyPrompt({
  say,
  choices,
  onChoice,
  onRefresh,
  isLoading = false,
}: NobodyPromptProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Title and Subtitle */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          {say.title}
        </h2>
        {say.subtitle && (
          <p className="text-base sm:text-lg opacity-70" style={{ color: "var(--foreground)" }}>
            {say.subtitle}
          </p>
        )}
      </div>

      {/* Choice Buttons (max 2) */}
      <div className="space-y-3">
        {choices.slice(0, 2).map((choice) => (
          <button
            key={choice.id}
            onClick={() => onChoice(choice.id)}
            disabled={isLoading}
            className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
            style={{
              backgroundColor: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            {choice.label}
          </button>
        ))}
      </div>

      {/* Optional Refresh Action */}
      {onRefresh && (
        <div className="flex justify-center">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:opacity-70 transition-opacity duration-200 disabled:opacity-50"
            style={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            title="Refresh prompt"
          >
            ↻
          </button>
        </div>
      )}
    </div>
  );
}

