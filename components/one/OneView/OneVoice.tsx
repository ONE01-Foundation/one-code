/**
 * OneVoice - Simple voice input for V1
 */

"use client";

import { useState, useEffect } from "react";

interface OneVoiceProps {
  isActive: boolean;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

export function OneVoice({ isActive, onConfirm, onCancel }: OneVoiceProps) {
  const [text, setText] = useState("");
  
  if (!isActive) return null;
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      }}
    >
      <div
        className="w-full max-w-md mx-4 p-6 rounded-lg"
        style={{
          backgroundColor: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        <div className="text-sm mb-4 opacity-60">Voice input (type for now)</div>
        <input
          type="text"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && text.trim()) {
              onConfirm(text.trim());
              setText("");
            } else if (e.key === "Escape") {
              onCancel();
              setText("");
            }
          }}
          className="w-full px-4 py-3 rounded-lg text-base mb-4"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            color: "#ffffff",
          }}
          placeholder="Type your intent..."
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (text.trim()) {
                onConfirm(text.trim());
                setText("");
              }
            }}
            disabled={!text.trim()}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

