/**
 * OneButton - Bottom center button with unified control
 * Uses same useOneTouchControl hook as center preview
 * ALWAYS VISIBLE - must not be removed
 */

"use client";

import { useRef } from "react";
import { useOneTouchControl } from "../../hooks/useOneTouchControl";

interface OneButtonProps {
  isPrivate: boolean;
  onTogglePrivacy: () => void;
  onDrag: (angle: number, strength: number) => void;
  onDragEnd: () => void;
  onTap: () => void;
  onDoubleTap: () => void;
  hasSelected: boolean;
}

const MAX_JOYSTICK_RADIUS = 80; // px

export default function OneButton({
  isPrivate,
  onTogglePrivacy,
  onDrag,
  onDragEnd,
  onTap,
  onDoubleTap,
  hasSelected,
}: OneButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Get center coordinates for joystick
  const getCenter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    }
    return { x: 0, y: 0 };
  };

  // Unified control engine - same as center preview
  const control = useOneTouchControl({
    onDrag,
    onDragEnd,
    onTap,
    onDoubleTap,
    deadZone: 10,
    doubleTapTime: 300,
    maxRadius: MAX_JOYSTICK_RADIUS,
  });

  const handlePointerDown = (e: React.PointerEvent) => {
    const center = getCenter();
    control.handlePointerDown(e, center.x, center.y);
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 h-24 z-30 pointer-events-none">
      <div className="pointer-events-none absolute inset-0 bg-white" />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
        <button
          ref={buttonRef}
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={control.handlePointerMove}
          onPointerUp={control.handlePointerUp}
          onPointerCancel={control.handlePointerCancel}
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black flex items-center justify-center shadow-lg hover:bg-neutral-800 transition-transform active:scale-95 z-[999] -translate-y-4 sm:-translate-y-4 touch-none"
          data-interactive="true"
          style={{
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
            minWidth: "64px",
            minHeight: "64px",
          }}
        >
          <span className="text-white text-xs font-bold pointer-events-none">ONE</span>
        </button>

        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs text-neutral-500 pointer-events-none">
          {isPrivate ? "Private" : "Public"}
        </div>
      </div>
    </footer>
  );
}
