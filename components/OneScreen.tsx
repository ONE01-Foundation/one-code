/**
 * ONE01 Screen - Core Interaction Loop
 * 
 * STRUCTURE:
 * - Top: Context line (one large, calm text)
 * - Center: Focus zone (one thing at a time)
 * - Side: 4 context circles (icons only, text on focus)
 * - Bottom: Anchor circle (current state, back/confirm)
 * 
 * STATES:
 * - Orientation: User just arrived, narrow intent
 * - Action: User choosing/doing something
 * - Reflection: Show result, offer next step
 * 
 * INTERACTIONS:
 * - Single tap: Confirm/Select
 * - Double tap: Back
 * - Focus/Hover: Show label
 * - No free typing by default
 */

"use client";

import { useState, useEffect, useRef } from "react";

type AppState = "orientation" | "action" | "reflection";

interface Direction {
  id: string;
  icon: string; // Simple emoji or symbol for now
  label: string;
  description?: string;
}

// Generate directions based on context (will be dynamic later)
function getDirections(state: AppState): Direction[] {
  if (state === "orientation") {
    return [
      { id: "improve", icon: "↑", label: "Improve" },
      { id: "resolve", icon: "→", label: "Resolve" },
      { id: "decide", icon: "↓", label: "Decide" },
      { id: "explore", icon: "←", label: "Explore" },
    ];
  }
  // For action/reflection, show fewer or different directions
  return [
    { id: "continue", icon: "→", label: "Continue" },
    { id: "pause", icon: "⏸", label: "Pause" },
    { id: "complete", icon: "✓", label: "Complete" },
  ];
}

// Context line text based on state
function getContextLine(state: AppState, step?: string): string {
  switch (state) {
    case "orientation":
      return "What do you need right now?";
    case "action":
      return step || "Choose one direction.";
    case "reflection":
      return "This is your next step.";
    default:
      return "What do you need right now?";
  }
}

// Center content based on state (1-2 lines max, neutral language)
function getCenterContent(state: AppState, hasSelection?: boolean): string {
  switch (state) {
    case "orientation":
      return "Next step available.";
    case "action":
      if (hasSelection) {
        return ""; // Confirmation will be shown separately
      }
      return "Select a direction to proceed.";
    case "reflection":
      return "Action completed. Next step available.";
    default:
      return "Next step available.";
  }
}

