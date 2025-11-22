import { useState } from 'react';
import { Goal } from '../types';

export const useGamificationModals = () => {
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'daily',
    priority: 'medium'
  });

  const openCreateGoal = () => setShowCreateGoal(true);
  const closeCreateGoal = () => {
    setShowCreateGoal(false);
    setNewGoal({ type: 'daily', priority: 'medium' });
  };

  const updateNewGoal = (updates: Partial<Goal>) => {
    setNewGoal({ ...newGoal, ...updates });
  };

  return {
    showCreateGoal,
    newGoal,
    openCreateGoal,
    closeCreateGoal,
    updateNewGoal,
    setNewGoal
  };
};
