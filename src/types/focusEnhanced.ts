/**
 * Enhanced Focus Mode Types
 * 
 * Comprehensive type definitions for all advanced focus features including
 * analytics, gamification, integrations, wellness tracking, and more.
 */

// ==================== Core Focus Types ====================

export interface FocusSession {
  id: string;
  userId?: string;
  type: 'focus' | 'break' | 'long-break';
  preset: FocusPreset;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number; // in seconds
  actualDuration?: number; // in seconds
  status: 'planned' | 'active' | 'paused' | 'completed' | 'cancelled';
  pausedTime?: number; // total time paused
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
  completionReward?: number; // XP points
}

export interface FocusPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  duration: number; // in minutes
  breakDuration?: number;
  longBreakAfter?: number; // sessions
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
  source?: string; // website/app that caused distraction
  duration?: number; // how long the distraction lasted
  handled: boolean; // was it blocked or allowed
  severity: 'low' | 'medium' | 'high';
}

// ==================== Analytics & Insights ====================

export interface FocusAnalytics {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: Date;
  endDate: Date;
  totalSessions: number;
  totalFocusTime: number; // in minutes
  averageSessionLength: number;
  completionRate: number; // percentage
  streakDays: number;
  longestStreak: number;
  currentStreak: number;
  productivityScore: number; // 0-100
  focusQuality: number; // 0-100 based on distractions
  peakHours: number[]; // hours of day when most productive
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
  timeOfDay: Record<number, number>; // hour -> distraction count
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
  data?: any;
  createdAt: Date;
  dismissed: boolean;
}

// ==================== Gamification ====================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'streak' | 'time' | 'completion' | 'special' | 'social';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement: AchievementRequirement;
  reward: number; // XP points
  unlockedAt?: Date;
  progress?: number; // 0-100
}

export interface AchievementRequirement {
  type: 'sessions' | 'time' | 'streak' | 'completion_rate' | 'special';
  target: number;
  timeframe?: 'day' | 'week' | 'month' | 'all_time';
  conditions?: Record<string, any>;
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
  reward: number; // XP points
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
  perfectDays: number; // days with 100% goal completion
  currentLevel: number;
  achievementsUnlocked: number;
  favoriteFocusType: string;
  mostProductiveHour: number;
}

// ==================== Social & Collaboration ====================

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
    change: number; // rank change from previous period
  }>;
  lastUpdated: Date;
}

// ==================== Integrations ====================

export interface Integration {
  id: string;
  name: string;
  type: 'calendar' | 'music' | 'notifications' | 'productivity' | 'health' | 'social';
  connected: boolean;
  config: IntegrationConfig;
  lastSync?: Date;
  status: 'active' | 'error' | 'disabled';
  features: string[];
}

export interface IntegrationConfig {
  apiKey?: string;
  refreshToken?: string;
  settings: Record<string, any>;
  permissions: string[];
  autoSync: boolean;
  syncInterval: number; // in minutes
}

export interface CalendarIntegration {
  events: CalendarEvent[];
  autoCreateSessions: boolean;
  blockTime: boolean;
  meetingMode: boolean;
  bufferTime: number; // minutes before/after meetings
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  type: 'meeting' | 'focus-block' | 'break' | 'other';
  isBlocked: boolean;
  focusSessionId?: string;
}

// ==================== Wellness & Health ====================

export interface WellnessSettings {
  eyeStrainReminders: boolean;
  eyeStrainInterval: number; // minutes
  postureReminders: boolean;
  postureInterval: number;
  hydrationReminders: boolean;
  hydrationInterval: number;
  breathingExercises: boolean;
  moodTracking: boolean;
  energyTracking: boolean;
  sleepCorrelation: boolean;
  maxDailyFocusTime: number; // minutes
  enforceBreaks: boolean;
  minBreakDuration: number; // minutes
}

export interface WellnessEvent {
  id: string;
  type: 'eye_strain' | 'posture' | 'hydration' | 'breathing' | 'mood' | 'energy';
  timestamp: Date;
  completed: boolean;
  value?: number; // for mood/energy ratings
  notes?: string;
}

export interface HealthMetrics {
  sleepHours: number;
  sleepQuality: number; // 1-5
  stressLevel: number; // 1-5
  exerciseMinutes: number;
  waterIntake: number; // glasses
  screenTime: number; // minutes
  date: Date;
}

