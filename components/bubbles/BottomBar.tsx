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
        className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none"
        style={{
          height: safeAreaBottom,
          backgroundColor: "transparent",
        }}
      />
      {/* Main bottom bar with gradient */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 pointer-events-none
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
      {showActionButton && (
        <div
          className={`absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center justify-center
            ${isRTL ? "flex-row-reverse" : ""}
          `}
          style={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 3rem)",
          }}
        >
          <button
            onClick={onBackToHome}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`
              flex items-center justify-center gap-2
              transition-all duration-300 pointer-events-auto
              ${
                theme === "dark"
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-black/20 hover:bg-black/30 text-black"
              }
              backdrop-blur-sm active:scale-95
              ${isExpanded 
                ? "px-4 py-2 rounded-xl h-10" 
                : "w-10 h-10 rounded-full"
              }
            `}
            aria-label="Back to Home"
            title="Back to Home"
          >
            {isExpanded && (
              <span className="text-sm font-medium transition-all duration-300">
                Home
              </span>
            )}
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 46 46" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M36.5664 15.9252L27.9488 8.80004C25.0459 6.39999 20.9541 6.39999 18.0512 8.80004L9.43355 15.9252C7.88094 17.2089 7 19.1553 7 21.1861V32.2974C7 35.9056 9.77464 39 13.4 39H16.6C18.3673 39 19.8 37.5674 19.8 35.8V30.5965C19.8 28.5685 21.3234 27.0939 23 27.0939C24.6766 27.0939 26.2 28.5685 26.2 30.5965V35.8C26.2 37.5674 27.6326 39 29.4 39H32.6C36.2254 39 39 35.9056 39 32.2974V21.1861C39 19.1553 38.119 17.2089 36.5664 15.9252Z" 
                fill={theme === "dark" ? "white" : "black"}
              />
            </svg>
          </button>
        </div>
      )}
      
      {/* Footer with copyright - positioned lower on mobile, higher on desktop */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-auto"
        style={{
          // Position above safe area - account for parent paddingBottom
          bottom: isMobile 
            ? `calc(${safeAreaBottom} + 4px)`
            : `calc(${safeAreaBottom} + 10px)`,
          paddingBottom: isMobile ? "0" : "0.5rem",
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            if (onOpenDashboard) {
              onOpenDashboard();
            }
          }}
          className={`text-xs font-normal transition-opacity duration-200 hover:opacity-100 cursor-pointer bg-transparent border-none ${
            theme === "dark" ? "text-white/40 hover:text-white/60" : "text-black/40 hover:text-black/60"
          }`}
          style={{
            // Larger clickable area but not visible - padding increases touch target
            padding: isMobile ? "20px" : "8px", // Bigger padding on mobile for easier tapping
            margin: "-20px", // Negative margin to keep visual size the same
          }}
        >
          {isRTL ? "1" : "1"}
        </button>
      </div>
    </div>
    </>
  );
}
