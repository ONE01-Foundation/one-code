/**
 * Core OneView - MVP implementation
 * 
 * Bubble field + center preview + anchor control
 */

"use client";

import { useEffect, useState } from "react";
import { useOneViewCoreStore } from "@/lib/oneview/core-store";
import { useNavStore } from "@/lib/oneview/nav-store";
import { useUnitsStore } from "@/lib/oneview/units-store";
import { useTimeStore } from "@/lib/oneview/time-store";
import { OneNavBubbleField } from "./OneNavBubbleField";
import { OneNavPreview } from "./OneNavPreview";
import { OneJoystick } from "./OneJoystick";
import { OneNavBackButton } from "./OneNavBackButton";
import { UnitsDisplay } from "./UnitsDisplay";
import { TimeScrubber } from "./TimeScrubber";
import { LivingSummary } from "./LivingSummary";
import { AnchorButton } from "./AnchorButton";
import { InputBar } from "./InputBar";
import { OneMicOverlay } from "./OneMicOverlay";
import { OneStepResult } from "./OneStepResult";
import { applyOneStepToPrivateTree } from "@/lib/oneview/tree-update";
import { OneStep } from "@/lib/oneview/onestep-types";
import { UILang } from "@/lib/lang";

export function CoreOneView() {
  const coreStore = useOneViewCoreStore();
  const navStore = useNavStore();
  const unitsStore = useUnitsStore();
  const timeStore = useTimeStore();
  
  const { initialize } = coreStore;
  const { mode, setMode, goBack, goHome } = navStore;
  
  const [isMicOpen, setIsMicOpen] = useState(false);
  const [oneStepResult, setOneStepResult] = useState<OneStep | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Initialize on mount
  useEffect(() => {
    initialize();
    unitsStore.initialize(); // Initialize Units (check daily refill)
    
    // Auto-compress yesterday's day at midnight
    const checkDailyCompression = () => {
      try {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        // Check if we need to compress yesterday
        const yesterdaySlice = timeStore.getTimeSlice("day", yesterdayStr);
        if (yesterdaySlice && !yesterdaySlice.compressed) {
          timeStore.compressDay(yesterdayStr);
        }
      } catch (error) {
        console.error("Error in daily compression check:", error);
      }
    };
    
    // Check on mount and set interval for daily check
    if (typeof window !== "undefined") {
      checkDailyCompression();
      const interval = setInterval(checkDailyCompression, 60 * 60 * 1000); // Check every hour
      return () => clearInterval(interval);
    }
  }, [initialize, unitsStore, timeStore]);
  
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
          mode: mode,
          currentPath: navStore.pathStack,
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
    const result = applyOneStepToPrivateTree(step, coreStore);
    
    // Focus on created/updated bubble
    if (result.createdBubbles.length > 0) {
      const lastBubbleId = result.createdBubbles[result.createdBubbles.length - 1];
      navStore.setFocusedNode(lastBubbleId);
    } else if (result.updatedBubbles.length > 0) {
      const lastBubbleId = result.updatedBubbles[result.updatedBubbles.length - 1];
      navStore.setFocusedNode(lastBubbleId);
    }
    
    // Clear result
    setOneStepResult(null);
    
    // Refresh store
    coreStore.initialize();
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
  
  // Get current context for anchor icon
  const currentContext = navStore.getCurrentContext();
  const bubbles = mode === "private" ? coreStore.privateBubbles : coreStore.globalBubbles;
  const currentBubble = currentContext ? bubbles[currentContext] : null;
  
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
      {/* Time Scrubber */}
      <TimeScrubber />
      
      {/* Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        {/* Mode Toggle */}
        <button
          onClick={() => setMode(mode === "private" ? "global" : "private")}
          className="px-4 py-2 rounded-full text-xs font-medium transition-opacity hover:opacity-80"
          style={{
            backgroundColor: mode === "private" ? "var(--foreground)" : "transparent",
            color: mode === "private" ? "var(--background)" : "var(--foreground)",
            border: "1px solid var(--border)",
          }}
        >
          {mode === "private" ? "Private" : "Global"}
        </button>
        
        <div className="flex items-center gap-2">
          {/* Units Display */}
          <UnitsDisplay />
          
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
        <OneJoystick />
        <OneNavBubbleField />
        <OneNavPreview />
        <LivingSummary unit="day" />
      </div>
      
      {/* Back Button */}
      <OneNavBackButton />
      
      {/* Input Bar (optional, can be hidden for MVP) */}
      <div className="absolute bottom-24 left-0 right-0 z-10 px-4 opacity-0 pointer-events-none">
        <InputBar
          value=""
          onChange={() => {}}
          onSubmit={() => {}}
          onLongPress={() => {}}
          mode={mode}
          isSubmitting={false}
        />
      </div>
      
      {/* Anchor Button (bottom center) */}
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