// ==================== Task & Project Management ====================

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number; // minutes
  actualTime: number; // minutes from focus sessions
  dueDate?: Date;
  tags: string[];
  focusSessions: string[]; // session IDs
  createdAt: Date;
  completedAt?: Date;
  difficulty: 1 | 2 | 3 | 4 | 5;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  estimatedHours: number;
  actualHours: number;
  tasks: string[]; // task IDs
  team?: string[]; // user IDs
  progress: number; // 0-100
  category: string;
}

// ==================== Settings & Preferences ====================

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
    start: string; // "22:00"
    end: string; // "08:00"
  };
}

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-100
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
  strictMode: boolean; // can't pause/stop sessions
  showProgress: boolean;
  showTimeRemaining: boolean;
  pomodoroMode: boolean;
  sessionTemplates: SessionTemplate[];
  quickTimers: number[]; // common timer durations
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

// ==================== API & State Management ====================

export interface FocusState {
  currentSession: FocusSession | null;
  upcomingSession: FocusSession | null;
  sessionQueue: FocusSession[];
  isActive: boolean;
  isPaused: boolean;
  timeRemaining: number;
  currentTemplate?: SessionTemplate;
  templateProgress: number;
  analytics: FocusAnalytics | null;
  goals: Goal[];
  achievements: Achievement[];
  profile: UserProfile | null;
  team: Team | null;
  challenges: Challenge[];
  tasks: Task[];
  projects: Project[];
  integrations: Integration[];
  wellnessEvents: WellnessEvent[];
  settings: UserPreferences;
  isLoading: boolean;
  error: string | null;
}

export interface FocusActions {
  // Session Management
  startSession: (preset: FocusPreset, options?: Partial<FocusSession>) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: (completed: boolean) => Promise<void>;
  skipToNextSession: () => Promise<void>;
  
  // Template Management
  startTemplate: (template: SessionTemplate) => Promise<void>;
  pauseTemplate: () => Promise<void>;
  resumeTemplate: () => Promise<void>;
  
  // Analytics
  loadAnalytics: (period: string) => Promise<void>;
  exportAnalytics: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  
  // Goals & Achievements
  createGoal: (goal: Omit<Goal, 'id' | 'currentProgress' | 'status'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  unlockAchievement: (id: string) => Promise<void>;
  
  // Social Features
  joinTeam: (teamId: string) => Promise<void>;
  createTeam: (team: Omit<Team, 'id' | 'members' | 'createdAt'>) => Promise<void>;
  inviteToTeam: (teamId: string, userId: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  
  // Task Management
  createTask: (task: Omit<Task, 'id' | 'actualTime' | 'focusSessions'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  linkTaskToSession: (taskId: string, sessionId: string) => Promise<void>;
  
  // Settings
  updateSettings: (settings: Partial<UserPreferences>) => Promise<void>;
  connectIntegration: (type: string, config: IntegrationConfig) => Promise<void>;
  disconnectIntegration: (type: string) => Promise<void>;
  
  // Wellness
  logWellnessEvent: (event: Omit<WellnessEvent, 'id' | 'timestamp'>) => Promise<void>;
  updateHealthMetrics: (metrics: HealthMetrics) => Promise<void>;
}

// ==================== Events & Hooks ====================

export type FocusEventType = 
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'session_cancelled'
  | 'break_started'
  | 'break_ended'
  | 'template_started'
  | 'template_completed'
  | 'goal_achieved'
  | 'achievement_unlocked'
  | 'streak_milestone'
  | 'distraction_detected'
  | 'wellness_reminder'
  | 'level_up';

export interface FocusEvent {
  type: FocusEventType;
  data: any;
  timestamp: Date;
  sessionId?: string;
  userId?: string;
}

export interface UseFocusReturn {
  state: FocusState;
  actions: FocusActions;
  isLoading: boolean;
  error: string | null;
}

// ==================== Utility Types ====================

export type TimeRange = {
  start: Date;
  end: Date;
};

export type DataPoint = {
  date: Date;
  value: number;
  label?: string;
};

export type ChartData = {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color: string;
    fill?: boolean;
  }>;
};

export type ExportFormat = 'csv' | 'json' | 'pdf';
export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';
export type MetricType = 'time' | 'count' | 'rate' | 'score';