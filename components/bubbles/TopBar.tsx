"use client";

import { useState, useEffect, useRef } from "react";

interface TopBarProps {
  theme: "light" | "dark";
  aiText: string | null;
  isRTL: boolean;
  isTransitioning?: boolean;
  onTap?: () => void; // Handler for tap to open chat
}

export default function TopBar({ theme, aiText, isRTL, isTransitioning = false, onTap }: TopBarProps) {
  const [displayWords, setDisplayWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const wordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (aiText) {
      const words = aiText.split(" ").filter(word => word.trim().length > 0);
      setDisplayWords(words);
      setCurrentWordIndex(0);
      setIsVisible(true);
      setOpacity(1);
      
      // Clear any existing timeouts
      if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      
      let currentIndex = 0;
      let isAnimating = true;
      
      // Start word-by-word animation
      const animateWords = () => {
        if (!isAnimating) return;
        
        if (currentIndex < words.length - 1) {
          // Show next word
          currentIndex++;
          setCurrentWordIndex(currentIndex);
          wordTimeoutRef.current = setTimeout(animateWords, 150) as NodeJS.Timeout;
        } else {
          // All words shown, fade out after a delay
          fadeTimeoutRef.current = setTimeout(() => {
            setOpacity(0.3);
            // After fade, restart from beginning
            setTimeout(() => {
              if (isAnimating && aiText) { // Only restart if still valid
                currentIndex = 0;
                setCurrentWordIndex(0);
                setOpacity(1);
                animateWords();
              }
            }, 500);
          }, 2000) as NodeJS.Timeout;
        }
      };
      
      // Start animation
      wordTimeoutRef.current = setTimeout(animateWords, 150) as NodeJS.Timeout;
      
      return () => {
        isAnimating = false;
        if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      };
    } else {
      setIsVisible(false);
      setDisplayWords([]);
      setCurrentWordIndex(0);
      setOpacity(1);
    }
  }, [aiText]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-30 pointer-events-none
        transition-all duration-300 ${
          isTransitioning ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
        }`}
      style={{
        height: aiText ? "35vh" : "25vh", // Expand more when aiText is visible
        minHeight: aiText ? "280px" : "200px",
        paddingTop: "env(safe-area-inset-top, 0px)",
        background: theme === "dark"
          ? aiText
            ? "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 30%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 70%, transparent 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.3) 70%, transparent 100%)"
          : aiText
            ? "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.8) 30%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 70%, transparent 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.3) 70%, transparent 100%)",
      }}
    >
      <div
        className="absolute inset-0 flex items-start justify-center w-full px-8"
        style={{
          transition: "opacity 0.6s ease-out",
          opacity: isVisible ? opacity : 0,
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 4rem + 15px)",
        }}
      >
        <div
          className="pointer-events-auto cursor-pointer w-full"
          onClick={onTap}
          style={{ pointerEvents: isVisible && onTap ? "auto" : "none" }}
        >
        {displayWords.length > 0 && (
          <p
            className={`text-base md:text-lg lg:text-xl font-normal ${
              theme === "dark" ? "text-white/60" : "text-black/60"
            }`}
            style={{
              lineHeight: "1.5",
              textAlign: "center",
              maxHeight: "3em", // Max 2 rows (1.5 * 2)
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {displayWords.slice(0, currentWordIndex + 1).map((word, index) => {
              const isFirst = index === 0;
              const isLast = index === currentWordIndex;
              return (
                <span key={index} style={{ fontWeight: (isFirst || isLast) ? 600 : 400 }}>
                  {word}
                  {index < currentWordIndex && " "}
                </span>
              );
            })}
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
