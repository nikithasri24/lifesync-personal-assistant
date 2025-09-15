/**
 * Focus Mode React Hooks
 * 
 * Custom hooks for integrating focus mode functionality into React components.
 * Provides state management, session control, and real-time updates.
 */

import { useEffect, useCallback, useRef } from 'react';
import { focusService } from '../services/focus/FocusService';
import { 
  FocusSession, 
  FocusPreset, 
  FocusAnalytics, 
  FocusSettings,
  ProductivityMetrics,
  UseFocusSessionReturn,
  UseFocusAnalyticsReturn,
  FocusEvent,
  FocusEventType
} from '../types/focus';

// ==================== Main Focus Session Hook ====================

export function useFocusSession(): UseFocusSessionReturn {
  const [currentSession, setCurrentSession] = useState<FocusSession | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update timer every second
  useEffect(() => {
    if (currentSession?.status === 'active') {
      intervalRef.current = setInterval(() => {
        const remaining = focusService.getTimeRemaining();
        const prog = focusService.getProgress();
        
        setTimeRemaining(remaining);
        setProgress(prog);
        
        if (remaining <= 0) {
          setCurrentSession(null);
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentSession?.status]);

  // Listen to focus events
  useEffect(() => {
    const handleFocusEvent = (event: FocusEvent) => {
      const session = focusService.getCurrentSession();
      setCurrentSession(session ? { ...session } : null);
      
      if (session) {
        setTimeRemaining(focusService.getTimeRemaining());
        setProgress(focusService.getProgress());
      } else {
        setTimeRemaining(0);
        setProgress(0);
      }
    };

    const listenerId = focusService.addEventListener('session_started', handleFocusEvent);
    const listenerId2 = focusService.addEventListener('session_paused', handleFocusEvent);
    const listenerId3 = focusService.addEventListener('session_resumed', handleFocusEvent);
    const listenerId4 = focusService.addEventListener('session_completed', handleFocusEvent);
    const listenerId5 = focusService.addEventListener('session_cancelled', handleFocusEvent);

    return () => {
      focusService.removeEventListener(listenerId);
      focusService.removeEventListener(listenerId2);
      focusService.removeEventListener(listenerId3);
      focusService.removeEventListener(listenerId4);
      focusService.removeEventListener(listenerId5);
    };
  }, []);

  // Initialize current session on mount
  useEffect(() => {
    const session = focusService.getCurrentSession();
    if (session) {
      setCurrentSession(session);
      setTimeRemaining(focusService.getTimeRemaining());
      setProgress(focusService.getProgress());
    }
  }, []);

  const startSession = useCallback(async (preset: FocusPreset, task?: string) => {
    try {
      const session = await focusService.startSession(preset, task);
      setCurrentSession(session);
    } catch (error) {
      console.error('Failed to start focus session:', error);
      throw error;
    }
  }, []);

  const pauseSession = useCallback(async () => {
    try {
      await focusService.pauseSession();
    } catch (error) {
      console.error('Failed to pause focus session:', error);
      throw error;
    }
  }, []);

  const resumeSession = useCallback(async () => {
    try {
      await focusService.resumeSession();
    } catch (error) {
      console.error('Failed to resume focus session:', error);
      throw error;
    }
  }, []);

  const endSession = useCallback(async () => {
    try {
      await focusService.endSession(true);
      setCurrentSession(null);
      setTimeRemaining(0);
      setProgress(0);
    } catch (error) {
      console.error('Failed to end focus session:', error);
      throw error;
    }
  }, []);

  const takeBreak = useCallback(async () => {
    try {
      await focusService.takeBreak();
    } catch (error) {
      console.error('Failed to take break:', error);
      throw error;
    }
  }, []);

  const endBreak = useCallback(async () => {
    try {
      await focusService.endBreak();
    } catch (error) {
      console.error('Failed to end break:', error);
      throw error;
    }
  }, []);

  const updateEnvironment = useCallback(async (environment: Partial<any>) => {
    try {
      if (currentSession) {
        await focusService.applyFocusEnvironment({
          ...currentSession.environment,
          ...environment
        });
      }
    } catch (error) {
      console.error('Failed to update environment:', error);
      throw error;
    }
  }, [currentSession]);

  return {
    currentSession,
    isActive: currentSession?.status === 'active',
    timeRemaining,
    progress,
    startSession,
    pauseSession,
    resumeSession,
    endSession,
    takeBreak,
    endBreak,
    updateEnvironment
  };
}

// ==================== Focus Analytics Hook ====================

export function useFocusAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'week'): UseFocusAnalyticsReturn {
  const [analytics, setAnalytics] = useState<FocusAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await focusService.getAnalytics(period);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      setAnalytics(null);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getInsights = useCallback(() => {
    return analytics?.insights || [];
  }, [analytics]);

  const exportData = useCallback(async (format: 'csv' | 'json' | 'pdf') => {
    if (!analytics) return;
    
    try {
      // Implementation would depend on your export service
      console.log(`Exporting analytics data as ${format}`);
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  }, [analytics]);

  return {
    analytics,
    isLoading,
    error,
    refresh,
    getInsights,
    exportData
  };
}

// ==================== Focus Presets Hook ====================

export function useFocusPresets() {
  const [presets, setPresets] = useState<FocusPreset[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load default and custom presets
    const defaultPresets: FocusPreset[] = [
      {
        id: 'deep-work',
        name: 'Deep Work',
        description: 'Distraction-free focus for complex tasks',
        mode: 'deep-work',
        duration: 90,
        distractionLevel: 'strict',
        environment: {
          notifications: {
            allowUrgent: false,
            allowCalls: false,
            allowMessages: false,
            allowCalendar: false,
            customRules: []
          },
          blockedApps: ['social', 'gaming', 'entertainment'],
          blockedWebsites: ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'],
          allowedApps: ['vscode', 'terminal', 'browser'],
          allowedWebsites: ['stackoverflow.com', 'github.com', 'docs.']
        },
        breakSchedule: {
          enabled: true,
          type: 'fixed',
          interval: 90,
          duration: 15,
          reminders: {
            beforeBreak: 5,
            duringBreak: true,
            afterBreak: 1
          }
        },
        icon: '🧠',
        color: '#6366f1',
        isDefault: true,
        isCustom: false,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'pomodoro',
        name: 'Pomodoro',
        description: 'Classic 25-minute focus sessions',
        mode: 'pomodoro',
        duration: 25,
        distractionLevel: 'moderate',
        environment: {
          notifications: {
            allowUrgent: true,
            allowCalls: true,
            allowMessages: false,
            allowCalendar: true,
            customRules: []
          },
          blockedApps: ['social', 'gaming'],
          blockedWebsites: ['facebook.com', 'twitter.com', 'youtube.com'],
          allowedApps: [],
          allowedWebsites: []
        },
        breakSchedule: {
          enabled: true,
          type: 'pomodoro',
          interval: 25,
          duration: 5,
          reminders: {
            beforeBreak: 2,
            duringBreak: true,
            afterBreak: 1
          }
        },
        icon: '🍅',
        color: '#ef4444',
        isDefault: true,
        isCustom: false,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'creative',
        name: 'Creative Flow',
        description: 'Open environment for creative work',
        mode: 'creative',
        duration: 60,
        distractionLevel: 'minimal',
        environment: {
          ambientSound: {
            type: 'nature',
            volume: 30,
            source: 'rain'
          },
          notifications: {
            allowUrgent: true,
            allowCalls: false,
            allowMessages: false,
            allowCalendar: false,
            customRules: []
          },
          blockedApps: ['social'],
          blockedWebsites: ['facebook.com', 'twitter.com'],
          allowedApps: [],
          allowedWebsites: []
        },
        breakSchedule: {
          enabled: true,
          type: 'adaptive',
          interval: 60,
          duration: 10,
          reminders: {
            beforeBreak: 5,
            duringBreak: false,
            afterBreak: 2
          }
        },
        icon: '🎨',
        color: '#8b5cf6',
        isDefault: true,
        isCustom: false,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'meeting',
        name: 'Meeting Mode',
        description: 'Focused attention for meetings',
        mode: 'meeting',
        duration: 60,
        distractionLevel: 'moderate',
        environment: {
          notifications: {
            allowUrgent: true,
            allowCalls: true,
            allowMessages: false,
            allowCalendar: true,
            customRules: []
          },
          blockedApps: ['social', 'gaming', 'entertainment'],
          blockedWebsites: ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'],
          allowedApps: ['zoom', 'teams', 'slack'],
          allowedWebsites: ['meet.google.com', 'zoom.us']
        },
        breakSchedule: {
          enabled: false,
          type: 'fixed',
          interval: 60,
          duration: 5,
          reminders: {
            beforeBreak: 0,
            duringBreak: false,
            afterBreak: 0
          }
        },
        icon: '👥',
        color: '#059669',
        isDefault: true,
        isCustom: false,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date()
      },
      {
        id: 'learning',
        name: 'Learning Session',
        description: 'Optimized for studying and learning',
        mode: 'learning',
        duration: 45,
        distractionLevel: 'moderate',
        environment: {
          notifications: {
            allowUrgent: false,
            allowCalls: false,
            allowMessages: false,
            allowCalendar: false,
            customRules: []
          },
          blockedApps: ['social', 'gaming', 'entertainment'],
          blockedWebsites: ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'],
          allowedApps: ['browser', 'notes'],
          allowedWebsites: ['wikipedia.org', 'coursera.org', 'udemy.com', 'stackoverflow.com']
        },
        breakSchedule: {
          enabled: true,
          type: 'fixed',
          interval: 45,
          duration: 15,
          reminders: {
            beforeBreak: 5,
            duringBreak: true,
            afterBreak: 2
          }
        },
        icon: '📚',
        color: '#0ea5e9',
        isDefault: true,
        isCustom: false,
        usageCount: 0,
        createdBy: 'system',
        createdAt: new Date()
      }
    ];

    setPresets(defaultPresets);
    setIsLoading(false);
  }, []);

  const createCustomPreset = useCallback((preset: Omit<FocusPreset, 'id' | 'createdAt' | 'usageCount'>) => {
    const newPreset: FocusPreset = {
      ...preset,
      id: `custom_${Date.now()}`,
      createdAt: new Date(),
      usageCount: 0,
      isCustom: true
    };

    setPresets(prev => [...prev, newPreset]);
    return newPreset;
  }, []);

  const updatePreset = useCallback((id: string, updates: Partial<FocusPreset>) => {
    setPresets(prev => prev.map(preset => 
      preset.id === id ? { ...preset, ...updates } : preset
    ));
  }, []);

  const deletePreset = useCallback((id: string) => {
    setPresets(prev => prev.filter(preset => preset.id !== id));
  }, []);

  return {
    presets,
    isLoading,
    createCustomPreset,
    updatePreset,
    deletePreset
  };
}

// ==================== Focus Event Hook ====================

export function useFocusEvents(eventTypes: FocusEventType[] = []) {
  const [events, setEvents] = useState<FocusEvent[]>([]);

  useEffect(() => {
    const listenerIds: string[] = [];

    const handleEvent = (event: FocusEvent) => {
      if (eventTypes.length === 0 || eventTypes.includes(event.type)) {
        setEvents(prev => [...prev.slice(-99), event]); // Keep last 100 events
      }
    };

    // Register listeners for specified event types or all events
    const typesToListen = eventTypes.length > 0 ? eventTypes : [
      'session_started',
      'session_paused',
      'session_resumed',
      'session_completed',
      'session_cancelled',
      'break_started',
      'break_ended',
      'distraction_detected'
    ];

    typesToListen.forEach(type => {
      const id = focusService.addEventListener(type, handleEvent);
      listenerIds.push(id);
    });

    return () => {
      listenerIds.forEach(id => focusService.removeEventListener(id));
    };
  }, [eventTypes]);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  return {
    events,
    clearEvents,
    latestEvent: events[events.length - 1] || null
  };
}

// ==================== Focus Timer Hook ====================

export function useFocusTimer() {
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const session = focusService.getCurrentSession();
    setIsRunning(session?.status === 'active');
    
    if (session?.status === 'active') {
      intervalRef.current = setInterval(() => {
        const elapsed = Date.now() - session.startTime.getTime();
        setTimeElapsed(elapsed);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setTimeElapsed(0);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Listen for session changes
  useEffect(() => {
    const handleSessionChange = () => {
      const session = focusService.getCurrentSession();
      setIsRunning(session?.status === 'active');
    };

    const listenerId1 = focusService.addEventListener('session_started', handleSessionChange);
    const listenerId2 = focusService.addEventListener('session_paused', handleSessionChange);
    const listenerId3 = focusService.addEventListener('session_resumed', handleSessionChange);
    const listenerId4 = focusService.addEventListener('session_completed', handleSessionChange);
    const listenerId5 = focusService.addEventListener('session_cancelled', handleSessionChange);

    return () => {
      focusService.removeEventListener(listenerId1);
      focusService.removeEventListener(listenerId2);
      focusService.removeEventListener(listenerId3);
      focusService.removeEventListener(listenerId4);
      focusService.removeEventListener(listenerId5);
    };
  }, []);

  const formatTime = useCallback((milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeElapsed,
    isRunning,
    formattedTime: formatTime(timeElapsed)
  };
}