/**
 * OneNav Preview - Compact preview card overlay
 * 
 * Shows when a sphere is focused (center)
 * - Title (label)
 * - 1-2 key stats
 * - One primary CTA
 */

"use client";

import { useNavStore } from "@/lib/oneview/nav-store";
import { useOneViewCoreStore } from "@/lib/oneview/core-store";

export function OneNavPreview() {
  const navStore = useNavStore();
  const coreStore = useOneViewCoreStore();
  
  const { focusedNodeId, mode } = navStore;
  const { privateBubbles, globalBubbles, getBubblePreview, importToPrivate } = coreStore;
  
  if (!focusedNodeId) return null;
  
  const bubbles = mode === "private" ? privateBubbles : globalBubbles;
  const bubble = bubbles[focusedNodeId] || null;
  const preview = getBubblePreview(focusedNodeId);
  
  if (!bubble || !preview) return null;
  
  const isGlobal = mode === "global";
  const hasChildren = bubble.childrenIds && bubble.childrenIds.length > 0;
  
  const handleOpen = () => {
    if (hasChildren) {
      navStore.enterNode(bubble.id);
    }
  };
  
  const handleImport = () => {
    importToPrivate(bubble.id);
    // After import, switch to private mode and focus the imported bubble
    navStore.setMode("private");
    // The imported bubble will be in private tree now
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div
        className="w-64 p-4 rounded-lg space-y-3 pointer-events-auto"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* Title */}
        <div className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
          {preview.title}
        </div>
        
        {/* Stats */}
        {preview.metric && (
          <div className="text-sm opacity-60" style={{ color: "var(--foreground)" }}>
            {preview.metric}
          </div>
        )}
        
        {/* AI Summary */}
        {preview.aiSummary && (
          <div className="text-xs opacity-50" style={{ color: "var(--foreground)" }}>
            {preview.aiSummary}
          </div>
        )}
        
        {/* CTA */}
        <div className="flex gap-2 pt-2">
          {isGlobal ? (
            <>
              <button
                onClick={handleImport}
                className="flex-1 px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--neutral-100)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                }}
              >
                Import to Private
              </button>
              {hasChildren && (
                <button
                  onClick={handleOpen}
                  className="flex-1 px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  Open
                </button>
              )}
            </>
          ) : (
            hasChildren && (
              <button
                onClick={handleOpen}
                className="w-full px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                Open
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}

