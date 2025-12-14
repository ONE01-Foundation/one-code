/**
 * OneScreen - Single-screen, context-driven interface
 * Unified control engine for both center preview and bottom joystick
 * 
 * CONTROL RULES:
 * - Drag = explore/select (continuous angle selection around orbit)
 * - Single Tap = enter (navigate into selected context)
 * - Double Tap = back (go back one level)
 */

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import OneHeader from "./OneHeader";
import AIContextText from "./AIContextText";
import OnePreview from "./OnePreview";
import OrbitCluster, { OrbitBubble } from "./OrbitCluster";
import OrbitLayout from "./OrbitLayout";
import OneButton from "./OneButton";
import InstructionText from "./InstructionText";

// Root level bubbles
const ROOT_BUBBLES: OrbitBubble[] = [
  { id: "life", label: "LIFE", icon: "🌟", description: "Your personal journey", children: [
    { id: "health", label: "HEALTH", icon: "💚", description: "Your physical and mental wellbeing." },
    { id: "fitness", label: "FITNESS", icon: "💪", description: "Movement and strength." },
    { id: "sleep", label: "SLEEP", icon: "😴", description: "Rest and recovery." },
    { id: "nutrition", label: "NUTRITION", icon: "🥗", description: "Food and nourishment." },
    { id: "mindfulness", label: "MINDFULNESS", icon: "🧘", description: "Presence and awareness." },
    { id: "relationships", label: "RELATIONSHIPS", icon: "🤝", description: "Connections with others." },
  ]},
  { id: "ask", label: "ASK", icon: "❓", description: "Questions, learning, and exploration.", children: [
    { id: "questions", label: "QUESTIONS", icon: "💭", description: "What do you want to know?" },
    { id: "learn", label: "LEARN", icon: "📚", description: "Acquire new knowledge." },
    { id: "explore", label: "EXPLORE", icon: "🔍", description: "Discover new possibilities." },
    { id: "research", label: "RESEARCH", icon: "🔬", description: "Investigate and study." },
    { id: "curiosity", label: "CURIOSITY", icon: "🤔", description: "Follow your interests." },
  ]},
  { id: "give", label: "GIVE", icon: "💝", description: "Sharing and contributing to others.", children: [
    { id: "share", label: "SHARE", icon: "📤", description: "Share what you have." },
    { id: "help", label: "HELP", icon: "🤲", description: "Assist others in need." },
    { id: "teach", label: "TEACH", icon: "👨‍🏫", description: "Pass on knowledge." },
    { id: "donate", label: "DONATE", icon: "🎁", description: "Give resources." },
    { id: "volunteer", label: "VOLUNTEER", icon: "🙋", description: "Offer your time." },
  ]},
  { id: "value", label: "VALUE", icon: "💎", description: "Wealth, assets, and financial matters.", children: [
    { id: "money", label: "MONEY", icon: "💰", description: "Currency and transactions." },
    { id: "assets", label: "ASSETS", icon: "🏦", description: "Your valuable possessions." },
    { id: "investments", label: "INVESTMENTS", icon: "📈", description: "Growing your wealth." },
    { id: "wealth", label: "WEALTH", icon: "💵", description: "Financial security." },
  ]},
  { id: "id", label: "ID", icon: "🆔", description: "Your identity and profile information.", children: [
    { id: "identity", label: "IDENTITY", icon: "👤", description: "Who you are." },
    { id: "profile", label: "PROFILE", icon: "📋", description: "Your personal information." },
    { id: "credentials", label: "CREDENTIALS", icon: "🔐", description: "Your access and verification." },
  ]},
  { id: "time", label: "TIME", icon: "⏰", description: "Schedule, events, and calendar.", children: [
    { id: "schedule", label: "SCHEDULE", icon: "📅", description: "Your planned activities." },
    { id: "calendar", label: "CALENDAR", icon: "🗓️", description: "Dates and events." },
    { id: "events", label: "EVENTS", icon: "🎉", description: "Special occasions." },
  ]},
  { id: "world", label: "WORLD", icon: "🌍", description: "Travel, places, and culture.", children: [
    { id: "travel", label: "TRAVEL", icon: "✈️", description: "Journeys and destinations." },
    { id: "places", label: "PLACES", icon: "📍", description: "Locations you've been." },
    { id: "culture", label: "CULTURE", icon: "🌎", description: "Different ways of life." },
  ]},
  { id: "shop", label: "SHOP", icon: "🛒", description: "Shopping and purchases.", children: [
    { id: "buy", label: "BUY", icon: "🛍️", description: "Make a purchase." },
    { id: "cart", label: "CART", icon: "🛒", description: "Your shopping cart." },
    { id: "wishlist", label: "WISHLIST", icon: "❤️", description: "Items you want." },
  ]},
  { id: "create", label: "CREATE", icon: "🎨", description: "Art, music, and creation.", children: [
    { id: "art", label: "ART", icon: "🖼️", description: "Visual expression." },
    { id: "music", label: "MUSIC", icon: "🎵", description: "Sound and rhythm." },
    { id: "write", label: "WRITE", icon: "✍️", description: "Words and stories." },
    { id: "build", label: "BUILD", icon: "🔨", description: "Make something new." },
  ]},
];

