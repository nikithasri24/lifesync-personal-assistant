/**
 * Meal Cell Component
 * Fixed-size 72×88px cell for the week grid view
 */

import React from 'react';
import { useThemeColors } from '../../hooks/useThemeColors';
import type { PlannedMeal, Recipe } from '../../types';

interface MealCellProps {
  meal?: PlannedMeal;
  recipe?: Recipe;
  isEmpty?: boolean;
  isToday?: boolean;
  onClick: () => void;
}

const MEAL_TYPE_EMOJIS: Record<string, string> = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
};

export function MealCell({ meal, recipe, isEmpty, isToday, onClick }: MealCellProps) {
  const colors = useThemeColors();

  // Status color based on meal status
  const getStatusColor = () => {
    if (!meal) return colors.border.light;
    switch (meal.status) {
      case 'logged':
        return '#10B981'; // Green
      case 'planned':
        return colors.accent.start; // Terracotta
      case 'skipped':
        return '#EF4444'; // Red
      default:
        return colors.border.light;
    }
  };

  const displayName = meal?.customName || recipe?.name || '';
  const calories = recipe?.nutritionInfo?.calories;
  const emoji = meal?.mealType ? MEAL_TYPE_EMOJIS[meal.mealType] : '';

  return (
    <div
      onClick={onClick}
      className="cursor-pointer transition-all duration-200 active:scale-95"
      style={{
        width: '72px',
        height: '88px',
        padding: '6px',
        backgroundColor: isEmpty ? 'transparent' : colors.bg.white,
        border: `2px solid ${isToday && !isEmpty ? colors.accent.start : 'transparent'}`,
        borderRadius: '12px',
        boxShadow: isEmpty ? 'none' : '0 2px 4px rgba(139, 111, 71, 0.06)',
        position: 'relative',
      }}
    >
      {!isEmpty && meal && (
        <>
          {/* Status dot */}
          <div
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: getStatusColor(),
            }}
          />

          {/* Emoji */}
          <div
            style={{
              fontSize: '18px',
              lineHeight: '18px',
              textAlign: 'center',
              marginBottom: '4px',
            }}
          >
            {emoji}
          </div>

          {/* Meal name */}
          <div
            style={{
              fontSize: '9px',
              lineHeight: '10px',
              color: colors.text.primary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              marginBottom: '4px',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            {displayName}
          </div>

          {/* Calorie badge */}
          {calories && (
            <div
              style={{
                fontSize: '7px',
                lineHeight: '12px',
                padding: '2px 4px',
                borderRadius: '4px',
                backgroundColor: colors.badge.bg,
                color: colors.badge.text,
                textAlign: 'center',
                fontWeight: 600,
              }}
            >
              {calories}
            </div>
          )}
        </>
      )}

      {isEmpty && (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px',
            color: colors.text.tertiary,
            opacity: 0.3,
          }}
        >
          +
        </div>
      )}
    </div>
  );
}
