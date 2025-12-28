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
    // This affects iOS safe area background
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
    // In light mode, use "default" (white) or "black-translucent" with white background
    // In dark mode, use "black-translucent" (black)
    appleMeta.setAttribute("content", theme === "dark" ? "black-translucent" : "default");
    
    // For Android Chrome browser UI, ensure theme-color is correct
    // Chrome uses theme-color for the browser UI (address bar, etc.)
    // White in light mode, black in dark mode
    const chromeThemeColor = theme === "dark" ? "#000000" : "#FFFFFF";
    meta.setAttribute("content", chromeThemeColor);
  }, [theme]);

  return null;
}

