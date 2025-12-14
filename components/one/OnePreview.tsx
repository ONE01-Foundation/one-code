/**
 * OnePreview - Pure control & preview circle
 * Uses unified useOneTouchControl hook
 * Shows selected bubble icon when selection exists, otherwise active bubble
 */

"use client";

import { useState, useEffect, useRef, forwardRef } from "react";
import { motion } from "framer-motion";
import { OrbitBubble } from "./OrbitCluster";
import { useOneTouchControl } from "../../hooks/useOneTouchControl";
import SubBubblesPreview from "./SubBubblesPreview";

interface OnePreviewProps {
  activeBubble: OrbitBubble;
  selectedBubble: OrbitBubble | null;
  onDrag: (angle: number, strength: number) => void;
  onDragEnd: () => void;
  onTap: () => void;
  onDoubleTap: () => void;
  centerRadius: number;
  showSubBubblesPreview?: boolean;
  subBubbles?: OrbitBubble[];
}

export default forwardRef<HTMLDivElement, OnePreviewProps>(
  function OnePreview(
    { activeBubble, selectedBubble, onDrag, onDragEnd, onTap, onDoubleTap, centerRadius, showSubBubblesPreview, subBubbles },
    ref
  ) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const previewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const interval = setInterval(() => {
        setCurrentTime(new Date());
      }, 1000);
      return () => clearInterval(interval);
    }, []);

    // Get center coordinates for joystick
    const getCenter = () => {
      if (previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        return {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
      }
      return { x: 0, y: 0 };
    };

    // Unified control engine
    const control = useOneTouchControl({
      onDrag,
      onDragEnd,
      onTap,
      onDoubleTap,
      deadZone: 10,
      doubleTapTime: 300,
      maxRadius: centerRadius * 0.8, // Max drag within circle
    });

    const handlePointerDown = (e: React.PointerEvent) => {
      const center = getCenter();
      control.handlePointerDown(e, center.x, center.y);
    };

    // Display bubble: selected if exists, otherwise active
    const displayBubble = selectedBubble || activeBubble;
    
    // Show sub-bubbles preview ONLY when inside a world (not on home screen)
    // When inside a world, show preview of that world's children
    const shouldShowPreview = showSubBubblesPreview && subBubbles && subBubbles.length > 0;
    const previewBubbles = subBubbles || [];
    
    // Home screen: show time/date/input
    // Inside world: show preview carousel only (no time/date/input)
    const isHomeScreen = !showSubBubblesPreview;

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatDate = (date: Date) => {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = String(date.getFullYear()).slice(-2);
      return `${day}.${month}.${year}`;
    };

    return (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
        <motion.div
          ref={(node) => {
            previewRef.current = node;
            if (typeof ref === "function") {
              ref(node);
            } else if (ref) {
              (ref as any).current = node;
            }
          }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          key={displayBubble.id}
          className="flex flex-col items-center justify-center rounded-full bg-white shadow-2xl border-[3px] border-neutral-900 pointer-events-auto touch-none"
          style={{
            width: centerRadius * 2,
            height: centerRadius * 2,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={control.handlePointerMove}
          onPointerUp={control.handlePointerUp}
          onPointerCancel={control.handlePointerCancel}
        >
          {/* Inside a world: show preview carousel only */}
          {shouldShowPreview && previewBubbles.length > 0 ? (
            <SubBubblesPreview subBubbles={previewBubbles} />
          ) : (
            /* Home screen: show time, date, input only */
            <>
              {/* Time */}
              <div className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-2 pointer-events-none">
                {formatTime(currentTime)}
              </div>

              {/* Date */}
              <div className="text-sm sm:text-base text-neutral-600 mb-4 pointer-events-none">
                {formatDate(currentTime)}
              </div>

              {/* Input field */}
              <div className="w-full max-w-[200px] px-4 py-2 bg-neutral-50 rounded-full border border-neutral-300 pointer-events-none">
                <span className="text-sm text-neutral-500">Now?</span>
              </div>
            </>
          )}
        </motion.div>
      </div>
    );
  }
);
