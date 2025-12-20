/**
 * Nutrition Dashboard Component
 * Shows daily summary, macro breakdown, and weekly trends
 */

import React, { useState } from 'react';
import { format, subDays } from 'date-fns';
import { TrendingUp, Target, Flame, Beef, Wheat, Droplet, Settings } from 'lucide-react';
import { MacroProgressBar } from './MacroProgressBar';
import { useDailyLogQuery, useNutritionGoalQuery, useSetNutritionGoalMutation } from '@/hooks/useNutritionQuery';

export function NutritionDashboard(): React.ReactElement {
  const today = format(new Date(), 'yyyy-MM-dd');
  const { data: dailyLog = [] } = useDailyLogQuery(today);
  const { data: goal } = useNutritionGoalQuery();
  const setGoalMutation = useSetNutritionGoalMutation();
  
  const [showGoalSettings, setShowGoalSettings] = useState(false);
  const [goalForm, setGoalForm] = useState({
    calories: goal?.calories_target || 2000,
    protein: goal?.protein_target_g || 150,
    carbs: goal?.carbs_target_g || 200,
    fat: goal?.fat_target_g || 65,
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

  return (
    <div className="space-y-6">
      {/* Today's Summary */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold opacity-90">Today's Nutrition</h3>
          <button onClick={() => setShowGoalSettings(true)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="12" />
              <circle
                cx="64" cy="64" r="56" fill="none" stroke="white" strokeWidth="12"
                strokeDasharray={`${(totals.calories / (goal?.calories_target || 2000)) * 352} 352`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{Math.round(totals.calories)}</span>
              <span className="text-sm opacity-80">/ {goal?.calories_target || 2000}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/10 rounded-xl p-3">
            <Beef className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <div className="text-xl font-bold">{Math.round(totals.protein)}g</div>
            <div className="text-xs opacity-70">Protein</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <Wheat className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <div className="text-xl font-bold">{Math.round(totals.carbs)}g</div>
            <div className="text-xs opacity-70">Carbs</div>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <Droplet className="w-5 h-5 mx-auto mb-1 opacity-80" />
            <div className="text-xl font-bold">{Math.round(totals.fat)}g</div>
            <div className="text-xs opacity-70">Fat</div>
          </div>
        </div>

        {remaining && remaining.calories > 0 && (
          <div className="mt-4 text-center text-sm opacity-80">
            {remaining.calories} calories remaining today
          </div>
        )}
      </div>

      {/* Goal Progress */}
      {goal && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target className="w-5 h-5 text-indigo-600" />
            Goal Progress
          </h3>
          <MacroProgressBar
            label="Calories"
            current={totals.calories}
            target={goal.calories_target}
            unit="cal"
            color="#f97316"
            icon={<Flame className="w-4 h-4 text-orange-500" />}
          />
          <MacroProgressBar label="Protein" current={totals.protein} target={goal.protein_target_g} unit="g" color="#ef4444" icon={<Beef className="w-4 h-4 text-red-500" />} />
          <MacroProgressBar label="Carbs" current={totals.carbs} target={goal.carbs_target_g} unit="g" color="#3b82f6" icon={<Wheat className="w-4 h-4 text-blue-500" />} />
          <MacroProgressBar label="Fat" current={totals.fat} target={goal.fat_target_g} unit="g" color="#eab308" icon={<Droplet className="w-4 h-4 text-yellow-500" />} />
        </div>
      )}

      {/* Goal Settings Modal */}
      {showGoalSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Set Nutrition Goals</h3>
            <div>
              <label className="text-sm text-gray-600">Daily Calories</label>
              <input type="number" value={goalForm.calories} onChange={e => setGoalForm(f => ({ ...f, calories: +e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Protein (g)</label>
              <input type="number" value={goalForm.protein} onChange={e => setGoalForm(f => ({ ...f, protein: +e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Carbs (g)</label>
              <input type="number" value={goalForm.carbs} onChange={e => setGoalForm(f => ({ ...f, carbs: +e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Fat (g)</label>
              <input type="number" value={goalForm.fat} onChange={e => setGoalForm(f => ({ ...f, fat: +e.target.value }))} className="w-full mt-1 px-3 py-2 border rounded-lg" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowGoalSettings(false)} className="flex-1 py-2 border border-gray-300 rounded-lg">Cancel</button>
              <button onClick={handleSaveGoal} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

