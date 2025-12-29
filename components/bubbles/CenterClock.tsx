"use client";

import { useState, useEffect, useRef } from "react";
import type { Profile } from "@/app/page";

interface CenterClockProps {
  theme: "light" | "dark";
  onToggle?: () => void; // Made optional since we're removing the click handler
  isRTL?: boolean;
  uiSize?: "normal" | "large";
  activeProfile?: Profile | null;
  profiles?: Profile[];
  onProfileChange?: (index: number) => void; // Handler to change profile on tap
  activeProfileIndex?: number; // Current active profile index
}

const HEBREW_DAYS = ["ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "שבת"];

const AI_TEXT_PLACEHOLDERS_EN = [
  "What matters",
  "Where are you",
  "What's next",
  "How do you feel",
  "What do you need",
  "Where do you want to go",
];

const AI_TEXT_PLACEHOLDERS_HE = [
  "מה חשוב",
  "איפה אתה",
  "מה הלאה",
  "איך אתה מרגיש",
  "מה אתה צריך",
  "לאן אתה רוצה ללכת",
];

export default function CenterClock({ theme, onToggle, isRTL = false, uiSize = "normal", activeProfile = null, profiles = [], onProfileChange, activeProfileIndex = 0 }: CenterClockProps) {
  const AI_TEXT_PLACEHOLDERS = isRTL ? AI_TEXT_PLACEHOLDERS_HE : AI_TEXT_PLACEHOLDERS_EN;
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");
  const [aiTextIndex, setAiTextIndex] = useState(0);
  const sizeMultiplier = uiSize === "large" ? 1.25 : 1.0;
  
  // Use profile AI text if available, otherwise use placeholder cycling
  const displayAiText = activeProfile 
    ? (isRTL && activeProfile.aiTextRTL ? activeProfile.aiTextRTL : activeProfile.aiText)
    : AI_TEXT_PLACEHOLDERS[aiTextIndex];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
      
      // Format date - remove year, use full Hebrew day names when RTL
      const day = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      if (isRTL) {
        const weekdayIndex = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const weekday = HEBREW_DAYS[weekdayIndex];
        setDate(`${weekday}, ${day}.${month}`);
      } else {
        const weekday = now.toLocaleDateString("en-US", { weekday: "long" });
        setDate(`${weekday}, ${day}.${month}`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [isRTL]);

  // Cycle through AI text placeholders every few seconds (only if no active profile)
  useEffect(() => {
    if (activeProfile) return; // Don't cycle if profile is active
    
    const interval = setInterval(() => {
      setAiTextIndex((prev) => (prev + 1) % AI_TEXT_PLACEHOLDERS.length);
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, [activeProfile]);


  return (
    <div
      className="bg-transparent border-none outline-none p-0 select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
    >
      <div className="flex flex-col items-center" style={{ userSelect: "none", WebkitUserSelect: "none" }}>
        {/* Profile avatar in circle - above AI text */}
        {activeProfile && (
          <div
            className="flex items-center justify-center mb-3 cursor-pointer"
            onClick={() => {
              if (onProfileChange && profiles.length > 0) {
                const newIndex = (activeProfileIndex + 1) % profiles.length;
                onProfileChange(newIndex);
              }
            }}
            style={{
              width: `${56 * sizeMultiplier}px`,
              height: `${56 * sizeMultiplier}px`,
              borderRadius: "50%",
              backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF",
              transition: "opacity 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.8";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            {activeProfile.id === "default" ? (
              <img
                src="/user-icon.svg"
                alt="User"
                width={32 * sizeMultiplier}
                height={32 * sizeMultiplier}
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  pointerEvents: "none",
                  filter: theme === "dark" ? "brightness(0) invert(1)" : "none",
                }}
              />
            ) : (
              <img
                src="/Create-icon.svg"
                alt="Create Profile"
                width={32 * sizeMultiplier}
                height={32 * sizeMultiplier}
                style={{
                  userSelect: "none",
                  WebkitUserSelect: "none",
                  pointerEvents: "none",
                  filter: theme === "dark" ? "brightness(0) invert(1)" : "none",
                }}
              />
            )}
          </div>
        )}
        
        {/* AI text placeholder with low opacity - at top, bigger, more margin */}
        <span 
          className={`text-base font-light transition-opacity duration-500 ${activeProfile ? "mb-2" : "mb-3"} ${
            theme === "dark" ? "text-white/30" : "text-black/30"
          }`}
          style={{ 
            userSelect: "none", 
            WebkitUserSelect: "none",
            fontSize: `${1 * sizeMultiplier}rem`, // text-base = 1rem
          }}
        >
          {displayAiText}
        </span>
        
        {/* Time - made bigger */}
        <span 
          className={`text-3xl font-mono font-semibold tracking-wider ${
            theme === "dark" ? "text-white/90" : "text-black/90"
          }`}
          style={{ 
            userSelect: "none", 
            WebkitUserSelect: "none",
            fontSize: `${1.875 * sizeMultiplier}rem`, // text-3xl = 1.875rem
          }}
        >
          {time}
        </span>
        
        {/* Date - at bottom */}
        <span 
          className={`text-xs font-medium mt-0.5 ${
            theme === "dark" ? "text-white/70" : "text-black/70"
          }`}
          style={{ 
            userSelect: "none", 
            WebkitUserSelect: "none",
            fontSize: `${0.75 * sizeMultiplier}rem`, // text-xs = 0.75rem
          }}
        >
          {date}
        </span>
      </div>
    </div>
  );
}
