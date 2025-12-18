/**
 * Center Stage - Shows time/date and preview when bubble is centered
 */

"use client";

import { useOneViewStore } from "@/lib/oneview/store";

export function CenterStage() {
  const { viewState, spheres, cards } = useOneViewStore();
  const { centeredBubbleId, timeCursor } = viewState;
  
  // Format time
  const date = new Date(timeCursor);
  const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  
  // Get preview data if bubble is centered
  let preview = null;
  if (centeredBubbleId) {
    // Check if it's a sphere or card
    const sphere = spheres[centeredBubbleId];
    const card = cards[centeredBubbleId];
    
    if (sphere) {
      preview = {
        title: sphere.name,
        metric: sphere.stats?.count ? `${sphere.stats.count} items` : null,
        trend: sphere.stats?.trend,
        hint: `Tap to enter ${sphere.name}`,
      };
    } else if (card) {
      preview = {
        title: card.title,
        metric: card.metrics ? `${card.metrics.key}: ${card.metrics.value}` : null,
        trend: card.metrics?.trend,
        hint: card.summary.substring(0, 50),
      };
    }
  }
  
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
        
        {/* Preview (max 3 items) */}
        {preview && (
          <div className="w-full px-4 space-y-2 mt-4">
            {preview.metric && (
              <div className="text-xs opacity-80 text-center" style={{ color: "var(--foreground)" }}>
                {preview.metric}
              </div>
            )}
            {preview.trend && (
              <div className="text-xs opacity-60 text-center" style={{ color: "var(--foreground)" }}>
                {preview.trend === "up" ? "↗" : preview.trend === "down" ? "↘" : "→"}
              </div>
            )}
            {preview.hint && (
              <div className="text-xs opacity-60 text-center px-2" style={{ color: "var(--foreground)" }}>
                {preview.hint}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

