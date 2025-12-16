/**
 * Hook for scope management (Global ↔ Private Mirror)
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

// Hook for scope state
export function useScope() {
  const [scope, setScope] = useState<Scope>(loadScope());
  
  useEffect(() => {
    saveScope(scope);
  }, [scope]);
  
  const toggleScope = () => {
    setScope((prev) => (prev === "private" ? "global" : "private"));
  };
  
  return { scope, setScope, toggleScope };
}

