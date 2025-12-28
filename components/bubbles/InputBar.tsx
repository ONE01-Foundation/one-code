"use client";

import { useState, useEffect, useRef } from "react";

interface InputBarProps {
  theme: "light" | "dark";
  isRTL: boolean;
  mode: "private" | "global";
  onModeChange: (mode: "private" | "global") => void;
  isOriginCentered: boolean;
  centeredBubbleTitle?: string | null;
  onOpenSettings?: () => void;
  onSendMessage?: (message: string) => void; // Handler for sending messages to AI
}

const PLACEHOLDER_WORDS_EN = ["Think", "Feel", "Do", "Now?"];
const PLACEHOLDER_WORDS_HE = ["חשוב", "הרגש", "עשה", "עכשיו?"];
const LONG_IDLE_TIME = 30000; // 30 seconds of idle before hint cycle restarts

export default function InputBar({ theme, isRTL, mode, onModeChange, isOriginCentered, centeredBubbleTitle, onOpenSettings, onSendMessage }: InputBarProps) {
  const PLACEHOLDER_WORDS = isRTL ? PLACEHOLDER_WORDS_HE : PLACEHOLDER_WORDS_EN;
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showModeText, setShowModeText] = useState(false);
  const [showCreateText, setShowCreateText] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputGhostRef = useRef<HTMLSpanElement>(null);
  const [inputWidth, setInputWidth] = useState(80);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modeTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const hasRunInitialCycleRef = useRef<boolean>(false);
  const cycleWasRunningRef = useRef(false);

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
          wordIntervalRef.current = setInterval(cycleWords, 1000) as NodeJS.Timeout;
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
          wordIntervalRef.current = setInterval(cycleWords, 1000) as NodeJS.Timeout;
        }
      }, 1000);
      return () => clearInterval(idleCheck);
    }
  }, [isFocused, inputValue, hasInteracted]);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const hasTriggeredLongPressRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  const handleModeToggleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isLongPressRef.current = false;
    hasTriggeredLongPressRef.current = false;
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      hasTriggeredLongPressRef.current = true;
      if (onOpenSettings) {
        onOpenSettings();
      }
    }, 500); // 500ms long press
  };

  const handleModeToggleMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Only trigger toggle if it wasn't a long press
    if (!hasTriggeredLongPressRef.current && !isLongPressRef.current) {
      handleModeToggle();
    }
    
    // Reset flags after a short delay
    setTimeout(() => {
      isLongPressRef.current = false;
      hasTriggeredLongPressRef.current = false;
    }, 100);
  };

  const handleModeToggleMouseLeave = (e: React.MouseEvent) => {
    // Clear long press timer on mouse leave but don't toggle
    // This prevents toggle when mouse leaves button area
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    // Reset flags to prevent toggle on mouseUp if user returns
    isLongPressRef.current = false;
    hasTriggeredLongPressRef.current = false;
  };

  const handleModeToggleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    isLongPressRef.current = false;
    hasTriggeredLongPressRef.current = false;
    
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      hasTriggeredLongPressRef.current = true;
      if (onOpenSettings) {
        onOpenSettings();
      }
    }, 500); // 500ms long press
  };

  const handleModeToggleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Only trigger toggle if it wasn't a long press
    if (!hasTriggeredLongPressRef.current && !isLongPressRef.current) {
      handleModeToggle();
    }
    
    // Reset flags after a short delay
    setTimeout(() => {
      isLongPressRef.current = false;
      hasTriggeredLongPressRef.current = false;
    }, 100);
  };

  const handleModeToggle = () => {
    setHasInteracted(true);
    const newMode = mode === "private" ? "global" : "private";
    onModeChange(newMode);
    
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
    lastInteractionRef.current = Date.now();
    // Stop hint cycle permanently
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
  };

  const handleCreateClick = () => {
    // Handle create button click - show "Create"/"צור" text
    setHasInteracted(true);
    setShowCreateText(true);
    if (modeTextTimeoutRef.current) {
      clearTimeout(modeTextTimeoutRef.current);
    }
    modeTextTimeoutRef.current = setTimeout(() => {
      setShowCreateText(false);
      // Return to "Now?" after showing create text
      setCurrentWordIndex(PLACEHOLDER_WORDS.length - 1);
    }, 1000) as NodeJS.Timeout;
    lastInteractionRef.current = Date.now();
    // Stop hint cycle permanently
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
    // TODO: Add create functionality
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
    // Remember if cycle was running (only pause, don't stop permanently)
    cycleWasRunningRef.current = wordIntervalRef.current !== null;
    // Pause hint animation (but don't set hasInteracted yet - only if user types)
    if (wordIntervalRef.current) {
      clearInterval(wordIntervalRef.current);
      wordIntervalRef.current = null;
    }
    setShowModeText(false);
    // On mobile, ensure keyboard opens
    if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Resume cycle if it was running before focus and user didn't type
    if (cycleWasRunningRef.current && !inputValue && !hasInteracted && !hasRunInitialCycleRef.current) {
      const cycleWords = () => {
        if (isFocused || inputValue || hasInteracted) return;
        setCurrentWordIndex((prev) => {
          const next = (prev + 1) % PLACEHOLDER_WORDS.length;
          // Stop at "Now?" (last word)
          if (next === PLACEHOLDER_WORDS.length - 1) {
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
      wordIntervalRef.current = setInterval(cycleWords, 1000) as NodeJS.Timeout;
      cycleWasRunningRef.current = false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Only mark as interacted if user actually types something
    if (e.target.value.length > 0) {
      setHasInteracted(true);
      lastInteractionRef.current = Date.now();
      // Stop hint cycle permanently once user types
      if (wordIntervalRef.current) {
        clearInterval(wordIntervalRef.current);
        wordIntervalRef.current = null;
      }
      cycleWasRunningRef.current = false;
    }
  };

  const isLight = theme === "light";
  const nowText = isRTL ? "עכשיו?" : "Now?";
  const displayText = showCreateText
    ? (isRTL ? "צור" : "Create")
    : showModeText 
      ? (mode === "private" ? (isRTL ? "פרטי" : "Private") : (isRTL ? "גלובלי" : "Global"))
      : (isFocused || inputValue ? "" : PLACEHOLDER_WORDS[currentWordIndex]);
  
  // Determine if we should show blinking question mark (only when showing "Now?" and not focused/typing)
  const showBlinkingQuestionMark = !isFocused && !inputValue && displayText === nowText;

  // Calculate styling based on current word (only when showing placeholder words, not mode text or create text)
  const getWordStyles = () => {
    if (showCreateText || showModeText) {
      return { opacity: 0.7, fontWeight: 200 }; // Default for mode/create text
    }
    
    const currentWord = PLACEHOLDER_WORDS[currentWordIndex];
    const thinkText = isRTL ? "חשוב" : "Think";
    const feelText = isRTL ? "הרגש" : "Feel";
    const doText = isRTL ? "עשה" : "Do";
    
    if (currentWord === thinkText) {
      return { opacity: 0.4, fontWeight: 200 };
    } else if (currentWord === feelText) {
      return { opacity: 0.7, fontWeight: 200 };
    } else if (currentWord === doText) {
      return { opacity: 0.7, fontWeight: 500 };
    } else if (currentWord === nowText) {
      return { opacity: 0.7, fontWeight: 200 }; // For "Now" part
    }
    return { opacity: 0.7, fontWeight: 200 }; // Default
  };

  const wordStyles = getWordStyles();
  const isNowQuestion = displayText === nowText && !showModeText && !showCreateText;

  // Update input width dynamically based on content
  useEffect(() => {
    if (inputGhostRef.current) {
      const width = inputGhostRef.current.offsetWidth;
      setInputWidth(Math.max(80, Math.min(300, width + 20)));
    }
  }, [inputValue, displayText, isFocused, isRTL]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      style={{
        top: "calc(50% + 50px)", // Position below center with consistent spacing
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
          width: "fit-content",
          minWidth: "152px",
          maxWidth: "calc(100vw - 40px)",
          height: "45px",
          paddingTop: "0px",
          paddingBottom: "0px",
          paddingLeft: "5px",
          paddingRight: "5px",
        }}
      >
        {/* Mode toggle button (when origin centered) or Create button (when other bubble centered) */}
        {isOriginCentered ? (
          <button
            onMouseDown={handleModeToggleMouseDown}
            onMouseUp={handleModeToggleMouseUp}
            onMouseLeave={handleModeToggleMouseLeave}
            onTouchStart={handleModeToggleTouchStart}
            onTouchEnd={handleModeToggleTouchEnd}
            onContextMenu={(e) => e.preventDefault()}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-200 flex-shrink-0
              ${isLight
                ? "bg-black/10 hover:bg-black/20"
                : "bg-white/10 hover:bg-white/20"
              }
            `}
            aria-label={mode === "private" ? (isRTL ? "פרטי" : "Private") : (isRTL ? "גלובלי" : "Global")}
          >
            <img
              src={mode === "private" ? "/private-icon.svg" : "/global-icon.svg"}
              alt={mode === "private" ? (isRTL ? "פרטי" : "Private") : (isRTL ? "גלובלי" : "Global")}
              width={22}
              height={22}
              draggable="false"
              className={isLight ? "opacity-70" : "opacity-70 brightness-0 invert"}
            />
          </button>
        ) : (
          <button
            onClick={handleCreateClick}
            onContextMenu={(e) => e.preventDefault()}
            className={`
              w-8 h-8 rounded-full flex items-center justify-center
              transition-all duration-200 flex-shrink-0
              ${isLight
                ? "bg-black/10 hover:bg-black/20"
                : "bg-white/10 hover:bg-white/20"
              }
            `}
            aria-label="Create"
          >
            <img
              src="/Create-icon.svg"
              alt="Create"
              width={22}
              height={22}
              draggable="false"
              className={isLight ? "opacity-70" : "opacity-70 brightness-0 invert"}
            />
          </button>
        )}

        {/* Input field */}
        <div className="relative flex-grow" style={{ minWidth: "80px", maxWidth: "300px" }}>
          {/* Hidden span to measure text width for dynamic sizing */}
          <span
            ref={inputGhostRef}
            style={{
              visibility: "hidden",
              position: "absolute",
              whiteSpace: "nowrap",
              fontSize: "1rem",
              fontWeight: 200,
              padding: "0 2px",
              pointerEvents: "none",
            }}
          >
            {inputValue || (isFocused ? "" : displayText)}
          </span>
          
          {/* Always render the input */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyPress={(e) => {
              if (e.key === "Enter" && inputValue.trim() && onSendMessage) {
                e.preventDefault();
                onSendMessage(inputValue.trim());
                setInputValue("");
                inputRef.current?.blur();
              }
            }}
            className={`
              bg-transparent border-none outline-none w-full
              text-base font-extralight
              ${isLight ? "text-black/70" : "text-white/70"}
            `}
            style={{
              fontWeight: 200,
              textAlign: isRTL ? "right" : "left",
              minWidth: "80px",
              width: `${inputWidth}px`,
              marginLeft: "5px",
              marginRight: "5px",
            }}
            dir={isRTL ? "rtl" : "ltr"}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
          />
          
          {/* Placeholder overlay - only visible when not focused and no value */}
          {!isFocused && !inputValue && (
            <div 
              className="absolute inset-0 flex items-center justify-center cursor-text pointer-events-none"
              onClick={() => {
                inputRef.current?.focus();
                // On mobile, ensure keyboard opens
                if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                  setTimeout(() => {
                    inputRef.current?.focus();
                  }, 100);
                }
              }}
              style={{ pointerEvents: "auto" }}
            >
              <span
                className={`${isNowQuestion ? 'text-base font-light transition-opacity duration-500' : 'text-base'} ${isLight ? (isNowQuestion ? "text-black/30" : "text-black") : (isNowQuestion ? "text-white/30" : "text-white")}`}
                style={{ 
                  fontWeight: isNowQuestion ? 300 : wordStyles.fontWeight,
                  opacity: isNowQuestion ? undefined : wordStyles.opacity,
                  display: "inline-block",
                  minWidth: "fit-content",
                }}
                dir={isRTL ? "rtl" : "ltr"}
              >
                {isNowQuestion ? (
                  <>
                    <span>{isRTL ? "עכשיו" : "Now"}</span>
                    <span
                      style={{
                        animation: showBlinkingQuestionMark ? "blink-question 1.2s ease-in-out infinite" : "none",
                      }}
                    >
                      ?
                    </span>
                  </>
                ) : (
                  displayText
                )}
              </span>
            </div>
          )}
        </div>

        {/* Microphone button - no border/outline */}
        <button
          onClick={handleMicClick}
          onContextMenu={(e) => e.preventDefault()}
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
            draggable="false"
            className={`${isLight ? "opacity-50" : "opacity-50 brightness-0 invert"}`}
          />
        </button>
      </div>
    </div>
  );
}
