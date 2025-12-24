"use client";

import { useState, useEffect, useRef } from "react";

interface InputBarProps {
  theme: "light" | "dark";
  isRTL: boolean;
}

const PLACEHOLDER_WORDS = ["think", "do", "feel", "now"];

export default function InputBar({ theme, isRTL }: InputBarProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mode, setMode] = useState<"private" | "global">("private");
  const [showModeLabel, setShowModeLabel] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const labelTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  // Cycle through placeholder words
  useEffect(() => {
    let wordInterval: NodeJS.Timeout | null = null;
    let idleCheckInterval: NodeJS.Timeout | null = null;

    const cycleWords = () => {
      setCurrentWordIndex((prev) => {
        const next = (prev + 1) % PLACEHOLDER_WORDS.length;
        // Stop at "now?" (last word)
        if (next === PLACEHOLDER_WORDS.length - 1) {
          if (wordInterval) {
            clearInterval(wordInterval);
            wordInterval = null;
          }
          return next;
        }
        return next;
      });
    };

    const checkIdle = () => {
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      // Restart cycle if idle for 8 seconds
      if (timeSinceInteraction > 8000) {
        setCurrentWordIndex(0);
        setIsVisible(true);
        lastInteractionRef.current = Date.now();
        // Restart word cycling
        if (!wordInterval) {
          wordInterval = setInterval(cycleWords, 2000);
        }
      }
    };

    // Initial delay before starting cycle
    const initialTimer = setTimeout(() => {
      wordInterval = setInterval(cycleWords, 2000); // Change word every 2 seconds
      idleCheckInterval = setInterval(checkIdle, 1000);
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      if (wordInterval) clearInterval(wordInterval);
      if (idleCheckInterval) clearInterval(idleCheckInterval);
    };
  }, []);

  const handleModeToggle = () => {
    setMode((prev) => (prev === "private" ? "global" : "private"));
    setShowModeLabel(true);
    
    if (labelTimeoutRef.current) {
      clearTimeout(labelTimeoutRef.current);
    }
    
    labelTimeoutRef.current = setTimeout(() => {
      setShowModeLabel(false);
    }, 3000) as NodeJS.Timeout;
  };

  const isLight = theme === "light";

  return (
    <div
      className={`fixed left-1/2 -translate-x-1/2 z-30 pointer-events-none
        ${isRTL ? "bottom-24" : "bottom-24"}
      `}
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0px) + 6rem)",
      }}
    >
      <div
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-2xl
          transition-all duration-300 pointer-events-auto
          ${isLight 
            ? "bg-white/20 backdrop-blur-md border border-black/10" 
            : "bg-black/20 backdrop-blur-md border border-white/10"
          }
        `}
      >
        {/* Placeholder text */}
        <div className="flex-1 min-w-0 text-center">
          <span
            className={`
              text-sm font-medium transition-all duration-500
              ${isLight ? "text-black/60" : "text-white/60"}
            `}
            key={currentWordIndex}
          >
            {PLACEHOLDER_WORDS[currentWordIndex]}?
          </span>
        </div>

        {/* Mode toggle button */}
        <button
          onClick={handleModeToggle}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${isLight
              ? "bg-black/10 hover:bg-black/20 text-black/70"
              : "bg-white/10 hover:bg-white/20 text-white/70"
            }
          `}
          aria-label={mode === "private" ? "Private" : "Global"}
        >
          <span className="text-sm">
            {mode === "private" ? "👤" : "🌍"}
          </span>
        </button>

        {/* Microphone button */}
        <button
          onClick={() => {
            lastInteractionRef.current = Date.now();
          }}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${isLight
              ? "bg-black/10 hover:bg-black/20 text-black/70"
              : "bg-white/10 hover:bg-white/20 text-white/70"
            }
          `}
          aria-label="Voice input"
        >
          <span className="text-sm">🎤</span>
        </button>
      </div>

      {/* Mode label tooltip */}
      {showModeLabel && (
        <div
          className={`
            absolute left-1/2 -translate-x-1/2 top-full mt-2
            px-3 py-1 rounded-full text-xs
            transition-opacity duration-300
            ${isLight
              ? "bg-black/20 text-black/90"
              : "bg-white/20 text-white/90"
            }
            backdrop-blur-sm
          `}
        >
          {mode === "private" ? "פרטי" : "גלובלי"}
        </div>
      )}
    </div>
  );
}

