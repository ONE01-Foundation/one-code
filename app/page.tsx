"use client";

import { useState } from "react";

export default function Home() {
  const [text, setText] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setReply(null);

    try {
      const res = await fetch("/api/brain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReply("Error: " + (data.error ?? "Unknown error"));
      } else {
        setReply(data.reply ?? "(empty reply)");
      }
    } catch (err) {
      setReply("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-4">One01 v0.1 – Brain Test</h1>

      <form onSubmit={handleAsk} className="w-full max-w-md space-y-3">
        <textarea
          className="w-full h-32 rounded-md bg-zinc-900 p-3 text-sm outline-none"
          placeholder="תכתוב משהו למוח של One01..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-yellow-400 text-black font-semibold py-2 disabled:opacity-50"
        >
          {loading ? "חושב..." : "שלח למוח"}
        </button>
      </form>

      {reply && (
        <div className="mt-6 w-full max-w-md rounded-md bg-zinc-900 p-3 text-sm">
          <div className="font-semibold mb-1">תשובת One01:</div>
          <div>{reply}</div>
        </div>
      )}
    </main>
  );
}
