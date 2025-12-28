"use client";

import { useEffect } from "react";

interface ThemeColorMetaProps {
  theme: "light" | "dark";
}

export default function ThemeColorMeta({ theme }: ThemeColorMetaProps) {
  useEffect(() => {
    // Find or create theme-color meta tag
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    
    // Update theme color based on current theme
    // This affects iOS safe area background and browser UI (Chrome address bar, etc.)
    const themeColor = theme === "dark" ? "#000000" : "#FFFFFF";
    meta.setAttribute("content", themeColor);
    
    // Also update the html element's background to match (for safe areas)
    document.documentElement.style.setProperty("background-color", themeColor);
    
    // Also update apple status bar style
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!appleMeta) {
      appleMeta = document.createElement("meta");
      appleMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(appleMeta);
    }
    // In light mode, use "default" (white status bar with black text)
    // In dark mode, use "black-translucent" (black status bar with white text)
    appleMeta.setAttribute("content", theme === "dark" ? "black-translucent" : "default");
  }, [theme]);

  return null;
}

