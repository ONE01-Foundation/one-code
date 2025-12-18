/**
 * Core OneView - MVP implementation
 * 
 * Bubble field + center preview + anchor control
 */

"use client";

import { useEffect, useState } from "react";
import { useOneViewCoreStore } from "@/lib/oneview/core-store";
import { CoreBubbleField } from "./CoreBubbleField";
import { CoreCenterPreview } from "./CoreCenterPreview";
import { AnchorButton } from "./AnchorButton";
import { InputBar } from "./InputBar";
import { OneMicOverlay } from "./OneMicOverlay";
import { OneStepResult } from "./OneStepResult";
import { applyOneStepToPrivateTree } from "@/lib/oneview/tree-update";
import { OneStep } from "@/lib/oneview/onestep-types";
import { UILang } from "@/lib/lang";

export function CoreOneView() {
  const store = useOneViewCoreStore();
  const { navigation, initialize, setMode, goBack, goHome, setCenteredBubble } = store;
  
  const [isMicOpen, setIsMicOpen] = useState(false);
  const [oneStepResult, setOneStepResult] = useState<OneStep | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Handle voice confirm
  const handleVoiceConfirm = async (text: string, lang: UILang) => {
    setIsMicOpen(false);
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/oneStep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: text,
          mode: navigation.mode,
          currentPath: navigation.stack,
          userLocale: lang,
        }),
      });
      
      if (!response.ok) {
        throw new Error("API error");
      }
      
      const data = await response.json();
      
      if (data.success && data.step) {
        setOneStepResult(data.step);
      } else {
        console.error("OneStep API error:", data.error);
      }
    } catch (error) {
      console.error("Error calling OneStep API:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Handle step action (apply to tree)
  const handleStepAction = (step: OneStep) => {
    // Apply to private tree
    const result = applyOneStepToPrivateTree(step, store);
    
    // Focus on created/updated bubble
    if (result.createdBubbles.length > 0) {
      const lastBubbleId = result.createdBubbles[result.createdBubbles.length - 1];
      setCenteredBubble(lastBubbleId);
      
      // Navigate to the bubble's parent path
      // For now, just center it
    } else if (result.updatedBubbles.length > 0) {
      const lastBubbleId = result.updatedBubbles[result.updatedBubbles.length - 1];
      setCenteredBubble(lastBubbleId);
    }
    
    // Clear result
    setOneStepResult(null);
    
    // Refresh store
    store.initialize();
  };
  
  // Handle edit card title
  const handleEditCard = (newTitle: string) => {
    if (oneStepResult && oneStepResult.card) {
      setOneStepResult({
        ...oneStepResult,
        card: {
          ...oneStepResult.card,
          title: newTitle,
        },
      });
    }
  };
  
  // Get current sphere for anchor icon
  const currentParentId = store.getCurrentParentId();
  const bubbles = navigation.mode === "private" ? store.privateBubbles : store.globalBubbles;
  const currentBubble = currentParentId ? bubbles[currentParentId] : null;
  
  // Anchor icon: show current bubble icon if inside, home if at root
  const anchorIcon = currentBubble?.icon || "🏠";
  
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        {/* Mode Toggle */}
        <button
          onClick={() => setMode(navigation.mode === "private" ? "global" : "private")}
          className="px-4 py-2 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
          style={{
            backgroundColor: navigation.mode === "private" ? "var(--foreground)" : "transparent",
            color: navigation.mode === "private" ? "var(--background)" : "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          {navigation.mode === "private" ? "Private" : "Global"}
        </button>
        
        {/* Mic Button */}
        <button
          onClick={() => setIsMicOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
          style={{
            backgroundColor: "var(--neutral-100)",
            border: "1px solid var(--border)",
          }}
          title="Voice input"
        >
          🎤
        </button>
      </div>
      
      {/* OneStep Result (if exists) */}
      {oneStepResult && (
        <div className="absolute top-20 left-4 right-4 z-10">
          <OneStepResult
            step={oneStepResult}
            onAction={handleStepAction}
            onEditCard={handleEditCard}
          />
        </div>
      )}
      
      {/* Center Stage */}
      <div className="relative w-full h-full flex items-center justify-center">
        <CoreBubbleField />
        <CoreCenterPreview />
      </div>
      
      {/* Input Bar (optional, can be hidden for MVP) */}
      <div className="absolute bottom-24 left-0 right-0 z-10 px-4 opacity-0 pointer-events-none">
        <InputBar
          value=""
          onChange={() => {}}
          onSubmit={() => {}}
          onLongPress={() => {}}
          mode={navigation.mode}
          isSubmitting={false}
        />
      </div>
      
      {/* Anchor Button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <AnchorButton
          currentSphereId={currentBubble?.id || null}
          spheres={{}}
          icon={anchorIcon}
          onTap={goBack}
          onLongPress={goHome}
          onVoiceStart={() => setIsMicOpen(true)}
        />
      </div>
      
      {/* Mic Overlay */}
      <OneMicOverlay
        isOpen={isMicOpen}
        onClose={() => setIsMicOpen(false)}
        onConfirm={handleVoiceConfirm}
      />
      
      {/* Processing Indicator */}
      {isProcessing && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-lg text-sm opacity-60" style={{ backgroundColor: "var(--neutral-100)", color: "var(--foreground)" }}>
          Processing...
        </div>
      )}
    </div>
  );
}


