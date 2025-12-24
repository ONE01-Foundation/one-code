"use client";

interface CenterOrnamentProps {
  theme: "light" | "dark";
}

export default function CenterOrnament({ theme }: CenterOrnamentProps) {
  return (
    <div
      className="fixed inset-0 z-0 flex items-center justify-center pointer-events-none"
      style={{
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
