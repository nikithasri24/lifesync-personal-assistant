/**
 * Goal Gamification Component
 * XP, levels, badges, and achievements system
 */

import React, { useMemo } from 'react';
import { Trophy, Award, Star, Zap, Target, Flame, TrendingUp } from 'lucide-react';
import type { LifeGoal } from '../types/lifeGoals';

interface GoalGamificationProps {
  goals: LifeGoal[];
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  earned: boolean;
}

interface UserStats {
  totalXP: number;
  level: number;
  xpToNextLevel: number;
  xpProgress: number;
  completedGoals: number;
  totalGoals: number;
  longestStreak: number;
  totalStreakDays: number;
  badges: Badge[];
}

const XP_PER_LEVEL = 1000;

const GoalGamification: React.FC<GoalGamificationProps> = ({ goals }) => {
  const stats = useMemo((): UserStats => {
    // Calculate total XP from completed goals and streaks
    let totalXP = 0;
    let completedGoals = 0;
    let longestStreak = 0;
    let totalStreakDays = 0;

    goals.forEach(goal => {
      // XP from completed goals
      if (goal.status === 'completed' && goal.xpReward) {
        totalXP += goal.xpReward;
        completedGoals++;
      }

      // XP from streaks (10 XP per streak day)
      if (goal.streakDays) {
        totalXP += goal.streakDays * 10;
        totalStreakDays += goal.streakDays;
      }

      // Track longest streak
      if (goal.longestStreak && goal.longestStreak > longestStreak) {
        longestStreak = goal.longestStreak;
      }
    });

    // Calculate level
    const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
    const xpInCurrentLevel = totalXP % XP_PER_LEVEL;
    const xpToNextLevel = XP_PER_LEVEL - xpInCurrentLevel;
    const xpProgress = (xpInCurrentLevel / XP_PER_LEVEL) * 100;

    // Calculate badges
    const badges: Badge[] = [
      {
        id: 'first-goal',
        name: 'First Steps',
        description: 'Complete your first goal',
        icon: <Target className="h-5 w-5" />,
        color: 'bg-blue-500',
        earned: completedGoals >= 1,
      },
      {
        id: 'five-goals',
        name: 'Goal Getter',
        description: 'Complete 5 goals',
        icon: <Trophy className="h-5 w-5" />,
        color: 'bg-yellow-500',
        earned: completedGoals >= 5,
      },
      {
        id: 'ten-goals',
        name: 'Achiever',
        description: 'Complete 10 goals',
        icon: <Award className="h-5 w-5" />,
        color: 'bg-purple-500',
        earned: completedGoals >= 10,
      },
      {
        id: 'level-5',
        name: 'Rising Star',
        description: 'Reach level 5',
        icon: <Star className="h-5 w-5" />,
        color: 'bg-indigo-500',
        earned: level >= 5,
      },
      {
        id: 'level-10',
        name: 'Expert',
        description: 'Reach level 10',
        icon: <Zap className="h-5 w-5" />,
        color: 'bg-orange-500',
        earned: level >= 10,
      },
      {
        id: 'streak-7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: <Flame className="h-5 w-5" />,
        color: 'bg-red-500',
        earned: longestStreak >= 7,
      },
      {
        id: 'streak-30',
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        icon: <Flame className="h-5 w-5" />,
        color: 'bg-red-600',
        earned: longestStreak >= 30,
      },
      {
        id: 'streak-100',
        name: 'Centurion',
        description: 'Maintain a 100-day streak',
        icon: <Flame className="h-5 w-5" />,
        color: 'bg-red-700',
        earned: longestStreak >= 100,
      },
      {
        id: 'hard-goal',
        name: 'Challenge Accepted',
        description: 'Complete a hard or extreme goal',
        icon: <TrendingUp className="h-5 w-5" />,
        color: 'bg-green-600',
        earned: goals.some(g => g.status === 'completed' && (g.difficulty === 'hard' || g.difficulty === 'extreme')),
      },
    ];

    return {
      totalXP,
      level,
      xpToNextLevel,
      xpProgress,
      completedGoals,
      totalGoals: goals.length,
      longestStreak,
      totalStreakDays,
      badges,
    };
  }, [goals]);

  const earnedBadges = stats.badges.filter(b => b.earned);
  const unearnedBadges = stats.badges.filter(b => !b.earned);

  return (
    <div className="space-y-6">
      {/* Level and XP */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm opacity-90">Your Level</p>
            <p className="text-4xl font-bold">Level {stats.level}</p>
          </div>
          <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <Zap className="h-8 w-8" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{stats.totalXP.toLocaleString()} XP</span>
            <span>{stats.xpToNextLevel.toLocaleString()} to next level</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-white h-full rounded-full transition-all duration-500"
              style={{ width: `${stats.xpProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <p className="text-xs font-medium text-slate-600">Goals</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.completedGoals}</p>
          <p className="text-xs text-slate-500">of {stats.totalGoals} completed</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="h-4 w-4 text-orange-600" />
            <p className="text-xs font-medium text-slate-600">Best Streak</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{stats.longestStreak}</p>
          <p className="text-xs text-slate-500">days</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-4 w-4 text-purple-600" />
            <p className="text-xs font-medium text-slate-600">Badges</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{earnedBadges.length}</p>
          <p className="text-xs text-slate-500">of {stats.badges.length} earned</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-4 w-4 text-indigo-600" />
            <p className="text-xs font-medium text-slate-600">Total XP</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{(stats.totalXP / 1000).toFixed(1)}k</p>
          <p className="text-xs text-slate-500">experience</p>
        </div>
      </div>

      {/* Badges */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-indigo-600" />
          Achievements
        </h3>

        {/* Earned badges */}
        {earnedBadges.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-700 mb-3">Unlocked ({earnedBadges.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {earnedBadges.map(badge => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-300 rounded-lg"
                >
                  <div className={`${badge.color} text-white p-3 rounded-full`}>
                    {badge.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-900">{badge.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked badges */}
        {unearnedBadges.length > 0 && (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Locked ({unearnedBadges.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {unearnedBadges.map(badge => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center gap-2 p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg opacity-60"
                >
                  <div className="bg-slate-300 text-slate-500 p-3 rounded-full">
                    {badge.icon}
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">{badge.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{badge.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* XP Breakdown */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-indigo-600" />
          XP Breakdown
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Completed Goals</p>
              <p className="text-xs text-slate-600">{stats.completedGoals} goals</p>
            </div>
            <p className="text-lg font-bold text-indigo-600">
              {goals
                .filter(g => g.status === 'completed')
                .reduce((sum, g) => sum + (g.xpReward || 0), 0)
                .toLocaleString()} XP
            </p>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-slate-900">Streaks</p>
              <p className="text-xs text-slate-600">{stats.totalStreakDays} days tracked</p>
            </div>
            <p className="text-lg font-bold text-orange-600">
              {(stats.totalStreakDays * 10).toLocaleString()} XP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalGamification;
