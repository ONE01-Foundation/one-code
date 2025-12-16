/**
 * Name Path Modal - Minimal inline modal for naming path
 * 
 * Center card style, calm UI
 */

import { useState } from "react";

interface NamePathModalProps {
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function NamePathModal({ onSave, onCancel }: NamePathModalProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    
    if (trimmed.length === 0) {
      setError("Name cannot be empty");
      return;
    }
    
    if (trimmed.length > 12) {
      setError("Name must be 12 characters or less");
      return;
    }
    
    onSave(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md mx-4 rounded-lg"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-xl font-medium" style={{ color: "var(--foreground)" }}>
            Name this path
          </h2>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              placeholder="A short name"
              maxLength={12}
              autoFocus
              className="w-full px-4 py-3 rounded-lg text-base font-normal transition-opacity duration-200"
              style={{
                backgroundColor: "var(--background)",
                border: "2px solid var(--border)",
                color: "var(--foreground)",
              }}
            />
            {error && (
              <p className="text-xs mt-2 opacity-60" style={{ color: "var(--foreground)" }}>
                {error}
              </p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200"
              style={{
                backgroundColor: "var(--background)",
                border: "2px solid var(--border)",
                color: "var(--foreground)",
              }}
            >
              Not now
            </button>
            <button
              type="submit"
              disabled={name.trim().length === 0}
              className="flex-1 px-6 py-3 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200 disabled:opacity-50"
              style={{
                backgroundColor: "var(--foreground)",
                color: "var(--background)",
              }}
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

