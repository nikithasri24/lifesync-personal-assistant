import React from 'react';
import type { LifeGoal, LifeGoalMilestone } from '../types/lifeGoals';

interface GoalMilestonesProps {
  goal: LifeGoal;
  milestones?: LifeGoalMilestone[];
  onMilestonesUpdated?: (goal: LifeGoal, milestones: LifeGoalMilestone[]) => void;
}

export function GoalMilestones({ goal: _goal, milestones: _milestones, onMilestonesUpdated: _onMilestonesUpdated }: GoalMilestonesProps): React.ReactElement {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500">Goal milestones feature not yet implemented</p>
    </div>
  );
}

export default GoalMilestones;
