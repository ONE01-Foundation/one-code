/**
 * Units Store - Spend/Earn logic
 * 
 * Rules:
 * - Creating a sphere = costs 1 Unit
 * - Importing a sphere = costs 1 Unit
 * - Completing a card (moment) = earns 1 Unit
 * - Editing / thinking / browsing = free
 * 
 * User starts with:
 * - 101 Units initial
 * - +10 Units daily refill (soft cap)
 */

import { create } from "zustand";

interface UnitsState {
  balance: number;
  lastRefillDate: string; // ISO date
  totalEarned: number;
  totalSpent: number;
  
  // Actions
  initialize: () => void;
  spend: (amount: number, reason: string) => boolean; // Returns true if successful
  earn: (amount: number, reason: string) => void;
  refillDaily: () => void;
  canAfford: (amount: number) => boolean;
  
  // Getters
  getBalance: () => number;
  getDailyRefillAmount: () => number;
}

const STORAGE_KEY = "oneview_units";
const INITIAL_BALANCE = 101;
const DAILY_REFILL = 10;
const MAX_BALANCE = 1000; // Soft cap

// Load from localStorage
function loadUnits(): { balance: number; lastRefillDate: string; totalEarned: number; totalSpent: number } {
  if (typeof window === "undefined") {
    return {
      balance: INITIAL_BALANCE,
      lastRefillDate: new Date().toISOString().split("T")[0],
      totalEarned: 0,
      totalSpent: 0,
    };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        balance: parsed.balance ?? INITIAL_BALANCE,
        lastRefillDate: parsed.lastRefillDate ?? new Date().toISOString().split("T")[0],
        totalEarned: parsed.totalEarned ?? 0,
        totalSpent: parsed.totalSpent ?? 0,
      };
    }
  } catch {
    // Ignore errors
  }
  
  return {
    balance: INITIAL_BALANCE,
    lastRefillDate: new Date().toISOString().split("T")[0],
    totalEarned: 0,
    totalSpent: 0,
  };
}

// Save to localStorage
function saveUnits(state: { balance: number; lastRefillDate: string; totalEarned: number; totalSpent: number }) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore errors
  }
}

// Check if should refill (new day)
function shouldRefill(lastRefillDate: string): boolean {
  const today = new Date().toISOString().split("T")[0];
  return lastRefillDate !== today;
}

export const useUnitsStore = create<UnitsState>((set, get) => ({
  // Initial state
  balance: INITIAL_BALANCE,
  lastRefillDate: new Date().toISOString().split("T")[0],
  totalEarned: 0,
  totalSpent: 0,
  
  // Initialize (load from storage, check daily refill)
  initialize: () => {
    const loaded = loadUnits();
    
    // Check if should refill
    if (shouldRefill(loaded.lastRefillDate)) {
      const newBalance = Math.min(loaded.balance + DAILY_REFILL, MAX_BALANCE);
      const today = new Date().toISOString().split("T")[0];
      set({
        balance: newBalance,
        lastRefillDate: today,
        totalEarned: loaded.totalEarned,
        totalSpent: loaded.totalSpent,
      });
      saveUnits({
        balance: newBalance,
        lastRefillDate: today,
        totalEarned: loaded.totalEarned,
        totalSpent: loaded.totalSpent,
      });
    } else {
      set(loaded);
    }
  },
  
  // Spend Units
  spend: (amount, reason) => {
    const { balance } = get();
    if (balance < amount) {
      console.warn(`Cannot spend ${amount} Units: insufficient balance (${balance})`);
      return false;
    }
    
    const newBalance = balance - amount;
    const newTotalSpent = get().totalSpent + amount;
    
    set({
      balance: newBalance,
      totalSpent: newTotalSpent,
    });
    
    saveUnits({
      balance: newBalance,
      lastRefillDate: get().lastRefillDate,
      totalEarned: get().totalEarned,
      totalSpent: newTotalSpent,
    });
    
    console.log(`Spent ${amount} Units (${reason}). New balance: ${newBalance}`);
    return true;
  },
  
  // Earn Units
  earn: (amount, reason) => {
    const { balance } = get();
    const newBalance = Math.min(balance + amount, MAX_BALANCE);
    const newTotalEarned = get().totalEarned + amount;
    
    set({
      balance: newBalance,
      totalEarned: newTotalEarned,
    });
    
    saveUnits({
      balance: newBalance,
      lastRefillDate: get().lastRefillDate,
      totalEarned: newTotalEarned,
      totalSpent: get().totalSpent,
    });
    
    console.log(`Earned ${amount} Units (${reason}). New balance: ${newBalance}`);
  },
  
  // Refill daily (called on init if needed)
  refillDaily: () => {
    const { balance, lastRefillDate } = get();
    if (!shouldRefill(lastRefillDate)) return;
    
    const newBalance = Math.min(balance + DAILY_REFILL, MAX_BALANCE);
    const today = new Date().toISOString().split("T")[0];
    
    set({
      balance: newBalance,
      lastRefillDate: today,
    });
    
    saveUnits({
      balance: newBalance,
      lastRefillDate: today,
      totalEarned: get().totalEarned,
      totalSpent: get().totalSpent,
    });
  },
  
  // Check if can afford
  canAfford: (amount) => {
    return get().balance >= amount;
  },
  
  // Get balance
  getBalance: () => {
    return get().balance;
  },
  
  // Get daily refill amount
  getDailyRefillAmount: () => {
    return DAILY_REFILL;
  },
}));

