/**
 * useHealth Hook
 * Cross-platform health data hook using HealthProvider abstraction
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getHealthProvider,
  type HealthProvider,
  type HealthPermissionStatus,
  type HealthDataRange,
  type StepData,
  type SleepData,
  type ActivityData,
} from '@/lib/health';
import { startOfDay, subDays } from 'date-fns';

interface UseHealthReturn {
  // Status
  isSupported: boolean;
  permissions: HealthPermissionStatus;
  isLoading: boolean;
  error: string | null;
  
  // Today's summary
  todaySummary: {
    steps: number;
    activeCalories: number;
    exerciseMinutes: number;
    sleepMinutes?: number;
  } | null;
  
  // Actions
  requestPermission: (types?: ('steps' | 'sleep' | 'activity' | 'heartRate')[]) => Promise<HealthPermissionStatus>;
  refreshTodaySummary: () => Promise<void>;
  getSteps: (range: HealthDataRange) => Promise<StepData[]>;
  getSleep: (range: HealthDataRange) => Promise<SleepData[]>;
  getActivity: (range: HealthDataRange) => Promise<ActivityData[]>;
  
  // Manual entry (web fallback)
  writeSteps?: (date: Date, steps: number) => Promise<boolean>;
  writeSleep?: (date: Date, minutes: number) => Promise<boolean>;
  
  // Provider info
  providerName: string;
}

export function useHealth(): UseHealthReturn {
  const providerRef = useRef<HealthProvider | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissions, setPermissions] = useState<HealthPermissionStatus>({
    steps: 'not_determined',
    sleep: 'not_determined',
    activity: 'not_determined',
    heartRate: 'not_determined',
  });
  const [todaySummary, setTodaySummary] = useState<{
    steps: number;
    activeCalories: number;
    exerciseMinutes: number;
    sleepMinutes?: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize provider
  useEffect(() => {
    const provider = getHealthProvider();
    providerRef.current = provider;
    
    setIsSupported(provider.isSupported());
    
    // Get initial permission status and today's summary
    Promise.all([
      provider.getPermissionStatus(),
      provider.getTodaySummary(),
    ])
      .then(([perms, summary]) => {
        setPermissions(perms);
        setTodaySummary(summary);
        setIsLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to initialize health');
        setIsLoading(false);
      });
    
    return () => {
      // Don't dispose - it's a singleton
    };
  }, []);
  
  const requestPermission = useCallback(async (
    types: ('steps' | 'sleep' | 'activity' | 'heartRate')[] = ['steps', 'sleep', 'activity']
  ): Promise<HealthPermissionStatus> => {
    if (!providerRef.current) {
      return permissions;
    }
    
    try {
      setError(null);
      const newPerms = await providerRef.current.requestPermission(types);
      setPermissions(newPerms);
      
      // Refresh summary after getting permissions
      const summary = await providerRef.current.getTodaySummary();
      setTodaySummary(summary);
      
      return newPerms;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request permission');
      return permissions;
    }
  }, [permissions]);
  
  const refreshTodaySummary = useCallback(async (): Promise<void> => {
    if (!providerRef.current) return;
    
    try {
      setError(null);
      const summary = await providerRef.current.getTodaySummary();
      setTodaySummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh summary');
    }
  }, []);
  
  const getSteps = useCallback(async (range: HealthDataRange): Promise<StepData[]> => {
    if (!providerRef.current) return [];
    return providerRef.current.getSteps(range);
  }, []);
  
  const getSleep = useCallback(async (range: HealthDataRange): Promise<SleepData[]> => {
    if (!providerRef.current) return [];
    return providerRef.current.getSleep(range);
  }, []);
  
  const getActivity = useCallback(async (range: HealthDataRange): Promise<ActivityData[]> => {
    if (!providerRef.current) return [];
    return providerRef.current.getActivity(range);
  }, []);
  
  const writeSteps = providerRef.current?.writeSteps
    ? async (date: Date, steps: number) => providerRef.current!.writeSteps!(date, steps)
    : undefined;
  
  const writeSleep = providerRef.current?.writeSleep
    ? async (date: Date, minutes: number) => providerRef.current!.writeSleep!(date, minutes)
    : undefined;
  
  return {
    isSupported,
    permissions,
    isLoading,
    error,
    todaySummary,
    requestPermission,
    refreshTodaySummary,
    getSteps,
    getSleep,
    getActivity,
    writeSteps,
    writeSleep,
    providerName: providerRef.current?.name ?? 'unknown',
  };
}

/**
 * Hook to get last 7 days of health data
 */
export function useWeeklyHealth() {
  const { getSteps, getSleep, getActivity, isSupported, permissions } = useHealth();
  const [weeklyData, setWeeklyData] = useState<{
    steps: StepData[];
    sleep: SleepData[];
    activity: ActivityData[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }
    
    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);
    const range = { startDate: weekAgo, endDate: today };
    
    Promise.all([
      getSteps(range),
      getSleep(range),
      getActivity(range),
    ])
      .then(([steps, sleep, activity]) => {
        setWeeklyData({ steps, sleep, activity });
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, [isSupported, getSteps, getSleep, getActivity]);
  
  return { weeklyData, isLoading };
}

