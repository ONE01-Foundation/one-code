"use client";

import { useEffect, useRef } from "react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isTyping?: boolean;
}

interface AIChatProps {
  theme: "light" | "dark";
  isRTL: boolean;
  isOpen: boolean;
  messages: ChatMessage[];
  onClose: () => void;
}

export default function AIChat({
  theme,
  isRTL,
  isOpen,
  messages,
  onClose,
}: AIChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (chatEndRef.current && isOpen) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop with reduced focus */}
      <div
        className="fixed inset-0 z-40"
        style={{
          backgroundColor: theme === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)",
          backdropFilter: "blur(8px)",
          transition: "opacity 0.3s ease, backdrop-filter 0.3s ease",
        }}
        onClick={onClose}
      />
      
      {/* Overlay content - expands from topbar area */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          paddingTop: "env(safe-area-inset-top, 0px)",
          maxHeight: "calc(100vh - env(safe-area-inset-bottom, 0px) - 200px)",
          background: theme === "dark"
            ? "linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.95) 30%, rgba(0,0,0,0.9) 70%, rgba(0,0,0,0.85) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 30%, rgba(255,255,255,0.9) 70%, rgba(255,255,255,0.85) 100%)",
          backdropFilter: "blur(20px)",
          borderBottomLeftRadius: "24px",
          borderBottomRightRadius: "24px",
          borderBottom: theme === "dark" 
            ? "1px solid rgba(255, 255, 255, 0.1)" 
            : "1px solid rgba(0, 0, 0, 0.1)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease",
          transform: isOpen ? "translateY(0)" : "translateY(-100%)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        {/* Close button */}
        <div className="flex justify-end px-4 pt-3 pb-2">
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg transition-colors text-sm ${
              theme === "dark"
                ? "text-white/60 hover:bg-white/10 hover:text-white/80"
                : "text-black/60 hover:bg-black/10 hover:text-black/80"
            }`}
          >
            {isRTL ? "סגור" : "Close"}
          </button>
        </div>

        {/* Messages Container - conversation history scroll */}
        <div
          ref={chatContainerRef}
          className="overflow-y-auto px-6 py-4"
          style={{
            maxHeight: "calc(50vh - env(safe-area-inset-top, 0px) - 80px)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {messages.length === 0 ? (
            <div
              className={`text-center py-8 ${
                theme === "dark" ? "text-white/30" : "text-black/30"
              }`}
            >
              {isRTL ? "אין הודעות עדיין" : "No messages yet"}
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col gap-2 ${
                    message.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Role indicator */}
                  <div
                    className={`text-xs font-medium ${
                      theme === "dark" ? "text-white/40" : "text-black/40"
                    }`}
                    style={{
                      paddingLeft: message.role === "user" ? 0 : "4px",
                      paddingRight: message.role === "user" ? "4px" : 0,
                    }}
                  >
                    {message.role === "user" 
                      ? (isRTL ? "אתה" : "You") 
                      : (isRTL ? "AI" : "AI")}
                  </div>
                  
                  {/* Message content */}
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? theme === "dark"
                          ? "bg-white/15 text-white/90"
                          : "bg-black/10 text-black/90"
                        : theme === "dark"
                        ? "bg-white/5 text-white/80 border border-white/10"
                        : "bg-black/5 text-black/80 border border-black/10"
                    }`}
                    style={{
                      wordBreak: "break-word",
                      lineHeight: "1.6",
                    }}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                      {message.isTyping && (
                        <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                      )}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

