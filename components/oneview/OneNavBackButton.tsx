/**
 * OneNav Back Button - Bottom-left back chevron
 * 
 * Always available, always predictable
 */

"use client";

import { useNavStore } from "@/lib/oneview/nav-store";

export function OneNavBackButton() {
  const { canGoBack, goBack } = useNavStore();
  
  if (!canGoBack()) return null;
  
  return (
    <button
      onClick={goBack}
      className="absolute bottom-4 left-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
      style={{
        backgroundColor: "var(--neutral-100)",
        border: "1px solid var(--border)",
        color: "var(--foreground)",
      }}
      title="Back"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{ color: "var(--foreground)" }}
      >
        <path
          d="M12 15L7 10L12 5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

