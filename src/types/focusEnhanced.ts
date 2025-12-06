import type {
  FocusSession,
  FocusPreset,
  DistractionEvent,
  FocusAnalytics,
  DistractionAnalytics,
  MoodAnalytics,
  DailyStats,
  Insight,
  Achievement,
  AchievementRequirement,
  Goal,
  GoalTarget,
  NotificationSettings,
} from './focusCore';

import type {
  UserProfile,
  UserStats,
  Team,
  TeamMember,
  Challenge,
  ChallengeLeaderboard,
  ChallengeReward,
  TeamLeaderboard,
  UserPreferences,
  SoundSettings,
  PrivacySettings,
  FocusSettings,
  SessionTemplate,
  WellnessSettings,
} from './focusGamification';

export type {
  FocusSession,
  FocusPreset,
  DistractionEvent,
  FocusAnalytics,
  DistractionAnalytics,
  MoodAnalytics,
  DailyStats,
  Insight,
  Achievement,
  AchievementRequirement,
  Goal,
  GoalTarget,
  NotificationSettings,
  UserProfile,
  UserStats,
  Team,
  TeamMember,
  Challenge,
  ChallengeLeaderboard,
  ChallengeReward,
  TeamLeaderboard,
  UserPreferences,
  SoundSettings,
  PrivacySettings,
  FocusSettings,
  SessionTemplate,
  WellnessSettings,
};

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
  settings: Record<string, string | number | boolean>;
  permissions: string[];
  autoSync: boolean;
  syncInterval: number;
}

export interface CalendarIntegration {
  events: CalendarEvent[];
  autoCreateSessions: boolean;
  blockTime: boolean;
  meetingMode: boolean;
  bufferTime: number;
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

export interface WellnessEvent {
  id: string;
  type: 'eye_strain' | 'posture' | 'hydration' | 'breathing' | 'mood' | 'energy';
  timestamp: Date;
  completed: boolean;
  value?: number;
  notes?: string;
}

export interface HealthMetrics {
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  exerciseMinutes: number;
  waterIntake: number;
  screenTime: number;
  date: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedTime: number;
  actualTime: number;
  dueDate?: Date;
  tags: string[];
  focusSessions: string[];
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
  tasks: string[];
  team?: string[];
  progress: number;
  category: string;
}

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
  startSession: (preset: FocusPreset, options?: Partial<FocusSession>) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: (completed: boolean) => Promise<void>;
  skipToNextSession: () => Promise<void>;
  startTemplate: (template: SessionTemplate) => Promise<void>;
  pauseTemplate: () => Promise<void>;
  resumeTemplate: () => Promise<void>;
  loadAnalytics: (period: string) => Promise<void>;
  exportAnalytics: (format: 'csv' | 'json' | 'pdf') => Promise<void>;
  createGoal: (goal: Omit<Goal, 'id' | 'currentProgress' | 'status'>) => Promise<void>;
  updateGoal: (id: string, updates: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  unlockAchievement: (id: string) => Promise<void>;
  joinTeam: (teamId: string) => Promise<void>;
  createTeam: (team: Omit<Team, 'id' | 'members' | 'createdAt'>) => Promise<void>;
  inviteToTeam: (teamId: string, userId: string) => Promise<void>;
  joinChallenge: (challengeId: string) => Promise<void>;
  createTask: (task: Omit<Task, 'id' | 'actualTime' | 'focusSessions'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  linkTaskToSession: (taskId: string, sessionId: string) => Promise<void>;
  updateSettings: (settings: Partial<UserPreferences>) => Promise<void>;
  connectIntegration: (type: string, config: IntegrationConfig) => Promise<void>;
  disconnectIntegration: (type: string) => Promise<void>;
  logWellnessEvent: (event: Omit<WellnessEvent, 'id' | 'timestamp'>) => Promise<void>;
  updateHealthMetrics: (metrics: HealthMetrics) => Promise<void>;
}

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
  data: unknown;
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
