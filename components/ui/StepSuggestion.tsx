/**
 * Step Suggestion - AI-generated next step
 * 
 * Shows the ONE next step returned from AI
 * With title, why, duration/energy badges, and 3 buttons
 */

import { OneNextStep } from "@/app/api/nobody/step/route";

interface StepSuggestionProps {
  step: OneNextStep;
  onDo: () => void;
  onNotNow: () => void;
  onChange: () => void;
}

export function StepSuggestion({ step, onDo, onNotNow, onChange }: StepSuggestionProps) {
  const energyColors: Record<string, string> = {
    low: "opacity-40",
    medium: "opacity-60",
    high: "opacity-80",
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-12">
      {/* Title (big) */}
      <div className="text-center">
        <h2
          className="text-3xl sm:text-4xl font-normal leading-relaxed"
          style={{ color: "var(--foreground)" }}
        >
          {step.title}
        </h2>
      </div>

      {/* Why (small) */}
      <div className="text-center">
        <p
          className="text-base sm:text-lg opacity-60"
          style={{ color: "var(--foreground)" }}
        >
          {step.why}
        </p>
      </div>

      {/* Duration + Energy badges */}
      <div className="flex items-center justify-center gap-4">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "var(--neutral-100)",
            color: "var(--foreground)",
          }}
        >
          {step.durationMinutes} min
        </div>
        <div
          className={`px-3 py-1 rounded-full text-xs font-medium ${energyColors[step.energy]}`}
          style={{
            backgroundColor: "var(--neutral-100)",
            color: "var(--foreground)",
          }}
        >
          {step.energy} energy
        </div>
      </div>

      {/* 3 buttons: Do it / Not now / Change */}
      <div className="space-y-3">
        <button
          onClick={onDo}
          className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
          style={{
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          {step.buttons.find((b) => b.id === "do")?.label || "Do it"}
        </button>
        <div className="flex gap-3">
          <button
            onClick={onNotNow}
            className="flex-1 px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200"
            style={{
              backgroundColor: "var(--background)",
              border: "2px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            {step.buttons.find((b) => b.id === "not_now")?.label || "Not now"}
          </button>
          <button
            onClick={onChange}
            className="flex-1 px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200"
            style={{
              backgroundColor: "var(--background)",
              border: "2px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            {step.buttons.find((b) => b.id === "change")?.label || "Change"}
          </button>
        </div>
      </div>
    </div>
  );
}

