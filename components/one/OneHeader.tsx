/**
 * OneHeader - Primary identity header
 * Large, clear, centered: "ONE | SUBJECT"
 * "ONE" is constant, SUBJECT changes with context
 */

"use client";

import { motion } from "framer-motion";

interface OneHeaderProps {
  subject: string;
}

export default function OneHeader({ subject }: OneHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none">
      <div className="pointer-events-none absolute inset-0 bg-white" />
      <div className="relative h-24 sm:h-28 flex items-center justify-center px-6 pt-safe">
        <motion.div
          key={subject}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <span className="text-2xl sm:text-3xl md:text-3xl font-bold text-neutral-900 tracking-tight">
            ONE{" "}
            <span className="font-normal text-neutral-600">|</span>{" "}
            <span className="font-normal">{subject}</span>
          </span>
        </motion.div>
      </div>
    </header>
  );
}
