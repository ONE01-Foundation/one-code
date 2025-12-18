/**
 * OneStep Result - Shows AI response and action button
 * 
 * Displays assistant line + one action button
 */

"use client";

import { OneStep } from "@/lib/oneview/onestep-types";
import { useState } from "react";

interface OneStepResultProps {
  step: OneStep;
  onAction: (step: OneStep) => void;
  onEditCard?: (title: string) => void;
}

export function OneStepResult({ step, onAction, onEditCard }: OneStepResultProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(step.card?.title || "");
  
  const handleSave = () => {
    if (onEditCard && step.card) {
      onEditCard(editedTitle);
    }
    setIsEditing(false);
  };
  
  return (
    <div
      className="w-full max-w-md mx-auto p-4 rounded-lg space-y-3"
      style={{
        backgroundColor: "var(--neutral-100)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Assistant Line */}
      <div className="text-sm opacity-80" style={{ color: "var(--foreground)" }}>
        {step.assistantLine}
      </div>
      
      {/* Clarifying Question */}
      {step.needsClarification && step.clarifyingQuestion && (
        <div className="text-sm opacity-60 italic" style={{ color: "var(--foreground)" }}>
          {step.clarifyingQuestion}
        </div>
      )}
      
      {/* Card Preview (if exists) */}
      {step.card && (
        <div className="space-y-2">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full px-3 py-2 rounded text-sm"
                style={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSave();
                  } else if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditedTitle(step.card?.title || "");
                  }
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="px-3 py-1 text-xs rounded"
                  style={{
                    backgroundColor: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditedTitle(step.card?.title || "");
                  }}
                  className="px-3 py-1 text-xs rounded"
                  style={{
                    backgroundColor: "var(--neutral-100)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="p-3 rounded cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: "var(--background)",
                border: "1px solid var(--border)",
              }}
              onClick={() => setIsEditing(true)}
            >
              <div className="text-base font-medium" style={{ color: "var(--foreground)" }}>
                {step.card.title}
              </div>
              <div className="text-xs opacity-60 mt-1" style={{ color: "var(--foreground)" }}>
                {step.card.summary}
              </div>
              <div className="text-xs opacity-40 mt-1" style={{ color: "var(--foreground)" }}>
                {step.card.estimatedMinutes} min • {step.card.energyLevel} energy
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Action Button */}
      {!step.needsClarification && (
        <button
          onClick={() => onAction(step)}
          className="w-full px-4 py-3 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          {step.intent === "create_card" ? "Create Card" :
           step.intent === "log" ? "Log" :
           step.intent === "plan" ? "Start Plan" :
           step.intent === "import_global" ? "Import" :
           "Continue"}
        </button>
      )}
    </div>
  );
}

