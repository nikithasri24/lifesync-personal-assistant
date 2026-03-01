// ==================== Query Keys ====================

export const lifeGoalsKeys = {
  all: ['lifeGoals'] as const,
  goals: () => [...lifeGoalsKeys.all, 'goals'] as const,
  goal: (id: string) => [...lifeGoalsKeys.all, 'goal', id] as const,
  dreams: () => [...lifeGoalsKeys.all, 'dreams'] as const,
  dream: (id: string) => [...lifeGoalsKeys.all, 'dream', id] as const,
  templates: () => [...lifeGoalsKeys.all, 'templates'] as const,
  checkins: (goalId: string) => [...lifeGoalsKeys.all, 'checkins', goalId] as const,
  // Merged mode keys
  mergedConnection: () => [...lifeGoalsKeys.all, 'mergedConnection'] as const,
  progressTracking: (goalIds: string[]) => [...lifeGoalsKeys.all, 'progressTracking', goalIds.sort().join(',')] as const,
  partnerProgress: (goalIds: string[], partnerId: string) => [...lifeGoalsKeys.all, 'partnerProgress', partnerId, goalIds.sort().join(',')] as const,
};
