/**
 * Daily Briefing Types
 * Types for the morning briefing feature
 */

export interface WeatherData {
  location: string;
  temperature: number;
  temperatureUnit: 'C' | 'F';
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'partly_cloudy' | 'stormy' | 'foggy' | 'windy';
  conditionText: string;
  humidity: number;
  high: number;
  low: number;
  icon: string;
}

export interface BriefingEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  isAllDay: boolean;
  type: 'meeting' | 'appointment' | 'event' | 'reminder';
}

export interface BriefingTask {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueTime?: string;
  estimatedMinutes?: number;
  isOverdue: boolean;
}

export interface BriefingHabit {
  id: string;
  name: string;
  currentStreak: number;
  isAtRisk: boolean; // Streak > 0 and not completed today
  isCompleted: boolean;
}

export interface DailyBriefing {
  // Meta
  date: string;
  greeting: string;
  dayOfWeek: string;
  
  // Weather
  weather?: WeatherData;
  
  // Schedule Overview
  events: BriefingEvent[];
  totalEvents: number;
  firstEventTime?: string;
  busyHours: number; // Total hours blocked by events
  
  // Tasks
  priorityTasks: BriefingTask[];
  totalTasksDue: number;
  overdueTasks: number;
  
  // Habits
  habitsToComplete: BriefingHabit[];
  streaksAtRisk: number;
  
  // Insights
  productivityTip?: string;
  focusSuggestion?: string;

  // Voice script
  voiceScript: string;
}

export interface BriefingOptions {
  includeWeather: boolean;
  weatherLocation?: { lat: number; lng: number };
  temperatureUnit: 'C' | 'F';
  maxEvents: number;
  maxTasks: number;
  maxHabits: number;
}

export const DEFAULT_BRIEFING_OPTIONS: BriefingOptions = {
  includeWeather: true,
  temperatureUnit: 'F',
  maxEvents: 5,
  maxTasks: 5,
  maxHabits: 5,
};

