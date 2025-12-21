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
  const [showCreateCard, setShowCreateCard] = useState(false);
  const [newCardTitle, setNewCardTitle] = useState("");

  if (viewMode !== "cards" || !focusedNodeId) return null;

  const cards = store.getCardsForNode(focusedNodeId);
  const node = store.nodes[focusedNodeId];

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardTitle.trim()) return;

    store.createCard({
      nodeId: focusedNodeId,
      title: newCardTitle.trim(),
      status: "open",
    });

    setNewCardTitle("");
    setShowCreateCard(false);
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-medium">{node?.name}</h1>
            <div className="text-sm opacity-60 mt-1">{cards.length} cards</div>
          </div>
          <button
            onClick={() => setShowCreateCard(!showCreateCard)}
            className="px-3 py-1 text-sm rounded transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            + Card
          </button>
        </div>
        
        {/* Create Card Input */}
        {showCreateCard && (
          <form onSubmit={handleCreateCard} className="mt-4">
            <input
              type="text"
              value={newCardTitle}
              onChange={(e) => setNewCardTitle(e.target.value)}
              placeholder="Card title..."
              autoFocus
              className="w-full px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
              }}
              onBlur={() => {
                if (!newCardTitle.trim()) {
                  setShowCreateCard(false);
                }
              }}
            />
          </form>
        )}
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

