"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Bubble from "./Bubble";
import type { Bubble as BubbleType } from "@/app/page";

interface BubbleFieldProps {
  bubbles: BubbleType[];
  theme: "light" | "dark";
  onCenteredBubbleChange: (bubble: BubbleType | null) => void;
  originBubble: BubbleType;
  targetBubble: BubbleType | null;
  onThemeToggle: () => void;
  centeredBubble: BubbleType | null;
}

interface Position {
  x: number;
  y: number;
}

const MIN_BUBBLE_DISTANCE = 140; // Minimum distance between bubble centers

export default function BubbleField({
  bubbles,
  theme,
  onCenteredBubbleChange,
  originBubble,
  targetBubble,
  onThemeToggle,
  centeredBubble,
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
  const [isMoving, setIsMoving] = useState(false);
  const [lastInteractionTime, setLastInteractionTime] = useState<number>(Date.now());
  const idleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const movingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [edgeBubbles, setEdgeBubbles] = useState<Position[]>([]);

  // Generate honeycomb positions
  const [bubblePositions, setBubblePositions] = useState<Position[]>([]);

  // Calculate center point (viewport center) - use visualViewport when available
  const getCenterPoint = useCallback((): Position => {
    if (!containerRef.current) return { x: 0, y: 0 };
    
    // Prefer visualViewport for mobile (accounts for keyboard, etc.)
    const vp = window.visualViewport || window;
    const rect = containerRef.current.getBoundingClientRect();
    
    return {
      x: rect.width / 2,
      y: rect.height / 2,
    };
  }, []);

  // Collision avoidance: ensure minimum distance between bubbles
  const enforceMinimumDistance = useCallback((positions: Position[]): Position[] => {
    const adjusted = [...positions];
    const maxIterations = 10;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let hasCollision = false;
      
      for (let i = 0; i < adjusted.length; i++) {
        for (let j = i + 1; j < adjusted.length; j++) {
          const dx = adjusted[j].x - adjusted[i].x;
          const dy = adjusted[j].y - adjusted[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < MIN_BUBBLE_DISTANCE && distance > 0) {
            hasCollision = true;
            const overlap = MIN_BUBBLE_DISTANCE - distance;
            const angle = Math.atan2(dy, dx);
            
            // Push bubbles apart
            const moveX = Math.cos(angle) * overlap * 0.5;
            const moveY = Math.sin(angle) * overlap * 0.5;
            
            // Don't move origin bubble (index 0)
            if (i !== 0) {
              adjusted[i].x -= moveX;
              adjusted[i].y -= moveY;
            }
            if (j !== 0) {
              adjusted[j].x += moveX;
              adjusted[j].y += moveY;
            }
          }
        }
      }
      
      if (!hasCollision) break;
    }
    
    return adjusted;
  }, []);

  const updatePositions = useCallback(() => {
    if (containerRef.current) {
      // Use actual viewport dimensions with safe area
      const rect = containerRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      
      let positions = generateHoneycombPositions(
        bubbles.length,
        width,
        height
      );
      
      // Enforce minimum distance
      positions = enforceMinimumDistance(positions);
      
      setBubblePositions(positions);
      
      // Center the origin bubble initially
      if (positions.length > 0) {
        const originIndex = bubbles.findIndex((b) => b.id === originBubble.id);
        if (originIndex === 0 && positions[0]) {
          const viewportCenterX = width / 2;
          const viewportCenterY = height / 2;
          const originPos = positions[0];
          
          // Calculate offset to center the origin bubble
          const offset = {
            x: viewportCenterX - originPos.x,
            y: viewportCenterY - originPos.y,
          };
          
          setPanOffset(offset);
          setVelocity({ x: 0, y: 0 });
          // Immediately notify that origin bubble is centered
          setTimeout(() => {
            onCenteredBubbleChange(originBubble);
          }, 50);
        }
      }
    }
  }, [bubbles.length, bubbles, originBubble, onCenteredBubbleChange, enforceMinimumDistance]);

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
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, [updatePositions]);

  // Find closest bubble to center
  const findClosestBubble = useCallback((): BubbleType | null => {
    if (bubblePositions.length === 0 || panOffset === null) return null;
    
    const center = getCenterPoint();
    let closest: BubbleType | null = null;
    let minDistance = Infinity;

    bubbles.forEach((bubble, index) => {
      if (!bubblePositions[index]) return;
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

  // Smooth snap to center if a bubble is close enough
  const smoothSnapToCenter = useCallback(() => {
    if (panOffset === null || bubblePositions.length === 0 || isDragging) return;
    
    // Cancel any ongoing inertia animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const center = getCenterPoint();
    const snapThreshold = 120; // Distance threshold for snapping
    
    let closestBubble: BubbleType | null = null;
    let closestIndex = -1;
    let minDistance = Infinity;

    bubbles.forEach((bubble, index) => {
      if (!bubblePositions[index]) return;
      const pos = bubblePositions[index];
      const screenX = pos.x + panOffset.x;
      const screenY = pos.y + panOffset.y;
      const distance = Math.sqrt(
        Math.pow(screenX - center.x, 2) + Math.pow(screenY - center.y, 2)
      );

      if (distance < minDistance && distance < snapThreshold) {
        minDistance = distance;
        closestBubble = bubble;
        closestIndex = index;
      }
    });

    // If we found a bubble close enough, smoothly snap it to center
    if (closestBubble && closestIndex >= 0 && bubblePositions[closestIndex]) {
      const targetPos = bubblePositions[closestIndex];
      const targetOffset = {
        x: center.x - targetPos.x,
        y: center.y - targetPos.y,
      };
      
      // Stop velocity for smooth snap
      setVelocity({ x: 0, y: 0 });
      
      // Smooth animation to center
      const startOffset = { ...panOffset };
      const deltaX = targetOffset.x - startOffset.x;
      const deltaY = targetOffset.y - startOffset.y;
      const duration = 300; // 300ms animation
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        setPanOffset({
          x: startOffset.x + deltaX * easeOut,
          y: startOffset.y + deltaY * easeOut,
        });
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Ensure we end exactly at target
          setPanOffset(targetOffset);
          setVelocity({ x: 0, y: 0 });
          onCenteredBubbleChange(closestBubble);
          animationFrameRef.current = null;
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [panOffset, bubblePositions, bubbles, getCenterPoint, isDragging, onCenteredBubbleChange]);

  // Generate edge bubbles when near the boundary
  useEffect(() => {
    if (panOffset === null || bubblePositions.length === 0 || !containerRef.current) return;

    const center = getCenterPoint();
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = rect.width;
    const viewportHeight = rect.height;

    // Find the bounds of existing bubbles in field coordinate space
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    bubblePositions.forEach((pos) => {
      minX = Math.min(minX, pos.x);
      maxX = Math.max(maxX, pos.x);
      minY = Math.min(minY, pos.y);
      maxY = Math.max(maxY, pos.y);
    });

    // Calculate center in field coordinates (origin is at 0,0 in field space, center needs to account for panOffset)
    const fieldCenterX = center.x - panOffset.x;
    const fieldCenterY = center.y - panOffset.y;

    // Check if we're near the edge (within 200px of boundary in screen space)
    const edgeThreshold = 200;
    const screenMinX = minX + panOffset.x;
    const screenMaxX = maxX + panOffset.x;
    const screenMinY = minY + panOffset.y;
    const screenMaxY = maxY + panOffset.y;
    
    const nearLeftEdge = center.x - screenMinX < edgeThreshold;
    const nearRightEdge = screenMaxX - center.x < edgeThreshold;
    const nearTopEdge = center.y - screenMinY < edgeThreshold;
    const nearBottomEdge = screenMaxY - center.y < edgeThreshold;

    const newEdgeBubbles: Position[] = [];

    if (nearLeftEdge || nearRightEdge || nearTopEdge || nearBottomEdge) {
      // Generate edge indicator bubbles in field coordinate space
      const spacing = 150;
      const edgeDistance = 250;

      if (nearLeftEdge) {
        // Generate bubbles to the left (in field coordinates)
        for (let i = -2; i <= 2; i++) {
          newEdgeBubbles.push({
            x: minX - edgeDistance,
            y: fieldCenterY + i * spacing,
          });
        }
      }
      if (nearRightEdge) {
        // Generate bubbles to the right (in field coordinates)
        for (let i = -2; i <= 2; i++) {
          newEdgeBubbles.push({
            x: maxX + edgeDistance,
            y: fieldCenterY + i * spacing,
          });
        }
      }
      if (nearTopEdge) {
        // Generate bubbles above (in field coordinates)
        for (let i = -2; i <= 2; i++) {
          newEdgeBubbles.push({
            x: fieldCenterX + i * spacing,
            y: minY - edgeDistance,
          });
        }
      }
      if (nearBottomEdge) {
        // Generate bubbles below (in field coordinates)
        for (let i = -2; i <= 2; i++) {
          newEdgeBubbles.push({
            x: fieldCenterX + i * spacing,
            y: maxY + edgeDistance,
          });
        }
      }
    }

    setEdgeBubbles(newEdgeBubbles);
  }, [panOffset, bubblePositions, getCenterPoint]);

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

  const handleInteraction = useCallback(() => {
    const now = Date.now();
    setLastInteractionTime(now);
    setIsIdle(false);
    setIsMoving(true);
    
    // Clear existing timeouts
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (movingTimeoutRef.current) {
      clearTimeout(movingTimeoutRef.current);
    }
    
    // Set moving to false after movement stops
    movingTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
    }, 200) as NodeJS.Timeout;
    
    // Set idle after 1000ms of no interaction
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 1000) as NodeJS.Timeout;
  }, []);

  // Idle state detection
  useEffect(() => {
    handleInteraction();
    return () => {
      if (idleTimeoutRef.current) {
        clearTimeout(idleTimeoutRef.current);
      }
      if (movingTimeoutRef.current) {
        clearTimeout(movingTimeoutRef.current);
      }
    };
  }, [handleInteraction]);

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
    // Smooth snap to center if bubble is close
    smoothSnapToCenter();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (panOffset === null) return;
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
    e.preventDefault();
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
    // Smooth snap to center if bubble is close
    smoothSnapToCenter();
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

  return (
      <div
        ref={containerRef}
        className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing touch-none z-10"
        style={{ 
          touchAction: "none",
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
        const isOrigin = bubble.id === originBubble.id;
        // Increased max scale for centered bubbles
        const baseScale = isOrigin ? 0.6 : 0.4;
        const maxScale = isOrigin ? 1.6 : 1.4; // Increased for all centered bubbles
        const scale = baseScale + (1 - normalizedDistance) * (maxScale - baseScale);

        const isOriginCentered = centeredBubble?.id === originBubble.id;

        return (
          <Bubble
            key={bubble.id}
            bubble={bubble}
            position={{ x: screenX, y: screenY }}
            scale={scale}
            theme={theme}
            isCentered={distance < 80}
            isOrigin={isOrigin}
            isIdle={isIdle}
            isMoving={isMoving}
            isOriginCentered={isOriginCentered}
            onClick={() => handleBubbleClick(bubble, index)}
            showClock={isOrigin && distance < 80}
            onThemeToggle={onThemeToggle}
          />
        );
      })}
      
      {/* Edge-of-field indicator bubbles */}
      {panOffset && edgeBubbles.map((edgePos, idx) => {
        // Convert field coordinates to screen coordinates
        const screenX = edgePos.x + panOffset.x;
        const screenY = edgePos.y + panOffset.y;
        const center = getCenterPoint();
        const distance = Math.sqrt(
          Math.pow(screenX - center.x, 2) + Math.pow(screenY - center.y, 2)
        );
        
        // Edge bubbles are smaller and more transparent
        const edgeScale = 0.25;
        const edgeOpacity = 0.15;

        return (
          <div
            key={`edge-${idx}`}
            style={{
              position: "absolute",
              width: `${120 * edgeScale}px`,
              height: `${120 * edgeScale}px`,
              borderRadius: "50%",
              transform: `translate(${screenX - 60 * edgeScale}px, ${screenY - 60 * edgeScale}px)`,
              background: theme === "dark"
                ? "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 100%)"
                : "radial-gradient(circle, rgba(0,0,0,0.04) 0%, transparent 100%)",
              border: `1px solid ${theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              opacity: edgeOpacity,
              pointerEvents: "none",
            }}
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
  const isMobile = width < 768;
  const spacing = isMobile 
    ? Math.max(140, Math.min(width, height) * 0.2) // Ensure minimum spacing
    : Math.max(180, Math.min(width, height) * 0.25);
  const centerX = width / 2;
  const centerY = height / 2;

  // Start from center and spiral outward
  let ring = 0;
  let index = 0;

  while (index < count) {
    if (ring === 0) {
      // First bubble (origin) is exactly at center
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
  const jitterAmount = isMobile ? 15 : 30;
  return positions.map((pos, idx) => {
    // Don't jitter the first bubble (origin)
    if (idx === 0) return pos;
    return {
      x: pos.x + (Math.random() - 0.5) * jitterAmount,
      y: pos.y + (Math.random() - 0.5) * jitterAmount,
    };
  });
}
