"use client";

import { useState, useEffect } from "react";
import CenterClock from "./CenterClock";
import type { Bubble as BubbleType } from "@/app/page";

// Simple clock display for origin bubble when not centered (no button)
const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

function OriginClockDisplay({ theme, isRTL = false }: { theme: "light" | "dark"; isRTL?: boolean }) {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
      
      // Format date - remove year, use full Hebrew day names when RTL
      const day = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      if (isRTL) {
        const weekdayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const weekday = HEBREW_DAYS[weekdayIndex];
        setDate(`${weekday}, ${day}.${month}`);
      } else {
        const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
        setDate(`${weekday}, ${day}.${month}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [isRTL]);

  return (
    <div className="flex flex-col items-center gap-0.5" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
      <span 
        className={`text-xl font-mono font-semibold tracking-wider ${
          theme === "dark" ? "text-white/90" : "text-black/90"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {time}
      </span>
      <span 
        className={`text-[10px] font-medium ${
          theme === "dark" ? "text-white/70" : "text-black/70"
        }`}
        style={{ userSelect: "none", WebkitUserSelect: "none" }}
      >
        {date}
      </span>
    </div>
  );
}

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
  onOpenSettings?: () => void;
  mousePosition?: { x: number; y: number } | null; // For desktop spotlight effect
  isRTL?: boolean;
  mode?: "private" | "global";
  hasSubBubbles?: boolean; // Whether this bubble has sub-bubbles
  subBubbleIndex?: number; // Current active sub-bubble index
  subBubblesCount?: number; // Total count of sub-bubbles
  parentBubble?: BubbleType; // Parent bubble when showing sub-bubble content
  subBubbles?: BubbleType[]; // Sub-bubbles array
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
  onOpenSettings,
  mousePosition = null,
  isRTL = false,
  mode = "private",
  hasSubBubbles = false,
  subBubbleIndex = 0,
  subBubblesCount = 0,
  parentBubble,
  subBubbles,
}: BubbleProps) {
  // Use RTL title and aiText if available and RTL is enabled
  const displayTitle = isRTL && bubble.titleRTL ? bubble.titleRTL : bubble.title;
  const displayAiText = isRTL && bubble.aiTextRTL ? bubble.aiTextRTL : bubble.aiText;
  
  // If showing sub-bubble content, use parent's icon when centered
  const displayIcon = (hasSubBubbles && isCentered && parentBubble) ? parentBubble.icon : bubble.icon;
  const size = isCentered ? 280 : 120 * scale;
  const borderRadius = "50%"; // Always circle

  // Base opacity based on visibility rules
  let baseOpacity = 1;
  
  if (isOriginCentered && isIdle && !isMoving) {
    // State A: Idle + centered on ORIGIN
    if (!isCentered) {
      // In global mode: show all bubbles with low opacity
      // In private mode: hide all non-centered bubbles
      baseOpacity = mode === "global" ? 0.3 : 0;
    } else {
      baseOpacity = 1; // Origin bubble stays visible
    }
  } else if (isMoving || !isIdle) {
    // State B: User is moving - show all bubbles with higher opacity
    baseOpacity = isCentered ? 1 : 0.7;
  } else {
    // State C: Idle + centered on NON-origin - fade non-centered bubbles to low opacity
    if (isCentered) {
      baseOpacity = 1;
    } else {
      baseOpacity = 0.3; // Low background opacity
    }
  }

  // Desktop spotlight effect: distance-based opacity and scale (including origin bubble)
  // When origin is centered and idle, reveal hidden bubbles on hover
  let spotlightOpacity = baseOpacity;
  let spotlightIconScale = 1;
  let isSpotlighted = false;
  let spotlightGlowIntensity = 0;
  
  if (mousePosition) {
    const bubbleCenterX = position.x;
    const bubbleCenterY = position.y;
    const distance = Math.sqrt(
      Math.pow(mousePosition.x - bubbleCenterX, 2) + Math.pow(mousePosition.y - bubbleCenterY, 2)
    );
    
    const spotlightRadius = 180; // Radius for spotlight effect
    if (distance < spotlightRadius) {
      isSpotlighted = true;
      // Smooth falloff: 1.0 at cursor, fade to baseOpacity at spotlightRadius
      const spotlightFactor = 1 - (distance / spotlightRadius);
      
      // Special case: if origin is centered and bubble was hidden (baseOpacity = 0), reveal it on hover
      if (isOriginCentered && isIdle && !isMoving && !isCentered && baseOpacity === 0) {
        // Reveal hidden bubbles when hovered (fade from 0 to 0.8)
        spotlightOpacity = spotlightFactor * 0.8;
    } else {
        // Normal spotlight effect: increase opacity smoothly
        spotlightOpacity = Math.min(1.0, baseOpacity + (1.0 - baseOpacity) * spotlightFactor * 0.8);
  }

      // Scale up icon: 1.0 to 1.3 based on distance (only for non-origin bubbles)
      if (!isOrigin) {
        spotlightIconScale = 1 + (0.3 * spotlightFactor);
      }
      // Glow intensity for all bubbles
      spotlightGlowIntensity = spotlightFactor;
    }
  }
  
  const opacity = spotlightOpacity;

  // Calculate transform - ensure bubble stays centered when size changes
  // Use left/top positioning with translate to keep bubble centered during size transitions
  const baseStyles = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: "50%",
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: `translate(-50%, -50%)`, // Always center from the position point, regardless of size
    transformOrigin: "center center",
    transition: "left 0.3s cubic-bezier(0.4, 0, 0.2, 1), top 0.3s cubic-bezier(0.4, 0, 0.2, 1), width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s ease-out, background 0.3s ease-out, box-shadow 0.2s ease-out",
    position: "absolute" as const,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "auto" as const,
    cursor: "pointer",
    overflow: "hidden",
  };

  // Format label as #07
  const label = `#${(bubble.value % 100).toString().padStart(2, "0")}`;

  // Style for bubbles: thin gradient border instead of fill
  // Creates soft, ethereal semi-circular appearance
  const borderGradientTopColor = "transparent"; // Fully transparent at top
  
  const borderGradientMiddleColor = theme === "dark"
    ? "rgba(255, 255, 255, 0.15)"
    : "rgba(255, 255, 255, 0.3)";
  
  const borderGradientBottomColor = theme === "dark"
    ? "rgba(255, 255, 255, 0.25)"
    : "rgba(255, 255, 255, 0.4)";
  

  // Add glow effect for bubbles when spotlighted (not origin, not centered)
  // Reduced glow intensity for subtler effect
  const glowColor = theme === "dark"
    ? `rgba(255, 255, 255, ${0.15 * spotlightGlowIntensity})`
    : `rgba(0, 0, 0, ${0.15 * spotlightGlowIntensity})`;
  const boxShadow = (!isOrigin && !isCentered && isSpotlighted && spotlightGlowIntensity > 0)
    ? `0 0 ${10 + 15 * spotlightGlowIntensity}px ${glowColor}`
    : "none";

  return (
    <div
      onClick={onClick}
      style={{
        ...baseStyles,
        // Full circle - no border or fill
        background: "transparent",
        border: "none",
        borderRadius: "50%",
        boxShadow: isCentered 
          ? boxShadow
          : "none",
        opacity,
      }}
    >
      {isOrigin ? (
        // Origin bubble: show clock + date (always, whether centered or not)
        isCentered ? (
          // When centered: full clock with theme toggle button
        <div className="flex flex-col items-center gap-0.5 relative" style={{ marginTop: "-20px" }}>
          {showClock && onThemeToggle && (
              <CenterClock 
                theme={theme} 
                onToggle={onThemeToggle} 
                isRTL={isRTL}
              />
          )}
        </div>
      ) : (
          // When NOT centered: simple time and date display (no button)
          <OriginClockDisplay theme={theme} isRTL={isRTL} />
        )
      ) : (
        // Other bubbles: icon with title when centered or spotlighted
        <div 
          className="flex flex-col items-center relative"
          style={{
            justifyContent: isCentered ? "flex-start" : "center",
            paddingTop: isCentered ? "0px" : "0",
          }}
        >
          {/* When centered: bigger icon, title, and aiText */}
          {isCentered ? (
            <div className="flex flex-col items-center gap-2" style={{ marginTop: "-60px" }}>
              {/* Bigger icon at top - show parent bubble icon if has sub-bubbles and showing sub-bubble, otherwise show bubble icon */}
              <span 
                className="text-5xl"
                style={{
                  display: "block",
                  lineHeight: "1",
                  marginBottom: "4px",
                }}
              >
                {hasSubBubbles && parentBubble && subBubbleIndex !== undefined && subBubbleIndex !== null ? parentBubble.icon : displayIcon}
              </span>
              {/* Title */}
          <span
                className={`text-lg font-semibold whitespace-nowrap ${
              theme === "dark" ? "text-white/90" : "text-black/90"
            }`}
                style={{
                  lineHeight: "1.3",
                  display: "block",
                }}
          >
                {displayTitle}
              </span>
              {/* Sub-bubble indicator */}
              {hasSubBubbles && subBubblesCount > 0 && subBubbleIndex !== undefined && subBubbleIndex !== null && subBubbleIndex > 0 && (
                <span
                  className={`text-xs font-medium ${
                    theme === "dark" ? "text-white/50" : "text-black/50"
                  }`}
                  style={{
                    marginTop: "-4px",
                    marginBottom: "2px",
                  }}
                >
                  {subBubbleIndex} / {subBubblesCount}
                </span>
              )}
              {/* AI Text */}
              {displayAiText && (
                <span
                  className={`text-sm font-light text-center px-4 ${
                    theme === "dark" ? "text-white/60" : "text-black/60"
                  }`}
                  style={{
                    lineHeight: "1.5",
                    display: "block",
                    maxWidth: "220px",
                    marginTop: "2px",
                  }}
                >
                  {displayAiText}
                </span>
              )}
            </div>
          ) : (
            <>
              {/* Emoji - always visible, stays in fixed position (bigger) */}
              <span 
                className="text-2xl"
                style={{
                  transform: `scale(${spotlightIconScale})`,
                  transition: "transform 0.2s ease-out",
                  display: "block",
                  lineHeight: "1",
                  marginBottom: isSpotlighted ? "6px" : "0",
                }}
              >
                {bubble.icon}
          </span>
              {/* Title - appears below emoji when spotlighted */}
              {isSpotlighted && (
            <span
                  className={`text-[11px] font-medium whitespace-nowrap ${
                    theme === "dark" ? "text-white/90" : "text-black/90"
              }`}
                  style={{
                    opacity: spotlightOpacity,
                    transition: "opacity 0.2s ease-out",
                    lineHeight: "1.3",
                    display: "block",
                  }}
            >
              {displayTitle}
            </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
