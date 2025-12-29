"use client";

import { useState, useEffect, useRef } from "react";

interface InputBarProps {
  theme: "light" | "dark";
  uiSize?: "normal" | "large";
  isRTL: boolean;
  mode: "private" | "global";
  onModeChange: (mode: "private" | "global") => void;
  isOriginCentered: boolean;
  centeredBubbleTitle?: string | null;
  onSendMessage?: (message: string) => void; // Handler for sending messages to AI
}

const PLACEHOLDER_WORDS_EN = ["Think", "Feel", "Do", "Now?"];
const PLACEHOLDER_WORDS_HE = ["חשוב", "הרגש", "עשה", "עכשיו?"];
const LONG_IDLE_TIME = 30000; // 30 seconds of idle before hint cycle restarts

export default function InputBar({ theme, uiSize = "normal", isRTL, mode, onModeChange, isOriginCentered, centeredBubbleTitle, onSendMessage }: InputBarProps) {
  const sizeMultiplier = uiSize === "large" ? 1.25 : 1.0;
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
  const [isRecording, setIsRecording] = useState(false);
  const wordIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modeTextTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastInteractionRef = useRef<number>(Date.now());
  const hasRunInitialCycleRef = useRef<boolean>(false);
  const cycleWasRunningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const baseTextRef = useRef<string>("");

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

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = isRTL ? "he-IL" : "en-US";

        recognition.onresult = (event: any) => {
          let interimTranscript = "";
          let finalTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript + " ";
            } else {
              interimTranscript += transcript;
            }
          }

          // Update base text with final transcript
          if (finalTranscript) {
            baseTextRef.current = baseTextRef.current + (baseTextRef.current ? " " : "") + finalTranscript.trim() + " ";
            const newValue = baseTextRef.current;
            setInputValue(newValue);
            // Force input field update
            if (inputRef.current) {
              inputRef.current.value = newValue;
            }
          }
          // Update display with base text + interim transcript
          else if (interimTranscript) {
            const displayValue = baseTextRef.current + (baseTextRef.current ? " " : "") + interimTranscript;
            setInputValue(displayValue);
            // Force input field update
            if (inputRef.current) {
              inputRef.current.value = displayValue;
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsRecording(false);
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // Ignore errors when stopping
            }
          }
        };

        recognition.onend = () => {
          setIsRecording(false);
          // Finalize any remaining interim text (already in baseTextRef from final results)
          setInputValue(baseTextRef.current.trim());
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors
        }
      }
    };
  }, [isRTL]);

  // Update recognition language when RTL changes
  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = isRTL ? "he-IL" : "en-US";
    }
  }, [isRTL]);

  // Sync baseTextRef with inputValue when not recording (handles manual typing and clearing)
  useEffect(() => {
    if (!isRecording) {
      baseTextRef.current = inputValue;
    }
  }, [inputValue, isRecording]);

  const handleMicMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handleMicMouseUp = (e: React.MouseEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const handleMicTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    startRecording();
  };

  const handleMicTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopRecording();
  };

  const startRecording = () => {
    if (recognitionRef.current && !isRecording) {
      try {
        setHasInteracted(true);
        lastInteractionRef.current = Date.now();
        setIsRecording(true);
        baseTextRef.current = inputValue; // Save current input value as base
        recognitionRef.current.start();
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setIsRecording(false);
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
        setIsRecording(false);
      }
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
  }, [inputValue, displayText, isFocused, isRTL, sizeMultiplier]);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 pointer-events-none"
      style={{
        top: "calc(50% + 50px)", // Position below center with consistent spacing
        zIndex: 45, // Above backdrop (40) but below chat overlay (50)
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
          width: "fit-content", // No expansion - keep original width
          minWidth: `${152 * sizeMultiplier}px`,
          maxWidth: "calc(100vw - 40px)",
          height: `${45 * sizeMultiplier}px`,
          paddingTop: "0px",
          paddingBottom: "0px",
          paddingLeft: `${5 * sizeMultiplier}px`,
          paddingRight: `${5 * sizeMultiplier}px`,
        }}
      >
        {/* Mode toggle button (when origin centered) or Create button (when other bubble centered) */}
        {isOriginCentered ? (
          <button
            onClick={handleModeToggle}
            onContextMenu={(e) => e.preventDefault()}
            className={`
              rounded-full flex items-center justify-center
              transition-all duration-200 flex-shrink-0
              ${isLight
                ? "bg-black/10 hover:bg-black/20"
                : "bg-white/10 hover:bg-white/20"
              }
            `}
            style={{
              width: `${32 * sizeMultiplier}px`,
              height: `${32 * sizeMultiplier}px`,
            }}
            aria-label={mode === "private" ? (isRTL ? "פרטי" : "Private") : (isRTL ? "גלובלי" : "Global")}
          >
            <img
              src={mode === "private" ? "/private-icon.svg" : "/global-icon.svg"}
              alt={mode === "private" ? (isRTL ? "פרטי" : "Private") : (isRTL ? "גלובלי" : "Global")}
              width={22 * sizeMultiplier}
              height={22 * sizeMultiplier}
              draggable="false"
              className={isLight ? "opacity-70" : "opacity-70 brightness-0 invert"}
            />
          </button>
        ) : (
          <button
            onClick={handleCreateClick}
            onContextMenu={(e) => e.preventDefault()}
            className={`
              rounded-full flex items-center justify-center
              transition-all duration-200 flex-shrink-0
              ${isLight
                ? "bg-black/10 hover:bg-black/20"
                : "bg-white/10 hover:bg-white/20"
              }
            `}
            style={{
              width: `${32 * sizeMultiplier}px`,
              height: `${32 * sizeMultiplier}px`,
            }}
            aria-label="Create"
          >
            <img
              src="/Create-icon.svg"
              alt="Create"
              width={22 * sizeMultiplier}
              height={22 * sizeMultiplier}
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
              fontSize: `${1 * sizeMultiplier}rem`,
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
              font-extralight
              ${isLight ? "text-black/70" : "text-white/70"}
            `}
            style={{
              fontWeight: 200,
              textAlign: isRTL ? "right" : "left",
              minWidth: `${80 * sizeMultiplier}px`,
              width: `${inputWidth * sizeMultiplier}px`,
              marginLeft: `${5 * sizeMultiplier}px`,
              marginRight: `${5 * sizeMultiplier}px`,
              fontSize: `${1 * sizeMultiplier}rem`, // text-base = 1rem
              caretColor: theme === "dark" ? "#ffffff" : "#000000",
              WebkitAppearance: "none",
            } as React.CSSProperties}
            dir={isRTL ? "rtl" : "ltr"}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
            data-form-type="other"
            enterKeyHint="send"
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
                className={`${isNowQuestion ? 'font-light transition-opacity duration-500' : ''} ${isLight ? (isNowQuestion ? "text-black/30" : "text-black") : (isNowQuestion ? "text-white/30" : "text-white")}`}
                style={{ 
                  fontWeight: isNowQuestion ? 300 : wordStyles.fontWeight,
                  opacity: isNowQuestion ? undefined : wordStyles.opacity,
                  display: "inline-block",
                  minWidth: "fit-content",
                  fontSize: `${1 * sizeMultiplier}rem`, // text-base = 1rem
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

          {/* Send button (when text entered) or Microphone button */}
          {inputValue.trim() && onSendMessage ? (
            <button
              onClick={() => {
                if (inputValue.trim() && onSendMessage) {
                  onSendMessage(inputValue.trim());
                  setInputValue("");
                  inputRef.current?.blur();
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center
                transition-all duration-200 flex-shrink-0
                ${isLight
                  ? "bg-black/10 hover:bg-black/20"
                  : "bg-white/10 hover:bg-white/20"
                }
              `}
              aria-label="Send"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{
                  transform: isRTL ? "scaleX(-1)" : "none",
                }}
              >
                <path
                  d="M22 2L11 13"
                  stroke={isLight ? "#000" : "#fff"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M22 2L15 22L11 13L2 9L22 2Z"
                  stroke={isLight ? "#000" : "#fff"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ) : (
            <button
              onMouseDown={handleMicMouseDown}
              onMouseUp={handleMicMouseUp}
              onMouseLeave={handleMicMouseUp}
              onTouchStart={handleMicTouchStart}
              onTouchEnd={handleMicTouchEnd}
              onContextMenu={(e) => e.preventDefault()}
              className={`
                flex items-center justify-center
                transition-all duration-200 flex-shrink-0
                bg-transparent border-none outline-none
              `}
              style={{
                width: `${32 * sizeMultiplier}px`,
                height: `${32 * sizeMultiplier}px`,
              }}
              aria-label="Voice input"
            >
              <img
                src="/microphone-icon.svg"
                alt="Microphone"
                width={22 * sizeMultiplier}
                height={22 * sizeMultiplier}
                draggable="false"
                className={`${isRecording 
                  ? (isLight ? "opacity-100" : "opacity-100 brightness-0 invert")
                  : (isFocused 
                    ? "opacity-70" 
                    : isLight ? "opacity-50" : "opacity-50 brightness-0 invert")
                }`}
                style={isRecording ? { 
                  filter: isLight ? "none" : "brightness(0) invert(1)",
                  opacity: 1,
                  animation: "pulse 1.5s ease-in-out infinite",
                } : (isFocused ? { filter: "none", opacity: 0.7 } : {})}
              />
            </button>
          )}
      </div>
    </div>
  );
}
