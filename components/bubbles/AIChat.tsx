"use client";

import { useState, useEffect, useRef } from "react";

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
  onSendMessage: (message: string) => void;
}

export default function AIChat({
  theme,
  isRTL,
  isOpen,
  messages,
  onClose,
  onSendMessage,
}: AIChatProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        backgroundColor: theme === "dark" ? "#000000" : "#FFFFFF",
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{
          borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        }}
      >
        <h2
          className={`text-lg font-semibold ${
            theme === "dark" ? "text-white" : "text-black"
          }`}
        >
          {isRTL ? "צ'אט AI" : "AI Chat"}
        </h2>
        <button
          onClick={onClose}
          className={`px-3 py-1 rounded-lg transition-colors ${
            theme === "dark"
              ? "text-white/70 hover:bg-white/10"
              : "text-black/70 hover:bg-black/10"
          }`}
        >
          {isRTL ? "סגור" : "Close"}
        </button>
      </div>

      {/* Messages Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{
          height: "calc(100vh - 120px - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))",
        }}
      >
        {messages.length === 0 ? (
          <div
            className={`text-center py-8 ${
              theme === "dark" ? "text-white/40" : "text-black/40"
            }`}
          >
            {isRTL ? "התחל שיחה עם AI" : "Start a conversation with AI"}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === "user"
                      ? theme === "dark"
                        ? "bg-white/20 text-white"
                        : "bg-black/10 text-black"
                      : theme === "dark"
                      ? "bg-white/5 text-white/90"
                      : "bg-black/5 text-black/90"
                  }`}
                  style={{
                    wordBreak: "break-word",
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

      {/* Input Bar */}
      <div
        className="px-4 py-3 border-t"
        style={{
          borderColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        }}
      >
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={isRTL ? "הקלד הודעה..." : "Type a message..."}
            className={`flex-1 px-4 py-2 rounded-full border outline-none transition-colors ${
              theme === "dark"
                ? "bg-white/5 border-white/20 text-white placeholder-white/40"
                : "bg-black/5 border-black/20 text-black placeholder-black/40"
            }`}
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className={`px-4 py-2 rounded-full transition-colors ${
              inputValue.trim()
                ? theme === "dark"
                  ? "bg-white/20 hover:bg-white/30 text-white"
                  : "bg-black/20 hover:bg-black/30 text-black"
                : theme === "dark"
                ? "bg-white/5 text-white/30 cursor-not-allowed"
                : "bg-black/5 text-black/30 cursor-not-allowed"
            }`}
          >
            {isRTL ? "שלח" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}

