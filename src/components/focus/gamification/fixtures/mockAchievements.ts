import { Achievement } from '../types';

export const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Steps',
    description: 'Complete your first focus session',
    icon: '🎯',
    category: 'completion',
    rarity: 'common',
    requirement: { type: 'sessions', target: 1 },
    reward: 100,
    unlockedAt: new Date(),
    progress: 100
  },
  {
    id: '2',
    name: 'Focus Master',
    description: 'Complete 50 focus sessions',
    icon: '🧠',
    category: 'completion',
    rarity: 'rare',
    requirement: { type: 'sessions', target: 50 },
    reward: 500,
    progress: 73
  },
  {
    id: '3',
    name: 'Time Lord',
    description: 'Accumulate 100 hours of focus time',
    icon: '⏰',
    category: 'time',
    rarity: 'epic',
    requirement: { type: 'time', target: 6000 },
    reward: 1000,
    progress: 45
  },
  {
    id: '4',
    name: 'Streak Champion',
    description: 'Maintain a 30-day streak',
    icon: '🔥',
    category: 'streak',
    rarity: 'legendary',
    requirement: { type: 'streak', target: 30 },
    reward: 2000,
    progress: 16
  },
  {
    id: '5',
    name: 'Early Bird',
    description: 'Complete 10 sessions before 9 AM',
    icon: '🌅',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'time_of_day', target: 10 },
    reward: 300,
    progress: 7
  },
  {
    id: '6',
    name: 'Night Owl',
    description: 'Complete 10 sessions after 10 PM',
    icon: '🦉',
    category: 'special',
    rarity: 'rare',
    requirement: { type: 'time_of_day', target: 10 },
    reward: 300,
    progress: 3
  }
];
