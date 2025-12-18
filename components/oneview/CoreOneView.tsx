/**
 * Core OneView - MVP implementation
 * 
 * Bubble field + center preview + anchor control
 */

"use client";

import { useEffect } from "react";
import { useOneViewCoreStore } from "@/lib/oneview/core-store";
import { CoreBubbleField } from "./CoreBubbleField";
import { CoreCenterPreview } from "./CoreCenterPreview";
import { AnchorButton } from "./AnchorButton";
import { InputBar } from "./InputBar";

export function CoreOneView() {
  const store = useOneViewCoreStore();
  const { navigation, initialize, setMode, goBack, goHome } = store;
  
  // Initialize on mount
  useEffect(() => {
    initialize();
  }, [initialize]);
  
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
      {/* Mode Toggle (top right) */}
      <div className="absolute top-4 right-4 z-10">
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
      </div>
      
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
          onVoiceStart={() => {}}
        />
      </div>
    </div>
  );
}

