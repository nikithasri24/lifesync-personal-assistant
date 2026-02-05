/**
 * Web Health Provider - Manual entry fallback for web browsers
 *
 * Since web browsers don't have access to health data,
 * this provider allows manual entry and stores data in localStorage
 */

import { logger } from '@/services/logger';
import {
  BaseHealthProvider,
  type HealthPermissionStatus,
  type HealthDataRange,
  type StepData,
  type SleepData,
  type ActivityData,
  type HeartRateData,
} from './HealthProvider';
import { startOfDay, format, eachDayOfInterval } from 'date-fns';

const STORAGE_KEY = 'lifesync_health_data';

interface StoredHealthData {
  steps: Record<string, number>; // date string -> steps
  sleep: Record<string, number>; // date string -> minutes
  activity: Record<string, { calories: number; minutes: number }>;
}

function getStoredData(): StoredHealthData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore parse errors
  }
  return { steps: {}, sleep: {}, activity: {} };
}

function saveStoredData(data: StoredHealthData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    logger.warn('Health', 'Failed to save health data');
  }
}

function dateKey(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd');
}

export class WebHealthProvider extends BaseHealthProvider {
  readonly name = 'WebHealthProvider';
  
  isSupported(): boolean {
    // Web provider is always "supported" as a fallback
    return true;
  }
  
  async getPermissionStatus(): Promise<HealthPermissionStatus> {
    // Web doesn't need permissions for manual entry
    return {
      steps: 'granted',
      sleep: 'granted',
      activity: 'granted',
      heartRate: 'granted',
    };
  }
  
  async requestPermission(): Promise<HealthPermissionStatus> {
    return this.getPermissionStatus();
  }
  
  async getSteps(range: HealthDataRange): Promise<StepData[]> {
    const data = getStoredData();
    const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
    
    return days.map(date => ({
      date,
      steps: data.steps[dateKey(date)] ?? 0,
    }));
  }
  
  async getSleep(range: HealthDataRange): Promise<SleepData[]> {
    const data = getStoredData();
    const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
    
    return days.map(date => ({
      date,
      totalMinutes: data.sleep[dateKey(date)] ?? 0,
    }));
  }
  
  async getActivity(range: HealthDataRange): Promise<ActivityData[]> {
    const data = getStoredData();
    const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
    
    return days.map(date => {
      const activity = data.activity[dateKey(date)];
      return {
        date,
        activeCalories: activity?.calories ?? 0,
        exerciseMinutes: activity?.minutes ?? 0,
      };
    });
  }
  
  async getHeartRate(): Promise<HeartRateData[]> {
    // Web provider doesn't support heart rate
    return [];
  }
  
  async getTodaySummary(): Promise<{
    steps: number;
    activeCalories: number;
    exerciseMinutes: number;
    sleepMinutes?: number;
  }> {
    const data = getStoredData();
    const today = dateKey(new Date());
    const activity = data.activity[today];
    
    return {
      steps: data.steps[today] ?? 0,
      activeCalories: activity?.calories ?? 0,
      exerciseMinutes: activity?.minutes ?? 0,
      sleepMinutes: data.sleep[today],
    };
  }
  
  async writeSteps(date: Date, steps: number): Promise<boolean> {
    const data = getStoredData();
    data.steps[dateKey(date)] = steps;
    saveStoredData(data);
    return true;
  }
  
  async writeSleep(date: Date, minutes: number): Promise<boolean> {
    const data = getStoredData();
    data.sleep[dateKey(date)] = minutes;
    saveStoredData(data);
    return true;
  }
  
  async writeActivity(date: Date, calories: number, minutes: number): Promise<boolean> {
    const data = getStoredData();
    data.activity[dateKey(date)] = { calories, minutes };
    saveStoredData(data);
    return true;
  }
}

