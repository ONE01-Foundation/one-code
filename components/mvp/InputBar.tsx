/**
 * InputBar - Text input with voice-ready UI and quick commands
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useMVPStore } from "@/lib/mvp/store";
import { classifyInput } from "@/lib/mvp/ai";
import { DraftMoment, WorldId } from "@/lib/mvp/types";
import { parseInputCommand } from "@/lib/mvp/commands";

export function InputBar() {
  const store = useMVPStore();
  const { focusedNodeId, isListening, setListening } = store;
  const [text, setText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spaceHoldTimerRef = useRef<NodeJS.Timeout | null>(null);
  const spaceKeyDownRef = useRef(false);

  // Handle space-hold for push-to-talk
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !spaceKeyDownRef.current) {
        spaceKeyDownRef.current = true;
        // Only trigger if not already listening and not in input
        if (!isListening && document.activeElement?.tagName !== "INPUT") {
          setListening(true);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceKeyDownRef.current = false;
        if (isListening) {
          setListening(false);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isListening, setListening]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Parse for quick commands
      const command = parseInputCommand(text);

      if (command.type === "card") {
        // "card: <title>" => open preview with card pre-filled
        const draft: DraftMoment = {
          text: command.title,
          proposedTags: focusedNodeId ? [store.nodes[focusedNodeId]?.name].filter(Boolean) : [],
          proposedWorldIds: [],
          proposedNodeIds: focusedNodeId ? [focusedNodeId] : [],
          suggestedCardTitle: command.title,
        };
        store.createDraftMoment(draft);
        setText("");
        return;
      }

      if (command.type === "tag") {
        // "tag: <tagname>" => attach to existing node
        const matchingNode = Object.values(store.nodes).find(
          (n) => n.name.toLowerCase() === command.tagName.toLowerCase()
        );

        if (!matchingNode) {
          setError(`Tag "${command.tagName}" not found`);
          setIsProcessing(false);
          return;
        }

        const draft: DraftMoment = {
          text: text.substring(4).trim() || "Tagged moment",
          proposedTags: [matchingNode.name],
          proposedWorldIds: [matchingNode.worldId],
          proposedNodeIds: [matchingNode.id],
        };
        store.createDraftMoment(draft);
        setText("");
        return;
      }

      if (command.type === "magic") {
        // "magic" => trigger insight for focused node
        if (focusedNodeId) {
          // Trigger magic button action (will be handled by OneView)
          window.dispatchEvent(new CustomEvent("magic:trigger", { detail: { nodeId: focusedNodeId } }));
        }
        setText("");
        setIsProcessing(false);
        return;
      }

      // Normal flow: classify and create draft
      const classification = await classifyInput(text);

      // Find relevant nodes
      const relevantNodes = Object.values(store.nodes).filter((node) => {
        const nodeName = node.name.toLowerCase();
        const textLower = text.toLowerCase();
        return textLower.includes(nodeName) || nodeName.includes(textLower);
      });

      if (classification.domain) {
        const worldNode = Object.values(store.nodes).find(
          (n) => n.type === "world" && n.worldId === classification.domain
        );
        if (worldNode && !relevantNodes.find((n) => n.id === worldNode.id)) {
          relevantNodes.push(worldNode);
        }
      }

      // Map domain to WorldId (only if it's a valid world)
      const worldIds: WorldId[] = [];
      if (classification.domain && ["health", "money", "career"].includes(classification.domain)) {
        worldIds.push(classification.domain as WorldId);
      }

      const draft: DraftMoment = {
        text: text.trim(),
        proposedTags: relevantNodes.map((n) => n.name),
        proposedWorldIds: worldIds,
        proposedNodeIds: relevantNodes.map((n) => n.id),
        suggestedNextStep: classification.suggestedNextStep,
        suggestedCardTitle: classification.suggestedCardTitle,
        suggestedCardType: classification.suggestedCardType,
      };

      store.createDraftMoment(draft);
      setText("");
    } catch (error) {
      console.error("Error processing input:", error);
      setError("Error processing input");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="absolute bottom-16 left-4 right-4 z-20">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            placeholder={isListening ? "Listening..." : "Type to create a moment..."}
            disabled={isProcessing}
            className="flex-1 px-4 py-3 rounded-lg text-base"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              color: "#ffffff",
            }}
          />
          
          {/* Mic Button */}
          <button
            type="button"
            onClick={() => setListening(!isListening)}
            className="w-12 h-12 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
            style={{
              backgroundColor: isListening ? "rgba(255, 0, 0, 0.2)" : "rgba(255, 255, 255, 0.1)",
              border: `1px solid ${isListening ? "rgba(255, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.2)"}`,
            }}
            title={isListening ? "Stop listening (or release Space)" : "Start listening (or hold Space)"}
          >
            {isListening ? (
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" style={{ animationDelay: "300ms" }} />
              </div>
            ) : (
              <div className="text-xl">🎤</div>
            )}
          </button>
        </div>
        
        {/* Listening UI (when active) */}
        {isListening && (
          <div className="mt-2 px-4 py-2 rounded text-sm opacity-60" style={{ backgroundColor: "rgba(255, 255, 255, 0.05)" }}>
            <div className="flex items-center gap-2">
              <span>Listening...</span>
              <span className="flex gap-1">
                <span className="animate-pulse">●</span>
                <span className="animate-pulse" style={{ animationDelay: "200ms" }}>●</span>
                <span className="animate-pulse" style={{ animationDelay: "400ms" }}>●</span>
              </span>
            </div>
          </div>
        )}
        
        {/* Error Message */}
        {error && (
          <div className="mt-2 px-4 py-2 rounded text-sm" style={{ backgroundColor: "rgba(255, 0, 0, 0.1)", color: "#ff6b6b" }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
