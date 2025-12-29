"use client";

import { useState, useEffect, useRef } from "react";

interface TopBarProps {
  theme: "light" | "dark";
  uiSize?: "normal" | "large";
  aiText: string | null;
  isRTL: boolean;
  isTransitioning?: boolean;
  onTap?: () => void; // Handler for tap to open chat
}

export default function TopBar({ theme, uiSize = "normal", aiText, isRTL, isTransitioning = false, onTap }: TopBarProps) {
  const sizeMultiplier = uiSize === "large" ? 1.25 : 1.0;
  const [displayWords, setDisplayWords] = useState<string[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [opacity, setOpacity] = useState(1);
  const [scrollOffset, setScrollOffset] = useState(0); // For scrolling text effect when > 2 rows
  const wordTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (aiText) {
      const words = aiText.split(" ").filter(word => word.trim().length > 0);
      setDisplayWords(words);
      setCurrentWordIndex(0);
      setScrollOffset(0);
      setIsVisible(true);
      setOpacity(1);
      
      // Clear any existing timeouts
      if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      
      let currentIndex = 0;
      let isAnimating = true;
      
      // Calculate if text exceeds 2 rows (approx 50-60 characters per row = ~100-120 chars)
      const maxCharsFor2Rows = 120;
      const fullText = words.join(" ");
      const exceeds2Rows = fullText.length > maxCharsFor2Rows;
      
      // Start word-by-word animation
      const animateWords = () => {
        if (!isAnimating) return;
        
        if (currentIndex < words.length - 1) {
          // Show next word
          currentIndex++;
          setCurrentWordIndex(currentIndex);
          wordTimeoutRef.current = setTimeout(animateWords, 150) as NodeJS.Timeout;
        } else {
          // All words shown
          if (exceeds2Rows) {
            // If text exceeds 2 rows, start scrolling effect to show remaining text
            const wordsPer2Rows = Math.floor((maxCharsFor2Rows / fullText.length) * words.length);
            let scrollIndex = wordsPer2Rows;
            
            const scrollText = () => {
              if (!isAnimating || scrollIndex >= words.length) {
                // Finished scrolling, fade and hide
                fadeTimeoutRef.current = setTimeout(() => {
                  setOpacity(0.3);
                  setTimeout(() => {
                    setIsVisible(false);
                    setDisplayWords([]);
                    setCurrentWordIndex(0);
                    setScrollOffset(0);
                    setOpacity(1);
                  }, 1000);
                  isAnimating = false;
                }, 2000) as NodeJS.Timeout;
                return;
              }
              
              // Scroll to show next portion of text
              setScrollOffset(scrollIndex);
              scrollIndex += Math.max(1, Math.floor(wordsPer2Rows / 3)); // Scroll by ~1/3 of visible words
              
              scrollTimeoutRef.current = setTimeout(scrollText, 2000) as NodeJS.Timeout; // Show each portion for 2 seconds
            };
            
            // Start scrolling after showing first portion
            scrollTimeoutRef.current = setTimeout(scrollText, 3000) as NodeJS.Timeout;
          } else {
            // Text fits in 2 rows, just fade and hide
            fadeTimeoutRef.current = setTimeout(() => {
              setOpacity(0.3);
              setTimeout(() => {
                setIsVisible(false);
                setDisplayWords([]);
                setCurrentWordIndex(0);
                setScrollOffset(0);
                setOpacity(1);
              }, 1000);
              isAnimating = false;
            }, 3000) as NodeJS.Timeout;
          }
        }
      };
      
      // Start animation
      wordTimeoutRef.current = setTimeout(animateWords, 150) as NodeJS.Timeout;
      
      return () => {
        isAnimating = false;
        if (wordTimeoutRef.current) clearTimeout(wordTimeoutRef.current);
        if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
        if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      };
    } else {
      setIsVisible(false);
      setDisplayWords([]);
      setCurrentWordIndex(0);
      setScrollOffset(0);
      setOpacity(1);
    }
  }, [aiText]);

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-30 pointer-events-auto cursor-pointer
        transition-all duration-300 ${
          isTransitioning ? "opacity-0 -translate-y-full" : "opacity-100 translate-y-0"
        }`}
      onClick={onTap}
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
        className="absolute inset-0 flex items-start justify-center w-full px-8 pointer-events-none"
        style={{
          transition: "opacity 0.6s ease-out",
          opacity: isVisible ? opacity : 0,
          paddingTop: "calc(env(safe-area-inset-top, 0px) + 4rem + 15px)",
        }}
      >
        <div className="w-full pointer-events-none">
        {displayWords.length > 0 && (
          <p
            className={`font-normal ${
              theme === "dark" ? "text-white/60" : "text-black/60"
            }`}
            style={{
              lineHeight: "1.5",
              textAlign: "center",
              maxHeight: `${3 * sizeMultiplier}em`, // Max 2 rows (1.5 * 2)
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              fontSize: `${1.125 * sizeMultiplier}rem`, // Base size with multiplier (between text-base and text-lg)
            }}
          >
            {(() => {
              // Show words based on scroll offset and current word index
              const startIndex = scrollOffset > 0 ? scrollOffset : 0;
              const endIndex = scrollOffset > 0 
                ? Math.min(startIndex + Math.floor(120 / 8), displayWords.length) // Show ~15 words (approx 2 rows)
                : currentWordIndex + 1;
              const visibleWords = displayWords.slice(startIndex, endIndex);
              
              return visibleWords.map((word, index) => {
                const absoluteIndex = startIndex + index;
                const isFirst = index === 0;
                const isLast = index === visibleWords.length - 1;
                return (
                  <span key={`${absoluteIndex}-${word}`} style={{ fontWeight: (isFirst || isLast) ? 600 : 400 }}>
                    {word}
                    {index < visibleWords.length - 1 && " "}
                  </span>
                );
              });
            })()}
          </p>
        )}
        </div>
      </div>
    </div>
  );
}
