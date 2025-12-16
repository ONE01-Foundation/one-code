/**
 * Presence Layer - Time-based calm background
 * 
 * Apple Weather-like subtle atmosphere
 * Monochrome, minimal, never blocks clicks
 */

"use client";

type TimePhase = "dawn" | "day" | "sunset" | "night";
type ActiveTheme = "light" | "dark";

interface PresenceLayerProps {
  activeTheme: ActiveTheme;
  phase: TimePhase;
}

export function PresenceLayer({ activeTheme, phase }: PresenceLayerProps) {
  // Monochrome gradients based on theme and phase
  const getGradient = () => {
    if (activeTheme === "light") {
      switch (phase) {
        case "dawn":
          return "linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(250, 250, 250, 0.95) 50%, rgba(255, 255, 255, 0.98) 100%)";
        case "day":
          return "linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(252, 252, 252, 0.98) 50%, rgba(255, 255, 255, 1) 100%)";
        case "sunset":
          return "linear-gradient(135deg, rgba(255, 252, 250, 0.98) 0%, rgba(250, 248, 246, 0.95) 50%, rgba(255, 252, 250, 0.98) 100%)";
        case "night":
          return "linear-gradient(135deg, rgba(248, 248, 250, 0.95) 0%, rgba(245, 245, 247, 0.92) 50%, rgba(248, 248, 250, 0.95) 100%)";
      }
    } else {
      // Dark mode
      switch (phase) {
        case "dawn":
          return "linear-gradient(135deg, rgba(20, 20, 22, 0.98) 0%, rgba(18, 18, 20, 0.95) 50%, rgba(20, 20, 22, 0.98) 100%)";
        case "day":
          return "linear-gradient(135deg, rgba(18, 18, 20, 1) 0%, rgba(16, 16, 18, 0.98) 50%, rgba(18, 18, 20, 1) 100%)";
        case "sunset":
          return "linear-gradient(135deg, rgba(22, 20, 20, 0.98) 0%, rgba(20, 18, 18, 0.95) 50%, rgba(22, 20, 20, 0.98) 100%)";
        case "night":
          return "linear-gradient(135deg, rgba(15, 15, 17, 0.95) 0%, rgba(12, 12, 14, 0.92) 50%, rgba(15, 15, 17, 0.95) 100%)";
      }
    }
  };

  return (
    <div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: getGradient(),
        // Soft noise-like effect using multiple radial gradients
        backgroundImage: `
          ${getGradient()},
          radial-gradient(circle at 20% 30%, rgba(0, 0, 0, ${activeTheme === "light" ? "0.01" : "0.02"}) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(0, 0, 0, ${activeTheme === "light" ? "0.01" : "0.02"}) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${activeTheme === "light" ? "0.005" : "0.01"}) 0%, transparent 60%)
        `,
        animation: "presence-drift 60s ease-in-out infinite",
      }}
    >
      <style jsx>{`
        @keyframes presence-drift {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          25% {
            transform: translate(1px, -1px) scale(1.001);
            opacity: 0.98;
          }
          50% {
            transform: translate(-1px, 1px) scale(0.999);
            opacity: 1;
          }
          75% {
            transform: translate(1px, 1px) scale(1.001);
            opacity: 0.99;
          }
        }
      `}</style>
    </div>
  );
}

