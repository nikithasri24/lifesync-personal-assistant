/**
 * TodayHabitsCompactStrip Component
 * Horizontal scrollable row of habit chips for fast one-tap completion
 */

import React from 'react';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { HabitWithProgress } from './HabitCardV2';

interface TodayHabitsCompactStripProps {
  habits: HabitWithProgress[];
  completedHabits: Set<string>;
  onComplete: (habitId: string) => void;
  completingHabit: string | null;
}

// Map common habit categories/names to emojis
function habitEmoji(habit: HabitWithProgress): string {
  const name = habit.name.toLowerCase();
  if (name.includes('meditat')) return '🧘';
  if (name.includes('workout') || name.includes('exercise') || name.includes('gym')) return '💪';
  if (name.includes('read')) return '📚';
  if (name.includes('water') || name.includes('drink')) return '💧';
  if (name.includes('sleep')) return '😴';
  if (name.includes('walk') || name.includes('run')) return '🏃';
  if (name.includes('journal') || name.includes('write')) return '✍️';
  if (name.includes('vitamin') || name.includes('medicine')) return '💊';
  if (name.includes('stretch') || name.includes('yoga')) return '🤸';
  if (name.includes('cook') || name.includes('meal')) return '🍽️';
  return '✅';
}

export const TodayHabitsCompactStrip: React.FC<TodayHabitsCompactStripProps> = ({
  habits,
  completedHabits,
  onComplete,
  completingHabit,
}) => {
  const navigate = useNavigate();
  const displayHabits = habits.slice(0, 6);

  if (habits.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Today's Habits</span>
        <button
          onClick={() => navigate('/habits')}
          className="text-xs font-medium"
          style={{ color: '#C18B5E', background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="See all habits"
        >
          See all →
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {displayHabits.map(habit => {
          const isCompleted = habit.isComplete || completedHabits.has(habit.id);
          const isCompleting = completingHabit === habit.id;

          return (
            <button
              key={habit.id}
              onClick={() => !isCompleted && onComplete(habit.id)}
              disabled={isCompleted || isCompleting}
              className="flex items-center gap-1.5 px-3 rounded-xl border flex-shrink-0 transition-all"
              style={{
                minHeight: '48px',
                backgroundColor: isCompleted ? '#F0FDF4' : 'white',
                borderColor: isCompleted ? '#86EFAC' : '#E5D5C3',
                cursor: isCompleted ? 'default' : 'pointer',
                opacity: isCompleting ? 0.6 : 1,
              }}
              aria-label={`${isCompleted ? 'Completed' : 'Complete'} ${habit.name}`}
            >
              <span className="text-base leading-none">{habitEmoji(habit)}</span>
              <span
                className="text-sm font-medium whitespace-nowrap"
                style={{ color: isCompleted ? '#16A34A' : '#5C4A3A' }}
              >
                {habit.name}
              </span>
              {isCompleted && (
                <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#16A34A' }} />
              )}
            </button>
          );
        })}

        {habits.length > 6 && (
          <button
            onClick={() => navigate('/habits')}
            className="flex items-center px-3 rounded-xl border flex-shrink-0 text-sm font-medium"
            style={{ minHeight: '48px', borderColor: '#E5D5C3', color: '#C18B5E', background: 'white', cursor: 'pointer' }}
            aria-label="View more habits"
          >
            +{habits.length - 6} more
          </button>
        )}
      </div>
    </div>
  );
};

export default TodayHabitsCompactStrip;
