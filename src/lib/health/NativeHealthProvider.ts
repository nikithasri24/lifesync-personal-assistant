/**
 * Native Health Provider using Capacitor HealthKit plugin
 * 
 * Uses @nicholasbraun/capacitor-healthkit for iOS HealthKit access
 * Note: Plugin needs to be installed separately:
 * npm install @nicholasbraun/capacitor-healthkit
 */

import {
  BaseHealthProvider,
  type HealthPermissionStatus,
  type HealthDataRange,
  type StepData,
  type SleepData,
  type ActivityData,
  type HeartRateData,
} from './HealthProvider';
import { isNative, isIOS } from '../platform';
import { startOfDay, eachDayOfInterval, format } from 'date-fns';
import { logger } from '@/services/logger';

// Types for Capacitor HealthKit plugin
interface HealthKitPlugin {
  isAvailable(): Promise<{ available: boolean }>;
  requestAuthorization(options: { 
    read: string[]; 
    write?: string[] 
  }): Promise<void>;
  queryQuantitySamples(options: {
    sampleType: string;
    startDate: string;
    endDate: string;
    limit?: number;
  }): Promise<{ samples: Array<{ startDate: string; endDate: string; value: number }> }>;
  queryCategorySamples(options: {
    sampleType: string;
    startDate: string;
    endDate: string;
  }): Promise<{ samples: Array<{ startDate: string; endDate: string; value: number }> }>;
}

// Dynamically loaded plugin
let HealthKit: HealthKitPlugin | null = null;
let pluginLoadAttempted = false;

async function tryImport<T>(moduleName: string): Promise<T | null> {
  try {
    const importFn = new Function('m', 'return import(m)') as (m: string) => Promise<T>;
    return await importFn(moduleName);
  } catch {
    return null;
  }
}

async function loadPlugin(): Promise<void> {
  if (pluginLoadAttempted) return;
  pluginLoadAttempted = true;
  
  if (!isNative() || !isIOS()) return;
  
  try {
    const module = await tryImport<{ HealthKit: HealthKitPlugin }>(
      '@nicholasbraun/capacitor-healthkit'
    );
    if (module?.HealthKit) {
      HealthKit = module.HealthKit;
    }
  } catch {
    logger.warn('Health', 'HealthKit plugin not available');
  }
}

const pluginLoaded = loadPlugin();

// HealthKit sample types
const SAMPLE_TYPES = {
  steps: 'HKQuantityTypeIdentifierStepCount',
  activeCalories: 'HKQuantityTypeIdentifierActiveEnergyBurned',
  exerciseMinutes: 'HKQuantityTypeIdentifierAppleExerciseTime',
  heartRate: 'HKQuantityTypeIdentifierHeartRate',
  sleep: 'HKCategoryTypeIdentifierSleepAnalysis',
};

export class NativeHealthProvider extends BaseHealthProvider {
  readonly name = 'NativeHealthProvider';
  
  isSupported(): boolean {
    return isNative() && isIOS();
  }
  
  async getPermissionStatus(): Promise<HealthPermissionStatus> {
    await pluginLoaded;
    
    if (!HealthKit) {
      return {
        steps: 'denied',
        sleep: 'denied',
        activity: 'denied',
        heartRate: 'denied',
      };
    }
    
    try {
      const { available } = await HealthKit.isAvailable();
      if (!available) {
        return {
          steps: 'denied',
          sleep: 'denied',
          activity: 'denied',
          heartRate: 'denied',
        };
      }
      
      // HealthKit doesn't provide a way to check individual permissions
      // We assume granted if available (will fail on actual query if not)
      return {
        steps: 'granted',
        sleep: 'granted',
        activity: 'granted',
        heartRate: 'granted',
      };
    } catch {
      return {
        steps: 'not_determined',
        sleep: 'not_determined',
        activity: 'not_determined',
        heartRate: 'not_determined',
      };
    }
  }
  
  async requestPermission(
    types: ('steps' | 'sleep' | 'activity' | 'heartRate')[]
  ): Promise<HealthPermissionStatus> {
    await pluginLoaded;
    
    if (!HealthKit) {
      return this.getPermissionStatus();
    }
    
    const readTypes: string[] = [];
    
    if (types.includes('steps')) {
      readTypes.push(SAMPLE_TYPES.steps);
    }
    if (types.includes('activity')) {
      readTypes.push(SAMPLE_TYPES.activeCalories, SAMPLE_TYPES.exerciseMinutes);
    }
    if (types.includes('heartRate')) {
      readTypes.push(SAMPLE_TYPES.heartRate);
    }
    if (types.includes('sleep')) {
      readTypes.push(SAMPLE_TYPES.sleep);
    }
    
    try {
      await HealthKit.requestAuthorization({ read: readTypes });
      return this.getPermissionStatus();
    } catch (error) {
      logger.error('Health', 'Permission request failed', { error });
      return this.getPermissionStatus();
    }
  }

