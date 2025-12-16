/**
 * Card Detail View - Read-only card view
 * 
 * Shows full card details for done/skipped cards
 */

import { StepCard } from "@/lib/step-card-storage";

interface CardDetailViewProps {
  card: StepCard;
  onClose: () => void;
}

export function CardDetailView({ card, onClose }: CardDetailViewProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg p-6 space-y-6"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2
            className="text-2xl font-normal"
            style={{ color: "var(--foreground)" }}
          >
            {card.title}
          </h2>
          <button
            onClick={onClose}
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            Close
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <p
              className="text-base opacity-60"
              style={{ color: "var(--foreground)" }}
            >
              {card.why}
            </p>
          </div>

          <div className="flex items-center gap-4">
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
            <div
              className="px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "var(--neutral-100)",
                color: "var(--foreground)",
              }}
            >
              {card.status}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

