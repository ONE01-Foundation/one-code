"use client";

import { useEffect } from "react";

interface FaviconUpdaterProps {
  theme: "light" | "dark";
  isRTL?: boolean;
}

export default function FaviconUpdater({ theme, isRTL = false }: FaviconUpdaterProps) {
  useEffect(() => {
    // Determine favicon path based on theme
    const faviconPath = theme === "dark" ? "/favicon-dark.ico" : "/favicon.ico";
    
    // Force update with cache buster to ensure browser loads new icon
    const cacheBuster = `?v=${Date.now()}`;
    const faviconUrl = `${faviconPath}${cacheBuster}`;
    
    // Function to remove all existing favicon links
    const removeAllIcons = () => {
      const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='apple-touch-icon']");
      existingIcons.forEach((icon) => icon.remove());
    };
    
    // Remove all existing favicon links first
    removeAllIcons();
    
    // Small delay to ensure DOM is updated
    setTimeout(() => {
      // Create new favicon link with smaller size hint for mobile
      const linkElement = document.createElement("link");
      linkElement.rel = "icon";
      linkElement.type = "image/x-icon";
      linkElement.href = faviconUrl;
      // Add sizes attribute to hint at smaller rendering
      linkElement.setAttribute("sizes", "32x32");
      document.head.appendChild(linkElement);
      
      // Create shortcut icon (for older browsers)
      const shortcutLink = document.createElement("link");
      shortcutLink.rel = "shortcut icon";
      shortcutLink.type = "image/x-icon";
      shortcutLink.href = faviconUrl;
      shortcutLink.setAttribute("sizes", "32x32");
      document.head.appendChild(shortcutLink);
      
      // Create apple-touch-icon for iOS PWA with proper size
      const appleTouchIcon = document.createElement("link");
      appleTouchIcon.rel = "apple-touch-icon";
      appleTouchIcon.href = faviconUrl;
      appleTouchIcon.setAttribute("sizes", "180x180");
      document.head.appendChild(appleTouchIcon);
      
      // Also update the favicon by directly accessing the link element
      // This forces the browser to reload even if cached
      const img = new Image();
      img.onload = () => {
        // Force browser to reload favicon by creating a new link element
        const forceLink = document.createElement("link");
        forceLink.rel = "icon";
        forceLink.type = "image/x-icon";
        forceLink.href = faviconPath; // Without cache buster for final version
        forceLink.setAttribute("sizes", "32x32");
        // Remove the cache-busted version and add the clean one
        const cachedLink = document.querySelector(`link[href*="${faviconPath}"]`);
        if (cachedLink) {
          cachedLink.remove();
        }
        document.head.appendChild(forceLink);
      };
      img.src = faviconUrl;
    }, 10);
    
    // Update manifest.json name based on RTL
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      const manifestUrl = manifestLink.href.split('?')[0];
      // Force reload manifest
      manifestLink.href = `${manifestUrl}?v=${Date.now()}`;
      
      // Update manifest content with RTL-aware name
      fetch(manifestLink.href)
        .then(res => res.json())
        .then(manifest => {
          // Update name based on RTL
          manifest.name = isRTL ? "אחד" : "ONE";
          manifest.short_name = isRTL ? "אחד" : "ONE";
          
          // Update icons in manifest to use current theme icon
          if (manifest.icons && manifest.icons.length > 0) {
            manifest.icons.forEach((icon: any) => {
              icon.src = faviconPath;
            });
          }
          
          // Create a blob URL for the updated manifest
          const blob = new Blob([JSON.stringify(manifest)], { type: "application/json" });
          const newManifestUrl = URL.createObjectURL(blob);
          manifestLink.href = newManifestUrl;
        })
        .catch(() => {
          // Manifest update failed, but that's okay
        });
    }
  }, [theme, isRTL]);

  return null; // This component doesn't render anything
}
