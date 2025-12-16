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
export function useScope(initialScope?: Scope) {
  const [mounted, setMounted] = useState(false);
  const [scope, setScope] = useState<Scope>(initialScope || "private"); // Use initialScope if provided
  
  useEffect(() => {
    setMounted(true);
    // If initialScope provided, use it; otherwise load from localStorage
    if (initialScope) {
      setScope(initialScope);
      saveScope(initialScope);
    } else {
      setScope(loadScope());
    }
  }, [initialScope]);
  
  useEffect(() => {
    if (mounted) {
      saveScope(scope);
    }
  }, [scope, mounted]);
  
  const toggleScope = () => {
    setScope((prev) => {
      const newScope = prev === "private" ? "global" : "private";
      // Style Memory v0.1: Save scope preference
      if (typeof window !== "undefined") {
        const { saveStyle } = require("@/lib/style-memory");
        saveStyle({ lastScope: newScope });
      }
      return newScope;
    });
  };
  
  return { scope, setScope, toggleScope, mounted };
}

