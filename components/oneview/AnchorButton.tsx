/**
 * Anchor Button - Bottom fixed anchor bubble
 * 
 * Hold-to-Talk: Hold without movement for 350ms => Voice Mode
 * Joystick: Drag > 12px => Navigate bubbles
 * Tap: go back one level (if no hold/joystick)
 * Long-press: go Home (root) - TODO: implement if needed
 */

"use client";

import { useState, useRef } from "react";
import { Sphere } from "@/lib/oneview/types";
import { useAnchorGesture } from "@/hooks/useAnchorGesture";

interface AnchorButtonProps {
  currentSphereId: string | null;
  spheres: Record<string, Sphere>;
  onTap: () => void;
  onLongPress: () => void;
  onVoiceStart: () => void;
  icon?: string; // Optional icon override (for CoreOneView)
}

export function AnchorButton({ currentSphereId, spheres, onTap, onLongPress, onVoiceStart, icon }: AnchorButtonProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const tapHandledRef = useRef(false);
  
  // Use provided icon or fallback to sphere icon or home
  const currentSphere = currentSphereId ? spheres[currentSphereId] : null;
  const iconKey = icon || currentSphere?.iconKey || "🏠";
  
  const {
    mode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  } = useAnchorGesture({
    onJoystickStart: () => {
      // Joystick started - cancel any tap/long-press
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      tapHandledRef.current = true;
    },
    onJoystickMove: (dx, dy) => {
      // Joystick movement - handle bubble navigation
      // This would be handled by BubbleField or OneView
      tapHandledRef.current = true;
    },
    onJoystickEnd: () => {
      tapHandledRef.current = false;
    },
    onVoiceStart: () => {
      // Cancel long-press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      tapHandledRef.current = true;
      onVoiceStart();
    },
    onVoiceEnd: () => {
      // Voice mode ends but overlay stays open until user confirms/cancels
      tapHandledRef.current = false;
    },
  });
  
  const handleDown = (e: React.PointerEvent) => {
    // Start long-press timer (for Home navigation)
    const timer = setTimeout(() => {
      if (mode === "idle" || mode === "voicePending") {
        onLongPress();
      }
      setLongPressTimer(null);
    }, 500);
    setLongPressTimer(timer);
    
    // Start gesture detection
    handlePointerDown(e);
  };
  
  const handleUp = (e: React.PointerEvent) => {
    // Cancel long-press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Handle gesture end
    handlePointerUp();
    
    // If no gesture was handled, treat as tap (back navigation)
    if (!tapHandledRef.current && mode === "idle") {
      onTap();
    }
    tapHandledRef.current = false;
  };
  
  // Show visual feedback for voice mode
  const isVoiceActive = mode === "voiceActive" || mode === "voicePending";
  
  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
      style={{
        backgroundColor: isVoiceActive ? "var(--neutral-100)" : "var(--foreground)",
        color: isVoiceActive ? "var(--foreground)" : "var(--background)",
        border: isVoiceActive ? "2px solid var(--border)" : "none",
        transform: isVoiceActive ? "scale(1.1)" : "scale(1)",
      }}
      onPointerDown={handleDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handleUp}
      onPointerCancel={handlePointerCancel}
      title="Hold: Voice | Drag: Navigate | Tap: Back"
    >
      <div className="text-2xl">
        {isVoiceActive ? "🎤" : (typeof iconKey === "string" && iconKey.length <= 2 ? iconKey : getIcon(iconKey))}
      </div>
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

