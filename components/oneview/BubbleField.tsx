/**
 * Bubble Field - Surrounding bubbles (8-12 faint bubbles with icons)
 */

"use client";

import { useOneViewStore } from "@/lib/oneview/store";
import { useState, useEffect, useRef } from "react";

const ICON_KEYS = ["health", "work", "money", "learning", "relationships", "life", "project", "home"];

export function BubbleField() {
  const { spheres, viewState, setCenteredBubble, navigateToSphere } = useOneViewStore();
  const { currentSphereId, centeredBubbleId } = viewState;
  const [dragState, setDragState] = useState<{ isDragging: boolean; startX: number; startY: number } | null>(null);
  const fieldRef = useRef<HTMLDivElement>(null);
  
  // Get bubbles to display (spheres + cards)
  const currentSphere = currentSphereId ? spheres[currentSphereId] : spheres["root"];
  const bubbleIds = [
    ...(currentSphere?.childrenSphereIds || []),
    ...(currentSphere?.cardIds || []),
  ].slice(0, 12); // Max 12 bubbles
  
  // Calculate positions in a circle
  const getBubblePosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2;
    const radius = 180; // Distance from center
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  };
  
  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragState({
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
    });
  };
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragState?.isDragging) return;
    
    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;
    
    // Find bubble nearest to center (simplified: just update based on drag)
    // In a real implementation, this would calculate which bubble is closest to center
  };
  
  const handleMouseUp = () => {
    setDragState(null);
  };
  
  // Find bubble nearest center (simplified)
  useEffect(() => {
    if (bubbleIds.length > 0 && !centeredBubbleId) {
      // Auto-center first bubble
      setCenteredBubble(bubbleIds[0]);
    }
  }, [bubbleIds.length, centeredBubbleId]);
  
  return (
    <div
      ref={fieldRef}
      className="absolute inset-0"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {bubbleIds.map((bubbleId, index) => {
        const position = getBubblePosition(index, bubbleIds.length);
        const isCentered = centeredBubbleId === bubbleId;
        const sphere = spheres[bubbleId];
        const iconKey = sphere?.iconKey || ICON_KEYS[index % ICON_KEYS.length];
        
        return (
          <div
            key={bubbleId}
            className={`absolute w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
              isCentered ? "opacity-100 scale-110" : "opacity-30 hover:opacity-60"
            }`}
            style={{
              left: `calc(50% + ${position.x}px)`,
              top: `calc(50% + ${position.y}px)`,
              transform: "translate(-50%, -50%)",
              backgroundColor: isCentered ? "var(--neutral-100)" : "transparent",
              border: `1px solid var(--border)`,
            }}
            onClick={() => {
              if (sphere) {
                // Navigate into sphere
                navigateToSphere(bubbleId);
              }
            }}
            title={sphere?.name || bubbleId}
          >
            <div className="text-2xl">{getIcon(iconKey)}</div>
          </div>
        );
      })}
    </div>
  );
}

function getIcon(key: string): string {
  const icons: Record<string, string> = {
    health: "❤️",
    work: "💼",
    money: "💰",
    learning: "📚",
    relationships: "🤝",
    life: "✨",
    project: "📁",
    home: "🏠",
  };
  return icons[key] || "●";
}

