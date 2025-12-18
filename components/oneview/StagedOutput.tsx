/**
 * Staged Output - Shows AI intent, plan, actions
 */

"use client";

import { StagedOutput as StagedOutputType } from "@/lib/oneview/types";

interface StagedOutputProps {
  output: StagedOutputType;
}

export function StagedOutput({ output }: StagedOutputProps) {
  return (
    <div
      className="p-3 rounded-lg space-y-2"
      style={{
        backgroundColor: "var(--neutral-100)",
        border: "1px solid var(--border)",
      }}
    >
      <div className="text-xs font-medium opacity-80" style={{ color: "var(--foreground)" }}>
        Intent: {output.intent}
      </div>
      
      {output.plan.length > 0 && (
        <div className="text-xs opacity-60" style={{ color: "var(--foreground)" }}>
          Plan: {output.plan.join(" → ")}
        </div>
      )}
      
      {output.actions.length > 0 && (
        <div className="text-xs opacity-50" style={{ color: "var(--foreground)" }}>
          Actions: {output.actions.length}
        </div>
      )}
      
      {output.ask && (
        <div className="text-xs opacity-70 italic" style={{ color: "var(--foreground)" }}>
          {output.ask}
        </div>
      )}
    </div>
  );
}

