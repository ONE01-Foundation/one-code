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
    
    // Function to remove all existing favicon links (but not apple-touch-icon - handled by PWAIconUpdater for mobile)
    const removeAllIcons = () => {
      // Only remove browser favicon links, not PWA icons (apple-touch-icon is handled by PWAIconUpdater)
      const existingIcons = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
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
      
      // Note: apple-touch-icon is now handled by PWAIconUpdater component
      // This component only handles browser favicon
      
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
    
    // Update manifest.json name based on RTL (icons handled by PWAIconUpdater)
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
    if (manifestLink) {
      const manifestUrl = manifestLink.href.split('?')[0];
      
      // Update manifest content with RTL-aware name
      fetch(`${manifestUrl}?v=${Date.now()}`)
        .then(res => res.json())
        .then(manifest => {
          // Update name based on RTL
          manifest.name = isRTL ? "אחד" : "ONE";
          manifest.short_name = isRTL ? "אחד" : "ONE";
          
          // Note: Icons are updated by PWAIconUpdater component
          
          // Create a blob URL for the updated manifest
          const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" });
          const newManifestUrl = URL.createObjectURL(blob);
          
          // Only update if changed
          if (manifestLink.href !== newManifestUrl) {
            const oldUrl = manifestLink.href;
            manifestLink.href = newManifestUrl;
            // Clean up old blob URL after a delay
            setTimeout(() => {
              if (oldUrl.startsWith("blob:")) {
                URL.revokeObjectURL(oldUrl);
              }
            }, 1000);
          }
        })
        .catch(() => {
          // Manifest update failed, but that's okay
        });
    }
  }, [theme, isRTL]);

  return null; // This component doesn't render anything
}
