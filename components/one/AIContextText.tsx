/**
 * AIContextText - Dynamic context explanation
 * 1-3 short lines explaining "what is happening now" or "what you can do next"
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { OrbitBubble } from "./OrbitCluster";

interface AIContextTextProps {
  activeBubble: OrbitBubble;
  hasChildren: boolean;
  navStackDepth: number;
}

export default function AIContextText({
  activeBubble,
  hasChildren,
  navStackDepth,
}: AIContextTextProps) {
  const contextText = useMemo(() => {
    const lines: string[] = [];

    // Base context description
    if (activeBubble.description) {
      lines.push(activeBubble.description);
    } else {
      // Generate context-aware text based on bubble
      const contextMap: Record<string, string> = {
        life: "Your personal journey and daily experience.",
        health: "Your physical and mental wellbeing.",
        ask: "Questions, learning, and exploration.",
        give: "Sharing and contributing to others.",
        value: "Wealth, assets, and financial matters.",
        id: "Your identity and profile information.",
        time: "Schedule, events, and calendar.",
        world: "Travel, places, and culture.",
        shop: "Shopping and purchases.",
        create: "Art, music, and creation.",
      };

      const baseText = contextMap[activeBubble.id.toLowerCase()] || "Your current context.";
      lines.push(baseText);
    }


    return lines.slice(0, 3); // Max 3 lines
  }, [activeBubble, hasChildren, navStackDepth]);

  return (
    <motion.div
      key={activeBubble.id}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
      className="text-center px-6 mb-6"
    >
      {contextText.map((line, index) => (
        <motion.p
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
          className="text-base sm:text-lg text-neutral-700 leading-relaxed mb-2"
        >
          {line}
        </motion.p>
      ))}
    </motion.div>
  );
}

