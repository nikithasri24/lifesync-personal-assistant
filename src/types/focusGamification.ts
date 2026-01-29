export interface UserProfile {
  id: string;
  username: string;
  email: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalXP: number;
  rank: string;
  joinDate: Date;
  avatar?: string;
  timezone: string;
  preferences: UserPreferences;
  stats: UserStats;
  badges: Achievement[];
  currentStreak: number;
  longestStreak: number;
  friends: string[];
  teams: string[];
}

export interface UserStats {
  totalSessions: number;
  totalFocusTime: number;
  averageProductivity: number;
  completionRate: number;
  perfectDays: number;
  currentLevel: number;
  achievementsUnlocked: number;
  favoriteFocusType: string;
  mostProductiveHour: number;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdBy: string;
  createdAt: Date;
  isPublic: boolean;
  joinCode?: string;
  challenges: Challenge[];
  leaderboard: TeamLeaderboard;
}

export interface TeamMember {
  userId: string;
  username: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: Date;
  stats: UserStats;
  currentStreak: number;
  weeklyXP: number;
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
  participants: string[];
  leaderboard: ChallengeLeaderboard[];
  rewards: ChallengeReward[];
  status: 'upcoming' | 'active' | 'completed';
}

export interface ChallengeLeaderboard {
  userId: string;
  username: string;
  progress: number;
  rank: number;
  lastUpdate: Date;
}

export interface ChallengeReward {
  rank: number;
  xp: number;
  badge?: string;
  title?: string;
}

export interface TeamLeaderboard {
  period: 'day' | 'week' | 'month';
  members: Array<{
    userId: string;
    username: string;
    score: number;
    rank: number;
    change: number;
  }>;
  lastUpdated: Date;
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

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  sounds: SoundSettings;
  privacy: PrivacySettings;
  focus: FocusSettings;
  wellness: WellnessSettings;
  integrations: Record<string, boolean>;
  keyboardShortcuts: Record<string, string>;
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

export interface SoundSettings {
  enabled: boolean;
  volume: number;
  completionSound: string;
  notificationSound: string;
  backgroundMusic: boolean;
  musicVolume: number;
  defaultMusicType: string;
}

export interface PrivacySettings {
  profileVisible: boolean;
  statsVisible: boolean;
  shareAchievements: boolean;
  shareStreaks: boolean;
  allowFriendRequests: boolean;
  allowTeamInvites: boolean;
  dataSharing: boolean;
}

export interface FocusSettings {
  defaultPreset: string;
  autoStartBreaks: boolean;
  strictMode: boolean;
  showProgress: boolean;
  showTimeRemaining: boolean;
  pomodoroMode: boolean;
  sessionTemplates: SessionTemplate[];
  quickTimers: number[];
}

export interface SessionTemplate {
  id: string;
  name: string;
  description?: string;
  sessions: Array<{
    type: 'focus' | 'break' | 'long-break';
    duration: number;
    preset?: string;
  }>;
  totalDuration: number;
  isDefault: boolean;
  usageCount: number;
}

export interface WellnessSettings {
  eyeStrainReminders: boolean;
  eyeStrainInterval: number;
  postureReminders: boolean;
  postureInterval: number;
  hydrationReminders: boolean;
  hydrationInterval: number;
  breathingExercises: boolean;
  energyTracking: boolean;
  sleepCorrelation: boolean;
  maxDailyFocusTime: number;
  enforceBreaks: boolean;
  minBreakDuration: number;
}
