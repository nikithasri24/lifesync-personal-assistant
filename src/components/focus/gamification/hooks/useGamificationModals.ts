import { useState } from 'react';
import { type Goal } from '../types';

export const useGamificationModals = (): {
  showCreateGoal: boolean;
  newGoal: Partial<Goal>;
  openCreateGoal: () => void;
  closeCreateGoal: () => void;
  updateNewGoal: (updates: Partial<Goal>) => void;
  setNewGoal: React.Dispatch<React.SetStateAction<Partial<Goal>>>;
} => {
  const [showCreateGoal, setShowCreateGoal] = useState<boolean>(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'daily',
    priority: 'medium'
  });

  const openCreateGoal = (): void => setShowCreateGoal(true);
  const closeCreateGoal = (): void => {
    setShowCreateGoal(false);
    setNewGoal({ type: 'daily', priority: 'medium' });
  };

  const updateNewGoal = (updates: Partial<Goal>): void => {
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
