/**
 * Orbit - Spheres arranged in a circle around center
 */

"use client";

import { Sphere as SphereType } from "@/lib/one/types";
import { Sphere } from "./Sphere";

interface OrbitProps {
  spheres: SphereType[];
  rotation: number;
  onSphereTap: (id: string) => void;
}

const ORBIT_RADIUS = 180; // Distance from center

export function Orbit({ spheres, rotation, onSphereTap }: OrbitProps) {
  if (spheres.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {spheres.map((sphere, index) => {
        const angle = (index / spheres.length) * Math.PI * 2 + (rotation * Math.PI / 180);
        const x = Math.cos(angle) * ORBIT_RADIUS;
        const y = Math.sin(angle) * ORBIT_RADIUS;

        return (
          <div
            key={sphere.id}
            className="absolute pointer-events-auto"
            style={{
              left: `calc(50% + ${x}px)`,
              top: `calc(50% + ${y}px)`,
              transform: "translate(-50%, -50%)",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onSphereTap(sphere.id);
            }}
          >
            <Sphere sphere={sphere} />
          </div>
        );
      })}
    </div>
  );
}

