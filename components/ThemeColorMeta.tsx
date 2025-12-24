"use client";

import { useEffect } from "react";

export default function ThemeColorMeta() {
  useEffect(() => {
    // This will be updated dynamically by the main page component
    // Initial theme color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      const newMeta = document.createElement("meta");
      newMeta.name = "theme-color";
      newMeta.content = "#000000";
      document.head.appendChild(newMeta);
    }
  }, []);

  return null;
}

