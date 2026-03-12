/**
 * Today View - Daily meal focus with logging
 * Shows today's meals organized by meal type with quick logging
 */

import React from 'react';
import { ChefHat, Plus } from 'lucide-react';
import { useThemeColors } from '../../../hooks/useThemeColors';
import type { PlannedMeal, Recipe } from '../../../types';
import { format } from 'date-fns';

interface TodayViewProps {
  todaysMeals: PlannedMeal[];
  recipes: Recipe[];
  onAddMeal: (mealType: string) => void;
  onLogMeal: (mealId: string) => void;
  onEditMeal: (meal: PlannedMeal) => void;
}

export function TodayView({
  todaysMeals,
  recipes,
  onAddMeal,
  onLogMeal,
  onEditMeal,
}: TodayViewProps) {
  const colors = useThemeColors();

  const mealTypes = [
    { id: 'breakfast', label: 'Breakfast', emoji: '🍳' },
    { id: 'lunch', label: 'Lunch', emoji: '🥗' },
    { id: 'dinner', label: 'Dinner', emoji: '🍽️' },
    { id: 'snack', label: 'Snacks', emoji: '🍎' },
  ];

  const getMealsForType = (mealType: string) => {
    return todaysMeals.filter(m => m.mealType === mealType);
  };

  const getRecipeForMeal = (meal: PlannedMeal): Recipe | null => {
    if (!meal.recipeId) return null;
    return recipes.find(r => r.id === meal.recipeId) || null;
  };

  return (
    <div className="px-5 py-4" style={{ paddingBottom: '140px' }}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-1" style={{ color: colors.text.primary }}>
          {format(new Date(), 'EEEE, MMM dd')}
        </h2>
        <p className="text-sm" style={{ color: colors.text.tertiary }}>
          Plan and log your meals for today
        </p>
      </div>

      {/* Meal Type Sections */}
      <div className="space-y-4">
        {mealTypes.map(({ id, label, emoji }) => {
          const meals = getMealsForType(id);

          return (
            <div
              key={id}
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: colors.bg.white,
                boxShadow: '0 2px 8px rgba(139, 111, 71, 0.06)',
              }}
            >
              {/* Section Header */}
              <div
                className="flex items-center justify-between px-4 py-3 border-b"
                style={{
                  backgroundColor: colors.bg.primary,
                  borderColor: colors.border.light,
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emoji}</span>
                  <h3 className="font-semibold text-base" style={{ color: colors.text.primary }}>
                    {label}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => onAddMeal(id)}
                  className="p-2 rounded-lg transition-colors duration-200"
                  style={{
                    backgroundColor: 'rgba(212, 165, 116, 0.1)',
                    color: colors.accent.start,
                  }}
                  aria-label={`Add ${label.toLowerCase()}`}
                >
                  <Plus size={18} />
                </button>
              </div>

              {/* Meals List */}
              {meals.length === 0 ? (
                <div
                  className="px-4 py-6 text-center"
                  style={{ color: colors.text.tertiary }}
                >
                  <p className="text-sm">No meal planned yet</p>
                  <button
                    type="button"
                    onClick={() => onAddMeal(id)}
                    className="mt-2 text-sm font-medium"
                    style={{ color: colors.accent.start }}
                  >
                    Add {label.toLowerCase()}
                  </button>
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: colors.border.light }}>
                  {meals.map((meal) => {
                    const recipe = getRecipeForMeal(meal);
                    const displayName = meal.customName || recipe?.name || 'Unnamed meal';
                    const isLogged = meal.status === 'logged';

                    return (
                      <div
                        key={meal.id}
                        onClick={() => onEditMeal(meal)}
                        className="px-4 py-3 cursor-pointer hover:bg-opacity-50 transition-colors duration-200"
                        style={{
                          backgroundColor: isLogged ? 'rgba(212, 165, 116, 0.05)' : 'transparent',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p
                              className="font-medium truncate"
                              style={{
                                color: isLogged ? colors.text.secondary : colors.text.primary,
                              }}
                            >
                              {displayName}
                            </p>
                            {recipe?.nutritionInfo?.calories && (
                              <p className="text-xs mt-0.5" style={{ color: colors.text.tertiary }}>
                                {recipe.nutritionInfo.calories} cal
                              </p>
                            )}
                          </div>

                          {!isLogged && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLogMeal(meal.id);
                              }}
                              className="ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 active:scale-95"
                              style={{
                                background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                                color: 'white',
                              }}
                            >
                              Log
                            </button>
                          )}

                          {isLogged && (
                            <div
                              className="ml-3 w-2 h-2 rounded-full"
                              style={{ backgroundColor: '#10B981' }}
                              title="Logged"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State — only shown when no meals exist at all, not alongside per-section empties */}
      {/* Intentionally removed: per-section "No meal planned yet" messages already communicate this */}
    </div>
  );
}
