/**
 * Side Bubbles Component - Recent StepCards
 * 
 * Renders up to 3 recent StepCards with status dots
 */

import { StepCard } from "@/lib/step-card";

interface SideBubblesProps {
  cards: StepCard[];
  onCardClick?: (card: StepCard) => void;
}

export function SideBubbles({ cards, onCardClick }: SideBubblesProps) {
  // Position 3 bubbles around the center
  const positions = [
    { top: "20%", left: "10%", transform: "translate(-50%, -50%)" },
    { top: "20%", right: "10%", transform: "translate(50%, -50%)" },
    { bottom: "20%", left: "50%", transform: "translate(-50%, 50%)" },
  ];
  
  const getStatusDotColor = (status: StepCard["status"]) => {
    switch (status) {
      case "done":
        return "var(--neutral-400)"; // Subtle gray
      case "skipped":
        return "var(--neutral-300)"; // Lighter gray
      case "active":
        return "var(--foreground)"; // Foreground color
      default:
        return "var(--neutral-200)";
    }
  };
  
  return (
    <>
      {cards.slice(0, 3).map((card, index) => {
        const position = positions[index];
        if (!position) return null;
        
        return (
          <div
            key={card.id}
            onClick={() => onCardClick?.(card)}
            className="absolute w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 opacity-30 hover:opacity-70 cursor-pointer"
            style={{
              ...position,
              backgroundColor: "var(--neutral-100)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            title={`${card.title} (${card.status})`}
          >
            {/* Status dot */}
            <div
              className="w-2 h-2 rounded-full mb-1"
              style={{ backgroundColor: getStatusDotColor(card.status) }}
            />
            {/* Title */}
            <div className="text-xs text-center px-2 truncate w-full">
              {card.title}
            </div>
          </div>
        );
      })}
    </>
  );
}

