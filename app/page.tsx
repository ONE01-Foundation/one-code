"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import TopBar from "@/components/bubbles/TopBar";
import BottomBar from "@/components/bubbles/BottomBar";
import BubbleField from "@/components/bubbles/BubbleField";
import InputBar from "@/components/bubbles/InputBar";
import CenterOrnament from "@/components/CenterOrnament";

export type Bubble = {
  id: string;
  title: string;
  icon: string;
  value: number;
  actionType: "open" | "view" | "edit" | "play" | "share";
  aiText: string;
};

const MOCK_BUBBLES: Bubble[] = Array.from({ length: 30 }, (_, i) => ({
  id: `bubble-${i}`,
  title: `Item ${i + 1}`,
  icon: ["📱", "💡", "🎯", "🚀", "⭐", "🎨", "📝", "🔔", "💬", "🎵"][i % 10],
  value: Math.floor(Math.random() * 100),
  actionType: ["open", "view", "edit", "play", "share"][i % 5] as Bubble["actionType"],
  aiText: `Selected: Bubble ${i + 1}`,
}));

// Auto theme by time - interpolate between light and dark
function getAutoTheme(): "light" | "dark" {
  const hour = new Date().getHours();
  // 6 AM - 6 PM: light, 6 PM - 6 AM: dark
  // Smooth transition around 6 AM and 6 PM
  if (hour >= 6 && hour < 18) {
    return "light";
  }
  return "dark";
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">(getAutoTheme());
  const [autoTheme, setAutoTheme] = useState(true);
  const [bubbles] = useState<Bubble[]>(MOCK_BUBBLES);
  const [centeredBubble, setCenteredBubble] = useState<Bubble | null>(bubbles[0]);
  const [targetBubble, setTargetBubble] = useState<Bubble | null>(null);
  const [lang, setLang] = useState<"en" | "he">("en");
  const [isRTL, setIsRTL] = useState(false);
  const [isThemeTransitioning, setIsThemeTransitioning] = useState(false);

  // First bubble is the origin/home bubble
  const originBubble = bubbles[0];
  const isOriginBubbleCentered = centeredBubble?.id === originBubble.id;

  // Auto theme by time
  useEffect(() => {
    if (!autoTheme) return;

    const updateTheme = () => {
      const newTheme = getAutoTheme();
      setTheme(newTheme);
      
      // Update theme-color meta tag
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute("content", newTheme === "dark" ? "#000000" : "#FFFFFF");
      }
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoTheme]);

  // Detect browser language
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const isHebrew = browserLang.startsWith("he");
    setLang(isHebrew ? "he" : "en");
    setIsRTL(isHebrew);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setAutoTheme(false); // Disable auto theme when manually toggled
    
    // Animate bars out
    setIsThemeTransitioning(true);
    
    setTimeout(() => {
      setTheme((prev) => {
        const newTheme = prev === "light" ? "dark" : "light";
        // Update theme-color meta tag
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) {
          meta.setAttribute("content", newTheme === "dark" ? "#000000" : "#FFFFFF");
        }
        return newTheme;
      });
      
      // Animate bars back in
      setTimeout(() => {
        setIsThemeTransitioning(false);
      }, 50);
    }, 300);
  }, []);

  const handleCenteredBubbleChange = useCallback((bubble: Bubble | null) => {
    setCenteredBubble(bubble);
    // Clear target bubble after centering is complete
    if (targetBubble && bubble?.id === targetBubble.id) {
      setTargetBubble(null);
    }
  }, [targetBubble]);

  const handleBackToHome = useCallback(() => {
    // Trigger smooth centering of origin bubble
    setTargetBubble(originBubble);
  }, [originBubble]);

  // Update theme-color on mount and theme change
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "dark" ? "#000000" : "#FFFFFF");
    }
  }, [theme]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        width: "100vw",
        minHeight: "100vh",
        height: "100dvh",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
        backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF",
        transition: "background-color 0.3s ease",
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Layer 1: Fixed centered ornament background */}
      <CenterOrnament theme={theme} />

      {/* Layer 2: Bubble grid (draggable) */}
      <BubbleField
        bubbles={bubbles}
        theme={theme}
        onCenteredBubbleChange={handleCenteredBubbleChange}
        originBubble={originBubble}
        targetBubble={targetBubble}
        onThemeToggle={handleThemeToggle}
        centeredBubble={centeredBubble}
      />

      {/* Layer 3: Top overlay bar - always present */}
      <TopBar
        theme={theme}
        aiText={centeredBubble?.aiText || null}
        isRTL={isRTL}
        isTransitioning={isThemeTransitioning}
      />

      {/* Layer 4: Bottom overlay - always present, action button only when needed */}
      <BottomBar
        theme={theme}
        onBackToHome={handleBackToHome}
        isRTL={isRTL}
        showActionButton={!isOriginBubbleCentered && centeredBubble !== null}
        isTransitioning={isThemeTransitioning}
      />

      <InputBar
        theme={theme}
        isRTL={isRTL}
      />
    </div>
  );
}
