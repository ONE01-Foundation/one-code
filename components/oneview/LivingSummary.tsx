/**
 * Living Summary - Shows time slice summary
 * 
 * Displays:
 * - Summary text (1-3 lines)
 * - 2-4 key indicators (icons, not charts)
 * - Direction (↑ ↓ →)
 * - Balance (good / warning / off)
 * - Focus (top domain)
 */

"use client";

import { useTimeStore } from "@/lib/oneview/time-store";
import { TimeUnit } from "@/lib/oneview/time-types";

interface LivingSummaryProps {
  unit: TimeUnit;
  onDrillDown?: () => void;
}

export function LivingSummary({ unit, onDrillDown }: LivingSummaryProps) {
  const { currentTime, getCurrentSlice, getSummaryForSlice } = useTimeStore();
  
  const slice = getCurrentSlice(unit);
  const summary = slice ? getSummaryForSlice(slice.id) : null;
  
  if (!slice && !summary) {
    return (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
        <div className="w-64 p-4 rounded-lg text-center" style={{ color: "var(--foreground)", opacity: 0.5 }}>
          No data for this time period
        </div>
      </div>
    );
  }
  
  const displaySummary = summary?.summary || slice?.summary || "No summary available.";
  const indicators = summary?.indicators || slice?.indicators || [];
  
  const getDirectionIcon = (direction: "up" | "down" | "stable") => {
    switch (direction) {
      case "up": return "↑";
      case "down": return "↓";
      case "stable": return "→";
    }
  };
  
  const getBalanceColor = (balance: "good" | "warning" | "off") => {
    switch (balance) {
      case "good": return "var(--foreground)";
      case "warning": return "#f59e0b";
      case "off": return "#ef4444";
    }
  };
  
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
      <div
        className="w-80 p-6 rounded-lg space-y-4 pointer-events-auto"
        style={{
          backgroundColor: "var(--background)",
          border: "2px solid var(--border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        {/* Summary Text */}
        <div className="text-base leading-relaxed" style={{ color: "var(--foreground)" }}>
          {displaySummary}
        </div>
        
        {/* Indicators */}
        {indicators.length > 0 && (
          <div className="flex flex-wrap gap-3 pt-2">
            {indicators.map((indicator, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-3 py-2 rounded"
                style={{
                  backgroundColor: "var(--neutral-100)",
                  border: "1px solid var(--border)",
                }}
              >
                <div className="text-xl">{indicator.icon}</div>
                <div className="flex flex-col">
                  <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                    {indicator.domain}
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="text-xs"
                      style={{ color: getBalanceColor(indicator.balance) }}
                    >
                      {getDirectionIcon(indicator.direction)}
                    </span>
                    <span
                      className="text-xs opacity-60"
                      style={{ color: "var(--foreground)" }}
                    >
                      {indicator.balance}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Drill Down Button */}
        {onDrillDown && (
          <button
            onClick={onDrillDown}
            className="w-full px-3 py-2 rounded text-sm font-medium transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "var(--neutral-100)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            }}
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
}

