/**
 * OneNav Bubble Field - Renders spheres with navigation
 * 
 * Handles:
 * - Tap to focus (preview state)
 * - Double tap / second tap to enter
 * - Pan offset from joystick
 */

"use client";

import { useEffect, useState } from "react";
import { useNavStore } from "@/lib/oneview/nav-store";
import { useOneViewCoreStore } from "@/lib/oneview/core-store";

const BUBBLE_RADIUS = 180; // Distance from center
const BUBBLE_SIZE = 64; // Size of each bubble

export function OneNavBubbleField() {
  const navStore = useNavStore();
  const coreStore = useOneViewCoreStore();
  
  const { pathStack, focusedNodeId, panOffset, mode } = navStore;
  const { getCurrentBubbles, privateBubbles, globalBubbles } = coreStore;
  
  const [lastTappedId, setLastTappedId] = useState<string | null>(null);
  const [tapTimer, setTapTimer] = useState<NodeJS.Timeout | null>(null);
  
  // Get current context bubbles
  const currentContext = navStore.getCurrentContext();
  const bubbles = getCurrentBubbles();
  
  // Auto-focus first bubble if none focused
  useEffect(() => {
    if (bubbles.length > 0 && !focusedNodeId) {
      navStore.setFocusedNode(bubbles[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbles.length, focusedNodeId]);
  
  // Calculate positions in a circle with pan offset
  const getBubblePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const x = Math.cos(angle) * BUBBLE_RADIUS + panOffset.x;
    const y = Math.sin(angle) * BUBBLE_RADIUS + panOffset.y;
    return { x, y };
  };
  
  // Handle bubble tap
  const handleBubbleTap = (bubbleId: string) => {
    // Clear any existing tap timer
    if (tapTimer) {
      clearTimeout(tapTimer);
      setTapTimer(null);
    }
    
    if (focusedNodeId === bubbleId) {
      // Second tap on focused sphere → Enter
      navStore.enterNode(bubbleId);
      setLastTappedId(null);
    } else {
      // First tap → Focus
      navStore.setFocusedNode(bubbleId);
      setLastTappedId(bubbleId);
      
      // Set timer to clear lastTappedId after delay
      const timer = setTimeout(() => {
        setLastTappedId(null);
      }, 500);
      setTapTimer(timer);
    }
  };
  
  // Get bubble icon
  const getBubbleIcon = (bubble: any) => {
    return bubble.icon || "●";
  };
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {bubbles.map((bubble, index) => {
        const position = getBubblePosition(index, bubbles.length);
        const isFocused = focusedNodeId === bubble.id;
        const isEntered = navStore.isEntered(bubble.id);
        
        return (
          <div
            key={bubble.id}
            className={`absolute rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isFocused ? "opacity-100 z-10" : "opacity-40 hover:opacity-60"
            }`}
            style={{
              width: `${BUBBLE_SIZE}px`,
              height: `${BUBBLE_SIZE}px`,
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: `translate(-50%, -50%) ${isFocused ? "scale(1.3)" : "scale(1)"}`,
              backgroundColor: isFocused ? "var(--neutral-100)" : "transparent",
              border: `1px solid var(--border)`,
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleBubbleTap(bubble.id);
            }}
            title={bubble.title}
          >
            <div className="text-2xl">{getBubbleIcon(bubble)}</div>
            {bubble.tags && bubble.tags.length > 0 && (
              <div className="absolute -top-1 -right-1 text-xs">
                {bubble.tags.includes("Hot") ? "🔥" : "📈"}
              </div>
            )}
            {isEntered && (
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs opacity-60">
                ✓
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

