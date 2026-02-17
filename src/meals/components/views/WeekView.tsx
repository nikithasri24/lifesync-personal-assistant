/**
 * Week View Component
 * 7-day meal grid with fixed-size cells (72×88px)
 */

import React, { useMemo } from 'react';
import { format, isSameDay, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import { toKey, ensureDate } from '../../../mealPlanning/utils';
import type { PlannedMeal, Recipe } from '../../../types';
import { MealCell } from '../MealCell';

interface WeekViewProps {
  weekDays: Date[];
  mealsByDate: Record<string, PlannedMeal[]>;
  recipes: Recipe[];
  onPreviousWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
  onCellClick: (date: string, mealType: string) => void;
}

const MEAL_TYPES = [
  { id: 'breakfast', label: 'B', emoji: '🍳' },
  { id: 'lunch', label: 'L', emoji: '🥗' },
  { id: 'dinner', label: 'D', emoji: '🍽️' },
  { id: 'snack', label: 'S', emoji: '🍎' },
];

export function WeekView({
  weekDays,
  mealsByDate,
  recipes,
  onPreviousWeek,
  onNextWeek,
  onToday,
  onCellClick,
}: WeekViewProps) {
  const colors = useThemeColors();

  const dateRange = useMemo(() => {
    if (weekDays.length === 0) return '';
    const start = format(weekDays[0], 'MMM d');
    const end = format(weekDays[weekDays.length - 1], 'd');
    return `${start} - ${end}`;
  }, [weekDays]);

  const getMealForCell = (date: Date, mealType: string): { meal?: PlannedMeal; recipe?: Recipe } => {
    const dateKey = toKey(date);
    const mealsForDate = mealsByDate[dateKey] || [];
    const meal = mealsForDate.find((m) => m.mealType === mealType);
    const recipe = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;
    return { meal, recipe };
  };

  return (
    <div style={{ backgroundColor: colors.bg.primary, minHeight: '100vh', paddingBottom: '80px' }}>
      {/* Week Navigation */}
      <div className="px-6 py-4 sticky top-[116px] z-10" style={{ backgroundColor: colors.bg.primary }}>
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={onPreviousWeek}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: colors.bg.white,
              color: colors.text.primary,
            }}
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={onToday}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200"
              style={{
                backgroundColor: colors.bg.white,
                color: colors.text.primary,
              }}
              aria-label="Go to current week"
            >
              <Calendar size={16} />
              <span className="font-semibold text-sm">{dateRange}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onNextWeek}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              backgroundColor: colors.bg.white,
              color: colors.text.primary,
            }}
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Meal Grid */}
      <div className="px-6 overflow-x-auto">
        <div
          style={{
            width: '373px', // Fixed width: 4 columns × 72px + 3 gaps × 8px + padding
            margin: '0 auto',
          }}
        >
          {/* Column Headers */}
          <div className="flex gap-2 mb-3">
            <div style={{ width: '60px' }} /> {/* Day label column */}
            {MEAL_TYPES.map((type) => (
              <div
                key={type.id}
                style={{
                  width: '72px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.text.secondary,
                }}
              >
                {type.emoji}
              </div>
            ))}
          </div>

          {/* Rows (one per day) */}
          {weekDays.map((day) => {
            const dayIsToday = isToday(day);

            return (
              <div key={toKey(day)} className="flex gap-2 mb-2">
                {/* Day label */}
                <div
                  style={{
                    width: '60px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: dayIsToday ? 700 : 600,
                      color: dayIsToday ? colors.accent.start : colors.text.primary,
                    }}
                  >
                    {format(day, 'EEE')}
                  </div>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 700,
                      color: dayIsToday ? colors.accent.start : colors.text.secondary,
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                </div>

                {/* Meal cells */}
                {MEAL_TYPES.map((type) => {
                  const { meal, recipe } = getMealForCell(day, type.id);
                  const dateKey = toKey(day);

                  return (
                    <MealCell
                      key={`${dateKey}-${type.id}`}
                      meal={meal}
                      recipe={recipe}
                      isEmpty={!meal}
                      isToday={dayIsToday}
                      onClick={() => onCellClick(dateKey, type.id)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
