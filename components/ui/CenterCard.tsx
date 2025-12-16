/**
 * Center Card Component (Active Card)
 * 
 * Renders the single active card in the center
 * Single tap to complete (✓) or defer (Next/Later)
 */

import { Card } from "@/lib/types";

interface CenterCardProps {
  card: Card;
  onComplete: () => void;
  onDefer: () => void;
}

export function CenterCard({ card, onComplete, onDefer }: CenterCardProps) {
  return (
    <div className="relative">
      {/* Center bubble - active card */}
      <div
        className="w-64 h-64 rounded-full flex flex-col items-center justify-center p-8 transition-all duration-300 cursor-pointer hover:opacity-90"
        style={{
          backgroundColor: "var(--neutral-100)",
          border: "2px solid var(--border)",
          color: "var(--foreground)",
        }}
        onClick={onComplete}
      >
        <div className="text-2xl font-bold text-center mb-2">{card.title}</div>
        {card.intent && (
          <div className="text-sm opacity-60 text-center">{card.intent}</div>
        )}
      </div>
      
      {/* Action buttons */}
      <div className="flex gap-4 mt-6 justify-center">
        <button
          onClick={onComplete}
          className="px-6 py-3 rounded-full font-medium transition-opacity duration-200 hover:opacity-90"
          style={{
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          ✓ Complete
        </button>
        <button
          onClick={onDefer}
          className="px-6 py-3 rounded-full font-medium transition-opacity duration-200 hover:opacity-90"
          style={{
            backgroundColor: "var(--background)",
            border: "2px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
}

