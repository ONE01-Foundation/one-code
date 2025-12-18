/**
 * OneView - Main component
 * 
 * Apple-Watch-like bubble navigation UI
 */

"use client";

import { useState, useEffect } from "react";
import { useOneViewStore } from "@/lib/oneview/store";
import { processUserInput } from "@/lib/oneview/ai-stub";
import { applyActions } from "@/lib/oneview/command-engine";
import { BubbleField } from "./BubbleField";
import { CenterStage } from "./CenterStage";
import { AnchorButton } from "./AnchorButton";
import { InputBar } from "./InputBar";
import { StagedOutput } from "./StagedOutput";
import { VoiceOverlay } from "./VoiceOverlay";

export function OneView() {
  const store = useOneViewStore();
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stagedOutput, setStagedOutput] = useState<any>(null);
  const [showLedger, setShowLedger] = useState(false);
  const [isVoiceModeOpen, setIsVoiceModeOpen] = useState(false);
  
  // Update time cursor every minute
  useEffect(() => {
    const interval = setInterval(() => {
      store.setTimeCursor(new Date().toISOString());
    }, 60000);
    return () => clearInterval(interval);
  }, [store]);
  
  // Handle input submit (shared by text input and voice)
  const handleSubmit = async (text: string) => {
    if (!text.trim()) return;
    
    setIsSubmitting(true);
    setInputText("");
    
    // Process through AI stub
    const output = processUserInput(text, store.viewState.currentSphereId);
    setStagedOutput(output);
    
    // Apply actions
    if (output.actions.length > 0) {
      applyActions(output.actions, store);
    }
    
    setIsSubmitting(false);
  };
  
  // Handle voice mode open
  const handleVoiceModeOpen = () => {
    setIsVoiceModeOpen(true);
  };
  
  // Handle voice mode close
  const handleVoiceModeClose = () => {
    setIsVoiceModeOpen(false);
  };
  
  // Handle long-press on input (toggle mode)
  const handleInputLongPress = () => {
    store.toggleMode();
  };
  
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{
        backgroundColor: "var(--background)",
        color: "var(--foreground)",
      }}
    >
      {/* Top: AI Main Output */}
      <div className="absolute top-4 left-4 right-4 z-10">
        <div className="text-xs opacity-60 mb-2">AI Main Output</div>
        {stagedOutput && (
          <StagedOutput output={stagedOutput} />
        )}
      </div>
      
      {/* Center Stage */}
      <div className={`relative w-full h-full flex items-center justify-center ${isVoiceModeOpen ? "pointer-events-none opacity-50" : ""}`}>
        <BubbleField />
        <CenterStage />
      </div>
      
      {/* Input Bar */}
      <div className="absolute bottom-24 left-0 right-0 z-10 px-4">
        <InputBar
          value={inputText}
          onChange={setInputText}
          onSubmit={handleSubmit}
          onLongPress={handleInputLongPress}
          mode={store.viewState.mode}
          isSubmitting={isSubmitting}
        />
      </div>
      
      {/* Anchor Button */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
        <AnchorButton
          currentSphereId={store.viewState.currentSphereId}
          spheres={store.spheres}
          onTap={store.navigateBack}
          onLongPress={store.navigateHome}
          onVoiceStart={handleVoiceModeOpen}
        />
      </div>
      
      {/* Voice Overlay */}
      <VoiceOverlay
        isOpen={isVoiceModeOpen}
        onClose={handleVoiceModeClose}
        onConfirm={(text) => {
          // onConfirm is called before onSubmit, but we'll use onSubmit directly
        }}
        onSubmit={handleSubmit}
      />
      
      {/* Dev: Ledger Toggle */}
      {process.env.NODE_ENV === "development" && (
        <button
          onClick={() => setShowLedger(!showLedger)}
          className="absolute top-4 right-4 z-30 px-2 py-1 text-xs opacity-40 hover:opacity-100"
          style={{
            backgroundColor: "var(--neutral-100)",
            border: "1px solid var(--border)",
          }}
        >
          {showLedger ? "Hide" : "Show"} Ledger
        </button>
      )}
      
      {/* Dev: Ledger Panel */}
      {showLedger && process.env.NODE_ENV === "development" && (
        <div
          className="absolute bottom-32 left-4 right-4 max-h-48 overflow-y-auto p-4 text-xs z-30"
          style={{
            backgroundColor: "var(--background)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="font-bold mb-2">Action Ledger ({store.ledger.length})</div>
          {store.ledger.slice(-10).map((action, i) => (
            <div key={i} className="mb-1 opacity-60">
              {action.type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

