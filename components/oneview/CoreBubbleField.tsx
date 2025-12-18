/**
 * Core Bubble Field - Renders bubbles in a circle
 * 
 * All bubbles same size, only center bubble scales up
 */

"use client";

import { useEffect } from "react";
import { useOneViewCoreStore } from "@/lib/oneview/core-store";

const BUBBLE_RADIUS = 180; // Distance from center

export function CoreBubbleField() {
  const {
    getCurrentBubbles,
    navigation,
    setCenteredBubble,
    enterBubble,
  } = useOneViewCoreStore();
  
  const bubbles = getCurrentBubbles();
  const { centeredBubbleId } = navigation;
  
  // Auto-center first bubble if none centered
  useEffect(() => {
    if (bubbles.length > 0 && !centeredBubbleId) {
      setCenteredBubble(bubbles[0].id);
    }
  }, [bubbles.length, centeredBubbleId]);
  
  // Calculate positions in a circle
  const getBubblePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * BUBBLE_RADIUS;
    const y = Math.sin(angle) * BUBBLE_RADIUS;
    return { x, y };
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {bubbles.map((bubble, index) => {
        const position = getBubblePosition(index, bubbles.length);
        const isCentered = centeredBubbleId === bubble.id;
        
        return (
          <div
            key={bubble.id}
            className={`absolute w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isCentered ? "opacity-100 z-10" : "opacity-40 hover:opacity-60"
            }`}
            style={{
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: `translate(-50%, -50%) ${isCentered ? "scale(1.3)" : "scale(1)"}`,
              backgroundColor: isCentered ? "var(--neutral-100)" : "transparent",
              border: `1px solid var(--border)`,
              pointerEvents: "auto",
            }}
            onClick={() => {
              if (isCentered) {
                // Enter bubble
                enterBubble(bubble.id);
              } else {
                // Center this bubble
                setCenteredBubble(bubble.id);
              }
            }}
            title={bubble.title}
          >
            <div className="text-2xl">{bubble.icon}</div>
            {bubble.tags && bubble.tags.length > 0 && (
              <div className="absolute -top-1 -right-1 text-xs">
                {bubble.tags.includes("Hot") ? "🔥" : "📈"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

