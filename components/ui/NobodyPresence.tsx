/**
 * Nobody Presence - Quiet System Guide
 * 
 * NOT a chatbot, NOT a character
 * Just a subtle presence that guides the next action
 * 
 * Rules:
 * - Never interrupts
 * - Only appears when a decision is needed
 * - No avatar, no face, no speech bubble
 * - Just subtle presence + one line of text
 */

interface NobodyPresenceProps {
  message: string;
  onYes: () => void;
  onNotNow: () => void;
}

export function NobodyPresence({ message, onYes, onNotNow }: NobodyPresenceProps) {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Subtle presence indicator - thin text line */}
      <div className="text-center">
        <div
          className="text-xs opacity-40 mb-4"
          style={{ color: "var(--foreground)" }}
        >
          Nobody
        </div>
      </div>

      {/* One line message */}
      <div className="text-center">
        <p
          className="text-xl sm:text-2xl font-normal leading-relaxed"
          style={{ color: "var(--foreground)" }}
        >
          {message}
        </p>
      </div>

      {/* Two buttons only */}
      <div className="space-y-3">
        <button
          onClick={onYes}
          className="w-full px-6 py-4 rounded-lg font-medium text-lg hover:opacity-90 transition-opacity duration-200"
          style={{
            backgroundColor: "var(--foreground)",
            color: "var(--background)",
          }}
        >
          Yes
        </button>
        <button
          onClick={onNotNow}
          className="w-full px-6 py-4 rounded-lg font-medium text-base hover:opacity-90 transition-opacity duration-200"
          style={{
            backgroundColor: "var(--background)",
            border: "2px solid var(--border)",
            color: "var(--foreground)",
          }}
        >
          Not now
        </button>
      </div>
    </div>
  );
}

