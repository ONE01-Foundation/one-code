/**
 * OneView V1
 * 
 * Private/Global mode
 * Nested sphere navigation
 * Card creation and completion
 * Voice input for creation
 */

"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Sphere } from "./ui/Sphere";
import { Orbit } from "./ui/Orbit";
import { Sphere as SphereType, Card } from "@/lib/one/types";
import {
  createSphere,
  createCard,
  getSphereChildren,
  getCardsForSphere,
  completeCard,
  updateSummary,
  getSummary,
  initializeStore,
  getAllSpheres,
} from "@/lib/one/store";
import { OneVoice } from "./OneVoice";

export function OneView() {
  const [mode, setMode] = useState<"private" | "global">("private");
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [spheres, setSpheres] = useState<SphereType[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [path, setPath] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [cards, setCards] = useState<Card[]>([]);
  const dragStartRef = useRef<{ x: number; rotation: number } | null>(null);

  // Initialize store
  useEffect(() => {
    initializeStore();
    loadSpheres();
  }, []);

  // Load spheres for current parent
  const loadSpheres = useCallback(() => {
    const children = getSphereChildren(currentParentId);
    const filtered = children.filter(s => s.mode === mode);
    setSpheres(filtered);
    
    if (filtered.length > 0 && !focusedId) {
      setFocusedId(filtered[0].id);
    }
    
    // Load cards for focused sphere
    if (focusedId) {
      const sphereCards = getCardsForSphere(focusedId);
      setCards(sphereCards);
    }
  }, [currentParentId, mode, focusedId]);

  useEffect(() => {
    loadSpheres();
  }, [loadSpheres]);

  // Handle drag to rotate orbit
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      rotation,
    };
  }, [rotation]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const sensitivity = 0.5;
    setRotation(dragStartRef.current.rotation + dx * sensitivity);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  // Handle sphere tap (bring to center)
  const handleSphereTap = useCallback((sphereId: string) => {
    setFocusedId(sphereId);
    const sphereCards = getCardsForSphere(sphereId);
    setCards(sphereCards);
  }, []);

  // Handle center sphere tap (enter)
  const handleCenterTap = useCallback(() => {
    if (!focusedId) return;
    
    const focusedSphere = spheres.find(s => s.id === focusedId);
    if (!focusedSphere) return;

    // Check if has children
    const children = getSphereChildren(focusedId);
    if (children.length > 0) {
      // Enter sphere: show children
      setPath([...path, focusedSphere.name]);
      setCurrentParentId(focusedId);
      setFocusedId(null);
      setRotation(0);
    }
  }, [focusedId, spheres, path]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (path.length > 0) {
      // Go back to parent
      const newPath = path.slice(0, -1);
      setPath(newPath);
      
      // Find parent sphere
      const parentName = newPath.length > 0 ? newPath[newPath.length - 1] : null;
      if (parentName) {
        const allSpheres = getAllSpheres(mode);
        const parentSphere = allSpheres.find(s => s.name === parentName);
        setCurrentParentId(parentSphere?.parentId || null);
      } else {
        setCurrentParentId(null);
      }
      
      setFocusedId(null);
      setRotation(0);
    }
  }, [path, mode]);

  // Handle voice input
  const handleVoiceConfirm = useCallback(async (text: string) => {
    setIsVoiceActive(false);
    
    if (!text.trim()) return;
    
    // Call OneStep API to parse intent
    try {
      const response = await fetch("/api/oneStep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userText: text,
          currentPath: path,
        }),
      });
      
      const data = await response.json();
      
      if (data.success && data.step) {
        const step = data.step;
        
        // Create sphere or card based on intent
        if (step.intent === "create_card" && step.card) {
          // Create card in current focused sphere or create new sphere
          const targetSphereId = focusedId || (currentParentId ? getSphereChildren(currentParentId)[0]?.id : null);
          
          if (targetSphereId) {
            createCard({
              sphereId: targetSphereId,
              text: step.card.title,
              status: "active",
            });
            
            // Update summary
            const summary = getSummary(targetSphereId);
            const newSummary = summary
              ? `${summary.text}\nAdded: ${step.card.title}`
              : `Active: ${step.card.title}`;
            updateSummary(targetSphereId, newSummary);
          }
        } else if (step.bubblePath && step.bubblePath.length > 0) {
          // Create sphere
          const parentId = currentParentId;
          const sphereName = step.bubblePath[step.bubblePath.length - 1];
          
          createSphere({
            parentId,
            name: sphereName,
            mode: "private",
          });
        }
        
        // Reload spheres
        loadSpheres();
      }
    } catch (error) {
      console.error("Error processing voice input:", error);
    }
  }, [focusedId, currentParentId, path, loadSpheres]);

  // Handle card completion
  const handleCardComplete = useCallback((cardId: string) => {
    completeCard(cardId);
    loadSpheres();
    
    // Update summary
    if (focusedId) {
      const summary = getSummary(focusedId);
      const cards = getCardsForSphere(focusedId);
      const completed = cards.filter(c => c.status === "done").length;
      const newSummary = `Completed: ${completed}/${cards.length} cards`;
      updateSummary(focusedId, newSummary);
    }
  }, [focusedId, loadSpheres]);

  const focusedSphere = spheres.find(s => s.id === focusedId);
  const orbitSpheres = spheres.filter(s => s.id !== focusedId);
  const summary = focusedId ? getSummary(focusedId) : null;

  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundColor: "#000000",
        color: "#ffffff",
      }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
      onDoubleClick={() => setIsVoiceActive(true)}
    >
      {/* Mode Toggle */}
      <div className="absolute top-4 left-4 z-30">
        <button
          onClick={() => {
            setMode(mode === "private" ? "global" : "private");
            setCurrentParentId(null);
            setPath([]);
            setFocusedId(null);
            setRotation(0);
          }}
          className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
          style={{
            backgroundColor: mode === "private" ? "rgba(255, 255, 255, 0.1)" : "transparent",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {mode === "private" ? "Private" : "Global"}
        </button>
      </div>

      {/* Summary (if exists) */}
      {summary && (
        <div
          className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-md px-4 py-2 rounded text-sm opacity-60"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          {summary.text}
        </div>
      )}

      {/* Center Sphere */}
      {focusedSphere && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Sphere
            sphere={focusedSphere}
            isFocused
            onClick={handleCenterTap}
            cards={cards}
            onCardComplete={handleCardComplete}
          />
        </div>
      )}

      {/* Orbit */}
      <Orbit
        spheres={orbitSpheres}
        rotation={rotation}
        onSphereTap={handleSphereTap}
      />

      {/* Breadcrumb Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-2 px-4 z-20"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <button
          onClick={handleBack}
          className="px-3 py-1 text-sm opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
          disabled={path.length === 0}
        >
          Home
        </button>
        {path.length > 0 && (
          <>
            <span className="opacity-40">›</span>
            <span className="text-sm">{path[path.length - 1]}</span>
          </>
        )}
      </div>

      {/* Voice Input */}
      <OneVoice
        isActive={isVoiceActive}
        onConfirm={handleVoiceConfirm}
        onCancel={() => setIsVoiceActive(false)}
      />
    </div>
  );
}
