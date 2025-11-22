import { Goal } from '../types';

export const getGoalProgress = (goal: Goal): number => {
  return Math.min((goal.currentProgress / goal.target.value) * 100, 100);
};
