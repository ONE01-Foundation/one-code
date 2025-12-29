"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Bubble from "./Bubble";
import type { Bubble as BubbleType } from "@/app/page";

interface BubbleFieldProps {
  bubbles: BubbleType[];
  theme: "light" | "dark";
  uiSize?: "normal" | "large";
  onCenteredBubbleChange: (bubble: BubbleType | null) => void;
  originBubble: BubbleType;
  targetBubble: BubbleType | null;
  onThemeToggle: () => void;
  centeredBubble: BubbleType | null;
  isRTL?: boolean;
  mode: "private" | "global";
  onHoveredBubbleChange?: (bubbleId: string | null) => void;
  onBubbleClick?: (bubble: BubbleType) => void;
}

interface Position {
  x: number;
  y: number;
}

// Minimum distance between bubble centers - larger on mobile for better spacing
const getMinBubbleDistance = (width: number) => {
  const isMobile = width < 768;
  return isMobile ? 160 : 140;
};

// Deterministic hash function for seeded random values
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Seeded random number generator (returns value between -0.5 and 0.5)
function seededRandom(seed: number): number {
  // Simple seeded random using seed value
  const x = Math.sin(seed) * 10000;
  return (x - Math.floor(x)) - 0.5;
}

export default function BubbleField({
  bubbles,
  theme,
  uiSize = "normal",
  onCenteredBubbleChange,
  originBubble,
  targetBubble,
  onThemeToggle,
  centeredBubble,
  isRTL = false,
  mode,
  onHoveredBubbleChange,
  onBubbleClick,
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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollTime = useRef<number>(0);
  
  // Desktop hover spotlight tracking
  const [mousePosition, setMousePosition] = useState<Position | null>(null);
  const [isPointerDevice, setIsPointerDevice] = useState(false);
  const [hoveredBubbleId, setHoveredBubbleId] = useState<string | null>(null);
  
  // Touch swipe tracking for vertical/horizontal detection
  const touchStartPos = useRef<Position | null>(null);
  const swipeDirection = useRef<"vertical" | "horizontal" | null>(null);
  const [activeSubBubbleIndex, setActiveSubBubbleIndex] = useState<number>(0);
  const [subBubblePanOffset, setSubBubblePanOffset] = useState<number>(0); // Horizontal offset for sub-bubbles
  const [isMobile, setIsMobile] = useState(false);
  const [highlightedArrow, setHighlightedArrow] = useState<"left" | "right" | null>(null);
  
  // Double tap/click detection
  const lastTapTime = useRef<number>(0);
  const lastTapPos = useRef<Position | null>(null);
  const doubleTapTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastClickTime = useRef<number>(0);
  const lastClickPos = useRef<Position | null>(null);
  const doubleClickTimeout = useRef<NodeJS.Timeout | null>(null);

  // Generate honeycomb positions
  const [bubblePositions, setBubblePositions] = useState<Position[]>([]);

  // Find origin bubble index (CRITICAL FIX #1)
  const originIndex = bubbles.findIndex(b => b.id === originBubble.id);

  // Detect pointer device capability (FIX #6)
  useEffect(() => {
    const checkPointerDevice = () => {
      // Check if device has fine pointer (mouse) capability
      const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
      setIsPointerDevice(hasFinePointer);
    };
    checkPointerDevice();
    window.matchMedia('(pointer: fine)').addEventListener('change', checkPointerDevice);
    return () => {
      window.matchMedia('(pointer: fine)').removeEventListener('change', checkPointerDevice);
    };
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Calculate center point (viewport center) - SINGLE SOURCE OF TRUTH (FIX #7)
  // Use clientWidth/clientHeight which excludes padding and scrollbars (more reliable than getBoundingClientRect)
  const getCenterPoint = useCallback((): Position => {
    if (!containerRef.current) {
      // Fallback to window center if container not available
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }
    
    // Use clientWidth/clientHeight - these exclude padding, borders, and scrollbars
    // This is the actual usable content area size, which is what we need for centering
    const width = containerRef.current.clientWidth || containerRef.current.offsetWidth;
    const height = containerRef.current.clientHeight || containerRef.current.offsetHeight;
    
    // Calculate center relative to container's top-left corner
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Ensure we have valid dimensions (Safari/Edge fix)
    if (width <= 0 || height <= 0 || !isFinite(centerX) || !isFinite(centerY)) {
      // Fallback to window dimensions if container dimensions are invalid
      return {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };
    }
    
    return {
      x: centerX,
      y: centerY,
    };
  }, []);

  // Clamp panOffset to world bounds
  const worldBounds = useRef<{ minX: number; maxX: number; minY: number; maxY: number; radius: number } | null>(null);
  
  const clampPanOffset = useCallback((offset: Position): Position => {
    if (!worldBounds.current || !containerRef.current) return offset;
    
    const center = getCenterPoint();
    const bounds = worldBounds.current;
    
    const minOffsetX = center.x - bounds.maxX;
    const maxOffsetX = center.x - bounds.minX;
    const minOffsetY = center.y - bounds.maxY;
    const maxOffsetY = center.y - bounds.minY;
    
    return {
      x: Math.max(minOffsetX, Math.min(maxOffsetX, offset.x)),
      y: Math.max(minOffsetY, Math.min(maxOffsetY, offset.y)),
    };
  }, [getCenterPoint]);

  // Collision avoidance: ensure minimum distance between bubbles (FIX #3)
  const enforceMinimumDistance = useCallback((positions: Position[], originIdx: number, width: number): Position[] => {
    const adjusted = [...positions];
    const maxIterations = 10;
    const minDistance = getMinBubbleDistance(width);
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let hasCollision = false;
      
      for (let i = 0; i < adjusted.length; i++) {
        for (let j = i + 1; j < adjusted.length; j++) {
          const dx = adjusted[j].x - adjusted[i].x;
          const dy = adjusted[j].y - adjusted[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < minDistance && distance > 0) {
            hasCollision = true;
            const overlap = minDistance - distance;
            const angle = Math.atan2(dy, dx);
            
            // Push bubbles apart
            const moveX = Math.cos(angle) * overlap * 0.5;
            const moveY = Math.sin(angle) * overlap * 0.5;
            
            // Don't move origin bubble (use originIdx, not index 0)
            if (i !== originIdx) {
              adjusted[i].x -= moveX;
              adjusted[i].y -= moveY;
            }
            if (j !== originIdx) {
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
    if (containerRef.current && originIndex >= 0) {
      isUpdatingPositions.current = true;
      
      // Use clientWidth/clientHeight for actual content area dimensions (excludes padding/scrollbars)
      let width = containerRef.current.clientWidth || containerRef.current.offsetWidth;
      let height = containerRef.current.clientHeight || containerRef.current.offsetHeight;
      
      // Safari/Edge fix: if dimensions are invalid, use window dimensions
      if (width <= 0 || height <= 0 || !isFinite(width) || !isFinite(height)) {
        width = window.innerWidth;
        height = window.innerHeight;
      }
      
      // Generate positions in field-space - vertical line layout
      let positions = generateVerticalLinePositions(
        bubbles.length,
        bubbles,
        originIndex,
        width,
        height
      );
      
      // Enforce minimum distance (pass originIndex, not assume 0)
      positions = enforceMinimumDistance(positions, originIndex, width);
      
      // Calculate world bounds for pan clamping
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      positions.forEach(pos => {
        minX = Math.min(minX, pos.x);
        maxX = Math.max(maxX, pos.x);
        minY = Math.min(minY, pos.y);
        maxY = Math.max(maxY, pos.y);
      });
      const maxRadius = Math.max(
        Math.sqrt(minX * minX + minY * minY),
        Math.sqrt(maxX * maxX + maxY * maxY)
      );
      worldBounds.current = { minX, maxX, minY, maxY, radius: maxRadius };
      
      setBubblePositions(positions);
      
      // Only center the origin bubble on initial load or if no bubble is currently centered
      // Don't reset if we're already centered on a bubble (prevents reset when bubbles update)
      if (panOffset === null || !centeredBubble) {
        // Center the origin bubble via panOffset (SINGLE source of truth for centering)
        // Use double requestAnimationFrame to ensure layout is complete (Safari/Edge fix)
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (!containerRef.current) {
              isUpdatingPositions.current = false;
              return;
            }
            const center = getCenterPoint();
            if (positions[originIndex]) {
              const originPos = positions[originIndex];
            
            // Calculate offset to center the origin bubble
            const offset = {
                x: center.x - originPos.x,
                y: center.y - originPos.y,
            };
            
            setPanOffset(offset);
            setVelocity({ x: 0, y: 0 });
            // Immediately notify that origin bubble is centered
            setTimeout(() => {
              onCenteredBubbleChange(originBubble);
              isUpdatingPositions.current = false;
            }, 50);
          }
          });
        });
      } else if (centeredBubble && panOffset !== null) {
        // If we have a centered bubble, maintain its position when bubbles update
        // Find the index of the currently centered bubble in the new bubbles array
        const currentCenteredIndex = bubbles.findIndex(b => b.id === centeredBubble.id);
        if (currentCenteredIndex >= 0 && positions[currentCenteredIndex]) {
          const center = getCenterPoint();
          const centeredPos = positions[currentCenteredIndex];
          const offset = {
            x: center.x - centeredPos.x,
            y: center.y - centeredPos.y,
          };
          setPanOffset(clampPanOffset(offset));
        }
        // Reset flag after a short delay to allow position update to complete
        setTimeout(() => {
          isUpdatingPositions.current = false;
        }, 100);
      } else {
        isUpdatingPositions.current = false;
      }
      }
  }, [bubbles, originIndex, originBubble, onCenteredBubbleChange, enforceMinimumDistance, getCenterPoint, panOffset, centeredBubble, clampPanOffset]);

  useEffect(() => {
    // Initial positioning - use longer delay for Safari/Edge to ensure layout is complete
    const timer = setTimeout(() => {
      updatePositions();
    }, 300);
    
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
    
    // Cancel any ongoing animations (inertia or previous snap)
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Ensure velocity is cleared to prevent inertia from continuing
    setVelocity({ x: 0, y: 0 });
    
    const center = getCenterPoint();
    const snapThreshold = 100; // Reduced threshold for more natural snapping
    
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

    if (closestBubble && closestIndex >= 0 && bubblePositions[closestIndex]) {
      const targetPos = bubblePositions[closestIndex];
      const targetOffset = {
        x: center.x - targetPos.x,
        y: center.y - targetPos.y,
      };
      
      const clampedTarget = clampPanOffset(targetOffset);
      const startOffset = { ...panOffset };
      const deltaX = clampedTarget.x - startOffset.x;
      const deltaY = clampedTarget.y - startOffset.y;
      
      // Only snap if movement is significant (prevents micro-movements)
      const deltaDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (deltaDistance < 5) {
        // Already very close, just update centered bubble
        onCenteredBubbleChange(closestBubble);
        return;
      }
      
      const duration = 250; // Slightly faster for more responsive feel
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Smooth ease-out curve
        const easeOut = 1 - Math.pow(1 - progress, 3);
        
        const currentOffset = {
          x: startOffset.x + deltaX * easeOut,
          y: startOffset.y + deltaY * easeOut,
        };
        setPanOffset(clampPanOffset(currentOffset));
        
        if (progress < 1) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          setPanOffset(clampedTarget);
          setVelocity({ x: 0, y: 0 });
          onCenteredBubbleChange(closestBubble);
          animationFrameRef.current = null;
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [panOffset, bubblePositions, bubbles, getCenterPoint, isDragging, onCenteredBubbleChange, clampPanOffset]);


  // Handle target bubble (for smooth centering)
  useEffect(() => {
    if (targetBubble && bubblePositions.length > 0) {
      const targetIndex = bubbles.findIndex((b) => b.id === targetBubble.id);
      if (targetIndex >= 0 && bubblePositions[targetIndex]) {
        const center = getCenterPoint();
        const targetPos = bubblePositions[targetIndex];
        const targetOffset = {
          x: center.x - targetPos.x,
          y: center.y - targetPos.y,
        };
        const clampedTarget = clampPanOffset(targetOffset);
        setPanOffset(clampedTarget);
        setVelocity({ x: 0, y: 0 });
        setTimeout(() => {
          onCenteredBubbleChange(targetBubble);
        }, 100);
      }
    }
  }, [targetBubble, bubblePositions, bubbles, getCenterPoint, onCenteredBubbleChange, clampPanOffset]);

  // Update centered bubble when pan changes
  // Don't update if we're in the middle of updating positions (to prevent reset during bubble updates)
  const isUpdatingPositions = useRef(false);
  useEffect(() => {
    if (panOffset === null || isUpdatingPositions.current) return;
    const closest = findClosestBubble();
    if (closest) {
      onCenteredBubbleChange(closest);
    }
  }, [panOffset, findClosestBubble, onCenteredBubbleChange]);

  // Inertia animation (with bounds clamping) - only for desktop mouse drags
  useEffect(() => {
    // Don't run inertia on mobile touch devices - let snap handle it
    if (isDragging || panOffset === null || (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1)) {
      return;
    }

    // Only apply inertia on desktop (mouse drags), not on touch devices
    // On touch, we rely on smoothSnapToCenter instead
    if (!isPointerDevice) {
      return;
    }

    const animate = () => {
      setPanOffset((prev) => {
        if (prev === null) return null;
        const next = {
          x: prev.x + velocity.x,
          y: prev.y + velocity.y,
        };
        return clampPanOffset(next);
      });

      setVelocity((prev) => ({
        x: prev.x * 0.92, // Slightly faster decay for smoother feel
        y: prev.y * 0.92,
      }));

      if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // When inertia stops, trigger snap
        animationFrameRef.current = null;
        smoothSnapToCenter();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isDragging, velocity, panOffset, clampPanOffset, isPointerDevice, smoothSnapToCenter]);

  const handleInteraction = useCallback(() => {
    const now = Date.now();
    setLastInteractionTime(now);
    setIsIdle(false);
    setIsMoving(true);
    
    if (idleTimeoutRef.current) {
      clearTimeout(idleTimeoutRef.current);
    }
    if (movingTimeoutRef.current) {
      clearTimeout(movingTimeoutRef.current);
    }
    
    movingTimeoutRef.current = setTimeout(() => {
      setIsMoving(false);
    }, 200) as NodeJS.Timeout;
    
    idleTimeoutRef.current = setTimeout(() => {
      setIsIdle(true);
    }, 1000) as NodeJS.Timeout;
  }, []);

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

  const mouseDownPos = useRef<Position | null>(null);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panOffset === null) return;
    mouseDownPos.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    const localDragStart = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
    setDragStart(localDragStart);
    setLastMovePos({ x: e.clientX - localDragStart.x, y: e.clientY - localDragStart.y });
    setVelocity({ x: 0, y: 0 });
    handleInteraction();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // Track mouse position for desktop spotlight effect
    if (isPointerDevice && containerRef.current && panOffset !== null && bubblePositions.length > 0) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setMousePosition({ x: mouseX, y: mouseY });
      
      // Find closest bubble to mouse for AI text display
      const center = getCenterPoint();
      const spotlightRadius = 180;
      let closestBubble: BubbleType | null = null;
      let minDistance = Infinity;
      
      for (let index = 0; index < bubbles.length; index++) {
        const bubble = bubbles[index];
        if (!bubblePositions[index]) continue;
        const pos = bubblePositions[index];
        const screenX = pos.x + panOffset.x;
        const screenY = pos.y + panOffset.y;
        const distance = Math.sqrt(
          Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2)
        );
        
        if (distance < minDistance && distance < spotlightRadius) {
          minDistance = distance;
          closestBubble = bubble;
        }
      }
      
      const newHoveredId: string | null = closestBubble !== null ? closestBubble.id : null;
      setHoveredBubbleId(newHoveredId);
      onHoveredBubbleChange?.(newHoveredId);
    } else {
      setHoveredBubbleId(null);
      onHoveredBubbleChange?.(null);
    }
    
    if (!isDragging || panOffset === null) return;
    handleInteraction();

    const now = Date.now();
    const deltaTime = now - lastMoveTime;
    
    if (deltaTime > 0) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      const clamped = clampPanOffset({ x: newX, y: newY });
      setPanOffset(clamped);
      
      const vx = (clamped.x - lastMovePos.x) / deltaTime * 16;
      const vy = (clamped.y - lastMovePos.y) / deltaTime * 16;
      setVelocity({ x: vx, y: vy });
      
      setLastMovePos({ x: clamped.x, y: clamped.y });
      setLastMoveTime(now);
    }
  };

  const handleMouseLeave = () => {
    setMousePosition(null);
    setHoveredBubbleId(null);
    onHoveredBubbleChange?.(null);
    setIsDragging(false);
    smoothSnapToCenter();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    setIsDragging(false);
    
    // Check for double click (desktop) - only if it wasn't a drag
    if (isPointerDevice && mouseDownPos.current) {
      const currentTime = Date.now();
      const currentPos: Position = { x: e.clientX, y: e.clientY };
      const dragDistance = Math.sqrt(
        Math.pow(currentPos.x - mouseDownPos.current.x, 2) + 
        Math.pow(currentPos.y - mouseDownPos.current.y, 2)
      );
      const maxClickDistance = 30; // Maximum distance for a click (not a drag)
      
      // Only treat as click if movement was small (not a drag)
      if (dragDistance < maxClickDistance) {
        const timeSinceLastClick = currentTime - lastClickTime.current;
        const doubleClickTimeWindow = 300; // 300ms window for double click
        
        // Check if this is a double click
        if (lastClickPos.current && 
            timeSinceLastClick < doubleClickTimeWindow &&
            Math.abs(currentPos.x - lastClickPos.current.x) < maxClickDistance &&
            Math.abs(currentPos.y - lastClickPos.current.y) < maxClickDistance) {
          // Double click detected - go to origin bubble
          e.preventDefault();
          e.stopPropagation();
          
          // Clear any pending single click timeout
          if (doubleClickTimeout.current) {
            clearTimeout(doubleClickTimeout.current);
            doubleClickTimeout.current = null;
          }
          
          // Navigate to origin bubble
          const center = getCenterPoint();
          const originIndex = bubbles.findIndex(b => b.id === originBubble.id);
          if (originIndex >= 0 && bubblePositions[originIndex]) {
            const originPos = bubblePositions[originIndex];
            const targetOffset = {
              x: center.x - originPos.x,
              y: center.y - originPos.y,
            };
            const clampedTarget = clampPanOffset(targetOffset);
            setPanOffset(clampedTarget);
            setVelocity({ x: 0, y: 0 });
            onCenteredBubbleChange(originBubble);
          }
          
          // Reset click tracking
          lastClickTime.current = 0;
          lastClickPos.current = null;
          mouseDownPos.current = null;
          return;
        } else {
          // Single click - wait to see if it becomes a double click
          lastClickTime.current = currentTime;
          lastClickPos.current = currentPos;
          
          // Clear any existing timeout
          if (doubleClickTimeout.current) {
            clearTimeout(doubleClickTimeout.current);
          }
          
          // Set timeout to clear if no second click comes
          doubleClickTimeout.current = setTimeout(() => {
            lastClickTime.current = 0;
            lastClickPos.current = null;
          }, doubleClickTimeWindow);
        }
      }
    }
    
    mouseDownPos.current = null;
    
    // Clear velocity immediately on mouse up to stop inertia
    setVelocity({ x: 0, y: 0 });
    // Small delay to ensure dragging state is cleared before snap
    requestAnimationFrame(() => {
      smoothSnapToCenter();
    });
  };

  // FIX #5: Compute dragStart locally before state update
  const handleTouchStart = (e: React.TouchEvent) => {
    if (panOffset === null) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    swipeDirection.current = null;
    setIsDragging(true);
    // Compute local dragStart before state update
    const localDragStart = { x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y };
    setDragStart(localDragStart);
    // Use localDragStart for lastMovePos initialization
    setLastMovePos({ x: touch.clientX - localDragStart.x, y: touch.clientY - localDragStart.y });
    setLastMoveTime(Date.now());
    setVelocity({ x: 0, y: 0 });
    handleInteraction();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || panOffset === null || !touchStartPos.current) return;
    e.preventDefault();
    handleInteraction();
    
    const touch = e.touches[0];
    
    // Detect swipe direction on first significant movement
    if (!swipeDirection.current) {
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      const threshold = 5; // Lower threshold for more responsive detection
      
      if (deltaX > threshold || deltaY > threshold) {
        // More sensitive direction detection - need clearer distinction
        swipeDirection.current = deltaY > deltaX * 1.2 ? "vertical" : (deltaX > deltaY * 1.2 ? "horizontal" : null);
      }
    }
    
    // Don't allow panning - bubbles will change directly based on scroll direction
    // This makes mobile scrolling work like desktop mouse wheel
  };

  // Get all bubbles sorted by their original order/index (for scroll navigation: 1, 2, 3, ...)
  const getSortedBubblesByNumber = useCallback((): Array<{ bubble: BubbleType; index: number }> => {
    if (bubblePositions.length === 0) return [];
    
    const bubblesWithIndex = bubbles.map((bubble, index) => {
      if (!bubblePositions[index]) return null;
      return { bubble, index };
    }).filter((item): item is { bubble: BubbleType; index: number } => item !== null);
    
    // Sort by original array index (order) - ascending order (bubble 0, 1, 2, 3, ...)
    return bubblesWithIndex.sort((a, b) => a.index - b.index);
  }, [bubbles, bubblePositions]);

  // Navigate to next/previous bubble (used by both wheel and touch)
  const navigateToBubble = useCallback((direction: "up" | "down") => {
    if (panOffset === null || bubblePositions.length === 0) return;
    
    const sortedBubbles = getSortedBubblesByNumber();
    if (sortedBubbles.length === 0) return;
    
    const currentIndex = sortedBubbles.findIndex(item => item.bubble.id === centeredBubble?.id);
    if (currentIndex === -1) return;
    
    let targetIndex: number;
    if (direction === "down") {
      // Next bubble
      targetIndex = currentIndex < sortedBubbles.length - 1 ? currentIndex + 1 : 0;
    } else {
      // Previous bubble
      targetIndex = currentIndex > 0 ? currentIndex - 1 : sortedBubbles.length - 1;
    }
    
    const targetBubbleData = sortedBubbles[targetIndex];
    if (targetBubbleData) {
      const center = getCenterPoint();
      const targetPos = bubblePositions[targetBubbleData.index];
      const targetOffset = {
        x: center.x - targetPos.x,
        y: center.y - targetPos.y,
      };
      const clampedTarget = clampPanOffset(targetOffset);
      setPanOffset(clampedTarget);
      setVelocity({ x: 0, y: 0 });
      onCenteredBubbleChange(targetBubbleData.bubble);
    }
  }, [panOffset, bubblePositions, centeredBubble, getSortedBubblesByNumber, getCenterPoint, clampPanOffset, onCenteredBubbleChange]);

  // Get active sub-bubble for centered parent bubble based on active index
  const getActiveSubBubble = useCallback((): BubbleType | null => {
    if (!centeredBubble || !centeredBubble.subBubbles || centeredBubble.subBubbles.length === 0) {
      return null;
    }
    // Index 0 = parent, index 1-5 = sub-bubbles
    const subIndex = activeSubBubbleIndex - 1; // Convert to 0-based sub-bubble index
    if (subIndex < 0 || subIndex >= centeredBubble.subBubbles.length) {
      return null;
    }
    return centeredBubble.subBubbles[subIndex] || null;
  }, [centeredBubble, activeSubBubbleIndex]);

  // Navigate between sub-bubbles horizontally (similar to vertical navigation)
  // Index 0 = parent, index 1-N = sub-bubbles (infinite scroll)
  const navigateSubBubbles = useCallback((direction: "left" | "right") => {
    if (!centeredBubble || !centeredBubble.subBubbles || centeredBubble.subBubbles.length === 0) {
      return;
    }
    
    const maxIndex = centeredBubble.subBubbles.length; // Max sub-bubble index (1-based, so maxIndex = total count)
    
    setActiveSubBubbleIndex((currentIndex) => {
      let targetIndex: number;
      
      if (direction === "right") {
        // Swipe right = move to next (index + 1, infinite scroll)
        // If at parent (0), go to first sub-bubble (1)
        // If at last sub-bubble (maxIndex), wrap back to parent (0)
        targetIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
      } else {
        // Swipe left = move to previous (index - 1, infinite scroll)
        // If at first sub-bubble (1), go to parent (0)
        // If at parent (0), wrap to last sub-bubble (maxIndex)
        targetIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
      }
      
      // Always center the active sub-bubble (offset = 0 for centered position)
      setSubBubblePanOffset(0);
      
      return targetIndex;
    });
  }, [centeredBubble]);

  // Reset sub-bubble index and pan offset when centered bubble changes
  // Start at index 0 (parent bubble) when a bubble with sub-bubbles is centered
  // Only reset if the bubble ID actually changed (not just sub-bubbles updated)
  const previousCenteredBubbleId = useRef<string | null>(null);
  useEffect(() => {
    const currentId = centeredBubble?.id || null;
    // Only reset if the bubble ID changed (not if it's the same bubble with updated sub-bubbles)
    if (currentId !== previousCenteredBubbleId.current) {
      previousCenteredBubbleId.current = currentId;
      if (centeredBubble?.subBubbles && centeredBubble.subBubbles.length > 0) {
        // Start at parent bubble (index 0) when centering a bubble with sub-bubbles
        setActiveSubBubbleIndex(0);
        setSubBubblePanOffset(0);
      } else {
        setActiveSubBubbleIndex(0);
        setSubBubblePanOffset(0);
      }
    }
  }, [centeredBubble?.id]);

  // Cleanup double tap/click timeouts on unmount
  useEffect(() => {
    return () => {
      if (doubleTapTimeout.current) {
        clearTimeout(doubleTapTimeout.current);
      }
      if (doubleClickTimeout.current) {
        clearTimeout(doubleClickTimeout.current);
      }
    };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsDragging(false);
    
    const touch = e.changedTouches[0];
    const currentTime = Date.now();
    const currentPos: Position = { x: touch.clientX, y: touch.clientY };
    
    // Check for double tap
    if (touchStartPos.current) {
      const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
      const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);
      const maxTapDistance = 30; // Maximum distance for a tap (not a swipe)
      
      // If movement is small, it's a tap
      if (deltaX < maxTapDistance && deltaY < maxTapDistance) {
        const timeSinceLastTap = currentTime - lastTapTime.current;
        const doubleTapTimeWindow = 300; // 300ms window for double tap
        
        // Check if this is a double tap
        if (lastTapPos.current && 
            timeSinceLastTap < doubleTapTimeWindow &&
            Math.abs(currentPos.x - lastTapPos.current.x) < maxTapDistance &&
            Math.abs(currentPos.y - lastTapPos.current.y) < maxTapDistance) {
          // Double tap detected - go to origin bubble
          e.preventDefault();
          e.stopPropagation();
          
          // Clear any pending single tap timeout
          if (doubleTapTimeout.current) {
            clearTimeout(doubleTapTimeout.current);
            doubleTapTimeout.current = null;
          }
          
          // Navigate to origin bubble
          const center = getCenterPoint();
          const originIndex = bubbles.findIndex(b => b.id === originBubble.id);
          if (originIndex >= 0 && bubblePositions[originIndex]) {
            const originPos = bubblePositions[originIndex];
            const targetOffset = {
              x: center.x - originPos.x,
              y: center.y - originPos.y,
            };
            const clampedTarget = clampPanOffset(targetOffset);
            setPanOffset(clampedTarget);
            setVelocity({ x: 0, y: 0 });
            onCenteredBubbleChange(originBubble);
          }
          
          // Reset tap tracking
          lastTapTime.current = 0;
          lastTapPos.current = null;
          
          touchStartPos.current = null;
          swipeDirection.current = null;
          return;
        } else {
          // Single tap - wait to see if it becomes a double tap
          lastTapTime.current = currentTime;
          lastTapPos.current = currentPos;
          
          // Clear any existing timeout
          if (doubleTapTimeout.current) {
            clearTimeout(doubleTapTimeout.current);
          }
          
          // Set timeout to clear if no second tap comes
          doubleTapTimeout.current = setTimeout(() => {
            lastTapTime.current = 0;
            lastTapPos.current = null;
          }, doubleTapTimeWindow);
        }
      }
    }
    
    // Handle swipe completion
    if (touchStartPos.current && swipeDirection.current) {
      const deltaX = touch.clientX - touchStartPos.current.x;
      const deltaY = touch.clientY - touchStartPos.current.y;
      const minSwipeDistance = 50; // Minimum distance for a swipe
      
      // Check if centered bubble has sub-bubbles
      const hasSubBubbles = centeredBubble?.subBubbles && centeredBubble.subBubbles.length > 0;
      
      // More free scrolling - prioritize the stronger direction with lower threshold
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const isPrimarilyVertical = absDeltaY > absDeltaX * 1.2; // Vertical is at least 1.2x stronger
      const isPrimarilyHorizontal = absDeltaX > absDeltaY * 1.2; // Horizontal is at least 1.2x stronger
      
      if (isPrimarilyVertical && absDeltaY > minSwipeDistance) {
        // Vertical swipe - always navigate parent bubbles
        navigateToBubble(deltaY > 0 ? "up" : "down");
      } else if (isPrimarilyHorizontal && absDeltaX > minSwipeDistance && hasSubBubbles) {
        // Horizontal swipe - navigate between sub-bubbles
        // Swipe right (deltaX > 0) should go to previous sub-bubble in LTR (opposite of before)
        // Swipe right (deltaX > 0) should go to next sub-bubble in RTL (opposite)
        // Swipe left (deltaX < 0) should go to next in LTR, previous in RTL
        const swipeDirection = deltaX < 0 ? "left" : "right";
        // In LTR: swipe right = previous (left), swipe left = next (right) - OPPOSITE
        // In RTL: swipe right = next (right), swipe left = previous (left) - OPPOSITE
        const navigationDirection = isRTL ? (swipeDirection === "right" ? "right" : "left") : (swipeDirection === "right" ? "left" : "right");
        
        // Highlight the OPPOSITE arrow - when swiping left, highlight right arrow (where you're going)
        // When swiping right, highlight left arrow (where you're going)
        // This gives visual feedback that you're moving towards that direction
        const highlightDirection = swipeDirection === "left" ? "right" : "left";
        setHighlightedArrow(highlightDirection);
        
        navigateSubBubbles(navigationDirection);
        // Clear highlight after animation
        setTimeout(() => setHighlightedArrow(null), 300);
      }
    }
    
    // Clear velocity immediately on touch end to stop inertia
    setVelocity({ x: 0, y: 0 });
    touchStartPos.current = null;
    swipeDirection.current = null;
    
    // No need to snap - bubbles change directly
  }, [navigateToBubble, navigateSubBubbles, centeredBubble, bubbles, bubblePositions, originBubble, getCenterPoint, clampPanOffset, onCenteredBubbleChange]);

  const handleBubbleClick = (bubble: BubbleType, index: number) => {
    if (bubblePositions[index]) {
      const center = getCenterPoint();
      const targetPos = bubblePositions[index];
      const targetOffset = {
        x: center.x - targetPos.x,
        y: center.y - targetPos.y,
      };
      const clampedTarget = clampPanOffset(targetOffset);
      setPanOffset(clampedTarget);
      setVelocity({ x: 0, y: 0 });
      onCenteredBubbleChange(bubble);
      handleInteraction();
    }
  };

  // Handle mouse wheel scroll (desktop) - navigate between bubbles or sub-bubbles
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!isPointerDevice || panOffset === null || bubblePositions.length === 0) return;
    
    e.preventDefault();
    
    // Check if centered bubble has sub-bubbles
    const hasSubBubbles = centeredBubble?.subBubbles && centeredBubble.subBubbles.length > 0;
    
    // Horizontal scroll for sub-bubbles, vertical scroll for parent bubbles
    if (hasSubBubbles && Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      // Horizontal scroll - navigate sub-bubbles
      const now = Date.now();
      if (now - lastScrollTime.current < 300) return;
      lastScrollTime.current = now;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        // Horizontal scroll - account for RTL (OPPOSITE behavior)
        // Scroll right (deltaX > 0) should go to previous sub-bubble in LTR (opposite)
        // Scroll right (deltaX > 0) should go to next sub-bubble in RTL (opposite)
        const scrollDirection = e.deltaX < 0 ? "left" : "right";
        const navigationDirection = isRTL ? (scrollDirection === "right" ? "right" : "left") : (scrollDirection === "right" ? "left" : "right");
        navigateSubBubbles(navigationDirection);
      }, 50);
    } else {
      // Vertical scroll - navigate parent bubbles
      const now = Date.now();
      if (now - lastScrollTime.current < 300) return;
      lastScrollTime.current = now;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        navigateToBubble(e.deltaY > 0 ? "down" : "up");
      }, 50);
    }
  }, [isPointerDevice, panOffset, bubblePositions.length, navigateToBubble, navigateSubBubbles, centeredBubble]);

  // Handle mouse wheel scroll (desktop only) - navigate between bubbles
  useEffect(() => {
    if (!containerRef.current || !isPointerDevice) return;
    
    const container = containerRef.current;
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleWheel);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [isPointerDevice, handleWheel]);

  return (
    <div
      ref={containerRef}
      className="absolute overflow-hidden cursor-grab active:cursor-grabbing touch-none z-10"
      dir="ltr"
      style={{ 
        touchAction: "none",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        height: "100%",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
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
        const baseScale = isOrigin ? 0.6 : 0.4;
          const maxScale = isOrigin ? 1.6 : 1.4;
        const scale = baseScale + (1 - normalizedDistance) * (maxScale - baseScale);

        const isOriginCentered = centeredBubble?.id === originBubble.id;

        // Check if this is the centered bubble with sub-bubbles
        const isCenteredBubble = distance < 80 && centeredBubble?.id === bubble.id;
        const hasSubBubbles = isCenteredBubble && !!bubble.subBubbles && bubble.subBubbles.length > 0;
        
        // Index 0 = parent bubble, index 1-N = sub-bubbles
        const effectiveSubBubbleIndex = activeSubBubbleIndex;
        
        // Get active sub-bubble (index 0 = parent, index > 0 = sub-bubble)
        const activeSubBubble = hasSubBubbles && effectiveSubBubbleIndex > 0 ? (() => {
          const subIndex = effectiveSubBubbleIndex - 1;
          return bubble.subBubbles![subIndex] || null;
        })() : null;
        
        // Use active sub-bubble content if selected (index > 0), otherwise use parent bubble
        const displayBubble = activeSubBubble || bubble;

        return (
          <Bubble
            key={bubble.id}
            bubble={displayBubble}
            position={{ x: screenX, y: screenY }}
            scale={scale}
            theme={theme}
            uiSize={uiSize}
            isCentered={distance < 80}
            isOrigin={isOrigin}
            isIdle={isIdle}
            isMoving={isMoving}
            isOriginCentered={isOriginCentered}
              onClick={() => {
                // If bubble is already centered and has custom click handler, call it
                if (centeredBubble?.id === bubble.id && onBubbleClick) {
                  // If a sub-bubble is active (index > 0), pass the sub-bubble instead of parent
                  if (hasSubBubbles && effectiveSubBubbleIndex > 0 && activeSubBubble) {
                    onBubbleClick(activeSubBubble);
                  } else {
                    onBubbleClick(bubble);
                  }
                } else {
                  handleBubbleClick(bubble, index);
                }
              }}
            showClock={isOrigin && distance < 80}
            onThemeToggle={onThemeToggle}
            mousePosition={isPointerDevice ? mousePosition : null}
            isRTL={isRTL}
            mode={mode}
            hasSubBubbles={hasSubBubbles}
            subBubbleIndex={hasSubBubbles ? effectiveSubBubbleIndex : 0}
            subBubblesCount={bubble.subBubbles?.length || 0}
            parentBubble={isCenteredBubble ? bubble : undefined}
            subBubbles={isCenteredBubble ? bubble.subBubbles : undefined}
          />
        );
        })}
        
        {/* Render sub-bubbles horizontally around centered parent bubble */}
        {centeredBubble && centeredBubble.subBubbles && centeredBubble.subBubbles.length > 0 && bubblePositions.length > 0 && panOffset !== null && (() => {
          const parentIndex = bubbles.findIndex(b => b.id === centeredBubble.id);
          if (parentIndex < 0 || !bubblePositions[parentIndex]) return null;
          
          const parentPos = bubblePositions[parentIndex];
          const center = getCenterPoint();
          const parentScreenX = parentPos.x + panOffset.x;
          const parentScreenY = parentPos.y + panOffset.y;
          
          // Only render if parent is centered (close to screen center)
          const parentDistance = Math.sqrt(
            Math.pow(parentScreenX - center.x, 2) + Math.pow(parentScreenY - center.y, 2)
          );
          if (parentDistance > 80) return null;
          
          // Calculate horizontal positions for sub-bubbles (position them left and right of center bubble)
          // Use smaller spacing on mobile so arrows are more visible and closer to center
          const subBubbleSpacing = isMobile ? 130 : 220; // 10px further from center on mobile (was 120), further on desktop
          const subBubbleY = center.y; // Same Y level as center bubble (horizontal line)
          const subBubbleSize = 70; // Smaller size for sub-bubbles
          
          const subBubblesArray = centeredBubble.subBubbles!; // Already checked above
          const totalSubBubbles = subBubblesArray.length;
          
          // activeSubBubbleIndex: 0 = parent, 1-N = sub-bubbles (1-based, but 0-based array access)
          const currentIndex = activeSubBubbleIndex;
          
          // Calculate previous and next indices with infinite scroll (including parent at index 0)
          // Previous: if at 0 (parent), show last sub-bubble; if at 1+, show index - 1
          // Next: if at max (last sub-bubble), show 0 (parent); if at 0, show 1; otherwise index + 1
          const getPrevIndex = () => {
            if (currentIndex === 0) {
              // At parent, show last sub-bubble
              return { type: 'sub', index: totalSubBubbles - 1, visualIndex: totalSubBubbles };
            } else {
              // At sub-bubble, show previous (which could be parent at 0 or previous sub-bubble)
              const prev = currentIndex - 1;
              if (prev === 0) {
                return { type: 'parent', index: 0, visualIndex: 0 };
              } else {
                return { type: 'sub', index: prev - 1, visualIndex: prev };
              }
            }
          };
          
          const getNextIndex = () => {
            if (currentIndex === 0) {
              // At parent, show first sub-bubble
              return { type: 'sub', index: 0, visualIndex: 1 };
            } else if (currentIndex === totalSubBubbles) {
              // At last sub-bubble, wrap to parent
              return { type: 'parent', index: 0, visualIndex: 0 };
            } else {
              // Show next sub-bubble
              return { type: 'sub', index: currentIndex, visualIndex: currentIndex + 1 };
            }
          };
          
          const prevBubble = getPrevIndex();
          const nextBubble = getNextIndex();
          
          // Render only 2: previous (left), next (right) - center is the main bubble showing current content
          const bubblesToRender = [
            { bubble: prevBubble.type === 'parent' ? centeredBubble : subBubblesArray[prevBubble.index], position: -1, ...prevBubble }, // Left
            { bubble: nextBubble.type === 'parent' ? centeredBubble : subBubblesArray[nextBubble.index], position: 1, ...nextBubble }, // Right
          ];
          
          return bubblesToRender.map(({ bubble, position, index, visualIndex }) => {
            // Position: -1 (left), 1 (right) - center is the main bubble
            const baseX = position * subBubbleSpacing;
            // Apply horizontal pan offset for smooth scrolling
            const subX = center.x + baseX + subBubblePanOffset;
            
            // Distance from screen center
            const distanceFromCenter = Math.abs(subX - center.x);
            const maxDistance = Math.sqrt(Math.pow(center.x, 2) + Math.pow(center.y, 2));
            const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
            
            // Scale based on distance (closer = larger)
            const baseScale = 0.5;
            const maxScale = 1.0;
            const subScale = baseScale + (1 - normalizedDistance) * (maxScale - baseScale);
            
            // Left/right bubbles are never active (center main bubble shows the active content)
            const isActive = false;
            const isCentered = false;
            
            return (
              <div
                key={`sub-${centeredBubble.id}-${position}-${visualIndex}`}
                className="absolute pointer-events-auto cursor-pointer"
                style={{
                  left: `${subX}px`,
                  top: `${subBubbleY}px`,
                  transform: `translate(-50%, -50%) scale(${subScale})`,
                  width: `${subBubbleSize}px`,
                  height: `${subBubbleSize}px`,
                  opacity: 0.6 + (1 - normalizedDistance) * 0.4,
                  zIndex: isCentered ? 25 : 20,
                  transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease-out, left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate to clicked sub-bubble
                  if (position === -1) {
                    // Clicked left - go to previous
                    navigateSubBubbles("left");
                  } else if (position === 1) {
                    // Clicked right - go to next
                    navigateSubBubbles("right");
                  }
                  // Center is already active, no action needed
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: "transparent", // No background for side bubbles
                    border: "none",
                    boxShadow: "none",
                  }}
                >
                  {/* Show left/right arrows on both mobile and desktop instead of emojis */}
                  <svg
                    width={isMobile ? "40" : "32"}
                    height={isMobile ? "40" : "32"}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{
                      color: theme === "dark" 
                        ? (highlightedArrow === (position === -1 ? "left" : "right") 
                            ? "rgba(255, 255, 255, 0.9)" 
                            : "rgba(255, 255, 255, 0.4)")
                        : (highlightedArrow === (position === -1 ? "left" : "right")
                            ? "rgba(0, 0, 0, 0.9)"
                            : "rgba(0, 0, 0, 0.4)"),
                      transition: "color 0.3s ease-out",
                    }}
                  >
                    {position === -1 ? (
                      // Left arrow
                      <path
                        d="M15 18L9 12L15 6"
                        stroke="currentColor"
                        strokeWidth={isMobile ? "2.5" : "2"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : (
                      // Right arrow
                      <path
                        d="M9 18L15 12L9 6"
                        stroke="currentColor"
                        strokeWidth={isMobile ? "2.5" : "2"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}
                  </svg>
                </div>
              </div>
            );
          });
        })()}
        
    </div>
  );
}

// Generate vertical line positions - bubbles in a single vertical column
function generateVerticalLinePositions(
  count: number,
  bubbles: BubbleType[],
  originIndex: number,
  width: number = 1920,
  height: number = 1080
): Position[] {
  const positions: Position[] = [];
  const centerX = width / 2;
  const spacing = height * 0.25; // Space between bubbles (25% of viewport height - reduced from 40%)
  
  // Generate positions in a vertical line, centered horizontally
  for (let i = 0; i < count; i++) {
    // Calculate Y position - start from top, space evenly
    // Origin bubble starts at center (0 in field space)
    const yOffset = (i - originIndex) * spacing;
    positions.push({
      x: centerX,
      y: yOffset,
    });
  }
  
  return positions;
}
