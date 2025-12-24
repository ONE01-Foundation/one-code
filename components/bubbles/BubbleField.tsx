"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Bubble from "./Bubble";
import type { Bubble as BubbleType, BubbleShape, BubbleFill } from "@/app/page";

interface BubbleFieldProps {
  bubbles: BubbleType[];
  theme: "light" | "dark";
  bubbleShape: BubbleShape;
  bubbleFill: BubbleFill;
  onCenteredBubbleChange: (bubble: BubbleType | null) => void;
  homeBubble: BubbleType;
  targetBubble: BubbleType | null;
  onThemeToggle: () => void;
}

interface Position {
  x: number;
  y: number;
}

export default function BubbleField({
  bubbles,
  theme,
  bubbleShape,
  bubbleFill,
  onCenteredBubbleChange,
  homeBubble,
  targetBubble,
  onThemeToggle,
}: BubbleFieldProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [panOffset, setPanOffset] = useState<Position | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [velocity, setVelocity] = useState<Position>({ x: 0, y: 0 });
  const [lastMoveTime, setLastMoveTime] = useState<number>(Date.now());
  const [lastMovePos, setLastMovePos] = useState<Position>({ x: 0, y: 0 });
  const animationFrameRef = useRef<number | null>(null);
  const [isIdle, setIsIdle] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generate honeycomb positions
  const [bubblePositions, setBubblePositions] = useState<Position[]>([]);

  // Calculate center point (viewport center)
  const getCenterPoint = useCallback((): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.width / 2,
      y: rect.height / 2,
    };
  }, []);

  const updatePositions = useCallback(() => {
    if (containerRef.current) {
      // Use actual viewport dimensions with safe area
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      const positions = generateHoneycombPositions(
        bubbles.length,
        width,
        height
      );
      setBubblePositions(positions);
      
      // Center the home bubble initially
      // The first bubble (home) is generated at centerX, centerY
      // Calculate actual viewport center accounting for safe areas
      if (positions.length > 0) {
        const homeIndex = bubbles.findIndex((b) => b.id === homeBubble.id);
        if (homeIndex === 0 && positions[0]) {
          const viewportCenterX = width / 2;
          const viewportCenterY = height / 2;
          const homePos = positions[0];
          
          // Calculate offset to center the home bubble
          const offset = {
            x: viewportCenterX - homePos.x,
            y: viewportCenterY - homePos.y,
          };
          
          setPanOffset(offset);
          setVelocity({ x: 0, y: 0 });
          // Immediately notify that home bubble is centered
          setTimeout(() => {
            onCenteredBubbleChange(homeBubble);
          }, 50);
        }
      }
    }
  }, [bubbles.length, bubbles, homeBubble, onCenteredBubbleChange]);

  useEffect(() => {
    // Initial positioning
    const timer = setTimeout(() => {
      updatePositions();
    }, 100);
    
    const handleResize = () => {
      updatePositions();
    };
    
    const handleOrientationChange = () => {
      setTimeout(() => {
        updatePositions();
      }, 200);
    };
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, [updatePositions]);

  // Find closest bubble to center
  const findClosestBubble = useCallback((): BubbleType | null => {
    if (bubblePositions.length === 0) return null;
    
    const center = getCenterPoint();
    let closest: BubbleType | null = null;
    let minDistance = Infinity;

    bubbles.forEach((bubble, index) => {
      if (!bubblePositions[index]) return;
      if (panOffset === null) return;
      const pos = bubblePositions[index];
      const screenX = pos.x + panOffset.x;
      const screenY = pos.y + panOffset.y;
      const distance = Math.sqrt(
        Math.pow(screenX - center.x, 2) + Math.pow(screenY - center.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closest = bubble;
      }
    });

    return closest;
  }, [bubbles, panOffset, getCenterPoint, bubblePositions]);

  // Handle target bubble (for smooth centering)
  useEffect(() => {
    if (targetBubble && bubblePositions.length > 0) {
      const targetIndex = bubbles.findIndex((b) => b.id === targetBubble.id);
      if (targetIndex >= 0 && bubblePositions[targetIndex]) {
        const center = getCenterPoint();
        const targetPos = bubblePositions[targetIndex];
        // Smoothly pan to center the target bubble
        const targetOffset = {
          x: center.x - targetPos.x,
          y: center.y - targetPos.y,
        };
        setPanOffset(targetOffset);
        setVelocity({ x: 0, y: 0 });
        // Clear target after centering
        setTimeout(() => {
          onCenteredBubbleChange(targetBubble);
        }, 100);
      }
    }
  }, [targetBubble, bubblePositions, bubbles, getCenterPoint, onCenteredBubbleChange]);

  // Update centered bubble when pan changes
  useEffect(() => {
    if (panOffset === null) return;
    const closest = findClosestBubble();
    onCenteredBubbleChange(closest);
  }, [panOffset, findClosestBubble, onCenteredBubbleChange]);

  // Idle state detection
  useEffect(() => {
    const checkIdle = () => {
      const timeSinceInteraction = Date.now() - lastInteractionTime;
      if (timeSinceInteraction > 3000) {
        setIsIdle(true);
      } else {
        setIsIdle(false);
      }
    };

    const interval = setInterval(checkIdle, 500);
    return () => clearInterval(interval);
  }, [lastInteractionTime]);

  // Inertia animation
  useEffect(() => {
    if (isDragging || panOffset === null || (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1)) {
      return;
    }

    const animate = () => {
      setPanOffset((prev) => {
        if (prev === null) return null;
        return {
          x: prev.x + velocity.x,
          y: prev.y + velocity.y,
        };
      });

      setVelocity((prev) => ({
        x: prev.x * 0.95,
        y: prev.y * 0.95,
      }));

      if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isDragging, velocity, panOffset]);

  const handleInteraction = () => {
    setLastInteractionTime(Date.now());
    setIsIdle(false);
  };

  const handleBubbleClick = (bubble: BubbleType, index: number) => {
    if (bubblePositions[index]) {
      const center = getCenterPoint();
      const targetPos = bubblePositions[index];
      const targetOffset = {
        x: center.x - targetPos.x,
        y: center.y - targetPos.y,
      };
      setPanOffset(targetOffset);
      setVelocity({ x: 0, y: 0 });
      onCenteredBubbleChange(bubble);
      handleInteraction();
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panOffset === null) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    setVelocity({ x: 0, y: 0 });
    handleInteraction();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || panOffset === null) return;
    handleInteraction();

    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    
    if (deltaTime > 0) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      setPanOffset({ x: newX, y: newY });
      
      // Calculate velocity for inertia
      const vx = (newX - lastMovePos.x) / deltaTime * 16;
      const vy = (newY - lastMovePos.y) / deltaTime * 16;
      setVelocity({ x: vx, y: vy });
      
      setLastMovePos({ x: newX, y: newY });
      setLastMoveTime(now);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (panOffset === null) return;
    // Prevent default to avoid scrolling issues on mobile
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
    setVelocity({ x: 0, y: 0 });
    setLastMovePos({ x: touch.clientX - dragStart.x, y: touch.clientY - dragStart.y });
    setLastMoveTime(Date.now());
    handleInteraction();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || panOffset === null) return;
    e.preventDefault(); // Prevent scrolling on mobile
    handleInteraction();
    
    const touch = e.touches[0];
    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    
    if (deltaTime > 0) {
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;
      
      setPanOffset({ x: newX, y: newY });
      
      const vx = (newX - lastMovePos.x) / deltaTime * 16;
      const vy = (newY - lastMovePos.y) / deltaTime * 16;
      setVelocity({ x: vx, y: vy });
      
      setLastMovePos({ x: newX, y: newY });
      setLastMoveTime(now);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing touch-none"
      style={{ 
        touchAction: "none",
        width: "100vw",
        minHeight: "100vh",
        height: "100dvh",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {bubbles.map((bubble, index) => {
        if (!bubblePositions[index] || panOffset === null) return null;
        const pos = bubblePositions[index];
        const center = getCenterPoint();
        const screenX = pos.x + panOffset.x;
        const screenY = pos.y + panOffset.y;
        const distance = Math.sqrt(
          Math.pow(screenX - center.x, 2) + Math.pow(screenY - center.y, 2)
        );

        // Scale based on distance (closer = larger)
        const maxDistance = Math.sqrt(
          Math.pow(center.x, 2) + Math.pow(center.y, 2)
        );
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        const isHome = bubble.id === homeBubble.id;
        const baseScale = isHome ? 0.5 : 0.4;
        const maxScale = isHome ? 1.2 : 1.0; // Home bubble scales larger
        const scale = baseScale + (1 - normalizedDistance) * (maxScale - baseScale);

        return (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            position={{ x: screenX, y: screenY }}
            scale={scale}
            theme={theme}
            shape={bubbleShape}
            fill={bubbleFill}
            isCentered={distance < 80}
            isHome={isHome}
            isIdle={isIdle}
            onClick={() => handleBubbleClick(bubble, index)}
            showClock={isHome && distance < 80}
            onThemeToggle={onThemeToggle}
          />
        );
      })}
    </div>
  );
}

// Generate honeycomb-like positions
function generateHoneycombPositions(
  count: number,
  width: number = 1920,
  height: number = 1080
): Position[] {
  const positions: Position[] = [];
  // Adjust spacing based on screen size (smaller on mobile)
  const isMobile = width < 768;
  const spacing = isMobile 
    ? Math.min(140, Math.min(width, height) * 0.2)
    : Math.min(180, Math.min(width, height) * 0.25);
  const centerX = width / 2;
  const centerY = height / 2;

  // Start from center and spiral outward
  let ring = 0;
  let index = 0;

  while (index < count) {
    if (ring === 0) {
      // First bubble (home) is exactly at center
      positions.push({ x: centerX, y: centerY });
      index++;
    } else {
      const hexCount = ring * 6;
      const angleStep = (2 * Math.PI) / hexCount;

      for (let i = 0; i < hexCount && index < count; i++) {
        const angle = i * angleStep;
        const radius = ring * spacing;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        positions.push({ x, y });
        index++;
      }
    }
    ring++;
  }

  // Add minimal jitter for more natural look (less on mobile)
  const jitterAmount = isMobile ? 20 : 40;
  return positions.map((pos, idx) => {
    // Don't jitter the first bubble (home)
    if (idx === 0) return pos;
    return {
      x: pos.x + (Math.random() - 0.5) * jitterAmount,
      y: pos.y + (Math.random() - 0.5) * jitterAmount,
    };
  });
}

