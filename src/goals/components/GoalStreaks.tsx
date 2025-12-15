import React from 'react';
import type { LifeGoal } from '../types/lifeGoals';

interface GoalStreaksProps {
  goal: LifeGoal;
  onGoalUpdated?: () => void;
}

export function GoalStreaks({ goal: _goal, onGoalUpdated: _onGoalUpdated }: GoalStreaksProps): React.ReactElement {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500">Goal streaks feature not yet implemented</p>
    </div>
  );
}

export default GoalStreaks;
