/**
 * Gamification Hub
 *
 * Complete gamification system with achievements, goals, XP, levels,
 * streaks, challenges, and social features to motivate users.
 */

import React, { useState } from 'react';
import { UserProfile, Goal, TabType } from './types';
import {
  GamificationHeader,
  GamificationTabs,
  OverviewTab,
  AchievementsTab,
  GoalsTab,
  ChallengesTab,
  LeaderboardTab,
  CreateGoalModal
} from './components';
import {
  useGamificationState,
  useGamificationModals,
  useGamificationActions
} from './hooks';

interface Props {
  userProfile: UserProfile;
  onCreateGoal: (goal: Omit<Goal, 'id' | 'currentProgress' | 'status'>) => void;
  onJoinChallenge: (challengeId: string) => void;
}

export const GamificationHub: React.FC<Props> = ({
  userProfile,
  onCreateGoal,
  onJoinChallenge
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { achievements, goals, challenges } = useGamificationState();

  const {
    showCreateGoal,
    newGoal,
    openCreateGoal,
    closeCreateGoal,
    updateNewGoal
  } = useGamificationModals();

  const { handleCreateGoal, handleJoinChallenge } = useGamificationActions({
    onCreateGoal,
    onJoinChallenge,
    newGoal,
    closeCreateGoal
  });

  return (
    <div className="space-y-6">
      <GamificationHeader userProfile={userProfile} />

      <GamificationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'overview' && (
        <OverviewTab
          achievements={achievements}
          goals={goals}
          onOpenCreateGoal={openCreateGoal}
        />
      )}

      {activeTab === 'achievements' && (
        <AchievementsTab achievements={achievements} />
      )}

      {activeTab === 'goals' && (
        <GoalsTab goals={goals} onOpenCreateGoal={openCreateGoal} />
      )}

      {activeTab === 'challenges' && (
        <ChallengesTab challenges={challenges} onJoinChallenge={handleJoinChallenge} />
      )}

      {activeTab === 'leaderboard' && (
        <LeaderboardTab />
      )}

      <CreateGoalModal
        isOpen={showCreateGoal}
        newGoal={newGoal}
        onUpdateGoal={updateNewGoal}
        onClose={closeCreateGoal}
        onCreate={handleCreateGoal}
      />
    </div>
  );
};
