"use client";

import { useState, useEffect, useRef } from "react";

interface InputBarProps {
  theme: "light" | "dark";
  isRTL: boolean;
}

const PLACEHOLDER_WORDS = ["Think", "Feel", "Do", "Now?"];

export default function InputBar({ theme, isRTL }: InputBarProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showCaret, setShowCaret] = useState(false);
  const [mode, setMode] = useState<"private" | "global">("private");
  const [showModeText, setShowModeText] = useState(false);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const caretIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modeTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());

  // Cycle through placeholder words
  useEffect(() => {
    let isCycling = true;

    const cycleWords = () => {
      if (!isCycling) return;
      
      setCurrentWordIndex((prev) => {
        const next = (prev + 1) % PLACEHOLDER_WORDS.length;
        // Stop at "Now?" (last word)
        if (next === PLACEHOLDER_WORDS.length - 1) {
          isCycling = false;
          if (wordIntervalRef.current) {
            clearInterval(wordIntervalRef.current);
            wordIntervalRef.current = null;
          }
          // Show caret briefly before "Now?"
          setTimeout(() => {
            setShowCaret(true);
            setTimeout(() => setShowCaret(false), 1000);
          }, 500);
          return next;
        }
        return next;
      });
    };

    // Initial delay before starting cycle
    const initialTimer = setTimeout(() => {
      wordIntervalRef.current = setInterval(cycleWords, 2000) as NodeJS.Timeout;
    }, 1000);

    // Check for idle and restart cycle
    const idleCheck = setInterval(() => {
      const timeSinceInteraction = Date.now() - lastInteractionRef.current;
      if (timeSinceInteraction > 8000 && !isCycling) {
        isCycling = true;
        setCurrentWordIndex(0);
        lastInteractionRef.current = Date.now();
        if (wordIntervalRef.current) {
          clearInterval(wordIntervalRef.current);
        }
        wordIntervalRef.current = setInterval(cycleWords, 2000) as NodeJS.Timeout;
      }
    }, 1000);

    return () => {
      clearTimeout(initialTimer);
      if (wordIntervalRef.current) clearInterval(wordIntervalRef.current);
      clearInterval(idleCheck);
    };
  }, []);

  const handleModeToggle = () => {
    setMode((prev) => {
      const newMode = prev === "private" ? "global" : "private";
      
      // Show mode text temporarily
      setShowModeText(true);
      if (modeTextTimeoutRef.current) {
        clearTimeout(modeTextTimeoutRef.current);
      }
      modeTextTimeoutRef.current = setTimeout(() => {
        setShowModeText(false);
      }, 1000) as NodeJS.Timeout;
      
      return newMode;
    });
    lastInteractionRef.current = Date.now();
  };

  const handleMicClick = () => {
    lastInteractionRef.current = Date.now();
  };

  const isLight = theme === "light";
  const displayText = showModeText 
    ? (mode === "private" ? "Private" : "Global")
    : PLACEHOLDER_WORDS[currentWordIndex];

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      style={{
        bottom: "calc(50% - 100px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className={`
          flex items-center gap-3 px-5 py-3 rounded-2xl
          transition-all duration-300 pointer-events-auto
          ${isLight 
            ? "bg-white/15 backdrop-blur-md border border-black/10" 
            : "bg-black/15 backdrop-blur-md border border-white/10"
          }
        `}
        style={{
          minWidth: "280px",
        }}
      >
        {/* Mode toggle button */}
        <button
          onClick={handleModeToggle}
          className={`
            w-9 h-9 rounded-full flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${isLight
              ? "bg-black/10 hover:bg-black/20"
              : "bg-white/10 hover:bg-white/20"
            }
          `}
          aria-label={mode === "private" ? "Private" : "Global"}
        >
          <img
            src={mode === "private" ? "/private-icon.svg" : "/global-icon.svg"}
            alt={mode === "private" ? "Private" : "Global"}
            width={18}
            height={18}
            className={isLight ? "opacity-70" : "opacity-70 brightness-0 invert"}
          />
        </button>

        {/* Input text */}
        <div className="flex-1 min-w-0 text-center">
          <span
            className={`
              text-base font-medium transition-all duration-500
              ${isLight ? "text-black/70" : "text-white/70"}
            `}
          >
            {displayText}
            {showCaret && displayText === "Now?" && (
              <span className="animate-pulse">|</span>
            )}
          </span>
        </div>

        {/* Microphone button */}
        <button
          onClick={handleMicClick}
          className={`
            w-9 h-9 rounded-full flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            ${isLight
              ? "bg-black/10 hover:bg-black/20"
              : "bg-white/10 hover:bg-white/20"
            }
          `}
          aria-label="Voice input"
        >
          <img
            src="/microphone-icon.svg"
            alt="Microphone"
            width={18}
            height={18}
            className={isLight ? "opacity-70" : "opacity-70 brightness-0 invert"}
          />
        </button>
      </div>
    </div>
  );
}
