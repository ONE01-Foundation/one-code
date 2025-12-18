/**
 * Voice Overlay - Shows live transcript and controls
 * 
 * Appears when Voice Mode is active
 */

"use client";

import { useEffect, useState } from "react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface VoiceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (text: string) => void;
  onSubmit: (text: string) => void;
}

export function VoiceOverlay({ isOpen, onClose, onConfirm, onSubmit }: VoiceOverlayProps) {
  const [fallbackText, setFallbackText] = useState("");
  
  const {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
  } = useVoiceInput({
    onTranscript: () => {},
    onFinalTranscript: () => {},
    enabled: false, // We'll control it manually
  });

  // Auto-start when opened
  useEffect(() => {
    if (isOpen) {
      if (isSupported) {
        startListening();
      }
      // If not supported, fallback text input is already shown
    } else {
      stopListening();
      setFallbackText("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isSupported]);

  if (!isOpen) return null;

  const displayText = isSupported ? transcript : fallbackText;

  const handleConfirm = () => {
    if (displayText.trim()) {
      onSubmit(displayText.trim());
    }
    onClose();
  };

  const handleCancel = () => {
    stopListening();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.7)", // Dim background
      }}
    >
      {/* Overlay Content */}
      <div
        className="w-full max-w-md mx-4 p-6 rounded-lg space-y-4"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Voice Input
          </div>
          {isListening && (
            <div className="flex items-center gap-2 text-xs opacity-60" style={{ color: "var(--foreground)" }}>
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Listening…
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="p-3 rounded text-sm"
            style={{
              backgroundColor: "var(--neutral-100)",
              color: "var(--foreground)",
            }}
          >
            {error}
          </div>
        )}

        {/* Not Supported Fallback */}
        {!isSupported && (
          <div className="space-y-4">
            <div className="text-sm opacity-60" style={{ color: "var(--foreground)" }}>
              Voice input not supported. Please type your message:
            </div>
            <input
              type="text"
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-base"
              style={{
                backgroundColor: "var(--neutral-100)",
                border: "1px solid var(--border)",
                color: "var(--foreground)",
              }}
              placeholder="Type your message..."
              value={fallbackText}
              onChange={(e) => {
                setFallbackText(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                } else if (e.key === "Escape") {
                  handleCancel();
                }
              }}
            />
          </div>
        )}

        {/* Live Transcript */}
        {isSupported && (
          <div
            className="min-h-[120px] p-4 rounded-lg text-base"
            style={{
              backgroundColor: "var(--neutral-100)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            {displayText || (
              <div className="opacity-40 italic">Waiting for speech...</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--neutral-100)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            ✖️ Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!displayText.trim()}
            className="flex-1 px-4 py-3 rounded-lg font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--foreground)",
              color: "var(--background)",
            }}
          >
            ✅ Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

