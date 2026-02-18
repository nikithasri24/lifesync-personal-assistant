/**
 * CalendarGridV2 Component
 * Weekly calendar grid for meal planning
 * 7 days × 4 meal types with click-to-add functionality
 */

import React from 'react';
import { format, addDays, startOfWeek, isSameDay, isToday } from 'date-fns';
import { useThemeColors } from '@/hooks/useThemeColors';
import { MealCardV2 } from './MealCardV2';

interface PlannedMeal {
  id: string;
  date: string;
  mealType: string;
  recipeName?: string;
  customName?: string;
  servings?: number;
  status?: 'planned' | 'logged' | 'skipped';
}

interface CalendarGridV2Props {
  currentDate: Date;
  plannedMeals: PlannedMeal[];
  onMealClick: (meal: PlannedMeal) => void;
  onCellClick: (date: Date, mealType: string) => void;
}

export const CalendarGridV2: React.FC<CalendarGridV2Props> = ({
  currentDate,
  plannedMeals,
  onMealClick,
  onCellClick,
}) => {
  const colors = useThemeColors();
  const weekStart = startOfWeek(currentDate);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const mealTypes = [
    { key: 'breakfast', emoji: '🍳', label: 'Breakfast' },
    { key: 'lunch', emoji: '🥗', label: 'Lunch' },
    { key: 'dinner', emoji: '🍽️', label: 'Dinner' },
    { key: 'snack', emoji: '🍎', label: 'Snack' },
  ];

  const getMealsForDateAndType = (date: Date, mealType: string) => {
    return plannedMeals.filter(
      meal => isSameDay(new Date(meal.date), date) && meal.mealType === mealType
    );
  };

  return (
    <div className="mb-6">
      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="text-center py-2 rounded-lg"
            style={{
              backgroundColor: isToday(day) ? colors.bg.tertiary : 'transparent',
            }}
          >
            <div className="text-xs font-semibold" style={{ color: colors.text.tertiary }}>
              {format(day, 'EEE')}
            </div>
            <div className="text-lg font-bold" style={{ color: isToday(day) ? '#C18B5E' : colors.text.primary }}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Meal Grid */}
      {mealTypes.map((mealType) => (
        <div key={mealType.key} className="mb-4">
          {/* Meal Type Row Header */}
          <div className="text-sm font-bold mb-2 capitalize" style={{ color: colors.text.secondary }}>
            {mealType.emoji} {mealType.label}
          </div>

          {/* Day Cells for this meal type */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const meals = getMealsForDateAndType(day, mealType.key);
              return (
                <div
                  key={`${day.toISOString()}-${mealType.key}`}
                  onClick={() => meals.length === 0 && onCellClick(day, mealType.key)}
                  className="min-h-[80px] p-2 rounded-xl border cursor-pointer hover:border-terracotta-400 transition-colors"
                  style={{
                    backgroundColor: colors.bg.white,
                    borderColor: colors.border.light,
                  }}
                >
                  {meals.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs pt-6">+</div>
                  ) : (
                    <div className="space-y-1">
                      {meals.map((meal) => (
                        <MealCardV2
                          key={meal.id}
                          meal={meal}
                          onClick={() => onMealClick(meal)}
                          compact
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CalendarGridV2;
