/**
 * NutritionSummaryV2 Component
 * Display nutrition totals with progress bars
 * Shows macros: calories, protein, carbs, fat, fiber, sugar
 */

import React from 'react';
import { useThemeColors } from '@/hooks/useThemeColors';

interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
}

interface NutritionSummaryV2Props {
  nutrition: NutritionInfo;
  dailyGoals?: NutritionInfo;
}

export const NutritionSummaryV2: React.FC<NutritionSummaryV2Props> = ({
  nutrition,
  dailyGoals,
}) => {
  const colors = useThemeColors();

  const nutrients = [
    { key: 'calories' as keyof NutritionInfo, label: 'Calories', unit: 'cal', color: '#C18B5E' },
    { key: 'protein' as keyof NutritionInfo, label: 'Protein', unit: 'g', color: '#3B82F6' },
    { key: 'carbs' as keyof NutritionInfo, label: 'Carbs', unit: 'g', color: '#F59E0B' },
    { key: 'fat' as keyof NutritionInfo, label: 'Fat', unit: 'g', color: '#EF4444' },
    { key: 'fiber' as keyof NutritionInfo, label: 'Fiber', unit: 'g', color: '#10B981' },
    { key: 'sugar' as keyof NutritionInfo, label: 'Sugar', unit: 'g', color: '#EC4899' },
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-bold mb-4" style={{ color: colors.text.primary }}>
        Nutrition Summary
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {nutrients.map(({ key, label, unit, color }) => {
          const value = nutrition[key] || 0;
          const goal = dailyGoals?.[key];
          const percentage = goal ? (value / goal) * 100 : 0;

          return (
            <div
              key={key}
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: colors.bg.white,
                borderColor: colors.border.light,
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold" style={{ color: colors.text.secondary }}>
                  {label}
                </span>
                {goal && (
                  <span className="text-xs" style={{ color: colors.text.tertiary }}>
                    {percentage.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold mb-2" style={{ color }}>
                {value.toFixed(0)}
                <span className="text-sm font-normal ml-1" style={{ color: colors.text.tertiary }}>
                  {unit}
                </span>
              </div>
              {goal && (
                <div
                  className="w-full h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: colors.border.light }}
                >
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NutritionSummaryV2;
