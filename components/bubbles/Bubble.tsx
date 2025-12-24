"use client";

import CenterClock from "./CenterClock";
import type { Bubble as BubbleType, BubbleShape, BubbleFill } from "@/app/page";

interface BubbleProps {
  bubble: BubbleType;
  position: { x: number; y: number };
  scale: number;
  theme: "light" | "dark";
  shape: BubbleShape;
  fill: BubbleFill;
  isCentered: boolean;
  isHome: boolean;
  isIdle: boolean;
  onClick: () => void;
  showClock?: boolean;
  onThemeToggle?: () => void;
}

export default function Bubble({
  bubble,
  position,
  scale,
  theme,
  shape,
  fill,
  isCentered,
  isHome,
  isIdle,
  onClick,
  showClock = false,
  onThemeToggle,
}: BubbleProps) {
  const size = 120 * scale;
  const borderRadius = shape === "circle" ? "50%" : "24px";

  // Opacity based on centered state and idle state
  let opacity = isCentered ? 1 : 0.7;
  if (isIdle && !isCentered) {
    opacity = 0.4;
  }

  const baseStyles = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius,
    transform: `translate(${position.x - size / 2}px, ${position.y - size / 2}px) scale(${scale})`,
    transition: "transform 0.3s ease-out, opacity 0.3s ease-out",
    position: "absolute" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto" as const,
    cursor: "pointer",
  };

  // Gradient fade mode
  if (fill === "gradient") {
    const gradientColor = theme === "dark" 
      ? "rgba(255, 255, 255, 0.15)" 
      : "rgba(0, 0, 0, 0.15)";
    const borderColor = theme === "dark"
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(0, 0, 0, 0.3)";

    return (
      <div
        onClick={onClick}
        style={{
          ...baseStyles,
          background: `radial-gradient(circle, ${gradientColor} 0%, ${gradientColor} 60%, transparent 100%)`,
          border: `1px solid ${borderColor}`,
          opacity,
        }}
      >
        {/* Always show icon and number */}
        <div className="flex flex-col items-center gap-0.5 relative">
          <span className="text-xl">{bubble.icon}</span>
          <span
            className={`text-xs font-semibold ${
              theme === "dark" ? "text-white/90" : "text-black/90"
            }`}
          >
            {bubble.value}
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
          {/* Clock only in home bubble when centered */}
          {showClock && onThemeToggle && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
              <CenterClock theme={theme} onToggle={onThemeToggle} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Solid fill mode
  const solidBg = theme === "dark"
    ? "rgba(255, 255, 255, 0.1)"
    : "rgba(0, 0, 0, 0.1)";
  const solidBorder = theme === "dark"
    ? "rgba(255, 255, 255, 0.4)"
    : "rgba(0, 0, 0, 0.4)";

  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyles,
        background: solidBg,
        border: `1px solid ${solidBorder}`,
        opacity,
      }}
    >
      {/* Always show icon and number */}
      <div className="flex flex-col items-center gap-0.5 relative">
        <span className="text-xl">{bubble.icon}</span>
        <span
          className={`text-xs font-semibold ${
            theme === "dark" ? "text-white/90" : "text-black/90"
          }`}
        >
          {bubble.value}
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
        {/* Clock only in home bubble when centered */}
        {showClock && onThemeToggle && (
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <CenterClock theme={theme} onToggle={onThemeToggle} />
          </div>
        )}
      </div>
    </div>
  );
}
