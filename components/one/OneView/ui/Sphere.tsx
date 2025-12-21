/**
 * Sphere - Individual sphere component with cards
 */

"use client";

import { Sphere as SphereType, Card } from "@/lib/one/types";

interface SphereProps {
  sphere: SphereType;
  isFocused?: boolean;
  onClick?: () => void;
  cards?: Card[];
  onCardComplete?: (cardId: string) => void;
}

export function Sphere({ sphere, isFocused = false, onClick, cards = [], onCardComplete }: SphereProps) {
  const size = isFocused ? 120 : 60;
  const activeCards = cards.filter(c => c.status === "active");
  const completedCards = cards.filter(c => c.status === "done");
  
  return (
    <div
      className="rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: isFocused ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${isFocused ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
      }}
      onClick={onClick}
    >
      <div className="text-sm font-medium mb-1">{sphere.name}</div>
      {isFocused && (
        <div className="text-xs opacity-60 mt-1">
          {activeCards.length} active, {completedCards.length} done
        </div>
      )}
      
      {/* Cards list (when focused) */}
      {isFocused && activeCards.length > 0 && (
        <div
          className="absolute top-full mt-4 w-64 max-h-48 overflow-y-auto rounded-lg p-2"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {activeCards.map((card) => (
            <div
              key={card.id}
              className="flex items-center justify-between p-2 mb-1 rounded hover:bg-white hover:bg-opacity-10"
            >
              <span className="text-xs flex-1">{card.text}</span>
              <button
                onClick={() => onCardComplete?.(card.id)}
                className="ml-2 px-2 py-1 text-xs rounded transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                }}
              >
                ✓
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
