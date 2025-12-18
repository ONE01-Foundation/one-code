/**
 * Sphere - Individual sphere component
 */

"use client";

import { SphereNode } from "@/lib/one/types";

interface SphereProps {
  node: SphereNode;
  isFocused?: boolean;
  onClick?: () => void;
}

export function Sphere({ node, isFocused = false, onClick }: SphereProps) {
  const size = isFocused ? 120 : 60;
  
  return (
    <div
      className="rounded-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: isFocused ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 0.05)",
        border: `1px solid ${isFocused ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
        transform: isFocused ? "scale(1)" : "scale(1)",
      }}
      onClick={onClick}
    >
      {node.icon && (
        <div className="text-3xl mb-1">{node.icon}</div>
      )}
      <div className="text-sm font-medium">{node.title}</div>
      {node.children && node.children.length > 0 && (
        <div className="text-xs opacity-60 mt-1">{node.children.length}</div>
      )}
    </div>
  );
}

