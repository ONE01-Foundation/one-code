/**
 * useAnchorGesture - Manages Anchor button gesture states
 * 
 * Handles hold-to-talk with deadzone to avoid joystick conflicts
 */

import { useState, useRef, useCallback } from "react";

const DEADZONE_PX = 12; // Pixels of movement before considering it a drag
const HOLD_MS = 350; // Milliseconds to hold before triggering voice

export type GestureMode = "idle" | "joystick" | "voicePending" | "voiceActive";

interface UseAnchorGestureOptions {
  onJoystickStart?: () => void;
  onJoystickMove?: (dx: number, dy: number) => void;
  onJoystickEnd?: () => void;
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
}

export function useAnchorGesture({
  onJoystickStart,
  onJoystickMove,
  onJoystickEnd,
  onVoiceStart,
  onVoiceEnd,
}: UseAnchorGestureOptions = {}) {
  const [mode, setMode] = useState<GestureMode>("idle");
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const startPos = { x: e.clientX, y: e.clientY };
    startPosRef.current = startPos;
    isDraggingRef.current = false;
    setMode("voicePending");

    // Start hold timer
    holdTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current && startPosRef.current) {
        setMode("voiceActive");
        onVoiceStart?.();
      }
    }, HOLD_MS);
  }, [onVoiceStart]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!startPosRef.current) return;

    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If movement exceeds deadzone, treat as joystick
    if (distance > DEADZONE_PX) {
      isDraggingRef.current = true;

      // Cancel hold timer
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }

      // Switch to joystick mode
      if (mode === "voicePending") {
        setMode("joystick");
        onJoystickStart?.();
      } else if (mode === "joystick") {
        onJoystickMove?.(dx, dy);
      }
    }
  }, [mode, onJoystickStart, onJoystickMove]);

  const handlePointerUp = useCallback(() => {
    // Cancel hold timer if still pending
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (mode === "joystick") {
      setMode("idle");
      onJoystickEnd?.();
    } else if (mode === "voiceActive") {
      // Don't auto-close voice mode on release
      // User must press ✅ or ✖️
      onVoiceEnd?.();
    } else if (mode === "voicePending") {
      // User released before hold time - treat as tap (back navigation)
      setMode("idle");
    }

    startPosRef.current = null;
    isDraggingRef.current = false;
  }, [mode, onJoystickEnd, onVoiceEnd]);

  const handlePointerCancel = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setMode("idle");
    startPosRef.current = null;
    isDraggingRef.current = false;
  }, []);

  const reset = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setMode("idle");
    startPosRef.current = null;
    isDraggingRef.current = false;
  }, []);

  return {
    mode,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerCancel,
    reset,
  };
}

