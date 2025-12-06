export type BudgetStatus = 'safe' | 'warning' | 'over';

export const getBudgetStatus = (percentage: number): BudgetStatus => {
  if (percentage >= 100) return 'over';
  if (percentage >= 80) return 'warning';
  return 'safe';
};
