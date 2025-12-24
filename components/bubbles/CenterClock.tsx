"use client";

import { useState, useEffect } from "react";

interface CenterClockProps {
  theme: "light" | "dark";
  onToggle: () => void;
}

export default function CenterClock({ theme, onToggle }: CenterClockProps) {
  const [time, setTime] = useState<string>("");
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setTime(`${hours}:${minutes}`);
      
      // Format date (e.g., Thu, 18.12.26)
      const day = now.getDate().toString().padStart(2, "0");
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const year = now.getFullYear().toString().slice(-2);
      const weekday = now.toLocaleDateString("en-US", { weekday: "short" });
      setDate(`${weekday}, ${day}.${month}.${year}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <button
      onClick={onToggle}
      className={`px-4 py-2 rounded-full transition-all duration-200
        ${theme === "dark" 
          ? "bg-white/10 text-white/80 hover:bg-white/20 hover:text-white/100" 
          : "bg-black/10 text-black/80 hover:bg-black/20 hover:text-black/100"
        }
        backdrop-blur-sm border ${
          theme === "dark" ? "border-white/20" : "border-black/20"
        }`}
      aria-label="Toggle theme"
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className="text-base font-mono tracking-wider">{time}</span>
        <span className="text-[10px] font-medium opacity-70">{date}</span>
      </div>
    </button>
  );
}
