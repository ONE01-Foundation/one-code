"use client";

import { useState, useEffect } from "react";

interface TopBarProps {
  theme: "light" | "dark";
  aiText: string | null;
  isRTL: boolean;
  isTransitioning?: boolean;
}

export default function TopBar({ theme, aiText, isRTL, isTransitioning = false }: TopBarProps) {
  const [displayText, setDisplayText] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (aiText) {
      setDisplayText(aiText);
      setIsVisible(true);
      
      // Hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [aiText]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-30 pointer-events-none
        h-40 transition-all duration-300 ${
          isTransitioning ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
        }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        background: theme === "dark"
          ? "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.5) 60%, transparent 100%)"
          : "radial-gradient(ellipse 100% 60% at 50% 0%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.5) 60%, transparent 100%)",
      }}
    >
      <div
        className={`absolute top-28 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8
          transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}
          text-center
        `}
      >
        <p
          className={`text-xl md:text-2xl font-medium ${
            theme === "dark" ? "text-white/90" : "text-black/90"
          }`}
          style={{
            lineHeight: "1.5",
            textAlign: "center",
          }}
        >
          {displayText}
        </p>
      </div>
    </div>
  );
}
