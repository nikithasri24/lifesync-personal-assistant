/**
 * Goals Helper Functions
 */

import { addDays } from 'date-fns';
import type { GoalDraft, DreamDraft } from '../types/drafts';

/**
 * Create an empty goal draft with default values
 */
export const createGoalDraft = (): GoalDraft => ({
  title: '',
  description: '',
  category: 'personal',
  priority: 'medium',
  targetDate: addDays(new Date(), 30).toISOString().slice(0, 10),
});

/**
 * Create an empty dream draft with default values
 */
export const createDreamDraft = (): DreamDraft => ({
  title: '',
  description: '',
  category: 'travel',
  priority: 'someday',
  status: 'dreaming',
  estimatedCost: '',
  estimatedTimeframe: '',
});

/**
 * Map goal draft to API create input
 */
export const mapGoalDraftToCreateInput = (draft: GoalDraft) => {
  const targetDate = draft.targetDate ? new Date(draft.targetDate) : addDays(new Date(), 30);
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    priority: draft.priority,
    startDate: new Date().toISOString(),
    targetDate: targetDate.toISOString(),
    difficulty: 'medium' as const,
    currentValue: 0,
    targetValue: 100,
    unit: 'percent',
  };
};

/**
 * Map dream draft to API create input
 */
export const mapDreamDraftToCreateInput = (draft: DreamDraft) => {
  const estimatedCost = draft.estimatedCost.trim();
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    priority: draft.priority,
    status: draft.status,
    estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
    estimatedTimeframe: draft.estimatedTimeframe.trim() || undefined,
  };
};
