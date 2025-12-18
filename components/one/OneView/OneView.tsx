/**
 * OneView V1 - Clean rebuild
 * 
 * Fullscreen black background
 * Center: focused sphere
 * Orbit: 6-10 spheres around center
 * Bottom: breadcrumb bar
 */

"use client";

import { useState, useRef, useCallback } from "react";
import { Sphere } from "./ui/Sphere";
import { Orbit } from "./ui/Orbit";
import { SphereNode } from "@/lib/one/types";

interface OneViewProps {
  initialData?: SphereNode[];
}

export function OneView({ initialData }: OneViewProps) {
  const [spheres, setSpheres] = useState<SphereNode[]>(initialData || getSeedData());
  const [focusedId, setFocusedId] = useState<string | null>(spheres[0]?.id || null);
  const [path, setPath] = useState<string[]>([]);
  const [rotation, setRotation] = useState(0);
  const dragStartRef = useRef<{ x: number; rotation: number } | null>(null);

  const focusedSphere = spheres.find(s => s.id === focusedId) || spheres[0];
  const orbitSpheres = spheres.filter(s => s.id !== focusedId);

  // Handle drag to rotate orbit
  const handleDragStart = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      rotation,
    };
  }, [rotation]);

  const handleDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const sensitivity = 0.5; // Rotation speed
    setRotation(dragStartRef.current.rotation + dx * sensitivity);
  }, []);

  const handleDragEnd = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  // Handle sphere tap (bring to center)
  const handleSphereTap = useCallback((sphereId: string) => {
    setFocusedId(sphereId);
  }, []);

  // Handle center sphere tap (enter)
  const handleCenterTap = useCallback(() => {
    if (focusedSphere?.children && focusedSphere.children.length > 0) {
      // Enter sphere: show children
      setPath([...path, focusedSphere.title]);
      setSpheres(focusedSphere.children);
      setFocusedId(focusedSphere.children[0]?.id || null);
      setRotation(0);
    }
  }, [focusedSphere, path]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (path.length > 0) {
      // Go back to parent
      const newPath = path.slice(0, -1);
      setPath(newPath);
      // Reset to root for now (in real app, would navigate to parent)
      setSpheres(getSeedData());
      setFocusedId(getSeedData()[0]?.id || null);
      setRotation(0);
    }
  }, [path]);

  return (
    <div
      className="fixed inset-0"
      style={{
        backgroundColor: "#000000",
        color: "#ffffff",
      }}
      onPointerDown={handleDragStart}
      onPointerMove={handleDragMove}
      onPointerUp={handleDragEnd}
      onPointerCancel={handleDragEnd}
    >
      {/* Center Sphere */}
      {focusedSphere && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <Sphere
            node={focusedSphere}
            isFocused
            onClick={handleCenterTap}
          />
        </div>
      )}

      {/* Orbit */}
      <Orbit
        spheres={orbitSpheres}
        rotation={rotation}
        onSphereTap={handleSphereTap}
      />

      {/* Breadcrumb Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-center gap-2 px-4 z-20"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <button
          onClick={handleBack}
          className="px-3 py-1 text-sm opacity-60 hover:opacity-100 transition-opacity"
          disabled={path.length === 0}
        >
          Home
        </button>
        {path.length > 0 && (
          <>
            <span className="opacity-40">›</span>
            <span className="text-sm">{path[path.length - 1]}</span>
          </>
        )}
      </div>
    </div>
  );
}

// Seed data
function getSeedData(): SphereNode[] {
  return [
    {
      id: "health",
      title: "Health",
      icon: "❤️",
      children: [
        { id: "nutrition", title: "Nutrition", icon: "🥗" },
        { id: "fitness", title: "Fitness", icon: "💪" },
        { id: "sleep", title: "Sleep", icon: "😴" },
      ],
    },
    {
      id: "money",
      title: "Money",
      icon: "💰",
      children: [
        { id: "income", title: "Income", icon: "📈" },
        { id: "expenses", title: "Expenses", icon: "📉" },
        { id: "debts", title: "Debts", icon: "💳" },
      ],
    },
    {
      id: "career",
      title: "Career",
      icon: "💼",
      children: [
        { id: "projects", title: "Projects", icon: "🚀" },
        { id: "skills", title: "Skills", icon: "🎯" },
        { id: "clients", title: "Clients", icon: "🤝" },
      ],
    },
  ];
}

