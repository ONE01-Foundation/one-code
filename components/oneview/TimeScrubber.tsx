/**
 * Time Scrubber - Navigate through time
 * 
 * Left/right gestures or zoom to navigate time
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { useTimeStore } from "@/lib/oneview/time-store";

interface TimeScrubberProps {
  onTimeChange?: (time: string) => void;
}

export function TimeScrubber({ onTimeChange }: TimeScrubberProps) {
  const { currentTime, setCurrentTime } = useTimeStore();
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; startTime: number } | null>(null);
  
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      startTime: new Date(currentTime).getTime(),
    };
  }, [currentTime]);
  
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    
    const dx = e.clientX - dragStartRef.current.x;
    const pixelsPerDay = 50; // Adjust sensitivity
    const daysOffset = Math.round(dx / pixelsPerDay);
    
    if (daysOffset !== 0) {
      const newTime = new Date(dragStartRef.current.startTime);
      newTime.setDate(newTime.getDate() + daysOffset);
      setCurrentTime(newTime.toISOString());
      onTimeChange?.(newTime.toISOString());
      dragStartRef.current.startTime = newTime.getTime();
      dragStartRef.current.x = e.clientX;
    }
  }, [isDragging, setCurrentTime, onTimeChange]);
  
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);
    dragStartRef.current = null;
  }, []);
  
  const formatTime = (time: string) => {
    const d = new Date(time);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  
  return (
    <div
      className="absolute top-16 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg flex items-center gap-2"
      style={{
        backgroundColor: "var(--neutral-100)",
        border: "1px solid var(--border)",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="text-xs opacity-60" style={{ color: "var(--foreground)" }}>
        ← Drag →
      </div>
      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
        {formatTime(currentTime)}
      </div>
    </div>
  );
}

