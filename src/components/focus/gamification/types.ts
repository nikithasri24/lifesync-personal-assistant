export interface UserProfile {
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

export interface Achievement {
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

export interface Goal {
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

export interface Challenge {
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

export type TabType = 'overview' | 'achievements' | 'goals' | 'challenges' | 'leaderboard';
