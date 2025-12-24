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
      className="bg-transparent border-none outline-none cursor-pointer p-0"
      aria-label="Toggle theme"
    >
      <div className="flex flex-col items-center gap-0.5">
        <span className={`text-2xl font-mono font-semibold tracking-wider ${
          theme === "dark" ? "text-white/90" : "text-black/90"
        }`}>
          {time}
        </span>
        <span className={`text-xs font-medium ${
          theme === "dark" ? "text-white/70" : "text-black/70"
        }`}>
          {date}
        </span>
      </div>
    </button>
  );
}
