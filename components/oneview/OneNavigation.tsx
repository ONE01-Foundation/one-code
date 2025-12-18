/**
 * One Navigation System
 * 
 * Three states: Explore (movement), Focus (preview), Enter (commit)
 * Joystick = current context sphere
 * World moves around joystick
 */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavStore } from "@/lib/oneview/nav-store";
import { useOneViewCoreStore } from "@/lib/oneview/core-store";

const BUBBLE_RADIUS = 200; // Distance from center
const CENTER_SIZE = 80; // Center sphere size (always same)
const PREVIEW_RADIUS = 120; // Distance for preview trigger
const BUBBLE_SIZE = 64; // Regular bubble size

interface BubblePosition {
  id: string;
  x: number;
  y: number;
  distance: number;
}

export function OneNavigation() {
  const navStore = useNavStore();
  const coreStore = useOneViewCoreStore();
  
  const { pathStack, focusedNodeId, panOffset, mode, setFocusedNode, enterNode } = navStore;
  const { privateBubbles, globalBubbles } = coreStore;
  
  const [worldOffset, setWorldOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const recenterTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Get current context (joystick sphere)
  const currentContext = navStore.getCurrentContext();
  const bubbles = mode === "private" ? privateBubbles : globalBubbles;
  
  // Get children of current context
  const childBubbles = Object.values(bubbles).filter((b) => b.parentId === currentContext);
  
  // Get parent bubble (for back anchor) - the bubble that contains currentContext
  const currentBubble = currentContext ? bubbles[currentContext] : null;
  const parentBubble = currentBubble?.parentId ? bubbles[currentBubble.parentId] : null;
  
  // Calculate bubble positions relative to center
  const calculatePositions = useCallback((): BubblePosition[] => {
    const positions: BubblePosition[] = [];
    
    childBubbles.forEach((bubble, index) => {
      const angle = (index / Math.max(childBubbles.length, 1)) * Math.PI * 2;
      const x = Math.cos(angle) * BUBBLE_RADIUS;
      const y = Math.sin(angle) * BUBBLE_RADIUS;
      const distance = Math.sqrt(x * x + y * y);
      
      positions.push({
        id: bubble.id,
        x: x + worldOffset.x + panOffset.x,
        y: y + worldOffset.y + panOffset.y,
        distance,
      });
    });
    
    return positions;
  }, [childBubbles, worldOffset, panOffset]);
  
  const bubblePositions = calculatePositions();
  
  // Find nearest bubble to center for preview
  const nearestBubble = bubblePositions.reduce((nearest, current) => {
    if (!nearest || current.distance < nearest.distance) {
      return current;
    }
    return nearest;
  }, null as BubblePosition | null);
  
  const previewBubble = nearestBubble && nearestBubble.distance < PREVIEW_RADIUS
    ? childBubbles.find((b) => b.id === nearestBubble.id)
    : null;
  
  // Auto-focus nearest bubble if none focused
  useEffect(() => {
    if (previewBubble && !focusedNodeId) {
      setFocusedNode(previewBubble.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewBubble?.id, focusedNodeId]);
  
  // Joystick drag handler (world moves opposite)
  const handleJoystickDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: worldOffset.x,
      offsetY: worldOffset.y,
    };
    
    // Clear recenter timer
    if (recenterTimerRef.current) {
      clearTimeout(recenterTimerRef.current);
      recenterTimerRef.current = null;
    }
  }, [worldOffset]);
  
  const handleJoystickMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    // World moves opposite direction (GPS-like)
    const dx = -(e.clientX - dragStartRef.current.x);
    const dy = -(e.clientY - dragStartRef.current.y);
    
    setWorldOffset({
      x: dragStartRef.current.offsetX + dx,
      y: dragStartRef.current.offsetY + dy,
    });
  }, [isDragging]);
  
  const handleJoystickUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    dragStartRef.current = null;
    
    // Fail-safe: recenter after 2 seconds of no interaction
    recenterTimerRef.current = setTimeout(() => {
      setWorldOffset({ x: 0, y: 0 });
      navStore.setPanOffset({ x: 0, y: 0 });
    }, 2000);
  }, [navStore]);
  
  // Handle center sphere tap (enter)
  const handleCenterTap = useCallback(() => {
    if (focusedNodeId) {
      enterNode(focusedNodeId);
      setWorldOffset({ x: 0, y: 0 }); // Reset world on enter
    }
  }, [focusedNodeId, enterNode]);
  
  // Handle bubble tap (focus)
  const handleBubbleTap = useCallback((bubbleId: string) => {
    setFocusedNode(bubbleId);
    // Recenter world to bring bubble to center
    const bubblePos = bubblePositions.find((p) => p.id === bubbleId);
    if (bubblePos) {
      setWorldOffset({ x: -bubblePos.x, y: -bubblePos.y });
    }
  }, [setFocusedNode, bubblePositions]);
  
  // Handle back anchor tap
  const handleBackTap = useCallback(() => {
    navStore.goBack();
    setWorldOffset({ x: 0, y: 0 });
  }, [navStore]);
  
  // Handle back anchor long-press (home)
  const handleBackLongPress = useCallback(() => {
    navStore.goHome();
    setWorldOffset({ x: 0, y: 0 });
  }, [navStore]);
  
  // Get center sphere (current context or first child)
  const centerSphere = currentContext
    ? bubbles[currentContext]
    : childBubbles[0] || null;
  
  const centerIcon = centerSphere?.icon || "🏠";
  const centerTitle = centerSphere?.title || "Home";
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Children bubbles (around center) */}
      {bubblePositions.map((pos) => {
        const bubble = childBubbles.find((b) => b.id === pos.id);
        if (!bubble) return null;
        
        const isFocused = focusedNodeId === bubble.id;
        const isPreview = previewBubble?.id === bubble.id;
        const scale = isPreview ? 1.2 : 1.0;
        
        return (
          <div
            key={bubble.id}
            className="absolute rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
            style={{
              width: `${BUBBLE_SIZE}px`,
              height: `${BUBBLE_SIZE}px`,
              left: `calc(50% + ${pos.x}px)`,
              top: `calc(50% + ${pos.y}px)`,
              transform: `translate(-50%, -50%) scale(${scale})`,
              opacity: isFocused ? 1 : 0.5,
              backgroundColor: isPreview ? "var(--neutral-100)" : "transparent",
              border: `1px solid var(--border)`,
              pointerEvents: "auto",
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleBubbleTap(bubble.id);
            }}
            title={bubble.title}
          >
            <div className="text-2xl">{bubble.icon}</div>
          </div>
        );
      })}
      
      {/* Center sphere (joystick) - always visible */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300"
        style={{
          width: `${CENTER_SIZE}px`,
          height: `${CENTER_SIZE}px`,
          backgroundColor: "var(--foreground)",
          color: "var(--background)",
          border: "2px solid var(--border)",
          pointerEvents: "auto",
          transform: isDragging ? "scale(1.1)" : "scale(1)",
        }}
        onPointerDown={handleJoystickDown}
        onPointerMove={handleJoystickMove}
        onPointerUp={handleJoystickUp}
        onPointerCancel={handleJoystickUp}
        onClick={handleCenterTap}
        title={`${centerTitle} - Drag to move, tap to enter`}
      >
        <div className="text-3xl">{centerIcon}</div>
      </div>
      
      {/* Back anchor (bottom) */}
      {parentBubble && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300"
          style={{
            width: `${CENTER_SIZE}px`,
            height: `${CENTER_SIZE}px`,
            backgroundColor: "var(--neutral-100)",
            border: "2px solid var(--border)",
            pointerEvents: "auto",
          }}
          onClick={handleBackTap}
          onContextMenu={(e) => {
            e.preventDefault();
            handleBackLongPress();
          }}
          title="Tap: Back | Long-press: Home"
        >
          <div className="text-2xl">{parentBubble.icon}</div>
        </div>
      )}
    </div>
  );
}

