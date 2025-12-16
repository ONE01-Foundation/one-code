/**
 * Step Prompt - What feels easiest to do next?
 * 
 * Shows after user says "Yes" to Nobody
 * Static options only (no AI yet)
 */

export type StepOption = "think" | "talk" | "action" | "other";

interface StepPromptProps {
  onSelect: (option: StepOption) => void;
}

const STEP_OPTIONS: Array<{ id: StepOption; label: string }> = [
  { id: "think", label: "Think" },
  { id: "talk", label: "Talk to someone" },
  { id: "action", label: "Do a small action" },
  { id: "other", label: "Something else" },
];

export function StepPrompt({ onSelect }: StepPromptProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* One question only */}
      <div className="text-center">
        <p
          className="text-xl sm:text-2xl font-normal leading-relaxed"
          style={{ color: "var(--foreground)" }}
        >
          What feels easiest to do next?
        </p>
      </div>

      {/* Static options (generated locally, no AI) */}
      <div className="space-y-3">
        {STEP_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200 text-left"
            style={{
              backgroundColor: "var(--background)",
              border: "2px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

