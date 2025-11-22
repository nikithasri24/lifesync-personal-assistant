import { startOfWeek, endOfWeek } from 'date-fns';
import { Goal } from '../types';

export const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Daily Focus Goal',
    description: 'Complete 2 hours of focused work',
    type: 'daily',
    target: { metric: 'focus_time', value: 120, unit: 'minutes' },
    currentProgress: 85,
    status: 'active',
    startDate: new Date(),
    reward: 50,
    streak: 5,
    priority: 'high'
  },
  {
    id: '2',
    title: 'Weekly Sessions',
    description: 'Complete 30 focus sessions this week',
    type: 'weekly',
    target: { metric: 'sessions', value: 30, unit: 'sessions' },
    currentProgress: 23,
    status: 'active',
    startDate: startOfWeek(new Date()),
    endDate: endOfWeek(new Date()),
    reward: 200,
    streak: 2,
    priority: 'medium'
  },
  {
    id: '3',
    title: 'Monthly Productivity',
    description: 'Achieve 90% completion rate this month',
    type: 'monthly',
    target: { metric: 'completion_rate', value: 90, unit: 'percentage' },
    currentProgress: 87,
    status: 'active',
    startDate: new Date(),
    reward: 500,
    streak: 1,
    priority: 'high'
  }
];
