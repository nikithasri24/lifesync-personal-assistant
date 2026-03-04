/**
 * TodayHabitsSectionV2 Component
 * Today's habits section with V2 design
 */

import React from 'react';
import { Target, Sparkles } from 'lucide-react';
import { useThemeColors } from '@/hooks/useThemeColors';
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
  onCompleteAll?: () => void;
  isCompletingAll?: boolean;
}

export const TodayHabitsSectionV2: React.FC<TodayHabitsSectionV2Props> = ({
  habits,
  hasAnyHabits,
  onViewAll,
  onComplete,
  completingHabit,
  completedHabits,
  onCompleteAll,
  isCompletingAll,
}) => {
  const colors = useThemeColors();

  return (
    <div
      className="rounded-2xl p-6 border mb-6"
      style={{
        backgroundColor: colors.bg.white,
        borderColor: colors.border.light,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <SectionHeaderV2
          title="Today's Habits"
          icon={Target}
          actionLabel="View all"
          onAction={onViewAll}
        />
        {habits.length > 0 && onCompleteAll && (
          <button
            onClick={onCompleteAll}
            disabled={isCompletingAll}
            className="px-3 py-1.5 text-sm rounded-lg font-semibold text-white transition-opacity disabled:opacity-50 flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)' }}
            aria-label="Mark all habits done"
          >
            {isCompletingAll ? 'Completing…' : 'Mark All Done'}
          </button>
        )}
      </div>

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

