/**
 * Time Engine Types
 * 
 * Time Model: Moment → Day → Week → Month → Year
 */

export type TimeUnit = "moment" | "day" | "week" | "month" | "year";

export interface TimeSlice {
  id: string;
  unit: TimeUnit;
  startTime: string; // ISO date
  endTime: string; // ISO date
  summary?: string; // AI-generated summary (1-3 lines)
  indicators?: TimeIndicator[]; // 2-4 key indicators
  activeDomains?: string[]; // Domain IDs active in this slice
  rawMoments?: string[]; // Moment IDs (hidden by default, shown on drill-down)
  pinned?: boolean; // Prevent compression
  compressed?: boolean; // Whether this has been compressed into parent
}

export interface TimeIndicator {
  domain: string; // e.g., "health", "money", "career"
  direction: "up" | "down" | "stable";
  balance: "good" | "warning" | "off";
  focus?: string; // Top domain or focus area
  icon: string; // Emoji or icon key
}

export interface Moment {
  id: string;
  timestamp: string; // ISO date
  type: "spoken" | "action" | "completion";
  content: string; // Raw text or action description
  domain?: string; // Associated domain
  cardId?: string; // If linked to a card
  pinned?: boolean; // Prevent compression
  compressed?: boolean; // Whether this has been compressed into a summary
}

export interface TimeSummary {
  id: string;
  unit: TimeUnit;
  timeSliceId: string;
  summary: string; // 1-3 lines
  indicators: TimeIndicator[];
  compressedFrom?: string[]; // IDs of compressed slices
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

