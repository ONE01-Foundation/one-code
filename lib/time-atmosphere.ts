/**
 * Time Atmosphere v0.1
 * 
 * Provides subtle time-based atmosphere for the one-screen experience
 * No motion, just calm color shifts
 */

export type TimeAtmosphere = "morning" | "day" | "evening" | "night";

export interface AtmosphereData {
  atmosphere: TimeAtmosphere;
  gradientStart: string;
  gradientEnd: string;
}

/**
 * Get time-based atmosphere
 * 
 * Morning: 05:00 - 09:59
 * Day: 10:00 - 16:59
 * Evening: 17:00 - 20:59
 * Night: 21:00 - 04:59
 */
export function getTimeAtmosphere(): AtmosphereData {
  const now = new Date();
  const hour = now.getHours();
  
  let atmosphere: TimeAtmosphere;
  let gradientStart: string;
  let gradientEnd: string;
  
  if (hour >= 5 && hour < 10) {
    // Morning: soft warm light
    atmosphere = "morning";
    gradientStart = "rgba(255, 250, 240, 0.02)";
    gradientEnd = "rgba(255, 245, 230, 0.01)";
  } else if (hour >= 10 && hour < 17) {
    // Day: neutral clarity
    atmosphere = "day";
    gradientStart = "rgba(250, 250, 250, 0.01)";
    gradientEnd = "rgba(255, 255, 255, 0.005)";
  } else if (hour >= 17 && hour < 21) {
    // Evening: gentle cool
    atmosphere = "evening";
    gradientStart = "rgba(240, 245, 255, 0.015)";
    gradientEnd = "rgba(235, 240, 250, 0.01)";
  } else {
    // Night: deep calm
    atmosphere = "night";
    gradientStart = "rgba(240, 240, 245, 0.01)";
    gradientEnd = "rgba(235, 235, 240, 0.005)";
  }
  
  return {
    atmosphere,
    gradientStart,
    gradientEnd,
  };
}

/**
 * Get Nobody headline phrase based on time atmosphere and home state
 */
export function getNobodyHeadline(
  atmosphere: TimeAtmosphere,
  homeState: "empty" | "suggestion" | "active" | "completed" | "loading"
): string {
  const phrases: Record<TimeAtmosphere, Record<string, string[]>> = {
    morning: {
      empty: ["What matters this morning?", "A quiet start.", "Morning clarity."],
      suggestion: ["One step forward.", "Here's what's next.", "A small beginning."],
      active: ["You're moving forward.", "Keep going gently.", "One thing at a time."],
      completed: ["Good morning work.", "That's done.", "Morning momentum."],
      loading: ["Finding what's next.", "Just a moment.", "Preparing quietly."],
    },
    day: {
      empty: ["What needs attention?", "A clear moment.", "What's next?"],
      suggestion: ["Here's one step.", "This makes sense.", "A clear direction."],
      active: ["You're in motion.", "Steady progress.", "One step at a time."],
      completed: ["That's done.", "Good work.", "Moving forward."],
      loading: ["Finding clarity.", "Just a moment.", "Preparing."],
    },
    evening: {
      empty: ["What matters tonight?", "Evening reflection.", "A quiet moment."],
      suggestion: ["One small step.", "Here's what fits.", "Evening clarity."],
      active: ["You're moving forward.", "Gentle progress.", "One thing now."],
      completed: ["That's done.", "Evening well spent.", "Good work."],
      loading: ["Finding what's next.", "Just a moment.", "Preparing quietly."],
    },
    night: {
      empty: ["What matters now?", "Night stillness.", "A quiet space."],
      suggestion: ["One small step.", "Here's what fits.", "Night clarity."],
      active: ["You're moving forward.", "Quiet progress.", "One thing now."],
      completed: ["That's done.", "Night well spent.", "Good work."],
      loading: ["Finding what's next.", "Just a moment.", "Preparing quietly."],
    },
  };
  
  const statePhrases = phrases[atmosphere][homeState] || phrases[atmosphere].empty;
  // Return first phrase for now (deterministic)
  return statePhrases[0];
}

