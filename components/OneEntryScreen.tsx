/**
 * OneEntryScreen - Entry screen (first time vs returning)
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const FIRST_TIME_KEY = "one01_first_time";

export default function OneEntryScreen() {
  const router = useRouter();
  const [isFirstTime, setIsFirstTime] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if first time
    const firstTime = localStorage.getItem(FIRST_TIME_KEY) === null;
    setIsFirstTime(firstTime);

    // If returning, auto-redirect
    if (!firstTime) {
      const timer = setTimeout(() => {
        router.push("/one");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const handleStart = () => {
    localStorage.setItem(FIRST_TIME_KEY, "false");
    router.push("/one");
  };

  if (isFirstTime === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-neutral-400">Loading...</div>
      </div>
    );
  }

  if (!isFirstTime) {
    // Returning user - show brief redirect message
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="text-neutral-600"
        >
          Welcome back...
        </motion.div>
      </div>
    );
  }

  // First time user
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-md"
      >
        {/* Nobody placeholder */}
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <span className="text-4xl">👤</span>
          </div>
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            Nobody
          </h1>
        </div>

        {/* One short line */}
        <p className="text-neutral-600 mb-8 text-lg">
          Welcome to ONE01. Your personal operating system.
        </p>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full max-w-xs mx-auto bg-black text-white py-4 px-8 rounded-full font-semibold text-lg hover:bg-neutral-800 transition-colors shadow-lg"
        >
          Start
        </button>
      </motion.div>
    </div>
  );
}

