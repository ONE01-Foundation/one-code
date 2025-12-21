/**
 * InputBar - Text input for creating moments/spheres
 */

"use client";

import { useState } from "react";
import { useMVPStore } from "@/lib/mvp/store";
import { classifyInput } from "@/lib/mvp/ai";

export function InputBar() {
  const store = useMVPStore();
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);

    try {
      // Classify input
      const classification = await classifyInput(text);

      // Create moment
      const moment = store.createMoment({
        rawText: text,
        intent: classification.intent,
        domain: classification.domain,
        nodeIds: [], // Will attach to relevant nodes
      });

      // Auto-attach to relevant nodes across worlds (keyword matching)
      // Match against all nodes (spheres, clusters, worlds)
      const relevantNodes = Object.values(store.nodes).filter((node) => {
        const nodeName = node.name.toLowerCase();
        const textLower = text.toLowerCase();
        return textLower.includes(nodeName) || nodeName.includes(textLower);
      });

      // Also match by domain to World nodes
      if (classification.domain) {
        const worldNode = Object.values(store.nodes).find(
          (n) => n.type === "world" && n.worldId === classification.domain
        );
        if (worldNode && !relevantNodes.find((n) => n.id === worldNode.id)) {
          relevantNodes.push(worldNode);
        }
      }

      if (relevantNodes.length > 0) {
        // Attach moment to relevant nodes (can be multiple across worlds)
        moment.nodeIds = relevantNodes.map((n) => n.id);
      }
      
      // DO NOT auto-create new top-level nodes - only attach to existing ones
      // User must explicitly create spheres via commands like "create sphere X under Y"

      setText("");
    } catch (error) {
      console.error("Error processing input:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="absolute bottom-16 left-4 right-4 z-20"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type to create a moment..."
        disabled={isProcessing}
        className="w-full px-4 py-3 rounded-lg text-base"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          color: "#ffffff",
        }}
      />
    </form>
  );
}

