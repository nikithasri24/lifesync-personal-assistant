import React from 'react';
import { Users, Clock } from 'lucide-react';
import { type Challenge } from '../../types';
import { formatTimeToNext } from '../../utils';

interface ChallengeCardProps {
  challenge: Challenge;
  onJoin: (challengeId: string) => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ challenge, onJoin }) => {
  const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;
  const timeRemaining = isActive ? formatTimeToNext(challenge.endDate) : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-semibold text-slate-900 dark:text-white">{challenge.title}</h4>
            <span className={`text-xs px-2 py-1 rounded-full ${
              challenge.type === 'global' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
              challenge.type === 'team' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}>
              {challenge.type}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{challenge.description}</p>

          <div className="flex items-center space-x-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center space-x-1">
              <Users size={12} />
              <span>{challenge.participants.toLocaleString()} participants</span>
            </span>
            {timeRemaining && (
              <span className="flex items-center space-x-1">
                <Clock size={12} />
                <span>{timeRemaining} left</span>
              </span>
            )}
          </div>
        </div>

        {!challenge.joined ? (
          <button
            onClick={() => onJoin(challenge.id)}
            className="px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-white text-sm rounded-lg transition-colors"
          >
            Join
          </button>
        ) : (
          <div className="text-right">
            {challenge.rank && (
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                Rank #{challenge.rank}
              </div>
            )}
            <div className="text-xs text-slate-500">Joined</div>
          </div>
        )}
      </div>

      {challenge.joined && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600 dark:text-slate-300">Progress</span>
            <span className="font-medium text-slate-900 dark:text-white">
              {challenge.progress}/{challenge.target}
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(challenge.progress / challenge.target) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="text-sm font-medium text-slate-900 dark:text-white mb-2">Rewards</div>
        <div className="space-y-1">
          {challenge.rewards.slice(0, 3).map((reward, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">
                {reward.rank === 1 ? '1st Place' : `Top ${reward.rank}`}
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 dark:text-white">+{reward.xp} XP</span>
                {reward.badge && (
                  <span className="text-yellow-500">🏆</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
