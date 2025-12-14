/**
 * InstructionText - Shows help text until first successful action
 * Disappears after user performs first drag or enter action
 */

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STORAGE_KEY = "one01_help_seen";

interface InstructionTextProps {
  onFirstAction: () => void; // Called when user performs first action
}

export default function InstructionText({ onFirstAction }: InstructionTextProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has seen help before (only on client)
    if (typeof window !== "undefined") {
      const hasSeenHelp = localStorage.getItem(STORAGE_KEY) === "true";
      if (!hasSeenHelp) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleFirstAction = () => {
    setIsVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onFirstAction();
  };

  // Expose method to hide from parent
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).hideOne01Help = handleFirstAction;
    }
  }, [handleFirstAction]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-neutral-200">
            <p className="text-sm text-neutral-700 text-center">
              Tap to enter • Double tap to go back
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

