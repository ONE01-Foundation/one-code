/**
 * QROverlay - QR code overlay in center preview
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

interface QROverlayProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Generate a simple QR-like pattern (placeholder)
function generateQRCode(): string {
  // In real implementation, use a QR code library
  // For now, return a placeholder pattern
  return "QR_CODE_PLACEHOLDER";
}

export default function QROverlay({ isOpen, onConfirm, onCancel }: QROverlayProps) {
  const [lastTap, setLastTap] = useState<number>(0);

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap < 300) {
      // Double tap - cancel
      onCancel();
      setLastTap(0);
    } else {
      // Single tap - confirm
      setLastTap(now);
      setTimeout(() => {
        if (Date.now() - lastTap >= 300) {
          onConfirm();
          setLastTap(0);
        }
      }, 300);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto"
      onClick={handleTap}
    >
      <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-[280px] w-full">
        <div className="text-center mb-4">
          <div className="text-4xl mb-2">📱</div>
          <h3 className="text-lg font-semibold text-neutral-900 mb-2">
            Connect Device
          </h3>
          <p className="text-sm text-neutral-600 mb-4">
            Scan QR code to pair
          </p>
        </div>
        
        {/* QR Code placeholder */}
        <div className="bg-neutral-100 rounded-lg p-8 mb-4 flex items-center justify-center aspect-square">
          <div className="text-6xl">📱</div>
        </div>

        <div className="text-xs text-neutral-500 text-center">
          Tap to confirm • Double tap to cancel
        </div>
      </div>
    </motion.div>
  );
}

