"use client";

import { useState, useEffect, useRef } from "react";

interface BottomBarProps {
  theme: "light" | "dark";
  onBackToHome: () => void;
  isRTL: boolean;
}

export default function BottomBar({
  theme,
  onBackToHome,
  isRTL,
}: BottomBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start as icon-only, expand briefly on first appearance
    setIsExpanded(true);
    
    const timer = setTimeout(() => {
      if (!isHovered && !isPressed) {
        setIsExpanded(false);
      }
    }, 2000);

    timeoutRef.current = timer;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isHovered, isPressed]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsExpanded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const timer = setTimeout(() => {
      if (!isPressed) {
        setIsExpanded(false);
      }
    }, 2000) as NodeJS.Timeout;
    timeoutRef.current = timer;
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    setIsExpanded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 2000) as NodeJS.Timeout;
    timeoutRef.current = timer;
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-30 pointer-events-none
        h-40 bg-gradient-to-t ${
          theme === "dark"
            ? "from-black/90 via-black/70 to-transparent"
            : "from-white/90 via-white/70 to-transparent"
        }`}
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center justify-center
          ${isRTL ? "flex-row-reverse" : ""}
        `}
        style={{
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 3rem)",
        }}
      >
        <button
          onClick={onBackToHome}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`
            flex items-center justify-center gap-2
            transition-all duration-300 pointer-events-auto
            ${
              theme === "dark"
                ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                : "bg-black/20 hover:bg-black/30 text-black border border-black/30"
            }
            backdrop-blur-sm shadow-lg active:scale-95
            ${isExpanded 
              ? "px-4 py-2 rounded-xl h-10" 
              : "w-10 h-10 rounded-full"
            }
          `}
          aria-label="Back to Home"
          title="Back to Home"
        >
          {isExpanded && (
            <span className="text-sm font-medium transition-all duration-300">
              Home
            </span>
          )}
          <span className="text-lg flex-shrink-0">🏠</span>
        </button>
      </div>
    </div>
  );
}
