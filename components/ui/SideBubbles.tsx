/**
 * Side Bubbles Component - One Bubble System v0.1
 * 
 * Renders 3 bubbles: NEXT, LATER, DONE
 * Navigation/preview only, not a state source
 */

import { Bubble } from "@/lib/bubbles";

interface SideBubblesProps {
  bubbles: Bubble[];
  onBubbleClick?: (bubble: Bubble) => void;
}

export function SideBubbles({ bubbles, onBubbleClick }: SideBubblesProps) {
  // Position 3 bubbles around the center
  const positions = [
    { top: "20%", left: "10%", transform: "translate(-50%, -50%)" },
    { top: "20%", right: "10%", transform: "translate(50%, -50%)" },
    { bottom: "20%", left: "50%", transform: "translate(-50%, 50%)" },
  ];
  
  const getKindDotColor = (kind: Bubble["kind"]) => {
    switch (kind) {
      case "done":
        return "var(--neutral-400)"; // Subtle gray
      case "later":
        return "var(--neutral-300)"; // Lighter gray
      case "next":
        return "var(--foreground)"; // Foreground color
      default:
        return "var(--neutral-200)";
    }
  };
  
  return (
    <>
      {bubbles.slice(0, 3).map((bubble, index) => {
        const position = positions[index];
        if (!position) return null;
        
        return (
          <div
            key={bubble.id}
            onClick={() => onBubbleClick?.(bubble)}
            className="absolute w-20 h-20 rounded-full flex flex-col items-center justify-center transition-all duration-300 opacity-30 hover:opacity-70 cursor-pointer"
            style={{
              ...position,
              backgroundColor: "var(--neutral-100)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
            title={`${bubble.title} (${bubble.kind})`}
          >
            {/* Kind dot */}
            <div
              className="w-2 h-2 rounded-full mb-1"
              style={{ backgroundColor: getKindDotColor(bubble.kind) }}
            />
            {/* Title */}
            <div className="text-xs text-center px-2 truncate w-full">
              {bubble.title}
            </div>
            {/* Meta (optional) */}
            {bubble.meta && (
              <div className="text-[10px] opacity-60 mt-0.5">
                {bubble.meta}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

