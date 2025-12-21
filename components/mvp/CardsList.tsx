/**
 * CardsList - View and manage cards
 */

"use client";

import { useMVPStore } from "@/lib/mvp/store";
import { Card } from "@/lib/mvp/types";
import { useState } from "react";

export function CardsList() {
  const store = useMVPStore();
  const { focusedNodeId, viewMode } = store;

  if (viewMode !== "cards" || !focusedNodeId) return null;

  const cards = store.getCardsForNode(focusedNodeId);
  const node = store.nodes[focusedNodeId];

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col"
      style={{
        backgroundColor: "#000000",
        color: "#ffffff",
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-white border-opacity-10">
        <h1 className="text-xl font-medium">{node?.name}</h1>
        <div className="text-sm opacity-60 mt-1">{cards.length} cards</div>
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {cards.length === 0 ? (
          <div className="text-center opacity-60 mt-8">
            No cards yet. Create one via input.
          </div>
        ) : (
          cards.map((card) => (
            <CardItem key={card.id} card={card} />
          ))
        )}
      </div>
    </div>
  );
}

function CardItem({ card }: { card: Card }) {
  const [isOpen, setIsOpen] = useState(false);
  const store = useMVPStore();

  return (
    <div
      className="p-4 rounded-lg border border-white border-opacity-10 cursor-pointer hover:bg-white hover:bg-opacity-5 transition-colors"
      onClick={() => setIsOpen(!isOpen)}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{card.title}</div>
          <div className="text-sm opacity-60 mt-1">
            {card.status} • {new Date(card.createdAt).toLocaleDateString()}
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            store.updateCard(card.id, {
              status: card.status === "open" ? "done" : "open",
            });
          }}
          className="px-3 py-1 text-xs rounded"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {card.status === "open" ? "✓ Complete" : "Reopen"}
        </button>
      </div>
      
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-white border-opacity-10">
          <div className="text-sm opacity-80">{card.notes || "No notes yet."}</div>
          {/* TODO: Add notes editor and next steps generation */}
        </div>
      )}
    </div>
  );
}

