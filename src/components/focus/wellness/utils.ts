import { subDays, startOfDay } from 'date-fns';
import { type WellnessEvent, type HealthMetrics } from './types';

export const generateMockData = (): { events: WellnessEvent[]; metrics: HealthMetrics[] } => {
  const events: WellnessEvent[] = [];
  const metrics: HealthMetrics[] = [];

  for (let i = 7; i >= 0; i--) {
    const date = subDays(new Date(), i);

    const dayEvents: WellnessEvent[] = [
      {
        id: `eye_${i}_1`,
        type: 'eye_strain',
        timestamp: new Date(date.getTime() + 9 * 60 * 60 * 1000),
        completed: Math.random() > 0.3,
      },
      {
        id: `eye_${i}_2`,
        type: 'eye_strain',
        timestamp: new Date(date.getTime() + 14 * 60 * 60 * 1000),
        completed: Math.random() > 0.3,
      },
      {
        id: `hydration_${i}_1`,
        type: 'hydration',
        timestamp: new Date(date.getTime() + 10 * 60 * 60 * 1000),
        completed: Math.random() > 0.2,
        value: Math.floor(Math.random() * 3) + 1
      },
      {
        id: `mood_${i}`,
        type: 'mood',
        timestamp: new Date(date.getTime() + 18 * 60 * 60 * 1000),
        completed: true,
        value: Math.floor(Math.random() * 5) + 1
      }
    ];

    events.push(...dayEvents);

    metrics.push({
      date,
      sleepHours: Math.random() * 3 + 6,
      sleepQuality: Math.floor(Math.random() * 5) + 1,
      stressLevel: Math.floor(Math.random() * 5) + 1,
      exerciseMinutes: Math.random() * 60,
      waterIntake: Math.floor(Math.random() * 8) + 2,
      screenTime: Math.random() * 120 + 300,
      focusSessionsCount: Math.floor(Math.random() * 8) + 2,
      focusQuality: Math.floor(Math.random() * 5) + 1,
      mood: Math.floor(Math.random() * 5) + 1,
      energy: Math.floor(Math.random() * 5) + 1
    });
  }

  return { events, metrics };
};

export const getTodayMetrics = (healthMetrics: HealthMetrics[]): HealthMetrics | undefined => {
  const today = startOfDay(new Date());
  return healthMetrics.find(m => startOfDay(m.date).getTime() === today.getTime());
};

export const getTodayEvents = (wellnessEvents: WellnessEvent[]): WellnessEvent[] => {
  const today = new Date();
  return wellnessEvents.filter(event =>
    startOfDay(event.timestamp).getTime() === startOfDay(today).getTime()
  );
};

export const getWellnessScore = (todayEvents: WellnessEvent[]): number => {
  const completed = todayEvents.filter(e => e.completed).length;
  const total = todayEvents.length;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};
