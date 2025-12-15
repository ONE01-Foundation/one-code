/**
 * OneMenu - Menu overlay from ONE button
 */

"use client";

import { motion } from "framer-motion";

interface OneMenuProps {
  isOpen: boolean;
  fullScreenControlEnabled: boolean;
  onClose: () => void;
  onConnectQR: () => void;
  onToggleFullScreenControl: () => void;
}

export default function OneMenu({
  isOpen,
  fullScreenControlEnabled,
  onClose,
  onConnectQR,
  onToggleFullScreenControl,
}: OneMenuProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-3xl shadow-2xl p-6 pb-safe"
      >
        <div className="space-y-3">
          <button
            onClick={onConnectQR}
            className="w-full px-4 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors text-left"
          >
            Connect (QR)
          </button>
          <button
            onClick={onToggleFullScreenControl}
            className="w-full px-4 py-3 bg-neutral-100 text-neutral-900 rounded-lg font-medium hover:bg-neutral-200 transition-colors text-left"
          >
            Full-screen Control: {fullScreenControlEnabled ? "ON" : "OFF"}
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

