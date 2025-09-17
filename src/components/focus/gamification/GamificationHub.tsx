/**
 * Gamification Hub
 * 
 * Complete gamification system with achievements, goals, XP, levels,
 * streaks, challenges, and social features to motivate users.
 */

import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Target,
  Star,
  Fire,
  Zap,
  Crown,
  Award,
  Users,
  TrendingUp,
  Calendar,
  Clock,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Share,
  Gift,
  Medal,
  Gem,
  Shield,
  Sword,
  Heart,
  Brain,
  Coffee,
  Book,
  Lightbulb,
  Timer,
  BarChart3,
  Settings
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek } from 'date-fns';

interface UserProfile {
  id: string;
  username: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  rank: string;
  currentStreak: number;
  longestStreak: number;
  joinDate: Date;
  avatar?: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'time' | 'completion' | 'special' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: {
    type: string;
    target: number;
    timeframe?: string;
  };
  reward: number;
  unlockedAt?: Date;
  progress?: number;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target: {
    metric: string;
    value: number;
    unit: string;
  };
  currentProgress: number;
  status: 'active' | 'completed' | 'paused' | 'failed';
  startDate: Date;
  endDate?: Date;
  reward: number;
  streak: number;
  priority: 'low' | 'medium' | 'high';
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'global';
  category: 'time' | 'sessions' | 'streak' | 'completion';
  target: number;
  startDate: Date;
  endDate: Date;
  participants: number;
  joined: boolean;
  progress: number;
  rank?: number;
  rewards: Array<{ rank: number; xp: number; badge?: string }>;
}

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
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'goals' | 'challenges' | 'leaderboard'>('overview');
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<Goal>>({
    type: 'daily',
    priority: 'medium'
  });

  // Mock data
  useEffect(() => {
    setAchievements([
      {
        id: '1',
        name: 'First Steps',
        description: 'Complete your first focus session',
        icon: '🎯',
        category: 'completion',
        rarity: 'common',
        requirement: { type: 'sessions', target: 1 },
        reward: 100,
        unlockedAt: new Date(),
        progress: 100
      },
      {
        id: '2',
        name: 'Focus Master',
        description: 'Complete 50 focus sessions',
        icon: '🧠',
        category: 'completion',
        rarity: 'rare',
        requirement: { type: 'sessions', target: 50 },
        reward: 500,
        progress: 73
      },
      {
        id: '3',
        name: 'Time Lord',
        description: 'Accumulate 100 hours of focus time',
        icon: '⏰',
        category: 'time',
        rarity: 'epic',
        requirement: { type: 'time', target: 6000 },
        reward: 1000,
        progress: 45
      },
      {
        id: '4',
        name: 'Streak Champion',
        description: 'Maintain a 30-day streak',
        icon: '🔥',
        category: 'streak',
        rarity: 'legendary',
        requirement: { type: 'streak', target: 30 },
        reward: 2000,
        progress: 16
      },
      {
        id: '5',
        name: 'Early Bird',
        description: 'Complete 10 sessions before 9 AM',
        icon: '🌅',
        category: 'special',
        rarity: 'rare',
        requirement: { type: 'time_of_day', target: 10 },
        reward: 300,
        progress: 7
      },
      {
        id: '6',
        name: 'Night Owl',
        description: 'Complete 10 sessions after 10 PM',
        icon: '🦉',
        category: 'special',
        rarity: 'rare',
        requirement: { type: 'time_of_day', target: 10 },
        reward: 300,
        progress: 3
      }
    ]);

    setGoals([
      {
        id: '1',
        title: 'Daily Focus Goal',
        description: 'Complete 2 hours of focused work',
        type: 'daily',
        target: { metric: 'focus_time', value: 120, unit: 'minutes' },
        currentProgress: 85,
        status: 'active',
        startDate: new Date(),
        reward: 50,
        streak: 5,
        priority: 'high'
      },
      {
        id: '2',
        title: 'Weekly Sessions',
        description: 'Complete 30 focus sessions this week',
        type: 'weekly',
        target: { metric: 'sessions', value: 30, unit: 'sessions' },
        currentProgress: 23,
        status: 'active',
        startDate: startOfWeek(new Date()),
        endDate: endOfWeek(new Date()),
        reward: 200,
        streak: 2,
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Monthly Productivity',
        description: 'Achieve 90% completion rate this month',
        type: 'monthly',
        target: { metric: 'completion_rate', value: 90, unit: 'percentage' },
        currentProgress: 87,
        status: 'active',
        startDate: new Date(),
        reward: 500,
        streak: 1,
        priority: 'high'
      }
    ]);

    setChallenges([
      {
        id: '1',
        title: 'Focus February',
        description: 'Complete 100 hours of focus time in February',
        type: 'global',
        category: 'time',
        target: 6000,
        startDate: new Date(2024, 1, 1),
        endDate: new Date(2024, 1, 29),
        participants: 1247,
        joined: true,
        progress: 45,
        rank: 123,
        rewards: [
          { rank: 1, xp: 5000, badge: 'February Champion' },
          { rank: 10, xp: 2000, badge: 'Top 10' },
          { rank: 100, xp: 1000 }
        ]
      },
      {
        id: '2',
        title: 'Team Sprint',
        description: 'Work together to complete 1000 sessions',
        type: 'team',
        category: 'sessions',
        target: 1000,
        startDate: new Date(),
        endDate: addDays(new Date(), 7),
        participants: 12,
        joined: false,
        progress: 0,
        rewards: [
          { rank: 1, xp: 1000, badge: 'Sprint Winner' }
        ]
      },
      {
        id: '3',
        title: 'Perfect Week',
        description: 'Achieve 100% completion rate for 7 days',
        type: 'individual',
        category: 'completion',
        target: 100,
        startDate: new Date(),
        endDate: addDays(new Date(), 7),
        participants: 1,
        joined: true,
        progress: 85,
        rewards: [
          { rank: 1, xp: 800, badge: 'Perfectionist' }
        ]
      }
    ]);
  }, []);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-500 to-pink-500';
      case 'rare': return 'from-blue-500 to-cyan-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getRarityBorder = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'border-yellow-400';
      case 'epic': return 'border-purple-500';
      case 'rare': return 'border-blue-500';
      default: return 'border-gray-400';
    }
  };

  const getGoalProgress = (goal: Goal) => {
    return Math.min((goal.currentProgress / goal.target.value) * 100, 100);
  };

  const formatTimeToNext = (endDate: Date) => {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

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
      setNewGoal({ type: 'daily', priority: 'medium' });
      setShowCreateGoal(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
                  <Fire className="w-4 h-4" />
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

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
        {[
          { key: 'overview', label: 'Overview', icon: BarChart3 },
          { key: 'achievements', label: 'Achievements', icon: Trophy },
          { key: 'goals', label: 'Goals', icon: Target },
          { key: 'challenges', label: 'Challenges', icon: Sword },
          { key: 'leaderboard', label: 'Leaderboard', icon: Users }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Achievements */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Recent Achievements</h3>
            <div className="space-y-3">
              {achievements.filter(a => a.unlockedAt).slice(0, 3).map((achievement) => (
                <div key={achievement.id} className={`flex items-center space-x-3 p-3 rounded-lg border-2 ${getRarityBorder(achievement.rarity)} bg-gradient-to-r ${getRarityColor(achievement.rarity)}/10`}>
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900 dark:text-white">{achievement.name}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-300">{achievement.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">+{achievement.reward} XP</div>
                    <div className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                      {achievement.rarity}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Goals */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Active Goals</h3>
              <button
                onClick={() => setShowCreateGoal(true)}
                className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus size={16} />
                <span className="text-sm">Add Goal</span>
              </button>
            </div>
            <div className="space-y-3">
              {goals.filter(g => g.status === 'active').slice(0, 3).map((goal) => {
                const progress = getGoalProgress(goal);
                const isCompleted = progress >= 100;
                
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{goal.title}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-300">
                          {goal.currentProgress}/{goal.target.value} {goal.target.unit}
                        </div>
                      </div>
                      <div className="text-right">
                        {goal.streak > 0 && (
                          <div className="flex items-center space-x-1 text-orange-500">
                            <Fire size={14} />
                            <span className="text-sm">{goal.streak}</span>
                          </div>
                        )}
                        <div className="text-xs text-slate-500">+{goal.reward} XP</div>
                      </div>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Achievements</h3>
            <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300">
              <Trophy size={16} />
              <span>{achievements.filter(a => a.unlockedAt).length}/{achievements.length} unlocked</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => {
              const isUnlocked = !!achievement.unlockedAt;
              const progress = achievement.progress || 0;
              
              return (
                <div
                  key={achievement.id}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    isUnlocked
                      ? `${getRarityBorder(achievement.rarity)} bg-gradient-to-br ${getRarityColor(achievement.rarity)}/10`
                      : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50'
                  } ${!isUnlocked && progress > 0 ? 'ring-2 ring-indigo-200 dark:ring-indigo-800' : ''}`}
                >
                  {isUnlocked && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                  )}
                  
                  <div className={`text-4xl mb-3 ${!isUnlocked ? 'opacity-50' : ''}`}>
                    {achievement.icon}
                  </div>
                  
                  <h4 className={`font-semibold mb-1 ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                    {achievement.name}
                  </h4>
                  
                  <p className={`text-sm mb-3 ${isUnlocked ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                    {achievement.description}
                  </p>
                  
                  {!isUnlocked && progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white`}>
                      {achievement.rarity}
                    </span>
                    <span className={`text-sm font-bold ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      +{achievement.reward} XP
                    </span>
                  </div>
                  
                  {isUnlocked && achievement.unlockedAt && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      Unlocked {format(achievement.unlockedAt, 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {activeTab === 'goals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Goals</h3>
            <button
              onClick={() => setShowCreateGoal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
            >
              <Plus size={16} />
              <span>Create Goal</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const progress = getGoalProgress(goal);
              const isCompleted = goal.status === 'completed' || progress >= 100;
              
              return (
                <div key={goal.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{goal.title}</h4>
                      {goal.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{goal.description}</p>
                      )}
                      <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                        <span className={`px-2 py-1 rounded-full ${
                          goal.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                          goal.priority === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300'
                        }`}>
                          {goal.priority}
                        </span>
                        <span>{goal.type}</span>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      {goal.streak > 0 && (
                        <div className="flex items-center space-x-1 text-orange-500 mb-1">
                          <Fire size={14} />
                          <span className="text-sm">{goal.streak}</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500">+{goal.reward} XP</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600 dark:text-slate-300">
                        {goal.currentProgress}/{goal.target.value} {goal.target.unit}
                      </span>
                      <span className={`font-medium ${isCompleted ? 'text-green-500' : 'text-slate-900 dark:text-white'}`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                    
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {goal.endDate && (
                    <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                      Ends {format(goal.endDate, 'MMM d, yyyy')}
                    </div>
                  )}
                  
                  {isCompleted && (
                    <div className="mt-3 flex items-center space-x-2 text-green-500">
                      <CheckCircle size={16} />
                      <span className="text-sm font-medium">Completed!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Challenges Tab */}
      {activeTab === 'challenges' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Active Challenges</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {challenges.map((challenge) => {
              const isActive = new Date() >= challenge.startDate && new Date() <= challenge.endDate;
              const timeRemaining = isActive ? formatTimeToNext(challenge.endDate) : null;
              
              return (
                <div key={challenge.id} className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
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
                        onClick={() => onJoinChallenge(challenge.id)}
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
            })}
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      {showCreateGoal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-2xl border border-white/20 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Create New Goal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  value={newGoal.title || ''}
                  onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  placeholder="Enter goal title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={newGoal.type}
                  onChange={(e) => setNewGoal({ ...newGoal, type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={newGoal.target?.value || ''}
                    onChange={(e) => setNewGoal({ 
                      ...newGoal, 
                      target: { ...newGoal.target!, value: parseInt(e.target.value) || 0 }
                    })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                    placeholder="120"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Unit
                  </label>
                  <select
                    value={newGoal.target?.unit || 'minutes'}
                    onChange={(e) => setNewGoal({ 
                      ...newGoal, 
                      target: { ...newGoal.target!, unit: e.target.value }
                    })}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value="minutes">Minutes</option>
                    <option value="sessions">Sessions</option>
                    <option value="percentage">Percentage</option>
                    <option value="points">Points</option>
                  </select>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCreateGoal(false)}
                  className="flex-1 px-6 py-3 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGoal}
                  className="flex-1 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};