/**
 * Goals Draft Types
 * Form state types for creating/editing goals and dreams
 */

import type { LifeGoal, LifeDream } from './lifeGoals';

export type GoalDraft = {
  title: string;
  description: string;
  category: LifeGoal['category'];
  priority: LifeGoal['priority'];
  targetDate: string;
};

export type DreamDraft = {
  title: string;
  description: string;
  category: LifeDream['category'];
  priority: LifeDream['priority'];
  status: LifeDream['status'];
  estimatedCost: string;
  estimatedTimeframe: string;
};
