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
    meta.setAttribute("content", theme === "dark" ? "#000000" : "#FFFFFF");
    
    // Also update apple status bar style
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]') as HTMLMetaElement;
    if (!appleMeta) {
      appleMeta = document.createElement("meta");
      appleMeta.setAttribute("name", "apple-mobile-web-app-status-bar-style");
      document.head.appendChild(appleMeta);
    }
    appleMeta.setAttribute("content", theme === "dark" ? "black-translucent" : "default");
  }, [theme]);

  return null;
}

