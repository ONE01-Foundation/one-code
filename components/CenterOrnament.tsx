"use client";

import { useEffect, useState } from "react";

interface CenterOrnamentProps {
  theme: "light" | "dark";
}

export default function CenterOrnament({ theme }: CenterOrnamentProps) {
  const [viewportCenter, setViewportCenter] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updateCenter = () => {
      // Use visualViewport when available (mobile), fallback to window
      if (window.visualViewport) {
        const vp = window.visualViewport;
        setViewportCenter({ x: vp.width / 2, y: vp.height / 2 });
      } else {
        setViewportCenter({ 
          x: window.innerWidth / 2, 
          y: window.innerHeight / 2 
        });
      }
    };

    updateCenter();
    
    const handleResize = () => {
      updateCenter();
    };
    
    const handleOrientationChange = () => {
      setTimeout(updateCenter, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
      }
    };
  }, []);

  return (
    <div
      className="fixed z-0 pointer-events-none"
      style={{
        left: "50%",
        top: "50%",
        transform: "translate(-50%, -50%)",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div
        className={`relative transition-opacity duration-500 ${
          theme === "dark" ? "opacity-60" : "opacity-40"
        }`}
        style={{
          width: "min(95vw, 700px)",
          height: "min(95vw, 700px)",
          maxWidth: "100%",
          maxHeight: "100%",
        }}
      >
        <img
          src="/one-center-bg.svg"
          alt="ONE Center Ornament"
          className="w-full h-full object-contain"
          style={{
            mixBlendMode: theme === "dark" ? "screen" : "multiply",
          }}
        />
      </div>
    </div>
  );
}
