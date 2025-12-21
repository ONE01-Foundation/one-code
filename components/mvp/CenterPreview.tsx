/**
 * CenterPreview - Centered preview sphere with metrics
 */

"use client";

import { SphereNode as SphereNodeType } from "@/lib/mvp/types";
import { useMVPStore } from "@/lib/mvp/store";

interface CenterPreviewProps {
  node: SphereNodeType;
  onEnter: () => void;
}

export function CenterPreview({ node, onEnter }: CenterPreviewProps) {
  const store = useMVPStore();
  const metrics = store.getMetrics(node.id);
  const unitsToday = store.getUnitsToday(node.id);

  return (
    <div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
    >
      <div
        className="rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
        style={{
          width: "120px",
          height: "120px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "2px solid rgba(255, 255, 255, 0.3)",
        }}
        onClick={() => {
          // Only allow enter if node is actually centered (focused)
          onEnter();
        }}
      >
        {node.icon && <div className="text-3xl mb-2">{node.icon}</div>}
        <div className="text-sm font-medium mb-1">{node.name}</div>
        
        {/* Metrics */}
        <div className="text-xs opacity-60 mt-2 space-y-1">
          <div>{metrics.openCards} open cards</div>
          <div>{metrics.momentsToday} moments today</div>
          <div>{unitsToday} units today</div>
        </div>
      </div>
      
      {/* Tap hint */}
      <div className="text-xs opacity-40 mt-4 text-center">
        Tap to enter
      </div>
    </div>
  );
}

