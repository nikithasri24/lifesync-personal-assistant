/**
 * HabitWeeklyGridV2 Component
 * Weekly grid view matching habits-design-spec.html
 */

import React, { useMemo } from 'react';
import type { HabitData, HabitEntryData } from '../../../services/types';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { shadows } from '../../../styles/colors';

export interface HabitWeeklyGridV2Props {
  habits: HabitData[];
  entries: HabitEntryData[];
  onToggleEntry: (habitId: string, date: string) => void;
  selectedDate?: Date;
}

// Get the week days for a given date (Mon-Sun)
const getWeekDays = (selectedDate: Date = new Date()): Array<{ date: string; day: number; dayName: string; isToday: boolean }> => {
  const today = new Date();
  const todayKey = today.toISOString().split('T')[0];

  // Find Monday of the week containing selectedDate
  const current = new Date(selectedDate);
  const currentDay = current.getDay();
  const diff = currentDay === 0 ? -6 : 1 - currentDay; // Adjust to Monday

  // Set to Monday of the week
  const monday = new Date(current);
  monday.setDate(current.getDate() + diff);

  const days = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];

    days.push({
      date: dateKey,
      day: date.getDate(),
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: dateKey === todayKey,
    });
  }
  return days;
};

export const HabitWeeklyGridV2: React.FC<HabitWeeklyGridV2Props> = ({
  habits,
  entries,
  onToggleEntry,
  selectedDate = new Date(),
}) => {
  const colors = useThemeColors();
  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate]);

  // Create a map of habit completions by date
  const completionsMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    entries.forEach(entry => {
      if (!map.has(entry.date)) {
        map.set(entry.date, new Set());
      }
      map.get(entry.date)!.add(entry.habit_id);
    });
    return map;
  }, [entries]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalPossible = habits.length * 7;
    const totalCompleted = entries.filter(entry => {
      const weekDates = weekDays.map(d => d.date);
      return weekDates.includes(entry.date);
    }).length;
    const completionPercentage = totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    // Count perfect days (all habits completed)
    const perfectDays = weekDays.filter(day => {
      const dayCompletions = completionsMap.get(day.date);
      return dayCompletions && dayCompletions.size === habits.length;
    }).length;

    return {
      completionPercentage,
      totalCompleted,
      perfectDays,
    };
  }, [habits, entries, weekDays, completionsMap]);

  return (
    <div style={{ padding: '16px 0' }}>
      {/* Day Headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
          marginBottom: '20px',
        }}
      >
        {weekDays.map((day) => (
          <div key={day.date} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: day.isToday ? colors.accent.end : colors.text.secondary,
                marginBottom: '6px',
                textTransform: 'uppercase',
              }}
            >
              {day.dayName}
            </div>
            {day.isToday ? (
              <div
                style={{
                  background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                {day.day}
              </div>
            ) : (
              <div
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  color: colors.text.primary,
                  marginBottom: '8px',
                }}
              >
                {day.day}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Habit Rows */}
      <div style={{ paddingBottom: '20px' }}>
        {habits.map((habit) => {
          // Get category emoji
          const getEmoji = () => {
            if (habit.category === 'Health') return '🧘';
            if (habit.category === 'Fitness') return '💪';
            if (habit.category === 'Learning') return '📚';
            if (habit.category === 'Personal') return '✍️';
            if (habit.category === 'Productivity') return '💼';
            if (habit.category === 'Social') return '🤝';
            return '🎯';
          };

          return (
            <div
              key={habit.id}
              style={{
                background: colors.bg.white,
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '12px',
                boxShadow: '0 2px 6px rgba(139, 111, 71, 0.06)',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: colors.text.primary,
                  marginBottom: '8px',
                }}
              >
                {getEmoji()} {habit.name}
                {habit.target_value && habit.target_value > 1 && (
                  <span style={{ color: colors.text.secondary, fontWeight: 400 }}>
                    {' '}({habit.target_value}x/{habit.frequency === 'weekly' ? 'week' : habit.frequency === 'monthly' ? 'month' : 'day'})
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: '8px',
                }}
              >
                {weekDays.map((day) => {
                  const isChecked = completionsMap.get(day.date)?.has(habit.id) || false;

                  return (
                    <button
                      key={`${habit.id}-${day.date}`}
                      onClick={() => onToggleEntry(habit.id, day.date)}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        background: isChecked
                          ? 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)'
                          : colors.border.light,
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto',
                        cursor: 'pointer',
                        color: isChecked ? 'white' : 'transparent',
                        fontSize: '16px',
                        transition: 'all 0.2s',
                      }}
                      aria-label={`Toggle ${habit.name} for ${day.dayName}`}
                    >
                      {isChecked ? '✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Summary */}
      <div
        style={{
          marginTop: '24px',
          background: colors.bg.white,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: shadows.card,
        }}
      >
        <div
          style={{
            fontSize: '16px',
            fontWeight: 700,
            color: colors.text.primary,
            marginBottom: '16px',
            textAlign: 'center',
          }}
        >
          This Week's Stats
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #D4A574 0%, #C18B5E 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {stats.completionPercentage}%
            </div>
            <div style={{ fontSize: '11px', color: colors.text.secondary, marginTop: '4px' }}>
              Completion
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {stats.totalCompleted}
            </div>
            <div style={{ fontSize: '11px', color: colors.text.secondary, marginTop: '4px' }}>
              Total Checks
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 700,
                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {stats.perfectDays}
            </div>
            <div style={{ fontSize: '11px', color: colors.text.secondary, marginTop: '4px' }}>
              Perfect Days
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HabitWeeklyGridV2;
