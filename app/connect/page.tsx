/**
 * /connect - Desktop QR code creation and polling
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

type SessionStatus = "idle" | "pending" | "claimed" | "expired";

export default function ConnectPage() {
  const [code, setCode] = useState<string | null>(null);
  const [claimUrl, setClaimUrl] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const createSession = async () => {
    try {
      setError(null);
      setStatus("idle");
      const response = await fetch("/api/one-touch/create", {
        method: "POST",
      });

      if (!response.ok) {
        const data = await response.json();
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || "Failed to create session";
        throw new Error(errorMsg);
      }

      const data = await response.json();
      setCode(data.code);
      setClaimUrl(data.claimUrl);
      setBaseUrl(data.baseUrl || null);
      setWarning(data.warning || null);
      setStatus("pending");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  const pollStatus = async (sessionCode: string) => {
    try {
      const response = await fetch(`/api/one-touch/status?code=${sessionCode}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setStatus("expired");
          return;
        }
        throw new Error("Failed to fetch status");
      }

      const data = await response.json();
      
      if (data.status === "expired" || (data.expires_at && new Date(data.expires_at) < new Date())) {
        setStatus("expired");
        return;
      }

      if (data.status === "claimed") {
        setStatus("claimed");
        return;
      }

      // Still pending, continue polling
      setStatus("pending");
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  useEffect(() => {
    if (status === "pending" && code) {
      // Start polling
      pollIntervalRef.current = setInterval(() => {
        pollStatus(code);
      }, 1000);

      return () => {
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
        }
      };
    } else {
      // Stop polling
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [status, code]);

  const getStatusColor = () => {
    switch (status) {
      case "pending":
        return "text-blue-600";
      case "claimed":
        return "text-green-600";
      case "expired":
        return "text-red-600";
      default:
        return "text-neutral-600";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "pending":
        return "Pending";
      case "claimed":
        return "Claimed";
      case "expired":
        return "Expired";
      default:
        return "Ready";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">ONE | CONNECT</h1>
          <p className="text-neutral-600">Create a QR code to connect your mobile device</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {warning && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm font-medium">⚠️ {warning}</p>
            <p className="text-yellow-700 text-xs mt-1">Set NEXT_PUBLIC_APP_URL in .env.local</p>
          </div>
        )}

        {baseUrl && (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-orange-800 text-sm font-medium">⚠️ Missing NEXT_PUBLIC_APP_URL</p>
            <p className="text-orange-700 text-xs mt-1">Using fallback: {baseUrl}</p>
          </div>
        )}

        {!claimUrl && (
          <button
            onClick={createSession}
            className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
          >
            Create QR
          </button>
        )}

        {claimUrl && (
          <div className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white p-6 rounded-lg border-2 border-neutral-200">
                <QRCodeSVG value={claimUrl} size={256} />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-neutral-600 mb-1">Code:</p>
                <p className="text-2xl font-mono font-bold text-neutral-900">{code}</p>
              </div>

              {baseUrl && (
                <p className="text-xs text-neutral-400 font-mono">
                  {baseUrl}
                </p>
              )}

              <div className={`text-lg font-semibold ${getStatusColor()}`}>
                {getStatusText()}
              </div>
            </div>

            <div className="space-y-2">
              {(status === "expired" || status === "claimed") && (
                <button
                  onClick={createSession}
                  className="w-full px-6 py-3 bg-black text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                >
                  Refresh QR
                </button>
              )}
              <button
                onClick={createSession}
                className="w-full px-6 py-3 border border-neutral-300 text-neutral-700 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
              >
                Create New QR
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

