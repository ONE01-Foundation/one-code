/**
 * OneLoadScreen - Loading screen with 101 animation
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function OneLoadScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Read timezone, language, choose theme
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language || "en";
    const hour = new Date().getHours();
    const isDark = hour >= 18 || hour < 6; // Dark mode after 6 PM or before 6 AM

    // Store preferences
    if (typeof window !== "undefined") {
      localStorage.setItem("one01_timezone", timezone);
      localStorage.setItem("one01_language", language);
      localStorage.setItem("one01_theme", isDark ? "dark" : "light");
    }

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 90);

    // Navigate after 900ms or when done
    const timer = setTimeout(() => {
      router.push("/one-entry");
    }, 900);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white overflow-hidden">
      {/* Repeating 101 faint layers */}
      <div className="absolute inset-0">
        {Array.from({ length: 101 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.02 }}
            transition={{ delay: i * 0.01 }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              transform: `scale(${1 + i * 0.01})`,
            }}
          >
            <span className="text-[200px] font-bold text-black/5">101</span>
          </motion.div>
        ))}
      </div>

      {/* Centered 1/0/1 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10"
      >
        <div className="text-[120px] sm:text-[180px] font-bold text-black leading-none">
          <span>1</span>
          <span className="text-black/30">/</span>
          <span>0</span>
          <span className="text-black/30">/</span>
          <span>1</span>
        </div>
      </motion.div>
    </div>
  );
}

