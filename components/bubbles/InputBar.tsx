"use client";

import { useState, useEffect, useRef } from "react";

interface InputBarProps {
  theme: "light" | "dark";
  isRTL: boolean;
}

const PLACEHOLDER_WORDS = ["Think", "Feel", "Do", "Now?"];
const LONG_IDLE_TIME = 30000; // 30 seconds of idle before hint cycle restarts

export default function InputBar({ theme, isRTL }: InputBarProps) {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showCaret, setShowCaret] = useState(false);
  const [mode, setMode] = useState<"private" | "global">("private");
  const [showModeText, setShowModeText] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const caretIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modeTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const hasRunInitialCycleRef = useRef<boolean>(false);

  // Cycle through placeholder words - only on first open or after very long idle
  useEffect(() => {
    if (isFocused || inputValue || hasInteracted) return; // Don't cycle when focused, has value, or user has interacted
    
    let isCycling = true;

    const cycleWords = () => {
      if (!isCycling || isFocused || inputValue || hasInteracted) return;
      
      setCurrentWordIndex((prev) => {
        const next = (prev + 1) % PLACEHOLDER_WORDS.length;
        // Stop at "Now?" (last word)
        if (next === PLACEHOLDER_WORDS.length - 1) {
          isCycling = false;
          hasRunInitialCycleRef.current = true;
          if (wordIntervalRef.current) {
            clearInterval(wordIntervalRef.current);
            wordIntervalRef.current = null;
          }
          return next;
        }
        return next;
      });
    };

    // Run cycle on first app open (if not already run)
    if (!hasRunInitialCycleRef.current) {
      const initialTimer = setTimeout(() => {
        if (!isFocused && !inputValue && !hasInteracted) {
          wordIntervalRef.current = setInterval(cycleWords, 2000) as NodeJS.Timeout;
        }
      }, 1000);
      return () => clearTimeout(initialTimer);
    }

    // Check for very long idle and restart cycle (only if user hasn't interacted yet)
    if (hasRunInitialCycleRef.current && !hasInteracted) {
      const idleCheck = setInterval(() => {
        const timeSinceInteraction = Date.now() - lastInteractionRef.current;
        if (timeSinceInteraction > LONG_IDLE_TIME && !isCycling && !isFocused && !inputValue) {
          isCycling = true;
          setCurrentWordIndex(0);
          lastInteractionRef.current = Date.now();
          if (wordIntervalRef.current) {
            clearInterval(wordIntervalRef.current);
          }
          wordIntervalRef.current = setInterval(cycleWords, 2000) as NodeJS.Timeout;
        }
      }, 1000);
      return () => clearInterval(idleCheck);
    }
  }, [isFocused, inputValue, hasInteracted]);

  // Show blinking caret occasionally when at "Now?" and not focused
  useEffect(() => {
    if (isFocused || inputValue || currentWordIndex !== PLACEHOLDER_WORDS.length - 1) {
      setShowCaret(false);
      return;
    }

    // Show caret occasionally (every 3-5 seconds)
    const showCaretInterval = setInterval(() => {
      if (!isFocused && !inputValue && currentWordIndex === PLACEHOLDER_WORDS.length - 1) {
        setShowCaret(true);
        setTimeout(() => setShowCaret(false), 1500);
      }
    }, 4000);

    return () => clearInterval(showCaretInterval);
  }, [isFocused, inputValue, currentWordIndex]);

  const handleModeToggle = () => {
    setHasInteracted(true);
    setMode((prev) => {
      const newMode = prev === "private" ? "global" : "private";
      
      // Replace placeholder text with mode text
      setShowModeText(true);
      if (modeTextTimeoutRef.current) {
        clearTimeout(modeTextTimeoutRef.current);
      }
      modeTextTimeoutRef.current = setTimeout(() => {
        setShowModeText(false);
        // Return to "Now?" after showing mode text
        setCurrentWordIndex(PLACEHOLDER_WORDS.length - 1);
      }, 1000) as NodeJS.Timeout;
      
      return newMode;
    });
    lastInteractionRef.current = Date.now();
    // Stop hint cycle permanently
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
  };

  const handleMicClick = () => {
    setHasInteracted(true);
    lastInteractionRef.current = Date.now();
    // Stop hint cycle permanently
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setHasInteracted(true);
    // Stop hint animation immediately
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
    setShowCaret(false);
    setShowModeText(false);
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setHasInteracted(true);
    lastInteractionRef.current = Date.now();
    // Stop hint cycle permanently once user types
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
  };

  const isLight = theme === "light";
  const displayText = showModeText 
    ? (mode === "private" ? "Private" : "Global")
    : (isFocused || inputValue ? "" : PLACEHOLDER_WORDS[currentWordIndex]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      style={{
        top: "calc(50% + 60px)", // Position slightly below center
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div
        className={`
          flex items-center rounded-3xl
          transition-all duration-300 pointer-events-auto
          ${isLight 
            ? "bg-white/20 backdrop-blur-sm border border-black/10" 
            : "bg-black/20 backdrop-blur-sm border border-white/10"
          }
        `}
        style={{
          gap: "0px",
          width: "153px",
          minWidth: "152px",
          height: "45px",
          paddingTop: "0px",
          paddingBottom: "0px",
          paddingLeft: "5px",
          paddingRight: "5px",
        }}
      >
        {/* Mode toggle button */}
        <button
          onClick={handleModeToggle}
          className={`
            w-8 h-8 rounded-full flex items-center justify-center
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
            width={22}
            height={22}
            className={isLight ? "opacity-70" : "opacity-70 brightness-0 invert"}
          />
        </button>

        {/* Input field */}
        <div className="flex-1 min-w-0 relative">
          {!isFocused && !inputValue ? (
            <div 
              className="w-full text-center cursor-text"
              onClick={() => inputRef.current?.focus()}
            >
              <span
                className={`
                  text-base font-extralight
                  ${isLight ? "text-black/70" : "text-white/70"}
                `}
                style={{ fontWeight: 200 }}
              >
                {displayText}
                {showCaret && displayText === "Now?" && (
                  <span className="animate-pulse ml-0.5">|</span>
                )}
              </span>
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className={`
                w-full bg-transparent border-none outline-none
                text-base font-extralight
                ${isLight ? "text-black/70" : "text-white/70"}
              `}
              style={{
                fontWeight: 200,
                textAlign: "center",
              }}
            />
          )}
        </div>

        {/* Microphone button - no border/outline */}
        <button
          onClick={handleMicClick}
          className={`
            w-8 h-8 flex items-center justify-center
            transition-all duration-200 flex-shrink-0
            bg-transparent border-none outline-none
          `}
          aria-label="Voice input"
        >
          <img
            src="/microphone-icon.svg"
            alt="Microphone"
            width={22}
            height={22}
            className={`${isLight ? "opacity-50" : "opacity-50 brightness-0 invert"}`}
          />
        </button>
      </div>
    </div>
  );
}
