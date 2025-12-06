import { addDays } from 'date-fns';
import { type Challenge } from '../types';

export const mockChallenges: Challenge[] = [
  {
    id: '1',
    title: 'Focus February',
    description: 'Complete 100 hours of focus time in February',
    type: 'global',
    category: 'time',
    target: 6000,
    startDate: new Date(2024, 1, 1),
    endDate: new Date(2024, 1, 29),
    participants: 1247,
    joined: true,
    progress: 45,
    rank: 123,
    rewards: [
      { rank: 1, xp: 5000, badge: 'February Champion' },
      { rank: 10, xp: 2000, badge: 'Top 10' },
      { rank: 100, xp: 1000 }
    ]
  },
  {
    id: '2',
    title: 'Team Sprint',
    description: 'Work together to complete 1000 sessions',
    type: 'team',
    category: 'sessions',
    target: 1000,
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    participants: 12,
    joined: false,
    progress: 0,
    rewards: [
      { rank: 1, xp: 1000, badge: 'Sprint Winner' }
    ]
  },
  {
    id: '3',
    title: 'Perfect Week',
    description: 'Achieve 100% completion rate for 7 days',
    type: 'individual',
    category: 'completion',
    target: 100,
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
    participants: 1,
    joined: true,
    progress: 85,
    rewards: [
      { rank: 1, xp: 800, badge: 'Perfectionist' }
    ]
  }
];
