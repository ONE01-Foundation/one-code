/**
 * SphereNode - Individual sphere component
 */

"use client";

import { useRef } from "react";
import { SphereNode as SphereNodeType } from "@/lib/mvp/types";

interface SphereNodeProps {
  node: SphereNodeType;
  x: number;
  y: number;
  isFocused: boolean;
  opacity: number;
  onDragStart: (e: React.PointerEvent) => void;
  onTap: () => void;
  onLongPress: () => void;
}

export function SphereNode({
  node,
  x,
  y,
  isFocused,
  opacity,
  onDragStart,
  onTap,
  onLongPress,
}: SphereNodeProps) {
  const size = isFocused ? 80 : 60;
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    onDragStart(e);
    
    // Long press detection
    longPressTimerRef.current = setTimeout(() => {
      onLongPress();
      longPressTimerRef.current = null;
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      onTap();
    }
  };

  return (
    <div
      className="absolute rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
      style={{
        left: `calc(50% + ${x}px)`,
        top: `calc(50% + ${y}px)`,
        transform: "translate(-50%, -50%)",
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: isFocused
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${
          isFocused ? "rgba(255, 255, 255, 0.4)" : "rgba(255, 255, 255, 0.2)"
        }`,
        opacity,
        scale: isFocused ? 1.1 : 1.0,
      }}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {node.icon && <div className="text-xl mb-1">{node.icon}</div>}
      <div className="text-xs font-medium text-center px-1">{node.name}</div>
    </div>
  );
}
