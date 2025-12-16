/**
 * ONE Screen - Unified single-screen interface
 * 
 * PERMANENT ZONES:
 * - Top: Mode toggle (Private / Global)
 * - Center: Primary content area
 * - Surrounding: Four inactive placeholder circles
 * - Bottom: Profile + foundation link
 * 
 * PRINCIPLES:
 * - One screen only
 * - One action at a time
 * - One active element
 * - Silence is preferred over noise
 */

"use client";

import { useState, useEffect } from "react";
import { Card, CardStatus, GlobalMirror } from "@/lib/types";

type Mode = "private" | "global";

// Exactly two options - fixed, not dynamic
const PRIVATE_OPTIONS = [
  { id: "1", label: "Start something new", description: "Begin a new action" },
  { id: "2", label: "Continue existing", description: "Resume what matters" },
];

export default function OneScreen() {
  const [mode, setMode] = useState<Mode>("private");
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [globalData, setGlobalData] = useState<GlobalMirror | null>(null);

  // Load active card from localStorage on mount
  useEffect(() => {
    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    // Find the most recent pending card, or first pending
    const pending = cards
      .filter((c: Card) => c.status === "pending")
      .sort((a: Card, b: Card) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0];
    
    if (pending) {
      setActiveCard({
        ...pending,
        createdAt: new Date(pending.createdAt),
        completedAt: pending.completedAt ? new Date(pending.completedAt) : undefined,
        delayedUntil: pending.delayedUntil ? new Date(pending.delayedUntil) : undefined,
      });
    }
  }, []);

  // Load global data when switching to global mode
  useEffect(() => {
    if (mode === "global") {
      const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
      setGlobalData({
        totalIntents: cards.length,
        totalCards: cards.length,
        cardsByStatus: {
          pending: cards.filter((c: any) => c.status === "pending").length,
          done: cards.filter((c: any) => c.status === "done").length,
          delayed: cards.filter((c: any) => c.status === "delayed").length,
        },
      });
    }
  }, [mode]);

  const handleOptionSelect = (option: typeof PRIVATE_OPTIONS[0]) => {
    // Create a card from the option
    const card: Card = {
      id: `card_${Date.now()}`,
      intentId: `intent_${Date.now()}`,
      action: option.label,
      status: "pending",
      createdAt: new Date(),
      userId: "user",
    };

    // Save to localStorage
    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    cards.push({
      ...card,
      createdAt: card.createdAt.toISOString(),
    });
    localStorage.setItem("one_cards", JSON.stringify(cards));

    // Show the card (only one visible at a time)
    setActiveCard(card);
  };

  const handleCardStatusChange = (status: CardStatus) => {
    if (!activeCard) return;

    const cards = JSON.parse(localStorage.getItem("one_cards") || "[]");
    const updated = cards.map((c: Card) => {
      if (c.id === activeCard.id) {
        return {
          ...c,
          status,
          completedAt: status === "done" ? new Date().toISOString() : c.completedAt,
        };
      }
      return c;
    });
    localStorage.setItem("one_cards", JSON.stringify(updated));

    setActiveCard({ 
      ...activeCard, 
      status,
      completedAt: status === "done" ? new Date() : activeCard.completedAt,
    });
  };

  const handleClearCard = () => {
    setActiveCard(null);
  };

  return (
    <div className="fixed inset-0 bg-white flex flex-col">
      {/* Top: Mode Toggle - Permanent Zone */}
      <div className="flex items-center justify-center pt-6 pb-4">
        <div className="flex gap-1 border border-black rounded-full px-1 py-1">
          <button
            onClick={() => setMode("private")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-opacity duration-200 ${
              mode === "private"
                ? "bg-black text-white"
                : "text-black hover:opacity-70"
            }`}
          >
            Private
          </button>
          <button
            onClick={() => setMode("global")}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-opacity duration-200 ${
              mode === "global"
                ? "bg-black text-white"
                : "text-black hover:opacity-70"
            }`}
          >
            Global
          </button>
        </div>
      </div>

      {/* Center: Primary Content Area - Permanent Zone */}
      <div className="flex-1 flex items-center justify-center px-6 relative overflow-hidden">
        {/* Surrounding: Four Inactive Placeholder Circles - Permanent Zone */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Left */}
          <div className="absolute top-8 left-8 w-16 h-16 rounded-full border border-neutral-200" />
          {/* Top Right */}
          <div className="absolute top-8 right-8 w-16 h-16 rounded-full border border-neutral-200" />
          {/* Bottom Left */}
          <div className="absolute bottom-8 left-8 w-16 h-16 rounded-full border border-neutral-200" />
          {/* Bottom Right */}
          <div className="absolute bottom-8 right-8 w-16 h-16 rounded-full border border-neutral-200" />
        </div>

        {/* Nobody Presence - Subtle Glow with Soft Motion */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-neutral-50 blur-3xl"
            style={{
              animation: "subtle-pulse 4s ease-in-out infinite",
            }}
          />
        </div>

        {/* Center Content */}
        <div className="relative z-10 w-full max-w-md">
          {mode === "private" ? (
            activeCard ? (
              <CardView
                card={activeCard}
                onStatusChange={handleCardStatusChange}
                onClear={handleClearCard}
              />
            ) : (
              <PrivateModeView
                options={PRIVATE_OPTIONS}
                onSelect={handleOptionSelect}
              />
            )
          ) : (
            <GlobalModeView data={globalData} />
          )}
        </div>
      </div>

      {/* Bottom: Profile + Foundation Link - Permanent Zone */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
        <div className="text-xs text-neutral-400">Profile</div>
        <a
          href="https://onefoundation.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-neutral-400 hover:text-black transition-colors duration-200"
        >
          ONE Foundation
        </a>
      </div>
    </div>
  );
}

// Private Mode View
function PrivateModeView({
  options,
  onSelect,
}: {
  options: typeof PRIVATE_OPTIONS;
  onSelect: (option: typeof PRIVATE_OPTIONS[0]) => void;
}) {
  return (
    <div className="space-y-10 text-center">
      {/* Primary text - large */}
      <div>
        <h1 className="text-5xl sm:text-6xl font-bold text-black mb-4">
          What matters now?
        </h1>
        {/* Secondary text - small */}
        <p className="text-sm text-neutral-500">
          Choose one direction to continue.
        </p>
      </div>

      {/* Exactly two options */}
      <div className="space-y-4">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            className="w-full px-6 py-4 bg-white border-2 border-black rounded-lg text-left hover:bg-black hover:text-white transition-colors duration-200"
          >
            <div className="font-medium text-lg">{option.label}</div>
            {option.description && (
              <div className="text-sm mt-1 opacity-70">{option.description}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// Card View - One card visible at a time
function CardView({
  card,
  onStatusChange,
  onClear,
}: {
  card: Card;
  onStatusChange: (status: CardStatus) => void;
  onClear: () => void;
}) {
  return (
    <div className="space-y-8 text-center">
      <div>
        <div className="inline-block px-3 py-1 text-xs font-medium border border-black rounded-full mb-4">
          {card.status.toUpperCase()}
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-black mb-2">
          {card.action}
        </h1>
      </div>

      <div className="space-y-3">
        {card.status === "pending" && (
          <>
            <button
              onClick={() => onStatusChange("done")}
              className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
            >
              Mark as Done
            </button>
            <button
              onClick={() => onStatusChange("delayed")}
              className="w-full px-6 py-4 bg-white border-2 border-black text-black rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
            >
              Delay
            </button>
          </>
        )}

        {card.status === "delayed" && (
          <button
            onClick={() => onStatusChange("pending")}
            className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
          >
            Resume
          </button>
        )}

        {card.status === "done" && (
          <button
            onClick={() => onStatusChange("pending")}
            className="w-full px-6 py-4 bg-white border-2 border-black text-black rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
          >
            Reopen
          </button>
        )}

        <button
          onClick={onClear}
          className="w-full px-4 py-2 text-neutral-500 hover:text-black text-sm transition-colors duration-200"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// Global Mode View - View-only, no actions
function GlobalModeView({ data }: { data: GlobalMirror | null }) {
  if (!data) {
    return (
      <div className="text-center text-neutral-400">Loading...</div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-black mb-2">Global Mirror</h1>
        <p className="text-sm text-neutral-500">Anonymous aggregates</p>
      </div>

      <div className="space-y-4">
        <div className="p-6 border-2 border-black rounded-lg text-center">
          <div className="text-4xl font-bold text-black">{data.totalIntents}</div>
          <div className="text-sm text-neutral-500 mt-1">Total Intents</div>
        </div>

        <div className="p-6 border-2 border-black rounded-lg text-center">
          <div className="text-4xl font-bold text-black">{data.totalCards}</div>
          <div className="text-sm text-neutral-500 mt-1">Total Cards</div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 border border-black rounded-lg text-center">
            <div className="text-2xl font-bold text-black">{data.cardsByStatus.pending}</div>
            <div className="text-xs text-neutral-500 mt-1">Pending</div>
          </div>
          <div className="p-4 border border-black rounded-lg text-center">
            <div className="text-2xl font-bold text-black">{data.cardsByStatus.done}</div>
            <div className="text-xs text-neutral-500 mt-1">Done</div>
          </div>
          <div className="p-4 border border-black rounded-lg text-center">
            <div className="text-2xl font-bold text-black">{data.cardsByStatus.delayed}</div>
            <div className="text-xs text-neutral-500 mt-1">Delayed</div>
          </div>
        </div>
      </div>
    </div>
  );
}

