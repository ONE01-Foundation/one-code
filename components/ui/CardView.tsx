/**
 * Card View - Read-only card details
 * 
 * Shows full card information for done/skipped cards
 */

import { StepCard } from "@/lib/step-card";

interface CardViewProps {
  card: StepCard;
  onClose: () => void;
}

export function CardView({ card, onClose }: CardViewProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-lg p-6"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-medium"
            style={{ color: "var(--foreground)" }}
          >
            {card.title}
          </h2>
          <button
            onClick={onClose}
            className="text-xs opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <div
              className="text-sm opacity-60 mb-1"
              style={{ color: "var(--foreground)" }}
            >
              Why
            </div>
            <div
              className="text-base"
              style={{ color: "var(--foreground)" }}
            >
              {card.why}
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <div
                className="text-xs opacity-60 mb-1"
                style={{ color: "var(--foreground)" }}
              >
                Duration
              </div>
              <div
                className="text-sm"
                style={{ color: "var(--foreground)" }}
              >
                {card.durationMinutes} min
              </div>
            </div>
            <div>
              <div
                className="text-xs opacity-60 mb-1"
                style={{ color: "var(--foreground)" }}
              >
                Energy
              </div>
              <div
                className="text-sm"
                style={{ color: "var(--foreground)" }}
              >
                {card.energy}
              </div>
            </div>
            <div>
              <div
                className="text-xs opacity-60 mb-1"
                style={{ color: "var(--foreground)" }}
              >
                Status
              </div>
              <div
                className="text-sm"
                style={{ color: "var(--foreground)" }}
              >
                {card.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

