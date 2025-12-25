/**
 * TodayHabitsSectionV2 Component
 * Today's habits section with V2 design
 */

import React from 'react';
import { Target, Sparkles } from 'lucide-react';
import { SectionHeaderV2 } from './SectionHeaderV2';
import { EmptyStateV2 } from './EmptyStateV2';
import { HabitCardV2, type HabitWithProgress } from './HabitCardV2';

export interface TodayHabitsSectionV2Props {
  habits: HabitWithProgress[];
  hasAnyHabits: boolean;
  onViewAll: () => void;
  onComplete: (habitId: string) => void;
  completingHabit: string | null;
  completedHabits: Set<string>;
}

export const TodayHabitsSectionV2: React.FC<TodayHabitsSectionV2Props> = ({
  habits,
  hasAnyHabits,
  onViewAll,
  onComplete,
  completingHabit,
  completedHabits,
}) => {
  return (
    <div className="
      bg-white dark:bg-gray-800
      rounded-2xl p-6
      border border-gray-200 dark:border-gray-700
      shadow-sm
    ">
      <SectionHeaderV2
        title="Today's Habits"
        icon={Target}
        actionLabel="View all"
        onAction={onViewAll}
      />

      <div className="space-y-3">
        {habits.length === 0 ? (
          hasAnyHabits ? (
            <EmptyStateV2
              icon={Sparkles}
              title="All habits completed!"
              description="Great job! You've completed all your habits for today."
              variant="accent"
            />
          ) : (
            <EmptyStateV2
              icon={Target}
              title="No habits yet"
              description="Start building better habits today. Create your first habit to get started."
              actionLabel="Create Your First Habit"
              onAction={onViewAll}
              variant="accent"
            />
          )
        ) : (
          habits.map((habit, index) => (
            <HabitCardV2
              key={habit.id}
              habit={habit}
              onComplete={onComplete}
              isCompleting={completingHabit === habit.id}
              isJustCompleted={completedHabits.has(habit.id)}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default TodayHabitsSectionV2;

