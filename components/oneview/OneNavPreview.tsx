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
import { useUnitsStore } from "@/lib/oneview/units-store";

export function OneNavPreview() {
  const navStore = useNavStore();
  const coreStore = useOneViewCoreStore();
  const unitsStore = useUnitsStore();
  
  const { focusedNodeId, mode } = navStore;
  const { privateBubbles, globalBubbles, getBubblePreview, importToPrivate } = coreStore;
  
  // Only show preview if bubble is near center (preview state)
  if (!focusedNodeId) return null;
  
  const bubbles = mode === "private" ? privateBubbles : globalBubbles;
  const bubble = bubbles[focusedNodeId] || null;
  const preview = getBubblePreview(focusedNodeId);
  
  if (!bubble || !preview) return null;
  
  // Show preview only when bubble is in preview state (near center)
  // This is handled by OneNavigation component
  
  const isGlobal = mode === "global";
  const hasChildren = bubble.childrenIds && bubble.childrenIds.length > 0;
  const canAffordImport = unitsStore.canAfford(1);
  const unitsBalance = unitsStore.getBalance();
  
  const handleOpen = () => {
    if (hasChildren) {
      navStore.enterNode(bubble.id);
    }
  };
  
  const handleImport = () => {
    if (!canAffordImport) {
      alert(`Insufficient Units. You need 1 Unit to import. Current balance: ${unitsBalance}`);
      return;
    }
    
    // Get reference summary from global bubble
    const referenceSummary = preview.aiSummary || preview.metric || `Imported from Global: ${bubble.title}`;
    
    const newBubbleId = importToPrivate(bubble.id, referenceSummary);
    
    if (newBubbleId) {
      // After import, switch to private mode and enter the new bubble
      navStore.setMode("private");
      navStore.setFocusedNode(newBubbleId);
      navStore.enterNode(newBubbleId);
    } else {
      alert("Failed to import. Please check your Units balance.");
    }
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
        <div className="flex flex-col gap-2 pt-2">
          {isGlobal ? (
            <>
              <button
                onClick={handleImport}
                disabled={!canAffordImport}
                className="w-full px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canAffordImport ? "var(--foreground)" : "var(--neutral-100)",
                  border: "1px solid var(--border)",
                  color: canAffordImport ? "var(--background)" : "var(--foreground)",
                }}
              >
                {canAffordImport ? `Use this for me (1 Unit)` : `Need 1 Unit (you have ${unitsBalance})`}
              </button>
              {hasChildren && (
                <button
                  onClick={handleOpen}
                  className="w-full px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
                  style={{
                    backgroundColor: "transparent",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Explore (read-only)
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

