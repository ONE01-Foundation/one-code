"use client";

import { useState, useEffect } from "react";

interface TopBarProps {
  theme: "light" | "dark";
  aiText: string | null;
  isRTL: boolean;
}

export default function TopBar({ theme, aiText, isRTL }: TopBarProps) {
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

  if (!displayText) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-30 pointer-events-none
        h-32 bg-gradient-to-b ${
          theme === "dark"
            ? "from-black/90 via-black/70 to-transparent"
            : "from-white/90 via-white/70 to-transparent"
        }`}
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div
        className={`absolute top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8
          transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}
          text-center
        `}
      >
        <p
          className={`text-lg md:text-xl font-medium ${
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
