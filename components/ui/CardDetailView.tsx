/**
 * Card Detail View - Read-only card view
 * 
 * Shows full card details for done/skipped cards
 */

import { StepCard } from "@/lib/step-card";

interface CardDetailViewProps {
  card: StepCard;
  onClose: () => void;
}

export function CardDetailView({ card, onClose }: CardDetailViewProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 rounded-lg"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
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

        {/* Content */}
        <div className="p-4 space-y-4">
          <div>
            <div className="text-sm opacity-60 mb-1" style={{ color: "var(--foreground)" }}>
              Why
            </div>
            <div className="text-base" style={{ color: "var(--foreground)" }}>
              {card.why}
            </div>
          </div>

          <div className="flex gap-4">
            <div>
              <div className="text-xs opacity-50 mb-1" style={{ color: "var(--foreground)" }}>
                Duration
              </div>
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                {card.durationMinutes} min
              </div>
            </div>
            <div>
              <div className="text-xs opacity-50 mb-1" style={{ color: "var(--foreground)" }}>
                Energy
              </div>
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                {card.energy}
              </div>
            </div>
            <div>
              <div className="text-xs opacity-50 mb-1" style={{ color: "var(--foreground)" }}>
                Status
              </div>
              <div className="text-sm" style={{ color: "var(--foreground)" }}>
                {card.status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
