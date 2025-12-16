/**
 * AskPanel - Live Ask v0.1
 * 
 * Progressive UI states:
 * - idle: Input visible, ready to type
 * - echo: Shows user text, preparing to think
 * - thinking: Shows "Thinking..." with subtle animation
 * - result: Shows the step suggestion (handled by parent)
 */

"use client";

import { useState, useEffect, useRef } from "react";

export type AskPhase = "idle" | "echo" | "thinking" | "result";

interface AskPanelProps {
  isOpen: boolean;
  phase: AskPhase;
  userText?: string;
  onSubmit: (text: string) => void;
  onClose?: () => void;
  isGenerating?: boolean;
}

export function AskPanel({
  isOpen,
  phase,
  userText = "",
  onSubmit,
  onClose,
  isGenerating = false,
}: AskPanelProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isOpen && phase === "idle" && inputRef.current) {
      // Small delay to ensure smooth transition
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, phase]);

  // Reset text when panel closes
  useEffect(() => {
    if (!isOpen) {
      setText("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Sync with userText prop (for echo phase)
  useEffect(() => {
    if (phase === "echo" && userText) {
      setText(userText);
    }
  }, [phase, userText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length === 0 || trimmed.length > 280 || isSubmitting || isGenerating) return;

    setIsSubmitting(true);
    onSubmit(trimmed);
    // Don't clear text here - parent will handle phase transitions
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      onClick={(e) => {
        // Close on backdrop click (only in idle phase)
        if (phase === "idle" && e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-md mx-4 p-6 rounded-lg"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {phase === "idle" ? (
          /* IDLE: Input ready */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-sm opacity-60 mb-2"
                style={{ color: "var(--foreground)" }}
              >
                What do you need?
              </label>
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Tell me what you need…"
                disabled={isSubmitting || isGenerating}
                maxLength={280}
                autoFocus
                className="w-full px-4 py-3 rounded-lg text-base font-normal transition-opacity duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--neutral-100)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={text.trim().length === 0 || isSubmitting || isGenerating}
                className="flex-1 px-6 py-3 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                {isSubmitting || isGenerating ? "..." : "Ask"}
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200"
                  style={{
                    backgroundColor: "var(--background)",
                    border: "2px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : phase === "echo" ? (
          /* ECHO: Show user text, brief pause */
          <div className="space-y-4">
            <div className="text-center py-4">
              <p
                className="text-lg opacity-80"
                style={{ color: "var(--foreground)" }}
              >
                {userText || text}
              </p>
            </div>
            <div className="text-center">
              <div
                className="inline-block w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--foreground)" }}
              />
            </div>
          </div>
        ) : phase === "thinking" ? (
          /* THINKING: Subtle animation */
          <div className="space-y-4 text-center py-8">
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--foreground)", animationDelay: "0ms" }}
              />
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--foreground)", animationDelay: "150ms" }}
              />
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: "var(--foreground)", animationDelay: "300ms" }}
              />
            </div>
            <p
              className="text-sm opacity-60"
              style={{ color: "var(--foreground)" }}
            >
              Thinking...
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

