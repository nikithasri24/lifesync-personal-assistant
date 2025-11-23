import type { SessionTemplate } from '../types';

export const defaultTemplates: SessionTemplate[] = [
  {
    id: 'classic-pomodoro',
    name: 'Classic Pomodoro',
    description: '25min focus + 5min break cycles with long breaks',
    sessions: [
      { type: 'focus', duration: 25, name: 'Focus Session 1' },
      { type: 'break', duration: 5, name: 'Short Break' },
      { type: 'focus', duration: 25, name: 'Focus Session 2' },
      { type: 'break', duration: 5, name: 'Short Break' },
      { type: 'focus', duration: 25, name: 'Focus Session 3' },
      { type: 'break', duration: 5, name: 'Short Break' },
      { type: 'focus', duration: 25, name: 'Focus Session 4' },
      { type: 'long-break', duration: 15, name: 'Long Break' }
    ],
    totalDuration: 160,
    isDefault: true,
    usageCount: 0
  },
  {
    id: 'deep-work',
    name: 'Deep Work Block',
    description: 'Extended focus sessions for complex tasks',
    sessions: [
      { type: 'focus', duration: 90, name: 'Deep Work Session' },
      { type: 'break', duration: 20, name: 'Recovery Break' },
      { type: 'focus', duration: 90, name: 'Deep Work Session' },
      { type: 'long-break', duration: 30, name: 'Long Break' }
    ],
    totalDuration: 230,
    isDefault: true,
    usageCount: 0
  },
  {
    id: 'study-session',
    name: 'Study Session',
    description: 'Optimized for learning and retention',
    sessions: [
      { type: 'focus', duration: 45, name: 'Study Block 1' },
      { type: 'break', duration: 10, name: 'Quick Break' },
      { type: 'focus', duration: 45, name: 'Study Block 2' },
      { type: 'break', duration: 15, name: 'Review Break' },
      { type: 'focus', duration: 30, name: 'Practice Session' }
    ],
    totalDuration: 145,
    isDefault: true,
    usageCount: 0
  },
  {
    id: 'creative-flow',
    name: 'Creative Flow',
    description: 'Longer blocks for creative work',
    sessions: [
      { type: 'focus', duration: 60, name: 'Creative Session 1' },
      { type: 'break', duration: 10, name: 'Inspiration Break' },
      { type: 'focus', duration: 60, name: 'Creative Session 2' },
      { type: 'break', duration: 20, name: 'Refresh Break' },
      { type: 'focus', duration: 45, name: 'Refinement Session' }
    ],
    totalDuration: 195,
    isDefault: true,
    usageCount: 0
  }
];
