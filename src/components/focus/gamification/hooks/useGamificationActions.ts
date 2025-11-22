import { Goal } from '../types';

interface UseGamificationActionsProps {
  onCreateGoal: (goal: Omit<Goal, 'id' | 'currentProgress' | 'status'>) => void;
  onJoinChallenge: (challengeId: string) => void;
  newGoal: Partial<Goal>;
  closeCreateGoal: () => void;
}

export const useGamificationActions = ({
  onCreateGoal,
  onJoinChallenge,
  newGoal,
  closeCreateGoal
}: UseGamificationActionsProps) => {
  const handleCreateGoal = () => {
    if (newGoal.title && newGoal.target) {
      onCreateGoal({
        title: newGoal.title,
        description: newGoal.description,
        type: newGoal.type as any,
        target: newGoal.target,
        startDate: new Date(),
        reward: newGoal.reward || 100,
        streak: 0,
        priority: newGoal.priority as any
      });
      closeCreateGoal();
    }
  };

  const handleJoinChallenge = (challengeId: string) => {
    onJoinChallenge(challengeId);
  };

  return {
    handleCreateGoal,
    handleJoinChallenge
  };
};
