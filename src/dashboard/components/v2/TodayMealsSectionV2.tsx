/**
 * TodayMealsSectionV2
 * Dashboard card showing today's 4 meal slots with quick-log action.
 * Uses the fully-built QuickLogModal (session=null) and useTodaysMealLogsQuery.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useTodaysMealLogsQuery, useCreateMealLog } from '@/hooks/mealPlanning/useBatchCookQueries';
import { QuickLogModal } from '@/meals/components/v2/QuickLogModal';
import type { MealType } from '@/meals/types';
import { format } from 'date-fns';
import { useToast } from '@/hooks/useToast';

const MEAL_SLOTS: { type: MealType; emoji: string; label: string }[] = [
  { type: 'breakfast', emoji: '🍳', label: 'Breakfast' },
  { type: 'lunch',     emoji: '🥗', label: 'Lunch' },
  { type: 'dinner',    emoji: '🍽️', label: 'Dinner' },
  { type: 'snack',     emoji: '🍎', label: 'Snack' },
];

export const TodayMealsSectionV2: React.FC = () => {
  const colors = useThemeColors();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [openMealType, setOpenMealType] = useState<MealType | null>(null);

  const { data: todaysLogs = [] } = useTodaysMealLogsQuery();
  const createMealLog = useCreateMealLog();

  // Count logs per meal type for today
  const countByType = (type: MealType) =>
    todaysLogs.filter((log) => log.mealType === type).length;

  const handleLogSubmit = async (params: {
    batchDishId?: string;
    customName?: string;
    mealType: MealType;
    servingsConsumed: number;
    notes: string;
  }) => {
    await createMealLog.mutateAsync({
      loggedDate: format(new Date(), 'yyyy-MM-dd'),
      mealType: params.mealType,
      batchDishId: params.batchDishId,
      customName: params.customName,
      servingsConsumed: params.servingsConsumed,
      notes: params.notes || undefined,
    });
    showToast('Meal logged! 🍽️', 'success');
    setOpenMealType(null);
  };

  return (
    <div
      className="rounded-xl p-4 mb-4"
      style={{ backgroundColor: colors.bg.white, border: `1px solid ${colors.border.light}` }}
    >
      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold" style={{ color: colors.text.primary }}>
          Today's Meals
        </h3>
        <button
          type="button"
          onClick={() => navigate('/meals')}
          className="text-xs font-semibold transition-colors"
          style={{ color: '#C18B5E' }}
          aria-label="View all meals"
        >
          View all
        </button>
      </div>

      {/* 2x2 meal slot grid */}
      <div className="grid grid-cols-2 gap-2">
        {MEAL_SLOTS.map(({ type, emoji, label }) => {
          const count = countByType(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => setOpenMealType(type)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 transition-all text-left"
              style={{
                borderColor: count > 0 ? '#C18B5E' : colors.border.light,
                backgroundColor: count > 0 ? 'rgba(212,165,116,0.08)' : colors.bg.secondary,
              }}
              aria-label={`Log ${label}`}
            >
              <span className="text-lg">{emoji}</span>
              <div className="min-w-0">
                <p
                  className="text-xs font-semibold"
                  style={{ color: count > 0 ? '#C18B5E' : colors.text.secondary }}
                >
                  {label}
                </p>
                <p className="text-xs" style={{ color: colors.text.tertiary }}>
                  {count > 0 ? `${count} logged` : 'Tap to log'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* QuickLogModal — session=null forces custom (free-text) mode */}
      <QuickLogModal
        isOpen={openMealType !== null}
        session={null}
        preSelectedMealType={openMealType ?? undefined}
        onClose={() => setOpenMealType(null)}
        onSubmit={handleLogSubmit}
        isPending={createMealLog.isPending}
      />
    </div>
  );
};

export default TodayMealsSectionV2;
