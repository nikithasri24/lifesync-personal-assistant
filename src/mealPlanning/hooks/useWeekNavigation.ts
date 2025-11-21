import { useState, useEffect, useMemo } from 'react';
import { addDays, startOfWeek, isSameWeek, format } from 'date-fns';
import type { MealPlanWeek } from '../../types';

export function useWeekNavigation(
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  mealPlans: MealPlanWeek[]
) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn })
  );
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isEnsuringPlan, setIsEnsuringPlan] = useState(false);

  // Re-align current week when weekStartsOn changes
  useEffect(() => {
    setCurrentWeekStart((prev) => startOfWeek(prev, { weekStartsOn }));
  }, [weekStartsOn]);

  // Find existing plan for current week
  useEffect(() => {
    const existingPlan = mealPlans.find((plan) =>
      isSameWeek(
        plan.weekStartDate instanceof Date ? plan.weekStartDate : new Date(plan.weekStartDate),
        currentWeekStart,
        { weekStartsOn }
      )
    );

    if (existingPlan) {
      setActivePlanId(existingPlan.id);
    } else {
      setActivePlanId(null);
    }
    setIsEnsuringPlan(false);
  }, [currentWeekStart, mealPlans, weekStartsOn]);

  const activePlan = useMemo(() => {
    if (activePlanId) {
      const plan = mealPlans.find((item) => item.id === activePlanId);
      if (plan) return plan;
    }

    return (
      mealPlans.find((plan) =>
        isSameWeek(
          plan.weekStartDate instanceof Date ? plan.weekStartDate : new Date(plan.weekStartDate),
          currentWeekStart,
          { weekStartsOn }
        )
      ) ?? null
    );
  }, [activePlanId, mealPlans, currentWeekStart, weekStartsOn]);

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(currentWeekStart, index)),
    [currentWeekStart]
  );

  const goToPreviousWeek = () => {
    setCurrentWeekStart((date) => addDays(date, -7));
  };

  const goToNextWeek = () => {
    setCurrentWeekStart((date) => addDays(date, 7));
  };

  const goToThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn }));
  };

  const goToWeek = (date: Date) => {
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn }));
  };

  return {
    currentWeekStart,
    setCurrentWeekStart,
    activePlan,
    activePlanId,
    weekDays,
    isEnsuringPlan,
    goToPreviousWeek,
    goToNextWeek,
    goToThisWeek,
    goToWeek,
  };
}
