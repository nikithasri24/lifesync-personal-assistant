/**
 * MealSectionV2 Component
 * Meal section with header, food items, and add button
 * Matches nutrition-design-spec.html exactly
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';
import { FoodItemV2 } from './FoodItemV2';

interface FoodEntry {
  id: string;
  name: string;
  servingInfo: string;
  calories: number;
  photoUrl?: string;
  emoji?: string;
}

interface MealSectionV2Props {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  mealLabel: string;
  mealIcon: string; // Emoji
  totalCalories: number;
  foodEntries: FoodEntry[];
  onAddFood: () => void;
  onFoodClick: (id: string) => void;
}

export const MealSectionV2: React.FC<MealSectionV2Props> = ({
  mealType,
  mealLabel,
  mealIcon,
  totalCalories,
  foodEntries,
  onAddFood,
  onFoodClick,
}) => {
  const colors = useThemeColors();

  return (
    <div
      style={{
        background: 'white',
        margin: '0 20px 12px',
        borderRadius: '16px',
        padding: '16px',
        boxShadow: '0 2px 12px rgba(92, 74, 58, 0.08)',
      }}
    >
      {/* Meal Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>{mealIcon}</span>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#5C4A3A' }}>
            {mealLabel}
          </span>
        </div>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#C18B5E' }}>
          {Math.round(totalCalories)} cal
        </div>
      </div>

      {/* Food Items */}
      {foodEntries.length > 0 && (
        <div style={{ marginBottom: '8px' }}>
          {foodEntries.map((food) => (
            <FoodItemV2
              key={food.id}
              id={food.id}
              name={food.name}
              servingInfo={food.servingInfo}
              calories={food.calories}
              photoUrl={food.photoUrl}
              emoji={food.emoji}
              onClick={() => onFoodClick(food.id)}
            />
          ))}
        </div>
      )}

      {/* Add Food Button */}
      <button
        onClick={onAddFood}
        className="w-full transition-all hover:bg-opacity-80"
        style={{
          padding: '10px',
          background: 'rgba(212, 165, 116, 0.1)',
          border: '2px dashed #D4A574',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: '600',
          color: '#C18B5E',
          cursor: 'pointer',
        }}
      >
        + Add Food
      </button>
    </div>
  );
};
