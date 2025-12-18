/**
 * Core Center Preview - Shows preview when bubble is centered
 * 
 * Preview: title + 1 metric + 1 AI summary line
 */

"use client";

import { useOneViewCoreStore } from "@/lib/oneview/core-store";

export function CoreCenterPreview() {
  const {
    navigation,
    getCenteredBubble,
    getBubblePreview,
  } = useOneViewCoreStore();
  
  const { centeredBubbleId, mode } = navigation;
  const bubble = getCenteredBubble();
  const preview = centeredBubbleId ? getBubblePreview(centeredBubbleId) : null;
  
  // Format time
  const date = new Date();
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-48 h-48 rounded-full flex flex-col items-center justify-center border-2 border-opacity-20" style={{ borderColor: "var(--border)" }}>
        {/* Time */}
        <div className="text-4xl font-light mb-2" style={{ color: "var(--foreground)" }}>
          {timeStr}
        </div>
        
        {/* Date */}
        <div className="text-sm opacity-60 mb-4" style={{ color: "var(--foreground)" }}>
          {dateStr}
        </div>
        
        {/* Preview (only when bubble is centered) */}
        {preview && (
          <div className="w-full px-4 space-y-2 mt-4">
            <div className="text-xs font-medium opacity-80 text-center" style={{ color: "var(--foreground)" }}>
              {preview.title}
            </div>
            {preview.metric && (
              <div className="text-xs opacity-60 text-center" style={{ color: "var(--foreground)" }}>
                {preview.metric}
              </div>
            )}
            {preview.aiSummary && (
              <div className="text-xs opacity-50 text-center px-2" style={{ color: "var(--foreground)" }}>
                {preview.aiSummary}
              </div>
            )}
            {mode === "global" && bubble && (
              <button
                className="mt-2 px-3 py-1 text-xs rounded-full transition-opacity hover:opacity-80 pointer-events-auto"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  useOneViewCoreStore.getState().importToPrivate(bubble.id);
                }}
              >
                Add to Private
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

