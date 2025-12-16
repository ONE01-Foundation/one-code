/**
 * Deck View - Minimal card history
 * 
 * Shows last 10 cards (title + status)
 * Tapping a done/skipped card opens read-only view
 */

import { StepCard } from "@/lib/step-card-storage";

interface DeckViewProps {
  cards: StepCard[];
  onCardClick?: (card: StepCard) => void;
  onClose: () => void;
}

export function DeckView({ cards, onCardClick, onClose }: DeckViewProps) {
  const getStatusColor = (status: StepCard["status"]) => {
    switch (status) {
      case "active":
        return "opacity-100";
      case "done":
        return "opacity-60";
      case "skipped":
        return "opacity-40";
      case "suggested":
        return "opacity-50";
      default:
        return "opacity-50";
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md max-h-[80vh] overflow-y-auto rounded-lg p-6 space-y-4"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-xl font-normal"
            style={{ color: "var(--foreground)" }}
          >
            Deck
          </h2>
          <button
            onClick={onClose}
            className="text-sm opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: "var(--foreground)" }}
          >
            Close
          </button>
        </div>

        {cards.length === 0 ? (
          <p
            className="text-sm opacity-60 text-center py-8"
            style={{ color: "var(--foreground)" }}
          >
            No cards yet
          </p>
        ) : (
          <div className="space-y-2">
            {cards.map((card) => (
              <button
                key={card.id}
                onClick={() => onCardClick?.(card)}
                className="w-full text-left p-3 rounded-lg transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: "var(--neutral-100)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div
                      className={`text-sm font-medium mb-1 ${getStatusColor(card.status)}`}
                      style={{ color: "var(--foreground)" }}
                    >
                      {card.title}
                    </div>
                    <div
                      className="text-xs opacity-50"
                      style={{ color: "var(--foreground)" }}
                    >
                      {card.status} • {card.durationMinutes} min
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

