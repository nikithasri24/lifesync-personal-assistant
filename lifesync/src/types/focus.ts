/**
 * Focus Mode Type Definitions
 * 
 * Comprehensive types for focus mode functionality including
 * sessions, analytics, blocking rules, and integrations.
 */

export type FocusMode = 
  | 'deep-work'
  | 'meeting'
  | 'creative'
  | 'learning'
  | 'break'
  | 'pomodoro'
  | 'custom';

export type FocusStatus = 
  | 'inactive'
  | 'active'
  | 'paused'
  | 'break'
  | 'completed';

export type DistractionLevel = 'minimal' | 'moderate' | 'strict' | 'nuclear';

export type FocusMetric = 
  | 'session_duration'
  | 'distraction_count'
  | 'productivity_score'
  | 'break_frequency'
  | 'completion_rate';

export interface FocusSession {
  id: string;
  userId: string;
  mode: FocusMode;
  status: FocusStatus;
  startTime: Date;
  endTime?: Date;
  plannedDuration: number; // minutes
  actualDuration?: number; // minutes
  targetTask?: string;
  targetProject?: string;
  distractionLevel: DistractionLevel;
  breaks: FocusBreak[];
  distractions: FocusDistraction[];
  productivity: ProductivityMetrics;
  environment: FocusEnvironment;
  notes?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface FocusBreak {
  id: string;
  sessionId: string;
  type: 'scheduled' | 'manual' | 'forced';
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  activity?: 'walk' | 'stretch' | 'hydrate' | 'meditate' | 'other';
  notes?: string;
}

export interface FocusDistraction {
  id: string;
  sessionId: string;
  timestamp: Date;
  type: 'notification' | 'app_switch' | 'website' | 'manual';
  source: string; // app name, website, etc.
  duration: number; // seconds
  handled: boolean;
  severity: 'low' | 'medium' | 'high';
}

export interface ProductivityMetrics {
  focusScore: number; // 0-100
  distractionCount: number;
  averageDistraction: number; // seconds
  deepWorkPercentage: number; // 0-100
  flowStateAchieved: boolean;
  taskCompletionRate: number; // 0-100
  energyLevel?: number; // 1-10, user reported
  moodRating?: number; // 1-10, user reported
}

export interface FocusEnvironment {
  ambientSound?: {
    type: 'nature' | 'white_noise' | 'binaural' | 'music' | 'silence';
    volume: number; // 0-100
    source?: string;
  };
  lighting?: {
    level: 'bright' | 'moderate' | 'dim';
    temperature: 'warm' | 'neutral' | 'cool';
  };
  notifications: {
    allowUrgent: boolean;
    allowCalls: boolean;
    allowMessages: boolean;
    allowCalendar: boolean;
    customRules: NotificationRule[];
  };
  blockedApps: string[];
  blockedWebsites: string[];
  allowedApps: string[];
  allowedWebsites: string[];
}

export interface NotificationRule {
  id: string;
  name: string;
  condition: 'sender' | 'keyword' | 'app' | 'time' | 'priority';
  value: string;
  action: 'allow' | 'block' | 'delay' | 'summarize';
  delay?: number; // minutes
}

export interface FocusPreset {
  id: string;
  name: string;
  description: string;
  mode: FocusMode;
  duration: number; // minutes
  distractionLevel: DistractionLevel;
  environment: FocusEnvironment;
  breakSchedule: BreakSchedule;
  icon: string;
  color: string;
  isDefault: boolean;
  isCustom: boolean;
  usageCount: number;
  lastUsed?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface BreakSchedule {
  enabled: boolean;
  type: 'fixed' | 'pomodoro' | 'adaptive';
  interval: number; // minutes
  duration: number; // minutes
  reminders: {
    beforeBreak: number; // minutes
    duringBreak: boolean;
    afterBreak: number; // minutes
  };
}

export interface FocusAnalytics {
  userId: string;
  period: 'day' | 'week' | 'month' | 'year';
  totalSessions: number;
  totalFocusTime: number; // minutes
  averageSessionLength: number; // minutes
  completionRate: number; // 0-100
  averageProductivityScore: number; // 0-100
  topDistractions: DistractionSummary[];
  productiveTimes: TimeSlot[];
  modeUsage: Record<FocusMode, number>; // minutes per mode
  weeklyTrend: DailyMetrics[];
  goals: FocusGoal[];
  achievements: FocusAchievement[];
  insights: FocusInsight[];
}

export interface DistractionSummary {
  source: string;
  count: number;
  totalTime: number; // seconds
  averageTime: number; // seconds
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface TimeSlot {
  hour: number; // 0-23
  productivity: number; // 0-100
  sessionCount: number;
  averageDuration: number; // minutes
}

export interface DailyMetrics {
  date: Date;
  totalFocusTime: number; // minutes
  sessionCount: number;
  productivityScore: number; // 0-100
  distractionCount: number;
  goalsMet: number;
}

export interface FocusGoal {
  id: string;
  userId: string;
  type: 'daily_time' | 'weekly_sessions' | 'completion_rate' | 'distraction_limit';
  target: number;
  current: number;
  period: 'day' | 'week' | 'month';
  isActive: boolean;
  createdAt: Date;
  deadline?: Date;
}

export interface FocusAchievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'streak' | 'milestone' | 'improvement' | 'special';
  requirement: string;
  unlockedAt?: Date;
  progress: number; // 0-100
}

export interface FocusInsight {
  id: string;
  type: 'trend' | 'recommendation' | 'warning' | 'celebration';
  title: string;
  description: string;
  actionable: boolean;
  action?: string;
  priority: 'low' | 'medium' | 'high';
  generatedAt: Date;
  dismissed: boolean;
}

export interface FocusSettings {
  userId: string;
  defaultMode: FocusMode;
  defaultDuration: number; // minutes
  defaultBreakInterval: number; // minutes
  defaultBreakDuration: number; // minutes
  autoStartBreaks: boolean;
  strictMode: boolean; // prevent disabling during session
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  analyticsEnabled: boolean;
  weeklyGoal: number; // minutes
  dailyGoal: number; // minutes
  preferredTimes: TimeSlot[];
  integrations: {
    calendar: boolean;
    slack: boolean;
    teams: boolean;
    spotify: boolean;
    notifications: boolean;
  };
  privacy: {
    shareStats: boolean;
    allowTeamView: boolean;
    trackApps: boolean;
    trackWebsites: boolean;
  };
}

export interface TeamFocusMetrics {
  teamId: string;
  period: 'day' | 'week' | 'month';
  totalTeamFocusTime: number; // minutes
  averageIndividualFocusTime: number; // minutes
  mostProductiveHours: TimeSlot[];
  teamProductivityScore: number; // 0-100
  collaborationBalance: number; // 0-100 (focus vs meeting time)
  topTeamDistractions: DistractionSummary[];
  focusCultureScore: number; // 0-100
  memberMetrics: Record<string, {
    focusTime: number;
    productivity: number;
    respectsTeamFocus: boolean;
  }>;
}

// Utility types
export type FocusEventType = 
  | 'session_started'
  | 'session_paused'
  | 'session_resumed'
  | 'session_completed'
  | 'session_cancelled'
  | 'break_started'
  | 'break_ended'
  | 'distraction_detected'
  | 'goal_achieved'
  | 'achievement_unlocked';

export interface FocusEvent {
  type: FocusEventType;
  sessionId?: string;
  userId: string;
  timestamp: Date;
  data: Record<string, any>;
}

// Hook return types
export interface UseFocusSessionReturn {
  currentSession: FocusSession | null;
  isActive: boolean;
  timeRemaining: number;
  progress: number;
  startSession: (preset: FocusPreset, task?: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  endSession: () => Promise<void>;
  takeBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  updateEnvironment: (environment: Partial<FocusEnvironment>) => Promise<void>;
}

export interface UseFocusAnalyticsReturn {
  analytics: FocusAnalytics | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getInsights: () => FocusInsight[];
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
}