const CENTER_BUBBLE_RADIUS = 140;

// Control stability constants
const DEADZONE_STRENGTH = 0.18;
const SMOOTHING_ALPHA = 0.3;
const HYSTERESIS = 0.05;
const THROTTLE_MS = 33; // ~30fps
const AUTOFOCUS_DELAY = 150; // ms - delay before autofocus swap

export default function OneScreen() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [navStack, setNavStack] = useState<OrbitBubble[]>([]);
  const [activeBubble, setActiveBubble] = useState<OrbitBubble>(ROOT_BUBBLES[0]);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(true);
  const [hasPerformedFirstAction, setHasPerformedFirstAction] = useState(false);

  // Smoothing state
  const smoothedAngleRef = useRef<number>(0);
  const smoothedStrengthRef = useRef<number>(0);
  const lastUpdateTimeRef = useRef<number>(0);
  const lastSelectedIdRef = useRef<string | null>(null);
  const autofocusTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Get current level bubbles
  const currentBubbles = useMemo(() => {
    if (navStack.length === 0) {
      return ROOT_BUBBLES;
    } else {
      const parent = navStack[navStack.length - 1];
      return parent.children || [];
    }
  }, [navStack]);

  // Get selected bubble object
  const selectedBubble = useMemo(() => {
    if (!selectedBubbleId) return null;
    return currentBubbles.find((b) => b.id === selectedBubbleId) || null;
  }, [selectedBubbleId, currentBubbles]);

  // Get header subject (selected bubble label if exists, otherwise active)
  const headerSubject = useMemo(() => {
    return selectedBubble?.label || activeBubble.label;
  }, [selectedBubble, activeBubble]);

  // Get center coordinates from preview circle
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);

  useEffect(() => {
    const updateCenter = () => {
      if (previewRef.current) {
        const rect = previewRef.current.getBoundingClientRect();
        setCenterX(rect.left + rect.width / 2);
        setCenterY(rect.top + rect.height / 2);
      }
    };

    updateCenter();
    window.addEventListener("resize", updateCenter);
    const interval = setInterval(updateCenter, 100);

    return () => {
      window.removeEventListener("resize", updateCenter);
      clearInterval(interval);
    };
  }, []);

  // Find nearest bubble by angle - uses exact layout positions
  const findNearestBubble = useCallback((angle: number): string | null => {
    const visibleBubbles = currentBubbles.filter((b) => b.id !== activeBubble.id);
    if (visibleBubbles.length === 0) return null;

    // Use exact layout positions: 3 left, 3 right, 1 bottom (if inside world)
    const leftAngles = [
      (120 * Math.PI) / 180, // Left-top
      (150 * Math.PI) / 180, // Left-center
      (180 * Math.PI) / 180, // Left-bottom
    ];
    
    const rightAngles = [
      (0 * Math.PI) / 180,   // Right-bottom
      (30 * Math.PI) / 180,  // Right-center
      (60 * Math.PI) / 180, // Right-top
    ];
    
    const bottomAngle = (270 * Math.PI) / 180;
    
    // Combine positions: left + right + (optionally) bottom
    const allAngles = [...leftAngles, ...rightAngles];
    if (navStack.length > 0) {
      allAngles.push(bottomAngle);
    }

    // Use only as many angles as we have bubbles
    const bubbleAngles = allAngles.slice(0, Math.min(visibleBubbles.length, allAngles.length));

    let normalizedAngle = angle;
    while (normalizedAngle < 0) normalizedAngle += 2 * Math.PI;
    while (normalizedAngle >= 2 * Math.PI) normalizedAngle -= 2 * Math.PI;

    let minDiff = Infinity;
    let nearestIndex = 0;

    for (let i = 0; i < Math.min(bubbleAngles.length, visibleBubbles.length); i++) {
      let bubbleAngle = bubbleAngles[i];
      while (bubbleAngle < 0) bubbleAngle += 2 * Math.PI;
      while (bubbleAngle >= 2 * Math.PI) bubbleAngle -= 2 * Math.PI;

      let diff = Math.abs(normalizedAngle - bubbleAngle);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;

      if (diff < minDiff) {
        minDiff = diff;
        nearestIndex = i;
      }
    }

    return visibleBubbles[nearestIndex]?.id || null;
  }, [currentBubbles, activeBubble, navStack.length]);

  // Unified joystick handler (used by both center and bottom joystick)
  const handleJoystickMove = useCallback(
    (angle: number, strength: number) => {
      if (!hasPerformedFirstAction) {
        setHasPerformedFirstAction(true);
        if (typeof window !== "undefined" && typeof (window as any).hideOne01Help === "function") {
          (window as any).hideOne01Help();
        }
      }

      const now = Date.now();

      // Throttle to ~30fps
      if (now - lastUpdateTimeRef.current < THROTTLE_MS) {
        return;
      }
      lastUpdateTimeRef.current = now;

      // Apply deadzone - but keep sticky focus (don't clear selection on weak input)
      if (strength < DEADZONE_STRENGTH) {
        // Don't clear selection - keep sticky focus
        // Only clear autofocus timer
        if (autofocusTimerRef.current) {
          clearTimeout(autofocusTimerRef.current);
          autofocusTimerRef.current = null;
        }
        return;
      }

      // Low-pass filter for smoothing
      smoothedAngleRef.current =
        SMOOTHING_ALPHA * angle + (1 - SMOOTHING_ALPHA) * smoothedAngleRef.current;
      smoothedStrengthRef.current =
        SMOOTHING_ALPHA * strength + (1 - SMOOTHING_ALPHA) * smoothedStrengthRef.current;

      // Find nearest bubble
      const nearestId = findNearestBubble(smoothedAngleRef.current);

      if (nearestId) {
        // Clear previous autofocus timer
        if (autofocusTimerRef.current) {
          clearTimeout(autofocusTimerRef.current);
          autofocusTimerRef.current = null;
        }

        // Apply hysteresis to prevent flicker - selection sticks
        if (lastSelectedIdRef.current === nearestId) {
          // Same selection - keep it
          setSelectedBubbleId(nearestId);
        } else if (
          !lastSelectedIdRef.current ||
          smoothedStrengthRef.current > DEADZONE_STRENGTH + HYSTERESIS
        ) {
          // New selection - update it
          setSelectedBubbleId(nearestId);
          lastSelectedIdRef.current = nearestId;
          // Clear any autofocus timer - selection sticks until user moves away
          if (autofocusTimerRef.current) {
            clearTimeout(autofocusTimerRef.current);
            autofocusTimerRef.current = null;
          }
        }
      } else {
        setSelectedBubbleId(null);
        lastSelectedIdRef.current = null;
        if (autofocusTimerRef.current) {
          clearTimeout(autofocusTimerRef.current);
          autofocusTimerRef.current = null;
        }
      }
    },
    [findNearestBubble, currentBubbles, activeBubble, hasPerformedFirstAction]
  );

  const handleJoystickEnd = useCallback(() => {
    // Keep selection - don't clear selectedBubbleId
    // Only reset smoothing values
    smoothedAngleRef.current = 0;
    smoothedStrengthRef.current = 0;
    if (autofocusTimerRef.current) {
      clearTimeout(autofocusTimerRef.current);
      autofocusTimerRef.current = null;
    }
  }, []);

  // Handle tap (confirm/enter selected bubble)
  const handleTap = useCallback(() => {
    if (!hasPerformedFirstAction) {
      setHasPerformedFirstAction(true);
      if (typeof window !== "undefined" && typeof (window as any).hideOne01Help === "function") {
        (window as any).hideOne01Help();
      }
    }

    // Enter selected bubble (or active if none selected)
    const targetId = selectedBubbleId;
    if (!targetId) {
      // No bubble selected - enter current active bubble's children
      if (activeBubble.children && activeBubble.children.length > 0) {
        setNavStack((prev) => [...prev, activeBubble]);
        setActiveBubble(activeBubble.children[0]);
        setSelectedBubbleId(null);
      }
      return;
    }

    const targetBubble = currentBubbles.find((b) => b.id === targetId);
    if (targetBubble) {
      // Enter the selected bubble
      if (targetBubble.children && targetBubble.children.length > 0) {
        setNavStack((prev) => [...prev, activeBubble]);
        setActiveBubble(targetBubble);
        setSelectedBubbleId(null);
      } else {
        // No children - just make it active
        setActiveBubble(targetBubble);
        setSelectedBubbleId(null);
      }
    }
  }, [selectedBubbleId, activeBubble, currentBubbles, hasPerformedFirstAction]);

  // Handle bubble tap (same as handleTap - confirm selection)
  const handleBubbleTap = useCallback((bubbleId: string) => {
    setSelectedBubbleId(bubbleId);
    // Trigger enter after a brief delay to allow state update
    setTimeout(() => {
      handleTap();
    }, 50);
  }, [handleTap]);

  // Handle double tap (back)
  const handlePreviewDoubleTap = useCallback(() => {
    if (navStack.length > 0) {
      const previous = navStack[navStack.length - 1];
      setNavStack((prev) => prev.slice(0, -1));
      setActiveBubble(previous);
      setSelectedBubbleId(null);
    } else {
      setActiveBubble(ROOT_BUBBLES[0]);
      setSelectedBubbleId(null);
    }
  }, [navStack]);

  // Handle double tap on ONE button (back)
  const handleDoubleTap = useCallback(() => {
    handlePreviewDoubleTap();
  }, [handlePreviewDoubleTap]);

  return (
    <div className="fixed inset-0 flex flex-col bg-white overflow-hidden" style={{ overflow: 'visible' }}>
      <OneHeader subject={headerSubject} />

      {/* Main content area */}
      <main className="flex-1 relative pt-24 sm:pt-28" ref={orbitRef} style={{ overflow: 'visible' }}>
        {/* AI Context Text */}
        <AIContextText
          activeBubble={selectedBubble || activeBubble}
          hasChildren={((selectedBubble || activeBubble).children?.length || 0) > 0}
          navStackDepth={navStack.length}
        />

        <OrbitLayout
          centerRadius={CENTER_BUBBLE_RADIUS}
          orbitRadius={calculateOrbitRadius(
            typeof window !== "undefined" && window.innerWidth < 768,
            CENTER_BUBBLE_RADIUS,
            typeof window !== "undefined" ? window.innerWidth : undefined,
            typeof window !== "undefined" ? window.innerHeight : undefined
          )}
        />
        <OrbitCluster
          bubbles={currentBubbles}
          activeBubble={activeBubble}
          selectedBubbleId={selectedBubbleId}
          centerX={centerX}
          centerY={centerY}
          centerRadius={CENTER_BUBBLE_RADIUS}
          orbitRef={orbitRef}
        />
        <OnePreview
          ref={previewRef}
          activeBubble={activeBubble}
          selectedBubble={selectedBubble}
          onDrag={handleJoystickMove}
          onDragEnd={handleJoystickEnd}
          onTap={handleTap}
          onDoubleTap={handlePreviewDoubleTap}
          centerRadius={CENTER_BUBBLE_RADIUS}
          showSubBubblesPreview={navStack.length > 0}
          subBubbles={activeBubble.children || []}
        />
      </main>

      {/* Bottom joystick (ALWAYS VISIBLE) */}
      <OneButton
        isPrivate={isPrivate}
        onTogglePrivacy={() => setIsPrivate((prev) => !prev)}
        onDrag={handleJoystickMove}
        onDragEnd={handleJoystickEnd}
        onTap={handleTap}
        onDoubleTap={handleDoubleTap}
        hasSelected={selectedBubbleId !== null}
      />

      {/* Instruction text */}
      <InstructionText onFirstAction={() => setHasPerformedFirstAction(true)} />
    </div>
  );
}

