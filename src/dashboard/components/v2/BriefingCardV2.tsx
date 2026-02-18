/**
 * BriefingCardV2 Component
 * Morning/afternoon/evening briefing with terracotta bullets
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { Task, Habit } from '@/types';

interface BriefingCardV2Props {
  tasks: Task[];
  habits: Habit[];
}

export const BriefingCardV2: React.FC<BriefingCardV2Props> = ({ tasks, habits }) => {
  const colors = useThemeColors();
  // Get time-based greeting icon
  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '☀️';
    if (hour < 18) return '🌤️';
    return '🌙';
  };

  // Get time-based title
  const getBriefingTitle = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning Briefing';
    if (hour < 18) return 'Afternoon Briefing';
    return 'Evening Briefing';
  };

  const highPriorityTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done');
  const todoTasks = tasks.filter(t => t.status !== 'done');
  const completedHabits = habits.filter(h => h.current_streak && h.current_streak > 0);

  const briefingItems = [
    todoTasks.length > 0 && `You have ${todoTasks.length} task${todoTasks.length === 1 ? '' : 's'} scheduled for today`,
    highPriorityTasks.length > 0 && `${highPriorityTasks.length} high-priority task${highPriorityTasks.length === 1 ? '' : 's'} need${highPriorityTasks.length === 1 ? 's' : ''} attention`,
    habits.length > 0 && `${habits.length} habit${habits.length === 1 ? '' : 's'} ready to complete`,
    completedHabits.length > 0 && `Keep up your streak on ${completedHabits.length} habit${completedHabits.length === 1 ? '' : 's'}!`,
  ].filter(Boolean);

  // If no items, show encouraging message
  if (briefingItems.length === 0) {
    briefingItems.push("You're all caught up! Great job staying organized.");
  }

  return (
    <div className="rounded-xl p-4 mb-6" style={{ backgroundColor: colors.bg.white }}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-base font-bold" style={{ color: colors.text.primary }}>
          {getGreetingIcon()} {getBriefingTitle()}
        </div>
      </div>
      <ul className="space-y-2">
        {briefingItems.map((item, index) => (
          <li
            key={index}
            className="pl-5 relative text-sm leading-relaxed"
            style={{
              listStyle: 'none',
              color: colors.text.primary,
            }}
          >
            <span
              className="absolute left-0 text-lg"
              style={{ color: colors.accent.start }}
            >
              •
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default BriefingCardV2;
