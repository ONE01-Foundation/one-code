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
      // Show text as whole words (no typing animation)
      setDisplayText(aiText);
      setIsVisible(true);
      
      // Hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [aiText]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-30 pointer-events-none
        transition-all duration-300 ${
          isTransitioning ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
        }`}
      style={{
        height: "25vh",
        minHeight: "200px",
        paddingTop: "env(safe-area-inset-top, 0px)",
        background: theme === "dark"
          ? "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, transparent 100%)"
          : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.3) 70%, transparent 100%)",
      }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center w-full px-8"
        style={{
          transition: "opacity 0.6s ease-out",
          opacity: isVisible ? 1 : 0,
        }}
      >
        <p
          className={`text-2xl md:text-3xl lg:text-4xl font-medium ${
            theme === "dark" ? "text-white/90" : "text-black/90"
          }`}
          style={{
            lineHeight: "1.4",
            textAlign: "center",
          }}
        >
          {displayText}
        </p>
      </div>
    </div>
  );
}
