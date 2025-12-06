/**
 * Goal Progress Calculator
 * Provides smart recommendations and progress projections for financial goals
 */

import type { Goal, GoalProgressPoint, GoalRecommendation } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DAYS_PER_MONTH = 30.44; // Average days per month

/**
 * Calculate smart recommendation for a goal
 */
export function calculateGoalRecommendation(
  goal: Goal,
  progressHistory?: GoalProgressPoint[]
): GoalRecommendation {
  const now = new Date();
  const dueDate = new Date(goal.dueDateISO);
  const createdAt = goal.createdAtISO ? new Date(goal.createdAtISO) : now;

  // Calculate time metrics
  const totalDuration = dueDate.getTime() - createdAt.getTime();
  const elapsed = now.getTime() - createdAt.getTime();
  const remaining = dueDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(remaining / MS_PER_DAY));
  const monthsRemaining = Math.max(0, daysRemaining / DAYS_PER_MONTH);

  // Calculate amounts
  const totalNeeded = goal.targetAmount - goal.startingAmount;
  const progress = goal.currentAmount - goal.startingAmount;
  const stillNeeded = goal.targetAmount - goal.currentAmount;

  // Calculate required monthly contribution
  const requiredMonthlyContribution = monthsRemaining > 0
    ? stillNeeded / monthsRemaining
    : stillNeeded;

  // Calculate current rate from progress history
  let currentMonthlyRate = 0;
  if (progressHistory && progressHistory.length >= 2) {
    currentMonthlyRate = calculateAverageMonthlyRate(progressHistory);
  } else if (elapsed > 0) {
    // Fallback: calculate rate from starting amount to current
    const monthsElapsed = elapsed / (MS_PER_DAY * DAYS_PER_MONTH);
    currentMonthlyRate = monthsElapsed > 0 ? progress / monthsElapsed : 0;
  }

  // Project completion date at current rate
  const monthsToCompletion = currentMonthlyRate > 0
    ? stillNeeded / currentMonthlyRate
    : 999;
  const projectedCompletionISO = new Date(
    now.getTime() + monthsToCompletion * DAYS_PER_MONTH * MS_PER_DAY
  ).toISOString();

  // Determine status
  const progressPercentage = totalNeeded > 0 ? (progress / totalNeeded) * 100 : 0;
  const timePercentage = totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0;

  let status: 'ahead' | 'on-track' | 'behind' | 'at-risk';
  let message: string;

  if (progressPercentage >= 100) {
    status = 'ahead';
    message = `🎉 Goal reached! You're ${formatCurrency(goal.currentAmount - goal.targetAmount)} ahead!`;
  } else if (daysRemaining <= 0) {
    status = 'at-risk';
    message = `⚠️ Past due date. ${formatCurrency(stillNeeded)} still needed.`;
  } else if (progressPercentage >= timePercentage + 10) {
    status = 'ahead';
    message = `🚀 Ahead of schedule! You're ${Math.round(progressPercentage - timePercentage)}% ahead.`;
  } else if (progressPercentage >= timePercentage - 10) {
    status = 'on-track';
    message = `✓ On track. Save ${formatCurrency(requiredMonthlyContribution)}/month to reach your goal.`;
  } else if (daysRemaining < 90) {
    status = 'at-risk';
    message = `⚠️ Behind schedule with ${daysRemaining} days left. Need ${formatCurrency(requiredMonthlyContribution)}/month.`;
  } else {
    status = 'behind';
    message = `↓ Behind schedule. Increase to ${formatCurrency(requiredMonthlyContribution)}/month to catch up.`;
  }

  const onTrack = status === 'ahead' || status === 'on-track';

  return {
    requiredMonthlyContribution,
    onTrack,
    projectedCompletionISO,
    daysRemaining,
    monthsRemaining,
    status,
    message,
  };
}

/**
 * Calculate average monthly contribution rate from progress history
 */
function calculateAverageMonthlyRate(history: GoalProgressPoint[]): number {
  if (history.length < 2) return 0;

  // Sort by date
  const sorted = [...history].sort((a, b) =>
    new Date(a.dateISO).getTime() - new Date(b.dateISO).getTime()
  );

  // Calculate total change and time span
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalChange = last.amount - first.amount;
  const timeSpan = new Date(last.dateISO).getTime() - new Date(first.dateISO).getTime();
  const monthsSpan = timeSpan / (MS_PER_DAY * DAYS_PER_MONTH);

  return monthsSpan > 0 ? totalChange / monthsSpan : 0;
}

/**
 * Generate expected progress path (linear projection)
 */
export function generateExpectedPath(
  goal: Goal,
  numPoints: number = 12
): GoalProgressPoint[] {
  const createdAt = goal.createdAtISO ? new Date(goal.createdAtISO) : new Date();
  const dueDate = new Date(goal.dueDateISO);
  const totalDuration = dueDate.getTime() - createdAt.getTime();
  const totalIncrease = goal.targetAmount - goal.startingAmount;

  const points: GoalProgressPoint[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints; // 0 to 1
    const dateISO = new Date(createdAt.getTime() + t * totalDuration).toISOString();
    const amount = goal.startingAmount + t * totalIncrease;
    points.push({ dateISO, amount, note: 'Expected' });
  }

  return points;
}

/**
 * Generate projected progress path based on current rate
 */
export function generateProjectedPath(
  goal: Goal,
  currentMonthlyRate: number,
  numPoints: number = 12
): GoalProgressPoint[] {
  const now = new Date();
  const dueDate = new Date(goal.dueDateISO);
  const monthsRemaining = Math.max(0, (dueDate.getTime() - now.getTime()) / (MS_PER_DAY * DAYS_PER_MONTH));

  const points: GoalProgressPoint[] = [];
  const monthsPerPoint = monthsRemaining / numPoints;

  for (let i = 0; i <= numPoints; i++) {
    const monthsAhead = i * monthsPerPoint;
    const dateISO = new Date(now.getTime() + monthsAhead * DAYS_PER_MONTH * MS_PER_DAY).toISOString();
    const amount = Math.min(goal.targetAmount, goal.currentAmount + monthsAhead * currentMonthlyRate);
    points.push({ dateISO, amount, note: 'Projected' });
  }

  return points;
}

/**
 * Format currency for display
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate progress percentage
 */
export function calculateProgressPercentage(goal: Goal): number {
  const totalNeeded = goal.targetAmount - goal.startingAmount;
  const progress = goal.currentAmount - goal.startingAmount;
  return totalNeeded > 0 ? Math.min(100, Math.max(0, (progress / totalNeeded) * 100)) : 0;
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: GoalRecommendation['status']): {
  bg: string;
  text: string;
  ring: string;
  progress: string;
} {
  switch (status) {
    case 'ahead':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-900',
        ring: 'ring-emerald-200',
        progress: '#10b981', // emerald-500
      };
    case 'on-track':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-900',
        ring: 'ring-blue-200',
        progress: '#3b82f6', // blue-500
      };
    case 'behind':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-900',
        ring: 'ring-amber-200',
        progress: '#f59e0b', // amber-500
      };
    case 'at-risk':
      return {
        bg: 'bg-red-50',
        text: 'text-red-900',
        ring: 'ring-red-200',
        progress: '#ef4444', // red-500
      };
  }
}
