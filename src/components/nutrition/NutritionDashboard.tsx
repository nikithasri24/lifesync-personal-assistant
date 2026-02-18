/**
 * Nutrition Dashboard Component
 * Shows daily summary, macro breakdown, and weekly trends
 */

import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Settings } from 'lucide-react';
import { useDailyLogQuery, useNutritionGoalQuery, useSetNutritionGoalMutation } from '@/hooks/useNutritionQuery';
import ErrorState from '@/components/ErrorState';
import { useThemeColors } from '@/hooks/useThemeColors';
import { CalorieSummaryV2, MacroProgressV2, NutritionStatsV2, WeeklyChartV2 } from '@/nutrition/components/v2';

export function NutritionDashboard(): React.ReactElement {
  const colors = useThemeColors();
  const today = format(new Date(), 'yyyy-MM-dd');
  const {
    data: dailyLog = [],
    error: dailyLogError,
    refetch: refetchDailyLog,
  } = useDailyLogQuery(today);
  const {
    data: goal,
    error: goalError,
    refetch: refetchGoal,
  } = useNutritionGoalQuery();
  const setGoalMutation = useSetNutritionGoalMutation();

  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [goalForm, setGoalForm] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
  });

  // Calculate today's totals
  const totals = dailyLog.reduce(
    (acc, entry) => ({
      calories: acc.calories + entry.calories,
      protein: acc.protein + entry.protein_g,
      carbs: acc.carbs + entry.carbs_g,
      fat: acc.fat + entry.fat_g,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate remaining
  const remaining = goal ? {
    calories: Math.max(0, goal.calories_target - totals.calories),
    protein: Math.max(0, goal.protein_target_g - totals.protein),
    carbs: Math.max(0, goal.carbs_target_g - totals.carbs),
    fat: Math.max(0, goal.fat_target_g - totals.fat),
  } : null;

  const handleSaveGoal = async () => {
    await setGoalMutation.mutateAsync({
      calories_target: goalForm.calories,
      protein_target_g: goalForm.protein,
      carbs_target_g: goalForm.carbs,
      fat_target_g: goalForm.fat,
    });
    setShowGoalSettings(false);
  };

  if (dailyLogError || goalError) {
    return (
      <ErrorState
        error={dailyLogError ?? goalError}
        onRetry={() => {
          void refetchDailyLog();
          void refetchGoal();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Button */}
      <div className="flex justify-end px-5">
        <button
          onClick={() => {
            setGoalForm({
              calories: goal?.calories_target || 2000,
              protein: goal?.protein_target_g || 150,
              carbs: goal?.carbs_target_g || 200,
              fat: goal?.fat_target_g || 65,
            });
            setShowGoalSettings(true);
          }}
          className="p-2 rounded-lg transition-all duration-200 active:scale-95"
          style={{ backgroundColor: colors.bg.secondary }}
          aria-label="Edit nutrition goals"
        >
          <Settings className="w-5 h-5" style={{ color: colors.text.primary }} />
        </button>
      </div>

      {/* Calorie Summary */}
      {goal && <CalorieSummaryV2 consumed={totals.calories} goal={goal.calories_target} />}

      {/* Macro Progress */}
      {goal && (
        <MacroProgressV2
          macros={{
            protein: { current: totals.protein, goal: goal.protein_target_g },
            carbs: { current: totals.carbs, goal: goal.carbs_target_g },
            fat: { current: totals.fat, goal: goal.fat_target_g },
          }}
        />
      )}

      {/* Weekly Stats */}
      <NutritionStatsV2
        dayStreak={7}
        avgCalories={totals.calories}
        avgProtein={totals.protein}
        goalHitRate={75}
      />

      {/* Weekly Chart */}
      <WeeklyChartV2
        weekData={[
          { day: 'Mon', calories: 1800 },
          { day: 'Tue', calories: 2100 },
          { day: 'Wed', calories: 1950 },
          { day: 'Thu', calories: 2050 },
          { day: 'Fri', calories: 1900 },
          { day: 'Sat', calories: 2200 },
          { day: 'Sun', calories: totals.calories },
        ]}
        maxCalories={goal?.calories_target || 2000}
      />

      {/* Goal Settings Modal */}
      {showGoalSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div
            className="rounded-xl p-6 w-full max-w-md space-y-4"
            style={{ backgroundColor: colors.bg.white }}
          >
            <h3 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              Set Nutrition Goals
            </h3>
            <div>
              <label className="text-sm" style={{ color: colors.text.secondary }}>
                Daily Calories
              </label>
              <input
                type="number"
                value={goalForm.calories}
                onChange={e => setGoalForm(f => ({ ...f, calories: +e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.bg.white,
                  color: colors.text.primary,
                }}
              />
            </div>
            <div>
              <label className="text-sm" style={{ color: colors.text.secondary }}>
                Protein (g)
              </label>
              <input
                type="number"
                value={goalForm.protein}
                onChange={e => setGoalForm(f => ({ ...f, protein: +e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.bg.white,
                  color: colors.text.primary,
                }}
              />
            </div>
            <div>
              <label className="text-sm" style={{ color: colors.text.secondary }}>
                Carbs (g)
              </label>
              <input
                type="number"
                value={goalForm.carbs}
                onChange={e => setGoalForm(f => ({ ...f, carbs: +e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.bg.white,
                  color: colors.text.primary,
                }}
              />
            </div>
            <div>
              <label className="text-sm" style={{ color: colors.text.secondary }}>
                Fat (g)
              </label>
              <input
                type="number"
                value={goalForm.fat}
                onChange={e => setGoalForm(f => ({ ...f, fat: +e.target.value }))}
                className="w-full mt-1 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  border: `1px solid ${colors.border.light}`,
                  backgroundColor: colors.bg.white,
                  color: colors.text.primary,
                }}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowGoalSettings(false)}
                className="flex-1 py-2 rounded-lg transition-all duration-200 active:scale-95"
                style={{
                  border: `1px solid ${colors.border.light}`,
                  color: colors.text.primary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGoal}
                className="flex-1 py-2 text-white rounded-lg transition-all duration-200 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${colors.accent.start} 0%, ${colors.accent.end} 100%)`,
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
