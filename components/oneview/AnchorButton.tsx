/**
 * Anchor Button - Bottom fixed anchor bubble
 * 
 * Tap: go back one level
 * Long-press: go Home (root)
 * Double-tap: open Voice Mode
 */

"use client";

import { useState, useRef } from "react";
import { Sphere } from "@/lib/oneview/types";

interface AnchorButtonProps {
  currentSphereId: string | null;
  spheres: Record<string, Sphere>;
  onTap: () => void;
  onLongPress: () => void;
  onDoubleTap: () => void;
}

export function AnchorButton({ currentSphereId, spheres, onTap, onLongPress, onDoubleTap }: AnchorButtonProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [tapTimer, setTapTimer] = useState<NodeJS.Timeout | null>(null);
  const tapCountRef = useRef(0);
  
  const currentSphere = currentSphereId ? spheres[currentSphereId] : spheres["root"];
  const iconKey = currentSphere?.iconKey || "home";
  
  const handleMouseDown = () => {
    // Start long-press timer
    const timer = setTimeout(() => {
      onLongPress();
      setLongPressTimer(null);
      tapCountRef.current = 0; // Reset tap count on long-press
    }, 500); // 500ms for long-press
    setLongPressTimer(timer);
  };
  
  const handleMouseUp = () => {
    // Cancel long-press if it was a tap
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
      
      // Handle double-tap detection
      tapCountRef.current += 1;
      
      if (tapCountRef.current === 1) {
        // First tap - wait for potential second tap
        const timer = setTimeout(() => {
          // Single tap - execute back navigation
          if (tapCountRef.current === 1) {
            onTap();
          }
          tapCountRef.current = 0;
          setTapTimer(null);
        }, 300); // 300ms window for double-tap
        setTapTimer(timer);
      } else if (tapCountRef.current === 2) {
        // Double tap detected
        if (tapTimer) {
          clearTimeout(tapTimer);
          setTapTimer(null);
        }
        onDoubleTap();
        tapCountRef.current = 0;
      }
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

