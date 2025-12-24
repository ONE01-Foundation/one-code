"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import TopBar from "@/components/bubbles/TopBar";
import BottomBar from "@/components/bubbles/BottomBar";
import BubbleField from "@/components/bubbles/BubbleField";

export type Bubble = {
  id: string;
  title: string;
  icon: string;
  value: number;
  actionType: "open" | "view" | "edit" | "play" | "share";
  aiText: string;
};

export type BubbleShape = "circle" | "rounded-square";
export type BubbleFill = "gradient" | "solid";

const MOCK_BUBBLES: Bubble[] = Array.from({ length: 30 }, (_, i) => ({
  id: `bubble-${i}`,
  title: `Item ${i + 1}`,
  icon: ["📱", "💡", "🎯", "🚀", "⭐", "🎨", "📝", "🔔", "💬", "🎵"][i % 10],
  value: Math.floor(Math.random() * 100),
  actionType: ["open", "view", "edit", "play", "share"][i % 5] as Bubble["actionType"],
  aiText: `This is ${["a task", "an idea", "a goal", "a note", "a reminder"][i % 5]} about Item ${i + 1}`,
}));

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [bubbles] = useState<Bubble[]>(MOCK_BUBBLES);
  // Initialize with home bubble centered
  const [centeredBubble, setCenteredBubble] = useState<Bubble | null>(bubbles[0]);
  const [targetBubble, setTargetBubble] = useState<Bubble | null>(null);
  const [bubbleShape, setBubbleShape] = useState<BubbleShape>("circle");
  const [bubbleFill, setBubbleFill] = useState<BubbleFill>("gradient");
  const [lang, setLang] = useState<"en" | "he">("en");
  const [isRTL, setIsRTL] = useState(false);

  // First bubble is the home bubble
  const homeBubble = bubbles[0];
  const isHomeBubbleCentered = centeredBubble?.id === homeBubble.id;

  // Detect browser language
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const isHebrew = browserLang.startsWith("he");
    setLang(isHebrew ? "he" : "en");
    setIsRTL(isHebrew);
  }, []);

  const handleThemeToggle = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleCenteredBubbleChange = useCallback((bubble: Bubble | null) => {
    setCenteredBubble(bubble);
    // Clear target bubble after centering is complete
    if (targetBubble && bubble?.id === targetBubble.id) {
      setTargetBubble(null);
    }
  }, [targetBubble]);

  const handleBackToHome = useCallback(() => {
    // Trigger smooth centering of home bubble
    setTargetBubble(homeBubble);
  }, [homeBubble]);

  return (
    <div
      className={`fixed inset-0 overflow-hidden transition-colors duration-300 ${
        theme === "dark" ? "bg-black" : "bg-white"
      }`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <TopBar
        theme={theme}
        aiText={centeredBubble?.aiText || null}
        isRTL={isRTL}
      />
      
      <BubbleField
        bubbles={bubbles}
        theme={theme}
        bubbleShape={bubbleShape}
        bubbleFill={bubbleFill}
        onCenteredBubbleChange={handleCenteredBubbleChange}
        homeBubble={homeBubble}
        targetBubble={targetBubble}
        onThemeToggle={handleThemeToggle}
      />


      {!isHomeBubbleCentered && centeredBubble && (
        <BottomBar
          theme={theme}
          onBackToHome={handleBackToHome}
          isRTL={isRTL}
        />
      )}
    </div>
  );
}
