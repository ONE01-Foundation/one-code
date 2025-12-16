/**
 * Path Model - Gentle Identity (IWE v0.1)
 * 
 * Minimal Path identity stored locally
 * No signup, no profile, just a name for continuity
 */

export interface Path {
  pathId: string; // UUID
  name?: string; // Optional, max 12 chars
  createdAt: number; // Timestamp
  lastActiveAt: number; // Timestamp
  lastOfferedAt?: number; // Timestamp - when name was last offered
}

const STORAGE_KEY = "one_path_v1";

// Load path from localStorage
export function loadPath(): Path | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save path to localStorage
export function savePath(path: Path): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(path));
}

// Ensure path exists (create if needed)
export function ensurePath(pathId: string): Path {
  const existing = loadPath();
  if (existing && existing.pathId === pathId) {
    return existing;
  }
  
  const now = Date.now();
  const path: Path = {
    pathId,
    createdAt: now,
    lastActiveAt: now,
  };
  
  savePath(path);
  return path;
}

// Set path name
export function setPathName(name: string): Path | null {
  const path = loadPath();
  if (!path) return null;
  
  // Trim and validate
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 12) {
    return null;
  }
  
  path.name = trimmed;
  path.lastActiveAt = Date.now();
  savePath(path);
  
  return path;
}

// Update lastActiveAt
export function updatePathActivity(): void {
  const path = loadPath();
  if (!path) return;
  
  path.lastActiveAt = Date.now();
  savePath(path);
}

// Mark that name was offered
export function markPathNameOffered(): void {
  const path = loadPath();
  if (!path) return;
  
  path.lastOfferedAt = Date.now();
  savePath(path);
}

// Check if name offer should be shown again (24h cooldown)
export function canOfferPathNameAgain(): boolean {
  const path = loadPath();
  if (!path || !path.lastOfferedAt) return true;
  
  const hoursSinceOffer = (Date.now() - path.lastOfferedAt) / (1000 * 60 * 60);
  return hoursSinceOffer >= 24;
}

