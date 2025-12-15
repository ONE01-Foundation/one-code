/**
 * OrbitCluster - Orbit bubbles around center preview
 * Layout: 3 left, 3 right, 1 bottom (same on mobile and desktop)
 * No bubbles at top to avoid collision with header
 */

"use client";

import { useMemo, useEffect, useState } from "react";
import { motion } from "framer-motion";

export interface OrbitBubble {
  id: string;
  label: string;
  icon: string;
  description?: string;
  children?: OrbitBubble[];
}

interface OrbitClusterProps {
  bubbles: OrbitBubble[];
  activeBubble: OrbitBubble;
  selectedBubbleId: string | null;
  centerX: number;
  centerY: number;
  centerRadius: number;
  orbitRef: React.RefObject<HTMLDivElement | null>;
  onBubbleTap?: (bubbleId: string) => void;
  showBottomNode?: boolean; // Show bottom node only after entering a world
}

const BUBBLE_SIZE = 72;
const BUBBLE_RADIUS = BUBBLE_SIZE / 2;
const SAFE_MARGIN = 20;

// Responsive orbit radius calculation
function calculateOrbitRadius(
  isMobile: boolean,
  centerRadius: number,
  viewportWidth: number,
  viewportHeight: number
): number {
  const minRadius = centerRadius + BUBBLE_RADIUS + SAFE_MARGIN;
  
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
    // Increase radius slightly for better reachability
    const viewportBased = Math.min(viewportWidth * 0.35, viewportHeight * 0.28);
    return Math.max(minRadius, Math.min(viewportBased, maxRadius));
  } else {
    // Desktop: use available space but cap at reasonable max
    const desktopMax = 280;
    return Math.max(minRadius, Math.min(maxRadius, desktopMax));
  }
}

// Unified layout: 3 left, 3 right, 1 bottom (same on mobile and desktop)
// No bubbles at top (angles avoid -60 to 60 degrees from top)
// Bottom node only appears after entering a world (navStack.length > 0)
function getBubblePositions(count: number, showBottomNode: boolean) {
  const positions = [];
  
  // Left side: 3 bubbles (angles between 120-180 and 180-240 degrees)
  // Equal spacing: 120°, 150°, 180°
  const leftAngles = [
    (120 * Math.PI) / 180, // Left-top
    (150 * Math.PI) / 180, // Left-center
    (180 * Math.PI) / 180, // Left-bottom
  ];
  
  // Right side: 3 bubbles (angles between 300-360 and 0-60 degrees)
  // Equal spacing: 0°, 30°, 60°
  const rightAngles = [
    (0 * Math.PI) / 180,   // Right-bottom
    (30 * Math.PI) / 180,  // Right-center
    (60 * Math.PI) / 180, // Right-top
  ];
  
  // Bottom: 1 bubble (270 degrees) - only shown after entering
  const bottomAngle = (270 * Math.PI) / 180;
  
  // Combine positions: left + right + (optionally) bottom
  const allAngles = [...leftAngles, ...rightAngles];
  if (showBottomNode) {
    allAngles.push(bottomAngle);
  }
  
  // Take only as many as we have bubbles
  for (let i = 0; i < Math.min(count, allAngles.length); i++) {
    positions.push({ angle: allAngles[i], isPeek: false });
  }
  
  return positions;
}

export default function OrbitCluster({
  bubbles,
  activeBubble,
  selectedBubbleId,
  centerX,
  centerY,
  centerRadius,
  orbitRef,
  onBubbleTap,
  showBottomNode = false,
}: OrbitClusterProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [pressedBubbleId, setPressedBubbleId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const orbitRadius = useMemo(() => {
    const width = viewportWidth || (typeof window !== "undefined" ? window.innerWidth : 1920);
    const height = viewportHeight || (typeof window !== "undefined" ? window.innerHeight : 1080);
    return calculateOrbitRadius(isMobile, centerRadius, width, height);
  }, [isMobile, centerRadius, viewportWidth, viewportHeight]);

  // Get visible bubbles (exclude active one)
  const visibleBubbles = bubbles.filter((b) => b.id !== activeBubble.id);
  const positions = useMemo(() => {
    return getBubblePositions(visibleBubbles.length, showBottomNode);
  }, [visibleBubbles.length, showBottomNode]);

  // Only render if center is calculated
  if (centerX === 0 || centerY === 0) {
    return null;
  }

  return (
    <div 
      className="absolute inset-0 pointer-events-none z-10"
      style={{ overflow: 'visible' }}
    >
      {visibleBubbles.slice(0, positions.length).map((bubble, index) => {
        const position = positions[index];
        if (!position) return null;

        const angle = position.angle;
        // Perfect alignment: x = centerX + radius * cos(angle), y = centerY + radius * sin(angle)
        const x = centerX + orbitRadius * Math.cos(angle);
        const y = centerY + orbitRadius * Math.sin(angle);
        const isSelected = selectedBubbleId === bubble.id;
        const isPressed = pressedBubbleId === bubble.id;

        return (
          <motion.div
            key={bubble.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              x: x - centerX, // Offset for framer-motion
              y: y - centerY,
              scale: isPressed ? 1.2 : isSelected ? 1.1 : 1,
              opacity: isSelected ? 1 : 0.8,
            }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 30,
              mass: 1.2,
            }}
            className="absolute flex flex-col items-center justify-center rounded-full bg-white shadow-lg pointer-events-auto z-10 cursor-pointer overflow-hidden"
            style={{
              width: BUBBLE_SIZE,
              height: BUBBLE_SIZE,
              left: centerX,
              top: centerY,
              transform: "translate(-50%, -50%)",
              border: isSelected 
                ? "3px solid transparent"
                : isPressed 
                ? "2px solid #d4d4d4"
                : "1px solid #d4d4d4",
              background: isSelected
                ? "linear-gradient(white, white) padding-box, conic-gradient(from 0deg, rgba(0,0,0,0.3), rgba(0,0,0,0.8), rgba(0,0,0,0.3)) border-box"
                : undefined,
              boxShadow: isSelected
                ? "0 8px 24px rgba(0,0,0,0.3)"
                : isPressed
                ? "0 6px 18px rgba(0,0,0,0.2)"
                : "0 2px 8px rgba(0,0,0,0.1)",
            }}
            onPointerDown={() => setPressedBubbleId(bubble.id)}
            onPointerUp={() => {
              setPressedBubbleId(null);
              if (onBubbleTap) {
                onBubbleTap(bubble.id);
              }
            }}
            onPointerLeave={() => setPressedBubbleId(null)}
            onClick={() => {
              if (onBubbleTap) {
                onBubbleTap(bubble.id);
              }
            }}
          >
            <motion.span 
              className="text-3xl sm:text-4xl pointer-events-none"
              animate={{
                y: isSelected ? -3 : isPressed ? -4 : 0,
                scale: isSelected ? 1.1 : isPressed ? 1.15 : 1,
              }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              style={{
                maxWidth: `${BUBBLE_SIZE * 0.8}px`,
                maxHeight: `${BUBBLE_SIZE * 0.8}px`,
              }}
            >
              {bubble.icon}
            </motion.span>
          </motion.div>
        );
      })}
    </div>
  );
}
