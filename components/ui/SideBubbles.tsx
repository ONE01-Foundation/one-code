/**
 * Side Bubbles - 3-Slot Navigation v0.1
 * 
 * LAST | NOW | NEXT
 * Fixed positions, always render 3 slots
 */

"use client";

import { BubbleSlots, BubbleSlot } from "@/lib/bubbles";
import { UILang } from "@/lib/lang";
import { t } from "@/lib/ui-text";

interface SideBubblesProps {
  bubbles: BubbleSlots;
  onSelect?: (slot: BubbleSlot) => void;
  uiLang?: UILang;
}

// Label translations
const getSlotLabel = (slot: BubbleSlot, uiLang: UILang): string => {
  if (uiLang === "he") {
    switch (slot) {
      case "last":
        return "אחרון";
      case "now":
        return "עכשיו";
      case "next":
        return "הבא";
    }
  }
  // English
  switch (slot) {
    case "last":
      return "LAST";
    case "now":
      return "NOW";
    case "next":
      return "NEXT";
  }
};

export function SideBubbles({
  bubbles,
  onSelect,
  uiLang = "en",
}: SideBubblesProps) {
  // Fixed 3 positions: Left (LAST), Center (NOW), Right (NEXT)
  const positions: Record<BubbleSlot, { top: string; left?: string; right?: string; transform: string }> = {
    last: { top: "50%", left: "10%", transform: "translate(-50%, -50%)" },
    now: { top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
    next: { top: "50%", right: "10%", transform: "translate(50%, -50%)" },
  };

  const slots: BubbleSlot[] = ["last", "now", "next"];

  return (
    <>
      {slots.map((slot) => {
        const bubble = bubbles[slot];
        const position = positions[slot];
        const isEmpty = !bubble;

        return (
          <div
            key={slot}
            onClick={() => !isEmpty && onSelect?.(slot)}
            className={`absolute w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${
              isEmpty ? "opacity-10" : "opacity-40 hover:opacity-70"
            }`}
            style={{
              ...position,
              backgroundColor: isEmpty ? "transparent" : "var(--neutral-100)",
              border: `1px solid var(--border)`,
              color: "var(--foreground)",
            }}
            title={isEmpty ? undefined : `${bubble.title} (${slot})`}
          >
            {/* Slot label (tiny) */}
            <div className="text-[9px] opacity-60 mb-1 font-medium uppercase">
              {getSlotLabel(slot, uiLang)}
            </div>
            
            {/* Title (1 line, truncate) */}
            {!isEmpty && (
              <div className="text-xs text-center px-2 truncate w-full font-normal">
                {bubble.title}
              </div>
            )}
            
            {/* Placeholder for empty slot */}
            {isEmpty && (
              <div className="text-[10px] opacity-30">—</div>
            )}
          </div>
        );
      })}
    </>
  );
}
