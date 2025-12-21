/**
 * BreadcrumbBar - Navigation breadcrumb at bottom
 */

"use client";

import { useMVPStore } from "@/lib/mvp/store";

export function BreadcrumbBar() {
  const store = useMVPStore();
  const { currentPath, goBack } = store;

  return (
    <div
      className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-2 px-4 z-20"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      }}
    >
      <button
        onClick={goBack}
        className="px-3 py-1 text-sm opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
        disabled={currentPath.length === 0}
      >
        Home
      </button>
      {currentPath.map((segment, index) => (
        <span key={index} className="flex items-center gap-2">
          <span className="opacity-40">›</span>
          <span className="text-sm">{segment}</span>
        </span>
      ))}
    </div>
  );
}

