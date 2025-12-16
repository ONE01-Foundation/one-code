/**
 * Active Step Card View
 * 
 * Shows the active step card with "Done" button
 */

import { StepCard } from "@/lib/step-card";

interface ActiveStepCardProps {
  card: StepCard;
  onDone: () => void;
}

export function ActiveStepCard({ card, onDone }: ActiveStepCardProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6 py-12">
      <div className="text-center space-y-4">
        <h2
          className="text-3xl sm:text-4xl font-normal"
          style={{ color: "var(--foreground)" }}
        >
          {card.title}
        </h2>
        <p
          className="text-base sm:text-lg opacity-60"
          style={{ color: "var(--foreground)" }}
        >
          {card.why}
        </p>
      </div>
      
      <div className="flex items-center justify-center gap-4">
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "var(--neutral-100)",
            color: "var(--foreground)",
          }}
        >
          {card.durationMinutes} min
        </div>
        <div
          className="px-3 py-1 rounded-full text-xs font-medium"
          style={{
            backgroundColor: "var(--neutral-100)",
            color: "var(--foreground)",
          }}
        >
          {card.energy} energy
        </div>
      </div>
      
      <button
        onClick={onDone}
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
}

