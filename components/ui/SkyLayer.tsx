/**
 * Sky Layer - Time-based calm background
 * 
 * Minimal, monochrome, Apple Weather-like
 * Never blocks clicks, sits behind everything
 */

"use client";

import { getSkyMoodByHour, getSkyStyles, SkyMood } from "@/lib/sky-mood";
import { useEffect, useState } from "react";

type ActiveTheme = "light" | "dark";

interface SkyLayerProps {
  activeTheme: ActiveTheme;
}

export function SkyLayer({ activeTheme }: SkyLayerProps) {
  const [mood, setMood] = useState<SkyMood>(getSkyMoodByHour());
  const styles = getSkyStyles(mood, activeTheme);

  // Update mood every 60 seconds
  useEffect(() => {
    const updateMood = () => {
      setMood(getSkyMoodByHour());
    };

    // Update immediately
    updateMood();

    // Update every 60 seconds
    const interval = setInterval(updateMood, 60000);

    return () => clearInterval(interval);
  }, []);

  // Vignette (subtle darkening at edges)
  const vignetteColor = activeTheme === "light" ? "rgba(0, 0, 0," : "rgba(0, 0, 0,";
  
  // Highlight (soft circular light that drifts)
  const highlightColor = activeTheme === "light" ? "rgba(255, 255, 255," : "rgba(255, 255, 255,";
  const highlightOpacity = activeTheme === "light" ? 0.02 : 0.03;

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        // Background overlay (very subtle)
        backgroundColor: activeTheme === "light" 
          ? `rgba(255, 255, 255, ${styles.backgroundOverlayOpacity})`
          : `rgba(0, 0, 0, ${styles.backgroundOverlayOpacity})`,
      }}
    >
      {/* Vignette layer (fixed, subtle darkening at edges) */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, ${vignetteColor}${styles.vignetteOpacity}) 100%)`,
        }}
      />

      {/* Drifting highlight (soft circular light) */}
      <div
        className="absolute rounded-full blur-3xl"
        style={{
          width: "600px",
          height: "600px",
          left: `${styles.highlightPosition.x}%`,
          top: `${styles.highlightPosition.y}%`,
          transform: "translate(-50%, -50%)",
          backgroundColor: `${highlightColor}${highlightOpacity})`,
          animation: "sky-drift 120s ease-in-out infinite",
        }}
      />

      <style jsx>{`
        @keyframes sky-drift {
          0%, 100% {
            transform: translate(-50%, -50%) translate(0, 0);
            opacity: ${highlightOpacity};
          }
          25% {
            transform: translate(-50%, -50%) translate(20px, -15px);
            opacity: ${highlightOpacity * 0.8};
          }
          50% {
            transform: translate(-50%, -50%) translate(-10px, 20px);
            opacity: ${highlightOpacity * 1.2};
          }
          75% {
            transform: translate(-50%, -50%) translate(15px, 10px);
            opacity: ${highlightOpacity * 0.9};
          }
        }
      `}</style>
    </div>
  );
}

