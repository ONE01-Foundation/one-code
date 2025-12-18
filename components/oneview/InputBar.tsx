/**
 * Input Bar - Input with mode icon and mic
 * 
 * Long-press toggles private/global mode
 */

"use client";

import { useState } from "react";

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  onLongPress: () => void;
  mode: "private" | "global";
  isSubmitting: boolean;
}

export function InputBar({ value, onChange, onSubmit, onLongPress, mode, isSubmitting }: InputBarProps) {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(value);
    }
  };
  
  const handleModeIconMouseDown = () => {
    const timer = setTimeout(() => {
      onLongPress();
    }, 500);
    setLongPressTimer(timer);
  };
  
  const handleModeIconMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };
  
  return (
    <div className="flex items-center gap-2 w-full max-w-md mx-auto">
      {/* Mode Icon (long-press to toggle) */}
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{
          backgroundColor: "var(--neutral-100)",
          border: "1px solid var(--border)",
        }}
        onMouseDown={handleModeIconMouseDown}
        onMouseUp={handleModeIconMouseUp}
        onMouseLeave={handleModeIconMouseUp}
        title={`Mode: ${mode} (long-press to toggle)`}
      >
        {mode === "private" ? "👤" : "🌍"}
      </button>
      
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Now?"
        disabled={isSubmitting}
        className="flex-1 px-4 py-3 rounded-full text-base transition-opacity disabled:opacity-50"
        style={{
          backgroundColor: "var(--neutral-100)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        }}
      />
      
      {/* Mic Icon */}
      <button
        className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
        style={{
          backgroundColor: "var(--neutral-100)",
          border: "1px solid var(--border)",
        }}
        title="Voice input (coming soon)"
      >
        🎤
      </button>
    </div>
  );
}

