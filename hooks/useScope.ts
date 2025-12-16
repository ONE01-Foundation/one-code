/**
 * Hook for scope management (Global ↔ Private Mirror)
 * 
 * Prevents hydration flicker with mounted guard
 */

import { useState, useEffect } from "react";
import { Scope } from "@/lib/types";

// Load scope from localStorage
function loadScope(): Scope {
  if (typeof window === "undefined") return "private";
  const stored = localStorage.getItem("one_scope");
  return (stored as Scope) || "private";
}

// Save scope to localStorage
function saveScope(scope: Scope) {
  if (typeof window === "undefined") return;
  localStorage.setItem("one_scope", scope);
}

// Hook for scope state (with hydration guard)
export function useScope() {
  const [mounted, setMounted] = useState(false);
  const [scope, setScope] = useState<Scope>("private"); // Default, will update on mount
  
  useEffect(() => {
    setMounted(true);
    setScope(loadScope());
  }, []);
  
  useEffect(() => {
    if (mounted) {
      saveScope(scope);
    }
  }, [scope, mounted]);
  
  const toggleScope = () => {
    setScope((prev) => (prev === "private" ? "global" : "private"));
  };
  
  return { scope, setScope, toggleScope, mounted };
}

