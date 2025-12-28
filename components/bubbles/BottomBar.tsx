"use client";

import { useState, useEffect, useRef } from "react";

interface BottomBarProps {
  theme: "light" | "dark";
  onBackToHome: () => void;
  onOpenDashboard?: () => void;
  isRTL: boolean;
  showActionButton?: boolean;
  isTransitioning?: boolean;
}

// Check if running as PWA (standalone mode)
const useIsPWA = () => {
  const [isPWA, setIsPWA] = useState(false);
  
  useEffect(() => {
    setIsPWA(window.matchMedia("(display-mode: standalone)").matches);
  }, []);
  
  return isPWA;
};

export default function BottomBar({
  theme,
  onBackToHome,
  onOpenDashboard,
  isRTL,
  showActionButton = false,
  isTransitioning = false,
}: BottomBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(false);
  const isPWA = useIsPWA();

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update year on mount and when year changes
  useEffect(() => {
    const updateYear = () => {
      setCurrentYear(new Date().getFullYear());
    };
    
    updateYear();
    // Update every hour to catch year changes (e.g., at midnight on New Year's)
    const interval = setInterval(updateYear, 3600000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showActionButton) {
      setIsExpanded(false);
      return;
    }

    // Start as icon-only for "Back to Home"
    setIsExpanded(false);
    
    const timer = setTimeout(() => {
      if (!isHovered && !isPressed) {
        setIsExpanded(false);
      }
    }, 2000);

    timeoutRef.current = timer;

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isHovered, isPressed, showActionButton]);

  const handleMouseEnter = () => {
    setIsHovered(true);
    setIsExpanded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    const timer = setTimeout(() => {
      if (!isPressed) {
        setIsExpanded(false);
      }
    }, 2000) as NodeJS.Timeout;
    timeoutRef.current = timer;
  };

  const handleTouchStart = () => {
    setIsPressed(true);
    setIsExpanded(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleTouchEnd = () => {
    setIsPressed(false);
    const timer = setTimeout(() => {
      setIsExpanded(false);
    }, 2000) as NodeJS.Timeout;
    timeoutRef.current = timer;
  };

  const safeAreaBottom = isPWA ? "env(safe-area-inset-bottom, 0px)" : "calc(env(safe-area-inset-bottom, 0px) + 40px)";
  
  return (
    <>
      {/* Background layer for safe area - transparent to show through */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none"
        style={{
          height: safeAreaBottom,
          backgroundColor: "transparent",
        }}
      />
      {/* Main bottom bar with gradient */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 pointer-events-none
          transition-all duration-300 ${
            isTransitioning ? "opacity-0 translate-y-full" : "opacity-100 translate-y-0"
          }`}
        style={{
          height: isPWA ? "160px" : "200px", // Taller when not PWA to account for browser UI
          paddingBottom: safeAreaBottom, // Extra padding when not PWA
          background: theme === "dark"
            ? "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.85) 30%, rgba(0,0,0,0.5) 60%, transparent 100%)"
            : "radial-gradient(ellipse 100% 60% at 50% 100%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.5) 60%, transparent 100%)",
        }}
      >
      {/* Back to home button hidden */}
      
      {/* Footer with copyright - positioned 10px above the end of footer container (12px on mobile) */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-auto"
        style={{
          bottom: isMobile ? "12px" : "10px", // 2px higher on mobile, 10px on desktop
          paddingBottom: "0.5rem",
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onOpenDashboard) {
              onOpenDashboard();
            }
          }}
          className={`text-xs font-normal transition-opacity duration-200 hover:opacity-100 cursor-pointer bg-transparent border-none p-0 ${
            theme === "dark" ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"
          }`}
        >
          {isRTL ? "1" : "1"}
        </button>
      </div>
    </div>
    </>
  );
}
