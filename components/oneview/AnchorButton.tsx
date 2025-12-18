/**
 * Anchor Button - Bottom fixed anchor bubble
 * 
 * Tap: go back one level
 * Long-press: go Home (root)
 */

"use client";

import { useState } from "react";
import { Sphere } from "@/lib/oneview/types";

interface AnchorButtonProps {
  currentSphereId: string | null;
  spheres: Record<string, Sphere>;
  onTap: () => void;
  onLongPress: () => void;
}

export function AnchorButton({ currentSphereId, spheres, onTap, onLongPress }: AnchorButtonProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const currentSphere = currentSphereId ? spheres[currentSphereId] : spheres["root"];
  const iconKey = currentSphere?.iconKey || "home";
  
  const handleMouseDown = () => {
    const timer = setTimeout(() => {
      onLongPress();
    }, 500); // 500ms for long-press
    setLongPressTimer(timer);
  };
  
  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      // If not long-press, it's a tap
      onTap();
    }
  };
  
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-opacity hover:opacity-80"
      style={{
        backgroundColor: "var(--foreground)",
        color: "var(--background)",
      }}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      title="Tap: Back | Long-press: Home"
    >
      <div className="text-2xl">{getIcon(iconKey)}</div>
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

