/**
 * SubBubblesPreview - Rotating preview of sub-items when inside a bubble
 * Cycles through sub-items every 2-3 seconds
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { OrbitBubble } from "./OrbitCluster";

interface SubBubblesPreviewProps {
  subBubbles: OrbitBubble[];
}

export default function SubBubblesPreview({ subBubbles }: SubBubblesPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (subBubbles.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % subBubbles.length);
    }, 2500); // 2.5 seconds

    return () => clearInterval(interval);
  }, [subBubbles.length]);

  if (subBubbles.length === 0) return null;

  const currentBubble = subBubbles[currentIndex];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentBubble.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center pointer-events-none"
      >
        <div className="text-6xl sm:text-7xl mb-3">{currentBubble.icon}</div>
        <div className="text-sm font-semibold text-neutral-900 mb-1 px-4 text-center">
          {currentBubble.label}
        </div>
        {currentBubble.description && (
          <div className="text-xs text-neutral-600 px-4 text-center max-w-[200px]">
            {currentBubble.description}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

