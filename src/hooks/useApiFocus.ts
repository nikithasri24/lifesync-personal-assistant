import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

interface UserProfile {
  id: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  currentStreak: number;
  username: string;
  totalSessions: number;
  totalFocusTime: number;
  completionRate: number;
  productivityScore: number;
}

interface Achievement {
  id: string;
  name: string;
  icon: string;
  unlocked: boolean;
  rarity: string;
  progress?: number;
}

interface WeeklyStat {
  day: string;
  sessions: number;
  productivity: number;
}

interface AnalyticsData {
  totalSessions: number;
  totalFocusTime: number;
  completionRate: number;
  productivityScore: number;
  weeklyStats: WeeklyStat[];
}

interface FocusSession {
  id: string;
  preset?: string;
  duration: number;
  actualDuration?: number;
  startTime: string;
  endTime?: string;
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export function useApiFocus() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus/profile`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      const data = await response.json();
      setUserProfile(data);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user profile');
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (updates: Partial<UserProfile>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update user profile');
      const data = await response.json();
      setUserProfile(data);
      return data;
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  }, []);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus/achievements`);
      if (!response.ok) throw new Error('Failed to fetch achievements');
      const data = await response.json();
      setAchievements(data);
    } catch (err) {
      console.error('Error fetching achievements:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch achievements');
    }
  }, []);

  // Fetch analytics data
  const fetchAnalyticsData = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus/analytics`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    }
  }, []);

  // Fetch focus sessions
  const fetchFocusSessions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus/sessions`);
      if (!response.ok) throw new Error('Failed to fetch focus sessions');
      const data = await response.json();
      setFocusSessions(data);
    } catch (err) {
      console.error('Error fetching focus sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch focus sessions');
    }
  }, []);

  // Create focus session
  const createFocusSession = useCallback(async (sessionData: Omit<FocusSession, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });
      if (!response.ok) throw new Error('Failed to create focus session');
      const data = await response.json();
      setFocusSessions(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating focus session:', err);
      throw err;
    }
  }, []);

  // Update focus session
  const updateFocusSession = useCallback(async (sessionId: string, updates: Partial<FocusSession>) => {
    try {
      const response = await fetch(`${API_BASE_URL}/focus/sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error('Failed to update focus session');
      const data = await response.json();
      setFocusSessions(prev => prev.map(session => 
        session.id === sessionId ? data : session
      ));
      return data;
    } catch (err) {
      console.error('Error updating focus session:', err);
      throw err;
    }
  }, []);

  // Refresh all data
  const refreshData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchUserProfile(),
        fetchAchievements(),
        fetchAnalyticsData(),
        fetchFocusSessions()
      ]);
    } catch (err) {
      console.error('Error refreshing focus data:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchUserProfile, fetchAchievements, fetchAnalyticsData, fetchFocusSessions]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  return {
    userProfile,
    achievements,
    analyticsData,
    focusSessions,
    loading,
    error,
    updateUserProfile,
    createFocusSession,
    updateFocusSession,
    refreshData
  };
}