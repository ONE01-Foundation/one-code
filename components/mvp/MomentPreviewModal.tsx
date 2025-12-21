/**
 * MomentPreviewModal - Preview and confirm moment before committing
 */

"use client";

import { useState, useEffect } from "react";
import { useMVPStore } from "@/lib/mvp/store";
import { DraftMoment } from "@/lib/mvp/types";

export function MomentPreviewModal() {
  const store = useMVPStore();
  const { draftMoment, showMomentPreview, nodes } = store;
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>(draftMoment?.proposedNodeIds || []);
  const [createCard, setCreateCard] = useState(false);
  const [cardTitle, setCardTitle] = useState(draftMoment?.suggestedCardTitle || "");

  // Update selectedNodeIds when draftMoment changes
  useEffect(() => {
    if (draftMoment) {
      setSelectedNodeIds(draftMoment.proposedNodeIds || []);
      setCardTitle(draftMoment.suggestedCardTitle || "");
    }
  }, [draftMoment]);

  if (!showMomentPreview || !draftMoment) return null;

  const selectedNodes = selectedNodeIds.map((id) => nodes[id]).filter(Boolean);
  const allNodes = Object.values(nodes).filter((n) => !n.hidden);

  const handleRemoveTag = (nodeId: string) => {
    setSelectedNodeIds(selectedNodeIds.filter((id) => id !== nodeId));
  };

  const handleAddTag = (nodeId: string) => {
    if (!selectedNodeIds.includes(nodeId)) {
      setSelectedNodeIds([...selectedNodeIds, nodeId]);
    }
  };

  const handleConfirm = () => {
    store.commitDraftMoment({
      createCard,
      cardTitle: createCard ? cardTitle.trim() : undefined,
      selectedNodeIds,
    });
  };

  const handleCancel = () => {
    store.cancelDraftMoment();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      }}
      onClick={handleCancel}
    >
      <div
        className="w-full max-w-md mx-4 p-6 rounded-lg"
        style={{
          backgroundColor: "#000000",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title */}
        <h2 className="text-xl font-medium mb-4">Confirm Moment</h2>

        {/* Raw Text */}
        <div className="mb-4 p-3 rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
          <div className="text-sm opacity-60 mb-1">Text</div>
          <div className="text-sm">{draftMoment.text}</div>
        </div>

        {/* Tags */}
        <div className="mb-4">
          <div className="text-sm opacity-60 mb-2">Tags</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {selectedNodes.map((node) => (
              <div
                key={node.id}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                }}
              >
                <span>{node.name}</span>
                <button
                  onClick={() => handleRemoveTag(node.id)}
                  className="opacity-60 hover:opacity-100"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          {/* Add Tag Dropdown */}
          <select
            onChange={(e) => {
              if (e.target.value) {
                handleAddTag(e.target.value);
                e.target.value = "";
              }
            }}
            className="w-full px-3 py-2 rounded text-sm"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
            }}
          >
            <option value="">Add Tag...</option>
            {allNodes
              .filter((n) => !selectedNodeIds.includes(n.id))
              .map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.type})
                </option>
              ))}
          </select>
        </div>

        {/* Suggested Next Step */}
        {draftMoment.suggestedNextStep && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
            <div className="text-sm opacity-60 mb-1">Suggested Next Step</div>
            <div className="text-sm">{draftMoment.suggestedNextStep}</div>
          </div>
        )}

        {/* Create Card Checkbox */}
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={createCard}
              onChange={(e) => setCreateCard(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">Create Card from this</span>
          </label>
          
          {createCard && (
            <input
              type="text"
              value={cardTitle}
              onChange={(e) => setCardTitle(e.target.value)}
              placeholder="Card title..."
              className="w-full mt-2 px-3 py-2 rounded text-sm"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                color: "#ffffff",
              }}
            />
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 rounded-lg text-sm transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedNodeIds.length === 0}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
            }}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}