  async getSteps(range: HealthDataRange): Promise<StepData[]> {
    await pluginLoaded;

    if (!HealthKit) return [];

    try {
      const { samples } = await HealthKit.queryQuantitySamples({
        sampleType: SAMPLE_TYPES.steps,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      });

      // Aggregate by day
      const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
      const stepsByDay = new Map<string, number>();

      for (const sample of samples) {
        const dayKey = format(startOfDay(new Date(sample.startDate)), 'yyyy-MM-dd');
        stepsByDay.set(dayKey, (stepsByDay.get(dayKey) ?? 0) + sample.value);
      }

      return days.map(date => ({
        date,
        steps: stepsByDay.get(format(date, 'yyyy-MM-dd')) ?? 0,
      }));
    } catch (error) {
      logger.error('Health', 'Failed to get steps', { error });
      return [];
    }
  }

  async getSleep(range: HealthDataRange): Promise<SleepData[]> {
    await pluginLoaded;

    if (!HealthKit) return [];

    try {
      const { samples } = await HealthKit.queryCategorySamples({
        sampleType: SAMPLE_TYPES.sleep,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
      });

      // Aggregate by day
      const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
      const sleepByDay = new Map<string, number>();

      for (const sample of samples) {
        const start = new Date(sample.startDate);
        const end = new Date(sample.endDate);
        const minutes = (end.getTime() - start.getTime()) / 60000;
        const dayKey = format(startOfDay(start), 'yyyy-MM-dd');
        sleepByDay.set(dayKey, (sleepByDay.get(dayKey) ?? 0) + minutes);
      }

      return days.map(date => ({
        date,
        totalMinutes: Math.round(sleepByDay.get(format(date, 'yyyy-MM-dd')) ?? 0),
      }));
    } catch (error) {
      logger.error('Health', 'Failed to get sleep', { error });
      return [];
    }
  }

  async getActivity(range: HealthDataRange): Promise<ActivityData[]> {
    await pluginLoaded;

    if (!HealthKit) return [];

    try {
      const [caloriesResult, exerciseResult] = await Promise.all([
        HealthKit.queryQuantitySamples({
          sampleType: SAMPLE_TYPES.activeCalories,
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
        }),
        HealthKit.queryQuantitySamples({
          sampleType: SAMPLE_TYPES.exerciseMinutes,
          startDate: range.startDate.toISOString(),
          endDate: range.endDate.toISOString(),
        }),
      ]);

      const days = eachDayOfInterval({ start: range.startDate, end: range.endDate });
      const caloriesByDay = new Map<string, number>();
      const exerciseByDay = new Map<string, number>();

      for (const sample of caloriesResult.samples) {
        const dayKey = format(startOfDay(new Date(sample.startDate)), 'yyyy-MM-dd');
        caloriesByDay.set(dayKey, (caloriesByDay.get(dayKey) ?? 0) + sample.value);
      }

      for (const sample of exerciseResult.samples) {
        const dayKey = format(startOfDay(new Date(sample.startDate)), 'yyyy-MM-dd');
        exerciseByDay.set(dayKey, (exerciseByDay.get(dayKey) ?? 0) + sample.value);
      }

      return days.map(date => {
        const dayKey = format(date, 'yyyy-MM-dd');
        return {
          date,
          activeCalories: Math.round(caloriesByDay.get(dayKey) ?? 0),
          exerciseMinutes: Math.round(exerciseByDay.get(dayKey) ?? 0),
        };
      });
    } catch (error) {
      logger.error('Health', 'Failed to get activity', { error });
      return [];
    }
  }

  async getHeartRate(range: HealthDataRange): Promise<HeartRateData[]> {
    await pluginLoaded;

    if (!HealthKit) return [];

    try {
      const { samples } = await HealthKit.queryQuantitySamples({
        sampleType: SAMPLE_TYPES.heartRate,
        startDate: range.startDate.toISOString(),
        endDate: range.endDate.toISOString(),
        limit: 1000,
      });

      return samples.map(sample => ({
        timestamp: new Date(sample.startDate),
        bpm: Math.round(sample.value),
      }));
    } catch (error) {
      logger.error('Health', 'Failed to get heart rate', { error });
      return [];
    }
  }

  async getTodaySummary(): Promise<{
    steps: number;
    activeCalories: number;
    exerciseMinutes: number;
    sleepMinutes?: number;
    restingHeartRate?: number;
  }> {
    const today = startOfDay(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const range = { startDate: today, endDate: tomorrow };

    const [steps, activity, sleep] = await Promise.all([
      this.getSteps(range),
      this.getActivity(range),
      this.getSleep(range),
    ]);

    return {
      steps: steps[0]?.steps ?? 0,
      activeCalories: activity[0]?.activeCalories ?? 0,
      exerciseMinutes: activity[0]?.exerciseMinutes ?? 0,
      sleepMinutes: sleep[0]?.totalMinutes,
    };
  }
}

