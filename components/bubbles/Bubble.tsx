"use client";

import CenterClock from "./CenterClock";
import type { Bubble as BubbleType } from "@/app/page";

interface BubbleProps {
  bubble: BubbleType;
  position: { x: number; y: number };
  scale: number;
  theme: "light" | "dark";
  isCentered: boolean;
  isOrigin: boolean;
  isIdle: boolean;
  isMoving: boolean;
  isOriginCentered: boolean; // Whether the origin bubble is currently centered
  onClick: () => void;
  showClock?: boolean;
  onThemeToggle?: () => void;
}

export default function Bubble({
  bubble,
  position,
  scale,
  theme,
  isCentered,
  isOrigin,
  isIdle,
  isMoving,
  isOriginCentered,
  onClick,
  showClock = false,
  onThemeToggle,
}: BubbleProps) {
  const size = 120 * scale;
  const borderRadius = "50%"; // Always circle

  // Opacity based on visibility rules
  let opacity = 1;
  
  if (isOriginCentered && isIdle && !isMoving) {
    // State A: Idle + centered on ORIGIN - hide all non-centered bubbles
    if (!isCentered) {
      opacity = 0;
    } else {
      opacity = 1; // Origin bubble stays visible
    }
  } else if (isMoving || !isIdle) {
    // State B: User is moving - show all bubbles with higher opacity
    opacity = isCentered ? 1 : 0.7;
  } else {
    // State C: Idle + centered on NON-origin - fade non-centered bubbles to low opacity
    if (isCentered) {
      opacity = 1;
    } else {
      opacity = 0.3; // Low background opacity
    }
  }

  // Border width - stronger for centered, especially origin
  const borderWidth = isCentered ? (isOrigin ? 2 : 1.5) : 1;

  const baseStyles = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius,
    transform: `translate(${position.x - size / 2}px, ${position.y - size / 2}px)`,
    transition: "transform 0.3s ease-out, opacity 0.4s ease-out, border-width 0.3s ease-out",
    position: "absolute" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto" as const,
    cursor: "pointer",
  };

  const gradientColor = theme === "dark" 
    ? "rgba(255, 255, 255, 0.15)" 
    : "rgba(0, 0, 0, 0.15)";
  const borderColor = theme === "dark"
    ? "rgba(255, 255, 255, 0.3)"
    : "rgba(0, 0, 0, 0.3)";

  // Format label as #07
  const label = `#${(bubble.value % 100).toString().padStart(2, "0")}`;

  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyles,
        background: `radial-gradient(circle, ${gradientColor} 0%, ${gradientColor} 60%, transparent 100%)`,
        border: `${borderWidth}px solid ${borderColor}`,
        opacity,
      }}
    >
      {isOrigin && isCentered ? (
        // Origin bubble: ONLY clock + date, positioned in upper area
        <div className="flex flex-col items-center gap-0.5 relative" style={{ marginTop: "-20px" }}>
          {showClock && onThemeToggle && (
            <CenterClock theme={theme} onToggle={onThemeToggle} />
          )}
        </div>
      ) : (
        // Other bubbles: icon + label + title when centered
        <div className="flex flex-col items-center gap-0.5 relative">
          <span className="text-xl">{bubble.icon}</span>
          <span
            className={`text-xs font-semibold ${
              theme === "dark" ? "text-white/90" : "text-black/90"
            }`}
          >
            {label}
          </span>
          {/* Show title only when centered */}
          {isCentered && (
            <span
              className={`text-[10px] font-medium ${
                theme === "dark" ? "text-white/70" : "text-black/70"
              }`}
            >
              {bubble.title}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
