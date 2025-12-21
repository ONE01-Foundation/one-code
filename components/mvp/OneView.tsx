/**
 * OneView MVP - Main component
 */

"use client";

import { useEffect, useState } from "react";
import { useMVPStore } from "@/lib/mvp/store";
import { SphereCanvas } from "./SphereCanvas";
import { CardsList } from "./CardsList";
import { MomentPreviewModal } from "./MomentPreviewModal";

export function OneView() {
  const store = useMVPStore();
  const { initialize, viewMode, focusedNodeId, createDraftMoment } = store;
  const [lastInsight, setLastInsight] = useState<string | null>(null);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Listen for magic insight events
  useEffect(() => {
    const handleMagicInsight = (e: CustomEvent) => {
      setLastInsight(e.detail.insight);
    };

    const handleMagicTrigger = (e: CustomEvent) => {
      // Trigger magic button programmatically
      if (e.detail.nodeId) {
        // This will be handled by MagicButton component
        // For now, just show the insight panel
      }
    };

    window.addEventListener("magic:insight", handleMagicInsight as EventListener);
    window.addEventListener("magic:trigger", handleMagicTrigger as EventListener);

    return () => {
      window.removeEventListener("magic:insight", handleMagicInsight as EventListener);
      window.removeEventListener("magic:trigger", handleMagicTrigger as EventListener);
    };
  }, []);

  const handleTurnIntoCard = () => {
    if (!lastInsight || !focusedNodeId) return;

    // Extract potential card title from insight (first few words)
    const words = lastInsight.split(/\s+/).slice(0, 5);
    const cardTitle = words.join(" ");

    const draft = {
      text: lastInsight,
      proposedTags: [store.nodes[focusedNodeId]?.name].filter(Boolean),
      proposedWorldIds: [],
      proposedNodeIds: [focusedNodeId],
      suggestedCardTitle: cardTitle,
    };

    store.createDraftMoment(draft);
    setLastInsight(null);
  };

  return (
    <>
      {viewMode === "cards" ? <CardsList /> : <SphereCanvas />}
      <MomentPreviewModal />
      
      {/* OneTap Insight Panel */}
      {lastInsight && (
        <div
          className="absolute top-20 right-4 z-30 max-w-xs p-4 rounded-lg"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div className="mb-2 font-medium text-sm">✨ Insight</div>
          <div className="text-sm opacity-80 mb-3">{lastInsight}</div>
          <div className="flex gap-2">
            <button
              onClick={handleTurnIntoCard}
              className="flex-1 px-3 py-2 rounded text-xs font-medium transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.2)",
              }}
            >
              Turn into Card
            </button>
            <button
              onClick={() => setLastInsight(null)}
              className="px-3 py-2 rounded text-xs transition-opacity hover:opacity-80"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

