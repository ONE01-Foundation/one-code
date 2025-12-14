/**
 * /claim - Mobile web claim page
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ClaimContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleClaim = async () => {
    if (!code) {
      setError("No code provided");
      return;
    }

    setStatus("claiming");
    setError(null);

    try {
      const response = await fetch("/api/one-touch/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to claim");
      }

      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

  if (!code) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">ONE | CONNECT</h1>
          <p className="text-neutral-600">No code provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">ONE | CONNECT</h1>
          <p className="text-neutral-600 mb-6">Code: {code}</p>
        </div>

        {status === "idle" && (
          <button
            onClick={handleClaim}
            className="w-full px-6 py-4 bg-black text-white rounded-lg font-medium text-lg hover:bg-neutral-800 transition-colors"
          >
            Tap to confirm
          </button>
        )}

        {status === "claiming" && (
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="w-16 h-16 border-4 border-neutral-200 border-t-black rounded-full mx-auto"></div>
            </div>
            <p className="text-neutral-600">Connecting...</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 bg-green-500 rounded-full mx-auto flex items-center justify-center">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-green-600 font-semibold text-lg">Connected!</p>
          </div>
        )}

        {status === "error" && error && (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
            <button
              onClick={handleClaim}
              className="w-full px-6 py-4 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">ONE | CONNECT</h1>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    }>
      <ClaimContent />
    </Suspense>
  );
}

