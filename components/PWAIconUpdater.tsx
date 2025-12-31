"use client";

import { useEffect } from "react";

interface PWAIconUpdaterProps {
  theme: "light" | "dark";
}

/**
 * PWA Icon Updater
 * 
 * Updates PWA icons (apple-touch-icon, manifest icons) based on theme.
 * For iOS and Android, uses square PNG icons that look good when masked.
 */
export default function PWAIconUpdater({ theme }: PWAIconUpdaterProps) {
  useEffect(() => {
    // Check if we're on mobile or in PWA standalone mode
    // Only update PWA icons on mobile devices or when in standalone mode
    const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isStandalone = typeof window !== "undefined" && ((window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches);
    
    // Only run PWA icon updates on mobile or in standalone mode
    if (!isMobile && !isStandalone) {
      return; // Skip on desktop browsers - let FaviconUpdater handle desktop favicons
    }
    
    // Determine icon path based on theme
    // Using square PNG icons optimized for PWA (not circular ICO files)
    const iconBase = theme === "dark" ? "/icon-dark" : "/icon";
    
    // Remove existing apple-touch-icon links and any old favicon links that might interfere
    const existingAppleIcons = document.querySelectorAll("link[rel='apple-touch-icon'], link[rel='apple-touch-icon-precomposed']");
    existingAppleIcons.forEach((icon) => icon.remove());
    
    // Remove any old favicon.ico links on mobile/PWA to prevent circular icon overlay
    // This ensures only the square PNG icons are used for PWA
    const oldFaviconLinks = document.querySelectorAll("link[rel='icon'], link[rel='shortcut icon']");
    oldFaviconLinks.forEach((icon) => {
      const href = (icon as HTMLLinkElement).href;
      if (href && (href.includes('favicon.ico') || href.includes('favicon-dark.ico'))) {
        icon.remove(); // Remove old circular favicon on mobile/PWA
      }
    });
    
    // Create apple-touch-icon for iOS (180x180 is standard)
    // Use the square PNG icon - iOS will automatically add rounded corners
    const appleTouchIcon = document.createElement("link");
    appleTouchIcon.rel = "apple-touch-icon";
    appleTouchIcon.sizes = "180x180";
    appleTouchIcon.href = `${iconBase}-180x180.png`;
    document.head.appendChild(appleTouchIcon);
    
    // Also add precomposed version for older iOS
    const appleTouchIconPrecomposed = document.createElement("link");
    appleTouchIconPrecomposed.rel = "apple-touch-icon-precomposed";
    appleTouchIconPrecomposed.sizes = "180x180";
    appleTouchIconPrecomposed.href = `${iconBase}-180x180.png`;
    document.head.appendChild(appleTouchIconPrecomposed);
    
    // Small delay to ensure icons are loaded before manifest update
    setTimeout(() => {
    
      // Update manifest.json dynamically for theme-aware icons
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        const manifestUrl = manifestLink.href.split('?')[0];
        
        // Fetch and update manifest with theme-appropriate icons
        fetch(`${manifestUrl}?v=${Date.now()}`)
          .then((res) => res.json())
          .then((manifest) => {
            // Update all icons in manifest to use current theme (square PNG icons only)
            if (manifest.icons && Array.isArray(manifest.icons)) {
              manifest.icons = manifest.icons.map((icon: any) => {
                // Extract size from existing icon sizes (e.g., "192x192" from "192x192" or "192x192 512x512")
                const sizesStr = icon.sizes || "192x192";
                const firstSize = sizesStr.split(" ")[0]; // Take first size if multiple
                return {
                  ...icon,
                  src: `${iconBase}-${firstSize}.png`, // Use square PNG icons, not ICO
                };
              });
            }
            
            // Update theme_color and background_color to match theme
            manifest.theme_color = theme === "dark" ? "#000000" : "#ffffff";
            manifest.background_color = theme === "dark" ? "#000000" : "#ffffff";
            
            // Create blob URL for updated manifest
            const blob = new Blob([JSON.stringify(manifest, null, 2)], {
              type: "application/json",
            });
            const newManifestUrl = URL.createObjectURL(blob);
            
            // Update manifest link
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
          .catch((err) => {
            console.error("Failed to update manifest icons:", err);
          });
      }
    }, 50); // Small delay to ensure apple-touch-icon is set first
  }, [theme]);

  return null;
}

