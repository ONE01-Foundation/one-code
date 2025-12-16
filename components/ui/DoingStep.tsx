/**
 * Doing Step - Guided micro-action UI
 * 
 * Timer / Breath / Check
 * Minimal, calm, one step at a time
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { Deck, DeckStep } from "@/lib/deck";
import { UILang } from "@/lib/lang";
import { t } from "@/lib/ui-text";

interface DoingStepProps {
  deck: Deck;
  step: DeckStep;
  onDone: () => void;
  onBack: () => void;
  uiLang?: UILang;
}

export function DoingStep({ deck, step, onDone, onBack, uiLang = "en" }: DoingStepProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(step.minutes ? step.minutes * 60 : 0);
  const [breathCycle, setBreathCycle] = useState(0);
  const [isInhaling, setIsInhaling] = useState(true);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(
    step.items ? new Array(step.items.length).fill(false) : []
  );
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (step.type === "timer" && isActive && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [step.type, isActive, timeRemaining]);

  // Breath cycle logic
  useEffect(() => {
    if (step.type === "breath" && isActive && breathCycle < (step.reps || 6)) {
      const breathInterval = setInterval(() => {
        setIsInhaling((prev) => {
          if (!prev) {
            // Finished exhale, move to next cycle
            setBreathCycle((c) => {
              if (c >= (step.reps || 6) - 1) {
                setIsActive(false);
                return c;
              }
              return c + 1;
            });
          }
          return !prev;
        });
      }, isInhaling ? 4000 : 6000); // Inhale 4s, exhale 6s

      return () => clearInterval(breathInterval);
    }
  }, [step.type, step.reps, isActive, breathCycle, isInhaling]);

  const handleStart = () => {
    setIsActive(true);
    if (step.type === "timer") {
      setTimeRemaining(step.minutes ? step.minutes * 60 : 0);
    } else if (step.type === "breath") {
      setBreathCycle(0);
      setIsInhaling(true);
    }
  };

  const handlePause = () => {
    setIsActive(false);
  };

  const handleReset = () => {
    setIsActive(false);
    if (step.type === "timer") {
      setTimeRemaining(step.minutes ? step.minutes * 60 : 0);
    } else if (step.type === "breath") {
      setBreathCycle(0);
      setIsInhaling(true);
    }
  };

  const handleCheckItem = (index: number) => {
    const newChecked = [...checkedItems];
    newChecked[index] = !newChecked[index];
    setCheckedItems(newChecked);
  };

  const allChecked = step.type === "check" && checkedItems.every((c) => c);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-8 py-12">
      {/* Step title */}
      <div className="text-center">
        <h2
          className="text-2xl sm:text-3xl font-normal mb-2"
          style={{ color: "var(--foreground)" }}
        >
          {step.title}
        </h2>
        <p
          className="text-sm opacity-60"
          style={{ color: "var(--foreground)" }}
        >
          {deck.title}
        </p>
      </div>

      {/* Timer step */}
      {step.type === "timer" && (
        <div className="space-y-6">
          <div className="text-center">
            <div
              className="text-6xl sm:text-7xl font-light mb-4"
              style={{ color: "var(--foreground)" }}
            >
              {formatTime(timeRemaining)}
            </div>
            {!isActive && timeRemaining === (step.minutes || 10) * 60 && (
              <button
                onClick={handleStart}
                className="px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                {t(uiLang, "start") || "Start"}
              </button>
            )}
            {isActive && (
              <button
                onClick={handlePause}
                className="px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "var(--background)",
                  border: "2px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                {t(uiLang, "pause") || "Pause"}
              </button>
            )}
            {!isActive && timeRemaining < (step.minutes || 10) * 60 && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleStart}
                  className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  {t(uiLang, "resume") || "Resume"}
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "2px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  {t(uiLang, "reset") || "Reset"}
                </button>
              </div>
            )}
            {timeRemaining === 0 && (
              <button
                onClick={onDone}
                className="px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                {t(uiLang, "done")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Breath step */}
      {step.type === "breath" && (
        <div className="space-y-6">
          <div className="text-center">
            <div
              className="text-5xl sm:text-6xl font-light mb-4"
              style={{
                color: "var(--foreground)",
                animation: isActive && isInhaling ? "pulse 4s ease-in-out infinite" : "none",
              }}
            >
              {isInhaling ? "↗" : "↘"}
            </div>
            <div
              className="text-lg opacity-70 mb-2"
              style={{ color: "var(--foreground)" }}
            >
              {isInhaling ? "Inhale" : "Exhale"}
            </div>
            <div
              className="text-sm opacity-50"
              style={{ color: "var(--foreground)" }}
            >
              Cycle {breathCycle + 1} / {step.reps || 6}
            </div>
            {!isActive && breathCycle === 0 && (
              <button
                onClick={handleStart}
                className="px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity mt-6"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                {t(uiLang, "start") || "Start"}
              </button>
            )}
            {!isActive && breathCycle >= (step.reps || 6) && (
              <button
                onClick={onDone}
                className="px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity mt-6"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                {t(uiLang, "done")}
              </button>
            )}
          </div>
          <style jsx>{`
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
                opacity: 0.8;
              }
              50% {
                transform: scale(1.2);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      )}

      {/* Check step */}
      {step.type === "check" && (
        <div className="space-y-6">
          <div className="space-y-3">
            {step.items?.map((item, index) => (
              <label
                key={index}
                className="flex items-center gap-3 p-4 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: "var(--neutral-100)",
                  border: checkedItems[index] ? "2px solid var(--foreground)" : "1px solid var(--border)",
                }}
              >
                <input
                  type="checkbox"
                  checked={checkedItems[index]}
                  onChange={() => handleCheckItem(index)}
                  className="w-5 h-5"
                  style={{
                    accentColor: "var(--foreground)",
                  }}
                />
                <span
                  className="text-base"
                  style={{ color: "var(--foreground)" }}
                >
                  {item}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={onDone}
            disabled={!allChecked}
            className="w-full px-8 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            {t(uiLang, "done")}
          </button>
        </div>
      )}

      {/* Back button (always available) */}
      <div className="text-center">
        <button
          onClick={onBack}
          className="text-sm opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "var(--foreground)" }}
        >
          {t(uiLang, "back") || "Back"}
        </button>
      </div>
    </div>
  );
}

