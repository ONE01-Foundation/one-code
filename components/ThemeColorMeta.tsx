"use client";

import { useEffect } from "react";

export default function ThemeColorMeta() {
  useEffect(() => {
    // Create meta tag if it doesn't exist
    // Initial theme will be set by page.tsx based on time of day
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      // Default to dark, will be updated immediately by page.tsx
      meta.setAttribute("content", "#000000");
      document.head.appendChild(meta);
    }
  }, []);

  return null;
}

