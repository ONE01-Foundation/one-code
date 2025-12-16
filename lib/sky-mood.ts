/**
 * Sky Mood - Time-based atmosphere
 * 
 * Minimal, calm, black/white only
 * Like Apple Weather vibe but simpler
 */

export type SkyMood = "night" | "dawn" | "day" | "dusk";

/**
 * Get sky mood based on hour of day
 */
export function getSkyMoodByHour(date: Date = new Date()): SkyMood {
  const hour = date.getHours();
  
  if (hour >= 0 && hour < 6) return "night";
  if (hour >= 6 && hour < 9) return "dawn";
  if (hour >= 9 && hour < 18) return "day";
  if (hour >= 18 && hour < 21) return "dusk";
  return "night"; // 21-23
}

export interface SkyStyles {
  backgroundOverlayOpacity: number;
  vignetteOpacity: number;
  highlightPosition: { x: number; y: number };
}

/**
 * Get sky styles based on mood and theme
 * Returns minimal opacity values and highlight position
 */
export function getSkyStyles(
  mood: SkyMood,
  theme: "light" | "dark"
): SkyStyles {
  // Base opacity ranges (very subtle)
  const baseOverlay = theme === "light" ? 0.03 : 0.05;
  const baseVignette = theme === "light" ? 0.02 : 0.04;
  
  // Mood adjustments (subtle variations)
  const moodAdjustments: Record<SkyMood, { overlay: number; vignette: number }> = {
    night: { overlay: 0.05, vignette: 0.06 },
    dawn: { overlay: 0.04, vignette: 0.03 },
    day: { overlay: 0.02, vignette: 0.02 },
    dusk: { overlay: 0.05, vignette: 0.05 },
  };
  
  const adjustment = moodAdjustments[mood];
  
  // Highlight position (subtle drift based on mood)
  const highlightPositions: Record<SkyMood, { x: number; y: number }> = {
    night: { x: 20, y: 30 }, // Lower, left
    dawn: { x: 30, y: 25 }, // Center-left
    day: { x: 50, y: 40 }, // Center
    dusk: { x: 70, y: 35 }, // Right
  };
  
  return {
    backgroundOverlayOpacity: Math.min(0.10, Math.max(0.03, baseOverlay + adjustment.overlay)),
    vignetteOpacity: Math.min(0.08, Math.max(0.02, baseVignette + adjustment.vignette)),
    highlightPosition: highlightPositions[mood],
  };
}