export default function OneScreen() {
  const [state, setState] = useState<AppState>("orientation");
  const [selectedDirection, setSelectedDirection] = useState<Direction | null>(null);
  const [focusedCircle, setFocusedCircle] = useState<string | null>(null);
  const [confirmationText, setConfirmationText] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const doubleTapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);

  const directions = getDirections(state);
  const contextLine = getContextLine(state, confirmationText || undefined);
  const centerContent = getCenterContent(state, !!selectedDirection);

  // Handle circle interaction
  const handleCircleTap = (direction: Direction) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - go back
      if (doubleTapTimerRef.current) {
        clearTimeout(doubleTapTimerRef.current);
      }
      handleBack();
      lastTapRef.current = 0;
      return;
    }

    // Single tap - select direction
    lastTapRef.current = now;
    doubleTapTimerRef.current = setTimeout(() => {
      handleDirectionSelect(direction);
      doubleTapTimerRef.current = null;
    }, 300);
  };

  const handleDirectionSelect = (direction: Direction) => {
    setSelectedDirection(direction);
    setConfirmationText(`Proceed with "${direction.label}"?`);
    setState("action");
  };

  const handleConfirm = () => {
    if (selectedDirection) {
      // Move to reflection state
      setState("reflection");
      setConfirmationText(null);
      // In a real implementation, this would trigger the actual action
    }
  };

  const handleBack = () => {
    if (state === "action" && selectedDirection) {
      // Go back to orientation
      setState("orientation");
      setSelectedDirection(null);
      setConfirmationText(null);
    } else if (state === "reflection") {
      // Go back to action or orientation
      setState("orientation");
      setSelectedDirection(null);
      setConfirmationText(null);
    }
  };

  // Anchor circle interactions
  const handleAnchorTap = () => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;

    if (timeSinceLastTap < 300) {
      // Double tap - back
      handleBack();
      lastTapRef.current = 0;
      return;
    }

    // Single tap - confirm
    lastTapRef.current = now;
    setTimeout(() => {
      if (state === "action" && selectedDirection) {
        handleConfirm();
      }
    }, 300);
  };

  // Explicitly invoke text input
  const handleInvokeTextInput = () => {
    setShowTextInput(true);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      // Process text input
      setConfirmationText(`Proceed with "${inputValue.trim()}"?`);
      setShowTextInput(false);
      setInputValue("");
      setState("action");
    }
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Top: Context Line - Permanent Zone */}
      <div className="flex items-center justify-center pt-8 pb-6 px-6">
        <h1 className="text-4xl sm:text-5xl font-normal text-black text-center">
          {contextLine}
        </h1>
      </div>

      {/* Center: Focus Zone - Permanent Zone */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Side Circles - Context Options (4 max) */}
        <div className="absolute inset-0 pointer-events-none">
          {directions.slice(0, 4).map((direction, index) => {
            const positions = [
              { top: "12%", left: "12%" }, // Top left
              { top: "12%", right: "12%" }, // Top right
              { bottom: "24%", left: "12%" }, // Bottom left
              { bottom: "24%", right: "12%" }, // Bottom right
            ];
            const pos = positions[index] || positions[0];
            const isFocused = focusedCircle === direction.id;

            return (
              <div
                key={direction.id}
                className="absolute pointer-events-auto z-20"
                style={pos}
                onMouseEnter={() => setFocusedCircle(direction.id)}
                onMouseLeave={() => setFocusedCircle(null)}
                onTouchStart={() => setFocusedCircle(direction.id)}
                onTouchEnd={() => setTimeout(() => setFocusedCircle(null), 1500)}
              >
                <button
                  onClick={() => handleCircleTap(direction)}
                  className={`
                    w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 
                    flex items-center justify-center
                    transition-all duration-200
                    ${isFocused 
                      ? "border-black bg-black text-white scale-110 shadow-lg" 
                      : "border-neutral-300 bg-white text-black hover:border-black"
                    }
                  `}
                >
                  <span className="text-2xl sm:text-3xl">{direction.icon}</span>
                </button>
                {/* Label appears on focus */}
                {isFocused && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap z-30">
                    <div className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded shadow-lg">
                      {direction.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Nobody Presence - Subtle Light Movement */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-neutral-50 blur-3xl"
            style={{
              animation: "subtle-pulse 4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Center Content - One thing at a time */}
        <div className="relative z-10 w-full max-w-md text-center">
          {showTextInput ? (
            <form onSubmit={handleTextSubmit} className="space-y-4">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your intent..."
                className="w-full px-4 py-3 border-2 border-black rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-black"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg font-medium hover:opacity-90"
                >
                  Continue
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowTextInput(false);
                    setInputValue("");
                  }}
                  className="flex-1 px-6 py-3 bg-white border-2 border-black text-black rounded-lg font-medium hover:opacity-90"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {/* System message (1-2 lines max) - only show if no confirmation */}
              {!(state === "action" && selectedDirection) && centerContent && (
                <p className="text-lg sm:text-xl text-neutral-700 leading-relaxed">
                  {centerContent}
                </p>
              )}

              {/* Confirmation if in action state - single question */}
              {state === "action" && selectedDirection && (
                <div className="space-y-4">
                  <p className="text-base sm:text-lg text-neutral-800 leading-relaxed">
                    {confirmationText}
                  </p>
                </div>
              )}

              {/* Reflection state - show result, offer next step */}
              {state === "reflection" && (
                <div className="space-y-4">
                  <p className="text-base sm:text-lg text-neutral-700 leading-relaxed">
                    {centerContent}
                  </p>
                </div>
              )}

              {/* Option to invoke text input - only in orientation */}
              {state === "orientation" && !showTextInput && (
                <button
                  onClick={handleInvokeTextInput}
                  className="text-sm text-neutral-500 hover:text-black transition-colors"
                >
                  Or type your intent
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom: Anchor Circle - Permanent Zone */}
      <div className="flex flex-col items-center justify-center pb-8 pt-4 relative">
        <button
          onClick={handleAnchorTap}
          className={`
            w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2
            flex items-center justify-center
            transition-all duration-200
            ${
              state === "action" && selectedDirection
                ? "border-black bg-black text-white shadow-lg"
                : state === "reflection"
                ? "border-black bg-white text-black"
                : "border-neutral-300 bg-white text-black hover:border-black"
            }
          `}
        >
          <span className="text-xl sm:text-2xl font-medium">
            {state === "orientation" ? "○" : state === "action" ? "✓" : "○"}
          </span>
        </button>
        {/* Subtle hint text */}
        {state === "action" && selectedDirection && (
          <div className="absolute -top-8 text-xs text-neutral-400 text-center whitespace-nowrap">
            <div>Tap to confirm</div>
            <div className="text-[10px] mt-0.5 opacity-70">Double tap to go back</div>
          </div>
        )}
        {state === "reflection" && (
          <div className="absolute -top-8 text-xs text-neutral-400 text-center whitespace-nowrap">
            <div>Double tap to return</div>
          </div>
        )}
      </div>
    </div>
  );
}
