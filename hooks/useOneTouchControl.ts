/**
 * useOneTouchControl - Unified control engine for drag/tap/double-tap
 * 
 * CONTROL RULES:
 * - Drag = explore/select (continuous angle selection around orbit)
 * - Single Tap = enter (navigate into selected context)
 * - Double Tap = back (go back one level)
 * 
 * Prevents conflicts: drag cancels tap if movement > threshold
 */

import { useRef, useCallback } from "react";

interface UseOneTouchControlOptions {
  onDrag?: (angle: number, strength: number) => void;
  onDragEnd?: () => void;
  onTap?: () => void;
  onDoubleTap?: () => void;
  deadZone?: number; // px - minimum movement to register as drag
  doubleTapTime?: number; // ms - time window for double tap
  maxRadius?: number; // px - maximum drag distance
}

const DEFAULT_DEAD_ZONE = 10; // px
const DEFAULT_DOUBLE_TAP_TIME = 300; // ms
const DEFAULT_MAX_RADIUS = 120; // px

export function useOneTouchControl({
  onDrag,
  onDragEnd,
  onTap,
  onDoubleTap,
  deadZone = DEFAULT_DEAD_ZONE,
  doubleTapTime = DEFAULT_DOUBLE_TAP_TIME,
  maxRadius = DEFAULT_MAX_RADIUS,
}: UseOneTouchControlOptions) {
  const startPosRef = useRef<{ x: number; y: number; centerX: number; centerY: number } | null>(null);
  const isDraggingRef = useRef(false);
  const lastTapRef = useRef<{ time: number; x: number; y: number } | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, centerX: number, centerY: number) => {
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    e.preventDefault();

    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
      centerX,
      centerY,
    };
    isDraggingRef.current = false;
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPosRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const distance = Math.hypot(dx, dy);

    // Check if movement exceeds dead zone (treat as drag)
    if (distance > deadZone) {
      isDraggingRef.current = true;

      // Calculate angle from center
      const angle = Math.atan2(
        e.clientY - startPosRef.current.centerY,
        e.clientX - startPosRef.current.centerX
      );

      // Clamp distance to max radius and convert to strength (0-1)
      const clampedDistance = Math.min(distance, maxRadius);
      const strength = clampedDistance / maxRadius;

      if (onDrag) {
        onDrag(angle, strength);
      }
    }
  }, [deadZone, maxRadius, onDrag]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    if (!startPosRef.current) return;

    if (isDraggingRef.current) {
      // Was a drag - end it
      if (onDragEnd) {
        onDragEnd();
      }
    } else {
      // Was a tap - check for single vs double
      const now = Date.now();
      const currentX = e.clientX;
      const currentY = e.clientY;

      if (lastTapRef.current) {
        const timeDiff = now - lastTapRef.current.time;
        const posDiff = Math.hypot(
          currentX - lastTapRef.current.x,
          currentY - lastTapRef.current.y
        );

        // Check if double tap (within time and position threshold)
        if (timeDiff < doubleTapTime && posDiff < 20) {
          // Clear any pending single tap
          if (tapTimeoutRef.current) {
            clearTimeout(tapTimeoutRef.current);
            tapTimeoutRef.current = null;
          }
          // Double tap
          if (onDoubleTap) {
            onDoubleTap();
          }
          lastTapRef.current = null;
        } else {
          // Too long or too far - treat as new single tap
          lastTapRef.current = { time: now, x: currentX, y: currentY };
          tapTimeoutRef.current = setTimeout(() => {
            if (onTap) {
              onTap();
            }
            lastTapRef.current = null;
            tapTimeoutRef.current = null;
          }, doubleTapTime);
        }
      } else {
        // First tap - wait for potential second tap
        lastTapRef.current = { time: now, x: currentX, y: currentY };
        tapTimeoutRef.current = setTimeout(() => {
          if (onTap) {
            onTap();
          }
          lastTapRef.current = null;
          tapTimeoutRef.current = null;
        }, doubleTapTime);
      }
    }

    startPosRef.current = null;
    isDraggingRef.current = false;
  }, [doubleTapTime, onDragEnd, onTap, onDoubleTap]);

  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.releasePointerCapture(e.pointerId);

    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }

    if (isDraggingRef.current && onDragEnd) {
      onDragEnd();
    }

    startPosRef.current = null;
    isDraggingRef.current = false;
    lastTapRef.current = null;
  }, [onDragEnd]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
  };
}

