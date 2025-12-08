import type { StateCreator } from 'zustand';
import type { FocusSessionData } from '@/services/types';
import {
  getFocusSessions,
  createFocusSession,
  updateFocusSession,
} from '@/api/focusAPI';
import { logger } from '@/services/logger';

export type FocusSessionInput = Omit<
  FocusSessionData,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;

export interface FocusStats {
  totalSessions: number;
  completedSessions: number;
  abandonedSessions: number;
  totalFocusTimeMinutes: number;
  averageSessionMinutes: number;
  mostProductiveTimeOfDay?: string;
  currentStreak: number;
}

export interface FocusSlice {
  sessions: FocusSessionData[];
  sessionsLoaded: boolean;
  sessionsLoading: boolean;
  sessionsError: string | null;

  loadSessions: () => Promise<void>;
  createSession: (session: FocusSessionInput) => Promise<FocusSessionData>;
  completeSession: (
    id: string,
    actualDurationSeconds: number,
    productivityScore?: number,
    moodAfter?: string,
    notes?: string
  ) => Promise<FocusSessionData>;
  abandonSession: (id: string, notes?: string) => Promise<FocusSessionData>;
  updateSessionDetails: (
    id: string,
    updates: Partial<FocusSessionData>
  ) => Promise<FocusSessionData>;
  getStats: (dateRange?: { startDate: string; endDate: string }) => FocusStats;
  getSessionById: (id: string) => FocusSessionData | undefined;
}

export const createFocusSlice: StateCreator<FocusSlice, [], [], FocusSlice> = (
  set,
  get
) => ({
  sessions: [],
  sessionsLoaded: false,
  sessionsLoading: false,
  sessionsError: null,

  loadSessions: async () => {
    if (get().sessionsLoading) return;

    set({ sessionsLoading: true, sessionsError: null });
    try {
      const sessions = await getFocusSessions();
      set({ sessions, sessionsLoaded: true, sessionsLoading: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load focus sessions';
      set({ sessionsError: message, sessionsLoading: false });
      logger.error('Focus', error as Error, { context: 'loadSessions' });
      throw error;
    }
  },

  createSession: async (session) => {
    try {
      const created = await createFocusSession(session);
      set((state) => ({ sessions: [created, ...state.sessions] }));
      return created;
    } catch (error) {
      logger.error('Focus', error as Error, { context: 'createSession' });
      throw error;
    }
  },

  completeSession: async (
    id,
    actualDurationSeconds,
    productivityScore,
    moodAfter,
    notes
  ) => {
    try {
      const updated = await updateFocusSession(id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        actual_duration_seconds: actualDurationSeconds,
        productivity_score: productivityScore,
        mood_after: moodAfter,
        notes,
      });
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updated } : s
        ),
      }));
      return updated;
    } catch (error) {
      logger.error('Focus', error as Error, {
        context: 'completeSession',
        sessionId: id,
      });
      throw error;
    }
  },

  abandonSession: async (id, notes) => {
    try {
      const updated = await updateFocusSession(id, {
        status: 'abandoned',
        completed_at: new Date().toISOString(),
        notes,
      });
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updated } : s
        ),
      }));
      return updated;
    } catch (error) {
      logger.error('Focus', error as Error, {
        context: 'abandonSession',
        sessionId: id,
      });
      throw error;
    }
  },

  updateSessionDetails: async (id, updates) => {
    try {
      const updated = await updateFocusSession(id, updates);
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === id ? { ...s, ...updated } : s
        ),
      }));
      return updated;
    } catch (error) {
      logger.error('Focus', error as Error, {
        context: 'updateSessionDetails',
        sessionId: id,
      });
      throw error;
    }
  },

  getStats: (dateRange) => {
    const { sessions } = get();

    // Filter sessions by date range if provided
    const filteredSessions = dateRange
      ? sessions.filter((s) => {
          const sessionDate = new Date(s.started_at);
          return (
            sessionDate >= new Date(dateRange.startDate) &&
            sessionDate <= new Date(dateRange.endDate)
          );
        })
      : sessions;

    const completedSessions = filteredSessions.filter(
      (s) => s.status === 'completed'
    );
    const abandonedSessions = filteredSessions.filter(
      (s) => s.status === 'abandoned'
    );

    // Calculate total focus time (use actual duration if available, otherwise planned)
    const totalFocusTimeMinutes = completedSessions.reduce((total, s) => {
      const minutes = s.actual_duration_seconds
        ? s.actual_duration_seconds / 60
        : s.duration_minutes;
      return total + minutes;
    }, 0);

    const averageSessionMinutes =
      completedSessions.length > 0
        ? totalFocusTimeMinutes / completedSessions.length
        : 0;

    // Find most productive time of day (hour with most completed sessions)
    const hourCounts: Record<number, number> = {};
    completedSessions.forEach((s) => {
      const hour = new Date(s.started_at).getHours();
      hourCounts[hour] = (hourCounts[hour] ?? 0) + 1;
    });

    let mostProductiveHour: number | undefined;
    let maxCount = 0;
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostProductiveHour = parseInt(hour);
      }
    });

    const mostProductiveTimeOfDay = mostProductiveHour
      ? `${mostProductiveHour}:00 - ${mostProductiveHour + 1}:00`
      : undefined;

    // Calculate current streak (consecutive days with completed sessions)
    const sortedCompletedSessions = [...completedSessions].sort(
      (a, b) =>
        new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
    );

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDays = new Set<string>();
    sortedCompletedSessions.forEach((s) => {
      const sessionDate = new Date(s.started_at);
      sessionDate.setHours(0, 0, 0, 0);
      const dateKey = sessionDate.toISOString().split('T')[0];
      uniqueDays.add(dateKey ?? '');
    });

    const sortedDays = Array.from(uniqueDays).sort().reverse();
    let expectedDate = new Date(today);

    for (const day of sortedDays) {
      const dayDate = new Date(day);
      if (dayDate.getTime() === expectedDate.getTime()) {
        currentStreak++;
        expectedDate.setDate(expectedDate.getDate() - 1);
      } else if (dayDate.getTime() < expectedDate.getTime()) {
        break;
      }
    }

    return {
      totalSessions: filteredSessions.length,
      completedSessions: completedSessions.length,
      abandonedSessions: abandonedSessions.length,
      totalFocusTimeMinutes: Math.round(totalFocusTimeMinutes),
      averageSessionMinutes: Math.round(averageSessionMinutes),
      mostProductiveTimeOfDay,
      currentStreak,
    };
  },

  getSessionById: (id) => get().sessions.find((s) => s.id === id),
});
