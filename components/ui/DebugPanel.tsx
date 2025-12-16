/**
 * Debug Panel (dev only)
 * 
 * Shows current scope, data source, and card ids
 */

import { Scope, ActionCard } from "@/lib/types";

interface DebugPanelProps {
  scope: Scope;
  cards: ActionCard[];
  dataSource: string;
}

export function DebugPanel({ scope, cards, dataSource }: DebugPanelProps) {
  // Only show in development
  if (process.env.NODE_ENV === "production") return null;
  
  return (
    <div
      className="fixed bottom-4 left-4 p-3 rounded text-xs font-mono opacity-50 hover:opacity-100 transition-opacity z-50"
      style={{
        backgroundColor: "var(--background)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
        maxWidth: "200px",
      }}
    >
      <div className="mb-2">
        <strong>Scope:</strong> {scope}
      </div>
      <div className="mb-2">
        <strong>Source:</strong> {dataSource}
      </div>
      <div>
        <strong>Cards:</strong> {cards.length}
        <div className="mt-1 text-xs opacity-70">
          {cards.map((c) => c.id).join(", ")}
        </div>
      </div>
    </div>
  );
}

