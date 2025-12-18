/**
 * OneJoystick - Drag to pan sphere cloud
 * 
 * ONLY affects position/offset, not selection
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { useNavStore } from "@/lib/oneview/nav-store";

interface OneJoystickProps {
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

export function OneJoystick({ onDragStart, onDragEnd }: OneJoystickProps) {
  const { panOffset, setPanOffset } = useNavStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX: panOffset.x,
      offsetY: panOffset.y,
    };
    onDragStart?.();
  }, [panOffset, onDragStart]);
  
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    
    setPanOffset({
      x: dragStartRef.current.offsetX + dx,
      y: dragStartRef.current.offsetY + dy,
    });
  }, [isDragging, setPanOffset]);
  
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    dragStartRef.current = null;
    onDragEnd?.();
  }, [onDragEnd]);
  
  return (
    <div
      className="absolute inset-0 cursor-grab active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{
        pointerEvents: isDragging ? "auto" : "none", // Only capture when dragging
      }}
    />
  );
}

