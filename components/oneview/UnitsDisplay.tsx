/**
 * Units Display - Shows current balance
 * 
 * Small indicator in top-right corner
 */

"use client";

import { useUnitsStore } from "@/lib/oneview/units-store";

export function UnitsDisplay() {
  const { balance } = useUnitsStore();
  
  return (
    <div
      className="absolute top-4 right-20 z-10 px-3 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: "var(--neutral-100)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
      }}
      title={`Units: ${balance}. Daily refill: +10`}
    >
      {balance} Units
    </div>
  );
}

