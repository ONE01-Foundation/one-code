"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to loading screen
    router.push("/one-load");
  }, [router]);

  return (
    <main className="fixed inset-0 flex items-center justify-center bg-white">
      <div className="text-neutral-400">Loading...</div>
    </main>
  );
}
