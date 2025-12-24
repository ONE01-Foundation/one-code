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

  const words = displayText.split(" ");
  const firstWord = words[0];
  const lastWord = words[words.length - 1];
  const middleWords = words.slice(1, -1).join(" ");

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 pointer-events-none
        h-24 bg-gradient-to-b ${
          theme === "dark"
            ? "from-black via-black/80 to-transparent"
            : "from-white via-white/80 to-transparent"
        }`}
    >
      <div
        className={`absolute top-16 left-1/2 -translate-x-1/2 w-full max-w-2xl px-8
          transition-opacity duration-500 ${isVisible ? "opacity-100" : "opacity-0"}
          text-center
        `}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
      >
        <p
          className={`text-base md:text-lg ${
            theme === "dark" ? "text-white/80" : "text-black/80"
          }`}
        >
          <span className="font-bold">{firstWord}</span>
          {middleWords && ` ${middleWords} `}
          <span className="font-bold">{lastWord}</span>
        </p>
      </div>
    </div>
  );
}

