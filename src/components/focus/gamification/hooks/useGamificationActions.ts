import { type Goal } from '../types';

interface UseGamificationActionsProps {
  onCreateGoal: (goal: Omit<Goal, 'id' | 'currentProgress' | 'status'>) => void;
  onJoinChallenge: (challengeId: string) => void;
  newGoal: Partial<Goal>;
  closeCreateGoal: () => void;
}

interface UseGamificationActionsReturn {
  handleCreateGoal: () => void;
  handleJoinChallenge: (challengeId: string) => void;
}

export const useGamificationActions = ({
  onCreateGoal,
  onJoinChallenge,
  newGoal,
  closeCreateGoal
}: UseGamificationActionsProps): UseGamificationActionsReturn => {
  const handleCreateGoal = (): void => {
    if (newGoal.title && newGoal.target) {
      onCreateGoal({
        title: newGoal.title,
        description: newGoal.description,
        type: newGoal.type ?? 'daily',
        target: newGoal.target,
        startDate: new Date(),
        reward: newGoal.reward ?? 100,
        streak: 0,
        priority: newGoal.priority ?? 'medium'
      });
      closeCreateGoal();
    }
  };

  const handleJoinChallenge = (challengeId: string): void => {
    onJoinChallenge(challengeId);
  };

  return {
    handleCreateGoal,
    handleJoinChallenge
  };
};
