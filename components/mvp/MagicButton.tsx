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
    
    // Get recent moments for this node
    const nodeMoments = store.moments.filter((m) => m.nodeIds.includes(nodeId));
    const momentTexts = nodeMoments.map((m) => m.rawText);
    
    // Generate insight
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

