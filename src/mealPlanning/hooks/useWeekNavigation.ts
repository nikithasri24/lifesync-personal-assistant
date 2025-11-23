import { useState, useEffect, useMemo } from 'react';
import { addDays, startOfWeek, isSameWeek } from 'date-fns';
import type { MealPlanWeek } from '../../types';

export function useWeekNavigation(
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  mealPlans: MealPlanWeek[]
): {
  currentWeekStart: Date;
  setCurrentWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  activePlan: MealPlanWeek | null;
  activePlanId: string | null;
  weekDays: Date[];
  isEnsuringPlan: boolean;
  goToPreviousWeek: () => void;
  goToNextWeek: () => void;
  goToThisWeek: () => void;
  goToWeek: (date: Date) => void;
} {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(new Date(), { weekStartsOn })
  );
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [isEnsuringPlan, setIsEnsuringPlan] = useState<boolean>(false);

  // Re-align current week when weekStartsOn changes
  useEffect(() => {
    setCurrentWeekStart((prev: Date) => startOfWeek(prev, { weekStartsOn }));
  }, [weekStartsOn]);

  // Find existing plan for current week
  useEffect(() => {
    const existingPlan: MealPlanWeek | undefined = mealPlans.find((plan: MealPlanWeek) =>
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

  const activePlan: MealPlanWeek | null = useMemo(() => {
    if (activePlanId) {
      const plan: MealPlanWeek | undefined = mealPlans.find((item: MealPlanWeek) => item.id === activePlanId);
      if (plan) return plan;
    }

    return (
      mealPlans.find((plan: MealPlanWeek) =>
        isSameWeek(
          plan.weekStartDate instanceof Date ? plan.weekStartDate : new Date(plan.weekStartDate),
          currentWeekStart,
          { weekStartsOn }
        )
      ) ?? null
    );
  }, [activePlanId, mealPlans, currentWeekStart, weekStartsOn]);

  const weekDays: Date[] = useMemo(
    () => Array.from({ length: 7 }, (_, index: number) => addDays(currentWeekStart, index)),
    [currentWeekStart]
  );

  const goToPreviousWeek = (): void => {
    setCurrentWeekStart((date: Date) => addDays(date, -7));
  };

  const goToNextWeek = (): void => {
    setCurrentWeekStart((date: Date) => addDays(date, 7));
  };

  const goToThisWeek = (): void => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn }));
  };

  const goToWeek = (date: Date): void => {
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
