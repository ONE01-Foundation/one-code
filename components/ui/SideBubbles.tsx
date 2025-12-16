/**
 * Side Bubbles Component
 * 
 * Renders 4 cards from active scope in side positions
 */

import { ActionCard } from "@/lib/types";

interface SideBubblesProps {
  cards: ActionCard[];
}

export function SideBubbles({ cards }: SideBubblesProps) {
  // Position 4 bubbles around the center
  const positions = [
    { top: "20%", left: "10%", transform: "translate(-50%, -50%)" },
    { top: "20%", right: "10%", transform: "translate(50%, -50%)" },
    { bottom: "20%", left: "10%", transform: "translate(-50%, 50%)" },
    { bottom: "20%", right: "10%", transform: "translate(50%, 50%)" },
  ];
  
  return (
    <>
      {cards.slice(0, 4).map((card, index) => {
        const position = positions[index];
        if (!position) return null;
        
        return (
          <div
            key={card.id}
            className="absolute w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 opacity-30 hover:opacity-60"
            style={{
              ...position,
              backgroundColor: "var(--neutral-100)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            title={`${card.title}: ${card.subtitle}`}
          >
            <div className="text-xs text-center px-2 truncate w-full">
              {card.title}
            </div>
          </div>
        );
      })}
    </>
  );
}

