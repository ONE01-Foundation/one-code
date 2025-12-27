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
  onOpenSettings?: () => void;
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
  onCenteredBubbleChange,
  originBubble,
  targetBubble,
  onThemeToggle,
  onOpenSettings,
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
      
      // Center the origin bubble via panOffset (SINGLE source of truth for centering)
      // Use double requestAnimationFrame to ensure layout is complete (Safari/Edge fix)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!containerRef.current) return;
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
          }, 50);
        }
        });
      });
      }
  }, [bubbles, originIndex, originBubble, onCenteredBubbleChange, enforceMinimumDistance, getCenterPoint]);

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
  useEffect(() => {
    if (panOffset === null) return;
    const closest = findClosestBubble();
    onCenteredBubbleChange(closest);
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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (panOffset === null) return;
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

  const handleMouseUp = () => {
    setIsDragging(false);
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
      const threshold = 10; // Minimum movement to detect direction
      
      if (deltaX > threshold || deltaY > threshold) {
        swipeDirection.current = deltaY > deltaX ? "vertical" : "horizontal";
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
  // Index 0 = parent, index 1-5 = sub-bubbles
  const navigateSubBubbles = useCallback((direction: "left" | "right") => {
    if (!centeredBubble || !centeredBubble.subBubbles || centeredBubble.subBubbles.length === 0) {
      return;
    }
    
    const subBubbleSpacing = 120;
    const maxIndex = centeredBubble.subBubbles.length; // 0 (parent) to N (last sub-bubble)
    
    setActiveSubBubbleIndex((currentIndex) => {
      let targetIndex: number;
      if (direction === "right") {
        // Swipe right = move to next (index + 1, wrap around to 0 after max)
        targetIndex = currentIndex < maxIndex ? currentIndex + 1 : 0;
      } else {
        // Swipe left = move to previous (index - 1, wrap around to max after 0)
        targetIndex = currentIndex > 0 ? currentIndex - 1 : maxIndex;
      }
      
      // Calculate target offset - if index 0 (parent), offset is 0
      // For sub-bubbles (index 1+), center them at screen center
      if (targetIndex === 0) {
        setSubBubblePanOffset(0);
      } else if (centeredBubble.subBubbles) {
        // Convert to 0-based sub-bubble index
        const subIndex = targetIndex - 1;
        const baseX = (subIndex * subBubbleSpacing) - ((centeredBubble.subBubbles.length - 1) * subBubbleSpacing / 2);
        const targetOffset = -baseX; // Negative to move the bubble to center
        setSubBubblePanOffset(targetOffset);
      }
      
      return targetIndex;
    });
  }, [centeredBubble]);

  // Reset sub-bubble index and pan offset when centered bubble changes
  useEffect(() => {
    setActiveSubBubbleIndex(0);
    setSubBubblePanOffset(0);
  }, [centeredBubble?.id]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsDragging(false);
    
    // Handle swipe completion
    if (touchStartPos.current && swipeDirection.current) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartPos.current.x;
      const deltaY = touch.clientY - touchStartPos.current.y;
      const minSwipeDistance = 50; // Minimum distance for a swipe
      
      // Check if centered bubble has sub-bubbles
      const hasSubBubbles = centeredBubble?.subBubbles && centeredBubble.subBubbles.length > 0;
      
      if (swipeDirection.current === "vertical" && Math.abs(deltaY) > minSwipeDistance) {
        // Only navigate vertical if not in sub-bubble mode (or if parent doesn't have sub-bubbles)
        if (!hasSubBubbles) {
          // Vertical swipe - swipe UP moves to next bubble (2, 3, 4...), swipe DOWN moves to previous bubble
          navigateToBubble(deltaY > 0 ? "up" : "down");
        }
      } else if (swipeDirection.current === "horizontal" && Math.abs(deltaX) > minSwipeDistance && hasSubBubbles) {
        // Horizontal swipe - navigate between sub-bubbles (swipe right = next, swipe left = previous)
        navigateSubBubbles(deltaX > 0 ? "right" : "left");
      } else if (swipeDirection.current === "vertical" && hasSubBubbles) {
        // If parent has sub-bubbles, vertical swipe can still navigate to next parent bubble
        navigateToBubble(deltaY > 0 ? "up" : "down");
      }
    }
    
    // Clear velocity immediately on touch end to stop inertia
    setVelocity({ x: 0, y: 0 });
    touchStartPos.current = null;
    swipeDirection.current = null;
    
    // No need to snap - bubbles change directly
  }, [navigateToBubble, navigateSubBubbles, centeredBubble]);

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
        navigateSubBubbles(e.deltaX > 0 ? "right" : "left");
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
        // Get active sub-bubble (index 0 = parent, index > 0 = sub-bubble)
        const activeSubBubble = hasSubBubbles && activeSubBubbleIndex > 0 ? getActiveSubBubble() : null;
        // Use active sub-bubble content if selected (index > 0), otherwise use parent bubble
        const displayBubble = activeSubBubble || bubble;

        return (
          <Bubble
            key={bubble.id}
            bubble={displayBubble}
            position={{ x: screenX, y: screenY }}
            scale={scale}
            theme={theme}
            isCentered={distance < 80}
            isOrigin={isOrigin}
            isIdle={isIdle}
            isMoving={isMoving}
            isOriginCentered={isOriginCentered}
              onClick={() => {
                // If bubble is already centered and has custom click handler, call it
                if (centeredBubble?.id === bubble.id && onBubbleClick) {
                  onBubbleClick(bubble);
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
            subBubbleIndex={activeSubBubbleIndex}
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
          
          // Calculate horizontal positions for sub-bubbles (similar to vertical layout)
          const subBubbleSpacing = 120; // Space between sub-bubbles
          const subBubbleY = center.y; // Same Y as center (horizontal line)
          const subBubbleSize = 80; // Smaller size for sub-bubbles
          
          const subBubblesArray = centeredBubble.subBubbles!; // Already checked above
          // Render sub-bubbles (index 1-5 in activeSubBubbleIndex corresponds to sub-bubbles 0-4)
          return subBubblesArray.map((subBubble, subIndex) => {
            // Calculate base X position (like vertical Y positions)
            // Position sub-bubbles starting from index 1 (subIndex 0 maps to activeSubBubbleIndex 1)
            const visualIndex = subIndex + 1; // Visual index: 1, 2, 3, 4, 5
            const baseX = (subIndex * subBubbleSpacing) - ((subBubblesArray.length - 1) * subBubbleSpacing / 2);
            // Apply horizontal pan offset
            const subX = center.x + baseX + subBubblePanOffset;
            
            // Distance from screen center
            const distanceFromCenter = Math.abs(subX - center.x);
            const maxDistance = Math.sqrt(Math.pow(center.x, 2) + Math.pow(center.y, 2));
            const normalizedDistance = Math.min(distanceFromCenter / maxDistance, 1);
            
            // Scale based on distance (closer = larger, like vertical bubbles)
            const baseScale = 0.5;
            const maxScale = 1.0;
            const subScale = baseScale + (1 - normalizedDistance) * (maxScale - baseScale);
            
            // Determine if this sub-bubble is active (visualIndex matches activeSubBubbleIndex)
            const isActive = visualIndex === activeSubBubbleIndex;
            const isCentered = distanceFromCenter < 80;
            
            return (
              <div
                key={`sub-${centeredBubble.id}-${subIndex}`}
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
                  // Set active index (visualIndex 1-5)
                  const targetOffset = -baseX;
                  setSubBubblePanOffset(targetOffset);
                  setActiveSubBubbleIndex(visualIndex);
                }}
              >
                <div
                  className="w-full h-full rounded-full flex items-center justify-center transition-all duration-300"
                  style={{
                    background: theme === "dark" 
                      ? (isActive ? "rgba(255, 255, 255, 0.2)" : "rgba(255, 255, 255, 0.1)")
                      : (isActive ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.1)"),
                    border: isActive 
                      ? (theme === "dark" ? "2px solid rgba(255, 255, 255, 0.5)" : "2px solid rgba(0, 0, 0, 0.5)")
                      : "1px solid transparent",
                    boxShadow: isActive 
                      ? (theme === "dark" ? "0 0 20px rgba(255, 255, 255, 0.3)" : "0 0 20px rgba(0, 0, 0, 0.3)")
                      : "none",
                  }}
                >
                  <span className="text-3xl">{subBubble.icon}</span>
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
