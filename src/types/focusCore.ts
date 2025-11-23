export interface FocusSession {
  id: string;
  userId?: string;
  type: 'focus' | 'break' | 'long-break';
  preset: FocusPreset;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number;
  actualDuration?: number;
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  pausedTime?: number;
  distractions: DistractionEvent[];
  taskId?: string;
  projectId?: string;
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'tired' | 'stressed';
  energy?: 1 | 2 | 3 | 4 | 5;
  productivity?: 1 | 2 | 3 | 4 | 5;
  tags?: string[];
  location?: string;
  weather?: string;
  backgroundMusic?: string;
  completionReward?: number;
}

export interface FocusPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  duration: number;
  breakDuration?: number;
  longBreakAfter?: number;
  longBreakDuration?: number;
  musicType?: string;
  distractionLevel: 'minimal' | 'moderate' | 'strict';
  notifications: NotificationSettings;
  blockedSites?: string[];
  allowedSites?: string[];
  isCustom: boolean;
  isDefault: boolean;
  usageCount: number;
  createdBy: string;
  createdAt: Date;
  category: 'work' | 'study' | 'creative' | 'personal' | 'health';
}

export interface DistractionEvent {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: 'pause' | 'website' | 'app' | 'notification' | 'manual';
  source?: string;
  duration?: number;
  handled: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface FocusAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  totalSessions: number;
  totalFocusTime: number;
  averageSessionLength: number;
  completionRate: number;
  streakDays: number;
  longestStreak: number;
  currentStreak: number;
  productivityScore: number;
  focusQuality: number;
  peakHours: number[];
  distractionStats: DistractionAnalytics;
  moodStats: MoodAnalytics;
  insights: Insight[];
  goals: Goal[];
  achievements: Achievement[];
  timeByCategory: Record<string, number>;
  timeByProject: Record<string, number>;
  dailyStats: DailyStats[];
}

export interface DistractionAnalytics {
  totalDistractions: number;
  averagePerSession: number;
  mostCommonSources: Array<{ source: string; count: number }>;
  timeOfDay: Record<number, number>;
  byType: Record<string, number>;
  blocked: number;
  allowed: number;
}

export interface MoodAnalytics {
  averageMood: number;
  averageEnergy: number;
  averageProductivity: number;
  correlations: {
    moodVsProductivity: number;
    energyVsCompletion: number;
    timeOfDayVsMood: Record<number, number>;
  };
}

export interface DailyStats {
  date: Date;
  sessions: number;
  focusTime: number;
  completions: number;
  distractions: number;
  productivity: number;
  mood: number;
  energy: number;
  goalsMet: number;
  xpEarned: number;
}

export interface Insight {
  id: string;
  type: 'positive' | 'suggestion' | 'warning' | 'achievement';
  title: string;
  description: string;
  actionable?: string;
  priority: 'low' | 'medium' | 'high';
  category: 'productivity' | 'wellness' | 'habits' | 'goals';
  data?: unknown;
  createdAt: Date;
  dismissed: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'time' | 'completion' | 'special' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: AchievementRequirement;
  reward: number;
  unlockedAt?: Date;
  progress?: number;
}

export interface AchievementRequirement {
  type: 'sessions' | 'time' | 'streak' | 'completion_rate' | 'special';
  target: number;
  timeframe?: 'day' | 'week' | 'month' | 'all_time';
  conditions?: Record<string, string | number | boolean>;
}

export interface Goal {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  target: GoalTarget;
  currentProgress: number;
  status: 'active' | 'completed' | 'paused' | 'failed';
  startDate: Date;
  endDate?: Date;
  reward: number;
  streak: number;
  category: 'time' | 'sessions' | 'completion' | 'productivity';
  priority: 'low' | 'medium' | 'high';
  reminders: boolean;
}

export interface GoalTarget {
  metric: 'focus_time' | 'sessions' | 'completion_rate' | 'streak' | 'productivity_score';
  value: number;
  unit: 'minutes' | 'sessions' | 'percentage' | 'days' | 'points';
}

export interface NotificationSettings {
  desktop: boolean;
  sound: boolean;
  vibration: boolean;
  sessionStart: boolean;
  sessionEnd: boolean;
  breakReminder: boolean;
  goalReminder: boolean;
  achievementUnlocked: boolean;
  teamUpdates: boolean;
  challengeUpdates: boolean;
  wellnessReminders: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}
