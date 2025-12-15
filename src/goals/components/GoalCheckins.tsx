import React from 'react';
import type { LifeGoal } from '../types/lifeGoals';

interface GoalCheckinsProps {
  goal: LifeGoal;
}

export function GoalCheckins({ goal: _goal }: GoalCheckinsProps): React.ReactElement {
  return (
    <div className="p-4">
      <p className="text-sm text-gray-500">Goal check-ins feature not yet implemented</p>
    </div>
  );
}

export default GoalCheckins;
