"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const FIRST_TIME_KEY = "one01_first_time";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Check if first time user
      const isFirstTime = localStorage.getItem(FIRST_TIME_KEY) === null;
      
      if (isFirstTime) {
        // First time - go through loading/entry flow
        router.push("/one-load");
      } else {
        // Returning user - go directly to main One screen
        router.push("/one");
      }
    }
  }, [router]);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-neutral-400">Loading...</div>
    </main>
  );
}
