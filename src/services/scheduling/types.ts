/**
 * Smart Scheduling Types
 * Type definitions for time blocking and optimal scheduling
 */

export type EnergyLevel = 'peak' | 'moderate' | 'low';
export type TaskComplexity = 'deep_work' | 'shallow' | 'routine';

export interface TimeSlot {
  start: Date;
  end: Date;
  durationMinutes: number;
}

export interface ScoredTimeSlot extends TimeSlot {
  score: number; // 0-100
  reasons: string[];
  energyLevel: EnergyLevel;
  conflicts: string[];
}

export interface SchedulingSuggestion {
  taskId: string;
  taskTitle: string;
  suggestedSlots: ScoredTimeSlot[];
  bestSlot: ScoredTimeSlot | null;
  unschedulable: boolean;
  unschedulableReason?: string;
}

export interface UserSchedulingPrefs {
  // Work hours
  workHoursStart: number; // 0-23
  workHoursEnd: number;
  workDays: number[]; // 0=Sunday, 1=Monday, etc.
  
  // Energy patterns
  peakEnergyStart: number;
  peakEnergyEnd: number;
  lowEnergyStart: number;
  lowEnergyEnd: number;
  
  // Preferences
  preferDeepWorkMorning: boolean;
  maxMeetingsPerDay: number;
  lunchBlockStart: number;
  lunchBlockEnd: number;
  bufferBetweenTasks: number; // minutes
}

export interface DaySchedule {
  date: Date;
  events: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    type: 'event' | 'task' | 'block';
  }>;
  freeSlots: TimeSlot[];
  busyPercentage: number;
  totalFreeMinutes: number;
}

export interface SchedulingContext {
  date: Date;
  tasks: Array<{
    id: string;
    title: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    estimatedMinutes: number;
    dueDate?: Date;
    complexity?: TaskComplexity;
  }>;
  events: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
  }>;
  existingBlocks: Array<{
    id: string;
    start: Date;
    end: Date;
    type: string;
  }>;
  preferences: UserSchedulingPrefs;
}

// Default preferences
export const DEFAULT_SCHEDULING_PREFS: UserSchedulingPrefs = {
  workHoursStart: 9,
  workHoursEnd: 17,
  workDays: [1, 2, 3, 4, 5], // Mon-Fri
  peakEnergyStart: 9,
  peakEnergyEnd: 12,
  lowEnergyStart: 14,
  lowEnergyEnd: 15,
  preferDeepWorkMorning: true,
  maxMeetingsPerDay: 4,
  lunchBlockStart: 12,
  lunchBlockEnd: 13,
  bufferBetweenTasks: 5,
};

