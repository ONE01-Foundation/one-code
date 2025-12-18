/**
 * Time Store - Time navigation and summaries
 * 
 * Handles:
 * - Current time cursor
 * - Time slices (day/week/month/year)
 * - Auto-summarization
 * - Time scrubbing
 */

import { create } from "zustand";
import { TimeSlice, Moment, TimeUnit, TimeSummary } from "./time-types";

interface TimeState {
  // Current time cursor
  currentTime: string; // ISO date
  
  // Time slices (indexed by unit and date)
  timeSlices: Record<string, TimeSlice>; // key: `${unit}_${date}`
  moments: Record<string, Moment>; // All moments
  summaries: Record<string, TimeSummary>; // Compressed summaries
  
  // Actions
  setCurrentTime: (time: string) => void;
  addMoment: (moment: Omit<Moment, "id" | "timestamp">) => string; // Returns moment ID
  getTimeSlice: (unit: TimeUnit, date: string) => TimeSlice | null;
  getCurrentSlice: (unit: TimeUnit) => TimeSlice | null;
  compressDay: (date: string) => void;
  compressWeek: (weekStart: string) => void;
  compressMonth: (monthStart: string) => void;
  compressYear: (yearStart: string) => void;
  pinMoment: (momentId: string) => void;
  unpinMoment: (momentId: string) => void;
  
  // Getters
  getMomentsForDay: (date: string) => Moment[];
  getMomentsForWeek: (weekStart: string) => Moment[];
  getSummaryForSlice: (sliceId: string) => TimeSummary | null;
}

const STORAGE_KEY = "oneview_time";

// Load from localStorage
function loadTimeData(): {
  timeSlices: Record<string, TimeSlice>;
  moments: Record<string, Moment>;
  summaries: Record<string, TimeSummary>;
} {
  if (typeof window === "undefined") {
    return { timeSlices: {}, moments: {}, summaries: {} };
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  
  return { timeSlices: {}, moments: {}, summaries: {} };
}

// Save to localStorage
function saveTimeData(data: {
  timeSlices: Record<string, TimeSlice>;
  moments: Record<string, Moment>;
  summaries: Record<string, TimeSummary>;
}) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore errors
  }
}

// Generate time slice key
function getTimeSliceKey(unit: TimeUnit, date: string): string {
  return `${unit}_${date}`;
}

// Get start/end of time unit
function getTimeUnitBounds(unit: TimeUnit, date: string): { start: string; end: string } {
  const d = new Date(date);
  
  switch (unit) {
    case "day":
      return {
        start: new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString(),
        end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString(),
      };
    case "week":
      const dayOfWeek = d.getDay();
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - dayOfWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      return {
        start: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate()).toISOString(),
        end: weekEnd.toISOString(),
      };
    case "month":
      return {
        start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        end: new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString(),
      };
    case "year":
      return {
        start: new Date(d.getFullYear(), 0, 1).toISOString(),
        end: new Date(d.getFullYear() + 1, 0, 1).toISOString(),
      };
    default:
      return { start: date, end: date };
  }
}