function calculateOrbitRadius(
  isMobile: boolean, 
  centerRadius: number, 
  viewportWidth?: number, 
  viewportHeight?: number
): number {
  const BUBBLE_RADIUS = 36;
  const SAFE_MARGIN = 20;
  const minRadius = centerRadius + BUBBLE_RADIUS + SAFE_MARGIN;
  
  if (viewportWidth && viewportHeight) {
    // Calculate available space (accounting for header and bottom button)
    const headerHeight = 96; // ~24 * 4 (h-24)
    const bottomHeight = 96; // ~24 * 4 (h-24)
    const availableHeight = viewportHeight - headerHeight - bottomHeight;
    const availableWidth = viewportWidth;
    
    // Use the smaller dimension to ensure bubbles fit
    const maxRadiusFromHeight = (availableHeight / 2) - centerRadius - BUBBLE_RADIUS - SAFE_MARGIN;
    const maxRadiusFromWidth = (availableWidth / 2) - centerRadius - BUBBLE_RADIUS - SAFE_MARGIN;
    const maxRadius = Math.min(maxRadiusFromHeight, maxRadiusFromWidth);
    
    if (isMobile) {
      // Mobile: use viewport-based calculation, but ensure it fits
      const viewportBased = Math.min(viewportWidth * 0.32, viewportHeight * 0.25);
      return Math.max(minRadius, Math.min(viewportBased, maxRadius));
    } else {
      // Desktop: use available space but cap at reasonable max
      const desktopMax = 280;
      return Math.max(minRadius, Math.min(maxRadius, desktopMax));
    }
  }
  
  // Fallback if viewport not available
  const maxRadius = isMobile ? 220 : 280;
  return Math.max(minRadius, maxRadius);
}
