"use client";

import { useState, useEffect } from "react";

interface CenterClockProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function CenterClock({ theme, onToggle }: CenterClockProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onToggle}
      className={`px-3 py-1.5 rounded-full transition-all duration-200
        ${theme === "dark" 
          ? "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80" 
          : "bg-black/10 text-black/60 hover:bg-black/20 hover:text-black/80"
        }
        backdrop-blur-sm border ${
          theme === "dark" ? "border-white/20" : "border-black/20"
        }`}
      aria-label="Toggle theme"
    >
      <span className="text-xs font-mono tracking-wider">{time}</span>
    </button>
  );
}