export const useTimeStore = create<TimeState>((set, get) => {
  // Load initial data (only on client)
  const initialData = typeof window !== "undefined" ? loadTimeData() : { timeSlices: {}, moments: {}, summaries: {} };
  
  return {
    // Initial state
    currentTime: new Date().toISOString(),
    timeSlices: initialData.timeSlices,
    moments: initialData.moments,
    summaries: initialData.summaries,
    
    // Set current time
    setCurrentTime: (time) => {
      set({ currentTime: time });
    },
    
    // Add moment
    addMoment: (momentData) => {
      const moment: Moment = {
        id: `moment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        ...momentData,
      };
      
      set((state) => {
        const updated = { ...state.moments, [moment.id]: moment };
        saveTimeData({
          timeSlices: state.timeSlices,
          moments: updated,
          summaries: state.summaries,
        });
        return { moments: updated };
      });
      
      return moment.id;
    },
    
    // Get time slice
    getTimeSlice: (unit, date) => {
      const { timeSlices } = get();
      const key = getTimeSliceKey(unit, date);
      return timeSlices[key] || null;
    },
    
    // Get current slice
    getCurrentSlice: (unit) => {
      const { currentTime } = get();
      const date = currentTime.split("T")[0];
      return get().getTimeSlice(unit, date);
    },
    
    // Compress day
    compressDay: (date) => {
      const { moments, timeSlices } = get();
      const dayMoments = get().getMomentsForDay(date);
      const unpinnedMoments = dayMoments.filter((m) => !m.pinned);
      
      if (unpinnedMoments.length === 0) return;
      
      // Generate summary (simplified - in real implementation, call AI)
      const summary: TimeSummary = {
        id: `summary_day_${date}`,
        unit: "day",
        timeSliceId: getTimeSliceKey("day", date),
        summary: generateDaySummary(unpinnedMoments),
        indicators: generateIndicators(unpinnedMoments),
        compressedFrom: unpinnedMoments.map((m) => m.id),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      // Mark moments as compressed
      const updatedMoments = { ...moments };
      unpinnedMoments.forEach((m) => {
        updatedMoments[m.id] = { ...m, compressed: true };
      });
      
      set((state) => {
        const updated = {
          timeSlices: state.timeSlices,
          moments: updatedMoments,
          summaries: { ...state.summaries, [summary.id]: summary },
        };
        saveTimeData(updated);
        return { moments: updatedMoments, summaries: updated.summaries };
      });
    },
    
    // Compress week (placeholder)
    compressWeek: (weekStart) => {
      // Similar to compressDay but for week
      console.log("Compress week:", weekStart);
    },
    
    // Compress month (placeholder)
    compressMonth: (monthStart) => {
      console.log("Compress month:", monthStart);
    },
    
    // Compress year (placeholder)
    compressYear: (yearStart) => {
      console.log("Compress year:", yearStart);
    },
    
    // Pin moment
    pinMoment: (momentId) => {
      set((state) => {
        const updated = {
          ...state.moments,
          [momentId]: { ...state.moments[momentId], pinned: true },
        };
        saveTimeData({
          timeSlices: state.timeSlices,
          moments: updated,
          summaries: state.summaries,
        });
        return { moments: updated };
      });
    },
    
    // Unpin moment
    unpinMoment: (momentId) => {
      set((state) => {
        const updated = {
          ...state.moments,
          [momentId]: { ...state.moments[momentId], pinned: false },
        };
        saveTimeData({
          timeSlices: state.timeSlices,
          moments: updated,
          summaries: state.summaries,
        });
        return { moments: updated };
      });
    },
    
    // Get moments for day
    getMomentsForDay: (date) => {
      const { moments } = get();
      return Object.values(moments).filter((m) => {
        const momentDate = m.timestamp.split("T")[0];
        return momentDate === date;
      });
    },
    
    // Get moments for week
    getMomentsForWeek: (weekStart) => {
      const { moments } = get();
      const bounds = getTimeUnitBounds("week", weekStart);
      return Object.values(moments).filter((m) => {
        return m.timestamp >= bounds.start && m.timestamp < bounds.end;
      });
    },
    
    // Get summary for slice
    getSummaryForSlice: (sliceId) => {
      const { summaries } = get();
      return summaries[sliceId] || null;
    },
  };
});

// Generate day summary (simplified - in real implementation, call AI)
function generateDaySummary(moments: Moment[]): string {
  if (moments.length === 0) return "No activity recorded.";
  
  const domains = new Set(moments.map((m) => m.domain).filter(Boolean));
  const domainCounts: Record<string, number> = {};
  
  moments.forEach((m) => {
    if (m.domain) {
      domainCounts[m.domain] = (domainCounts[m.domain] || 0) + 1;
    }
  });
  
  const topDomain = Object.entries(domainCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  
  if (topDomain) {
    return `Focused on ${topDomain}. ${moments.length} moments recorded.`;
  }
  
  return `${moments.length} moments recorded.`;
}

// Generate indicators (simplified)
function generateIndicators(moments: Moment[]): import("./time-types").TimeIndicator[] {
  const domains = new Set(moments.map((m) => m.domain).filter(Boolean));
  const indicators: import("./time-types").TimeIndicator[] = [];
  
  const domainIcons: Record<string, string> = {
    health: "❤️",
    money: "💰",
    career: "💼",
    relationships: "🤝",
    learning: "📚",
  };
  
  Array.from(domains).filter((d): d is string => !!d).slice(0, 3).forEach((domain) => {
    indicators.push({
      domain,
      direction: "stable",
      balance: "good",
      icon: domainIcons[domain] || "✨",
    });
  });
  
  return indicators;
}

