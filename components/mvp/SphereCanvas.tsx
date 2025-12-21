/**
 * SphereCanvas - Main sphere navigation canvas
 */

"use client";

import { useCallback, useRef, useState } from "react";
import { useMVPStore } from "@/lib/mvp/store";
import { SphereNode } from "./SphereNode";
import { CenterPreview } from "./CenterPreview";
import { BreadcrumbBar } from "./BreadcrumbBar";
import { MagicButton } from "./MagicButton";
import { InputBar } from "./InputBar";

export function SphereCanvas() {
  const store = useMVPStore();
  const { viewMode, focusedNodeId } = store;
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ nodeId: string; x: number; y: number } | null>(null);

  // Get nodes to display
  const getDisplayNodes = () => {
    if (viewMode === "home") {
      // Show root spheres (no parent)
      return store.getChildren(null);
    } else if (viewMode === "drill") {
      // Show children of current path's last node
      const pathNodeName = store.currentPath[store.currentPath.length - 1];
      const pathNode = Object.values(store.nodes).find((n) => n.name === pathNodeName);
      if (pathNode) {
        return store.getChildren(pathNode.id);
      }
    }
    return [];
  };

  const displayNodes = getDisplayNodes();
  const focusedNode = focusedNodeId ? store.nodes[focusedNodeId] : null;

  // Handle drag start
  const handleNodeDragStart = useCallback((nodeId: string, e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      nodeId,
      x: e.clientX,
      y: e.clientY,
    };
  }, []);

  // Handle drag move with magnetic snap
  const handleNodeDragMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;

    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Magnetic snap: smooth threshold at 120px
    const snapThreshold = 120;
    if (distance < snapThreshold) {
      // Smooth magnetic effect
      const snapStrength = 1 - (distance / snapThreshold);
      if (snapStrength > 0.3) {
        store.setFocusedNode(dragStartRef.current.nodeId);
      }
    }
  }, [isDragging, store]);

  // Handle drag end
  const handleNodeDragEnd = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);

  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundColor: "#000000",
        color: "#ffffff",
      }}
      onPointerMove={handleNodeDragMove}
      onPointerUp={handleNodeDragEnd}
      onPointerCancel={handleNodeDragEnd}
    >
      {/* Sphere Nodes */}
      <div className="absolute inset-0">
        {displayNodes.map((node, index) => {
          const isFocused = node.id === focusedNodeId;
          const angle = (index / Math.max(displayNodes.length, 1)) * Math.PI * 2;
          const radius = 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          // Calculate opacity based on recency
          const lastActivity = new Date(node.lastActivityAt).getTime();
          const now = Date.now();
          const daysSinceActivity = (now - lastActivity) / (1000 * 60 * 60 * 24);
          const opacity = Math.max(0.3, 1.0 - daysSinceActivity * 0.1);

          return (
            <SphereNode
              key={node.id}
              node={node}
              x={x}
              y={y}
              isFocused={isFocused}
              opacity={opacity}
              onDragStart={(e) => handleNodeDragStart(node.id, e)}
              onTap={() => store.setFocusedNode(node.id)}
              onLongPress={() => {
                // Settings panel (TODO)
                console.log("Settings for:", node.name);
              }}
            />
          );
        })}
      </div>

      {/* Center Preview */}
      {focusedNode && (
        <CenterPreview
          node={focusedNode}
          onEnter={() => store.enterNode(focusedNode.id)}
        />
      )}

      {/* Magic Button */}
      {focusedNode && (
        <MagicButton nodeId={focusedNode.id} />
      )}

      {/* Breadcrumb Bar */}
      <BreadcrumbBar />

      {/* Input Bar */}
      <InputBar />
    </div>
  );
}

