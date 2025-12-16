/**
 * Ask Nobody Input - Tiny input bar for HOME screen
 * 
 * Shows ONE input bar at bottom center
 * Only appears in empty state
 */

import { useState } from "react";

interface AskNobodyInputProps {
  onSubmit: (text: string) => void;
  isGenerating?: boolean;
}

export function AskNobodyInput({ onSubmit, isGenerating }: AskNobodyInputProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed.length === 0 || trimmed.length > 280) return;
    
    setIsSubmitting(true);
    onSubmit(trimmed);
    setText("");
    // Note: isSubmitting will be reset by parent when loading completes
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-30"
    >
      <div className="flex gap-2 items-center">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Tell me what you need…"
          disabled={isGenerating || isSubmitting}
          maxLength={280}
          className="flex-1 px-4 py-3 rounded-lg text-base font-normal transition-opacity duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "var(--background)",
            border: "2px solid var(--border)",
            color: "var(--foreground)",
          }}
        />
        <button
          type="submit"
          disabled={isGenerating || isSubmitting || text.trim().length === 0}
          className="px-6 py-3 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
          style={{
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          {isGenerating || isSubmitting ? "..." : "Enter"}
        </button>
      </div>
    </form>
  );
}

