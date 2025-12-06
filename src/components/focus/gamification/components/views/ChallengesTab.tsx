import React from 'react';
import { type Challenge } from '../../types';
import { ChallengeCard } from '../cards';

interface ChallengesTabProps {
  challenges: Challenge[];
  onJoinChallenge: (challengeId: string) => void;
}

export const ChallengesTab: React.FC<ChallengesTabProps> = ({ challenges, onJoinChallenge }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Active Challenges</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {challenges.map((challenge) => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            onJoin={onJoinChallenge}
          />
        ))}
      </div>
    </div>
  );
};
