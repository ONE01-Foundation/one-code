/**
 * FloatingJoystick - Full-screen dynamic joystick for mobile
 * Activated when enabled and user touches outside interactive UI
 */

"use client";

import { useRef } from "react";

interface FloatingJoystickProps {
  enabled: boolean;
  onJoystickMove: (angle: number, strength: number) => void;
  onJoystickEnd: () => void;
}

const MAX_RADIUS = 120; // px - max joystick movement distance
const DEADZONE_STRENGTH = 0.18; // Minimum strength to register

export default function FloatingJoystick({
  enabled,
  onJoystickMove,
  onJoystickEnd,
}: FloatingJoystickProps) {
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const isActiveRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!enabled) return;
    
    // Check if touch is on interactive element (bubble, button, etc.)
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-interactive]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('textarea') ||
      target.closest('[role="button"]')
    ) {
      return; // Ignore touches on interactive elements
    }

    originRef.current = { x: e.clientX, y: e.clientY };
    isActiveRef.current = true;
    e.preventDefault();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!enabled || !originRef.current || !isActiveRef.current) return;

    const dx = e.clientX - originRef.current.x;
    const dy = e.clientY - originRef.current.y;
    const distance = Math.hypot(dx, dy);
    
    // Clamp to max radius
    const clampedDistance = Math.min(distance, MAX_RADIUS);
    const strength = clampedDistance / MAX_RADIUS;
    
    // Apply deadzone
    if (strength < DEADZONE_STRENGTH) {
      onJoystickEnd();
      return;
    }

    const angle = Math.atan2(dy, dx);
    onJoystickMove(angle, strength);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!enabled || !isActiveRef.current) return;
    
    originRef.current = null;
    isActiveRef.current = false;
    onJoystickEnd();
  };

  if (!enabled) return null;

  return (
    <div
      className="fixed inset-0 z-5 pointer-events-auto touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
    />
  );
}

