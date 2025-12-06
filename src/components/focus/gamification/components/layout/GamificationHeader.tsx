import React from 'react';
import { Crown, Flame, Star } from 'lucide-react';
import { type UserProfile } from '../../types';

interface GamificationHeaderProps {
  userProfile: UserProfile;
}

export const GamificationHeader: React.FC<GamificationHeaderProps> = ({ userProfile }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Crown className="w-10 h-10" />
            </div>
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
              {userProfile.level}
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-1">{userProfile.username}</h2>
            <p className="text-white/80 mb-2">{userProfile.rank}</p>
            <div className="flex items-center space-x-4 text-sm">
              <span className="flex items-center space-x-1">
                <Flame className="w-4 h-4" />
                <span>{userProfile.currentStreak} day streak</span>
              </span>
              <span className="flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>{userProfile.totalXP.toLocaleString()} XP</span>
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-3xl font-bold mb-2">{userProfile.xp.toLocaleString()}</div>
          <div className="text-white/80 text-sm mb-3">
            {userProfile.xpToNextLevel.toLocaleString()} XP to level {userProfile.level + 1}
          </div>
          <div className="w-48 bg-white/20 rounded-full h-3">
            <div
              className="bg-white rounded-full h-3 transition-all duration-500"
              style={{ width: `${(userProfile.xp / (userProfile.xp + userProfile.xpToNextLevel)) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
