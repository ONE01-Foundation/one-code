/**
 * BreadcrumbBar - Navigation breadcrumb at bottom
 */

"use client";

import { useMVPStore } from "@/lib/mvp/store";

export function BreadcrumbBar() {
  const store = useMVPStore();
  const { currentPath, goBack, nodes, viewMode } = store;

  const handleBreadcrumbClick = (targetIndex: number) => {
    // Navigate back to the clicked breadcrumb level
    const targetPath = currentPath.slice(0, targetIndex + 1);
    
    if (targetPath.length === 0) {
      // Go to home
      store.goBack();
      return;
    }
    
    // Find the node at this path level
    const targetNodeName = targetPath[targetPath.length - 1];
    const targetNode = Object.values(nodes).find((n) => n.name === targetNodeName);
    
    if (targetNode) {
      // Calculate how many steps back we need
      const stepsBack = currentPath.length - targetPath.length;
      
      // Navigate back the required number of steps
      for (let i = 0; i < stepsBack; i++) {
        store.goBack();
      }
      
      // If we're at the target level now, enter it to show its children
      if (store.currentPath.length === targetPath.length) {
        const children = store.getChildren(targetNode.id);
        if (children.length > 0) {
          store.setFocusedNode(children[0]?.id || null);
        }
      }
    }
  };

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
          <button
            onClick={() => handleBreadcrumbClick(index)}
            className="text-sm opacity-80 hover:opacity-100 transition-opacity"
          >
            {segment}
          </button>
        </span>
      ))}
    </div>
  );
}
