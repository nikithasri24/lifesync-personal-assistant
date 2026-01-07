/**
 * Abstract HealthProvider interface for cross-platform health data access
 * 
 * Implementations:
 * - NativeHealthProvider: Uses Capacitor HealthKit/Google Fit plugins
 * - WebHealthProvider: Manual entry fallback for web
 */

export interface HealthSample {
  startDate: Date;
  endDate: Date;
  value: number;
  unit: string;
  source?: string;
}

export interface StepData {
  date: Date;
  steps: number;
  distance?: number; // meters
}

export interface SleepData {
  date: Date;
  totalMinutes: number;
  deepMinutes?: number;
  remMinutes?: number;
  lightMinutes?: number;
  awakeMinutes?: number;
  quality?: number; // 0-100
}

export interface ActivityData {
  date: Date;
  activeCalories: number;
  totalCalories?: number;
  exerciseMinutes: number;
  standHours?: number;
  moveMinutes?: number;
}

export interface HeartRateData {
  timestamp: Date;
  bpm: number;
  context?: 'resting' | 'active' | 'workout' | 'sleep';
}

export interface HealthPermissionStatus {
  steps: 'granted' | 'denied' | 'not_determined';
  sleep: 'granted' | 'denied' | 'not_determined';
  activity: 'granted' | 'denied' | 'not_determined';
  heartRate: 'granted' | 'denied' | 'not_determined';
}

export interface HealthDataRange {
  startDate: Date;
  endDate: Date;
}

export interface HealthProvider {
  /**
   * Provider name for debugging
   */
  readonly name: string;
  
  /**
   * Check if health data access is supported
   */
  isSupported(): boolean;
  
  /**
   * Check current permission status
   */
  getPermissionStatus(): Promise<HealthPermissionStatus>;
  
  /**
   * Request permission to access health data
   */
  requestPermission(types: ('steps' | 'sleep' | 'activity' | 'heartRate')[]): Promise<HealthPermissionStatus>;
  
  /**
   * Get step count data for a date range
   */
  getSteps(range: HealthDataRange): Promise<StepData[]>;
  
  /**
   * Get sleep data for a date range
   */
  getSleep(range: HealthDataRange): Promise<SleepData[]>;
  
  /**
   * Get activity/exercise data for a date range
   */
  getActivity(range: HealthDataRange): Promise<ActivityData[]>;
  
  /**
   * Get heart rate samples for a date range
   */
  getHeartRate(range: HealthDataRange): Promise<HeartRateData[]>;
  
  /**
   * Get today's summary
   */
  getTodaySummary(): Promise<{
    steps: number;
    activeCalories: number;
    exerciseMinutes: number;
    sleepMinutes?: number;
    restingHeartRate?: number;
  }>;
  
  /**
   * Write step data (for manual entry)
   */
  writeSteps?(date: Date, steps: number): Promise<boolean>;
  
  /**
   * Write sleep data (for manual entry)
   */
  writeSleep?(date: Date, minutes: number): Promise<boolean>;
  
  /**
   * Clean up resources
   */
  dispose(): void;
}

/**
 * Base class with common functionality
 */
export abstract class BaseHealthProvider implements HealthProvider {
  abstract readonly name: string;
  
  abstract isSupported(): boolean;
  abstract getPermissionStatus(): Promise<HealthPermissionStatus>;
  abstract requestPermission(types: ('steps' | 'sleep' | 'activity' | 'heartRate')[]): Promise<HealthPermissionStatus>;
  abstract getSteps(range: HealthDataRange): Promise<StepData[]>;
  abstract getSleep(range: HealthDataRange): Promise<SleepData[]>;
  abstract getActivity(range: HealthDataRange): Promise<ActivityData[]>;
  abstract getHeartRate(range: HealthDataRange): Promise<HeartRateData[]>;
  abstract getTodaySummary(): Promise<{
    steps: number;
    activeCalories: number;
    exerciseMinutes: number;
    sleepMinutes?: number;
    restingHeartRate?: number;
  }>;
  
  dispose(): void {
    // Override in subclasses if needed
  }
}

