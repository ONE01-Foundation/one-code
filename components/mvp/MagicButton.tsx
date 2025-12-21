/**
 * MagicButton - Generate AI insight
 */

"use client";

import { useState } from "react";
import { useMVPStore } from "@/lib/mvp/store";
import { generateInsight } from "@/lib/mvp/ai";

interface MagicButtonProps {
  nodeId: string;
}

export function MagicButton({ nodeId }: MagicButtonProps) {
  const store = useMVPStore();
  const [insight, setInsight] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    
    const node = store.nodes[nodeId];
    if (!node) {
      setIsLoading(false);
      return;
    }
    
    let momentTexts: string[] = [];
    
    // If World: aggregate from all descendants
    if (node.type === "world") {
      const allDescendants = Object.values(store.nodes).filter((n) => {
        const isDescendant = (nid: string): boolean => {
          const n = store.nodes[nid];
          if (!n) return false;
          if (n.id === nodeId) return true;
          if (n.parentId === nodeId) return true;
          if (n.parentId && isDescendant(n.parentId)) return true;
          return false;
        };
        return n.id !== nodeId && isDescendant(n.id);
      });
      const descendantIds = [nodeId, ...allDescendants.map((n) => n.id)];
      const allMoments = store.moments.filter((m) =>
        m.nodeIds.some((nid) => descendantIds.includes(nid))
      );
      momentTexts = allMoments.map((m) => m.rawText);
    } else if (node.type === "cluster") {
      // Cluster: use its cards + moments
      const clusterCards = store.getCardsForNode(nodeId);
      const clusterMoments = store.moments.filter((m) => m.nodeIds.includes(nodeId));
      momentTexts = [
        ...clusterCards.map((c) => c.title),
        ...clusterMoments.map((m) => m.rawText),
      ];
    } else {
      // Sphere or other: use its moments
      const nodeMoments = store.moments.filter((m) => m.nodeIds.includes(nodeId));
      momentTexts = nodeMoments.map((m) => m.rawText);
    }
    
    // Generate insight from collected texts
    const result = await generateInsight(nodeId, momentTexts);
    setInsight(result);
    setIsLoading(false);
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="absolute top-4 right-4 z-30 px-3 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
      >
        {isLoading ? "✨ Thinking..." : "✨ Magic"}
      </button>
      
      {/* Insight Display */}
      {insight && (
        <div
          className="absolute top-16 right-4 z-30 max-w-xs p-4 rounded-lg text-sm"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <div className="mb-2 font-medium">✨ Insight</div>
          <div className="opacity-80">{insight}</div>
          <button
            onClick={() => setInsight(null)}
            className="mt-2 text-xs opacity-60 hover:opacity-100"
          >
            Close
          </button>
        </div>
      )}
    </>
  );
}

