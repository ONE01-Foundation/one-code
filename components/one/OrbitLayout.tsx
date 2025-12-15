/**
 * OrbitLayout - Subtle orbit ring background
 * Z-index: 0 (behind everything)
 */

"use client";

import { ReactNode } from "react";

interface OrbitLayoutProps {
  centerRadius: number;
  orbitRadius: number;
  children?: ReactNode;
}

export default function OrbitLayout({
  centerRadius,
  orbitRadius,
  children,
}: OrbitLayoutProps) {
  const ringInnerRadius = centerRadius + 20;
  const ringOuterRadius = orbitRadius - 32;

  return (
    <div className="absolute inset-0 pointer-events-none z-0" style={{ overflow: 'visible' }}>
      {/* Subtle orbit ring */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-neutral-200/30 pointer-events-none"
        style={{
          width: ringInnerRadius * 2,
          height: ringInnerRadius * 2,
          boxShadow: `0 0 0 ${ringOuterRadius - ringInnerRadius}px rgba(0,0,0,0.02)`,
        }}
      />
      {children}
    </div>
  );
}
