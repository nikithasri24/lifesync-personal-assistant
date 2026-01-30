/**
 * Life Goals System Types
 * TypeScript interfaces for goals, dreams, milestones, and related entities
 */

export type GoalCategory = 'personal' | 'health' | 'career' | 'financial' | 'fitness';
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical';
export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'on-hold' | 'abandoned';
export type GoalDifficulty = 'easy' | 'medium' | 'hard' | 'extreme';
export type StreakFrequency = 'daily' | 'weekly' | 'monthly';

export type DreamCategory = 'travel' | 'experiences' | 'possessions' | 'achievements' | 'relationships' | 'lifestyle';
/** @deprecated Use estimatedTimeframe text field instead */
export type DreamPriority = 'someday' | 'within-5-years' | 'within-10-years' | 'lifetime';
export type DreamStatus = 'dreaming' | 'planning' | 'in-progress' | 'achieved' | 'no-longer-interested';

// Tracking mode for shared goals/dreams
// 'combined' = one shared progress (e.g., "Save $50k for house")
// 'individual' = each person tracks separately (e.g., "Exercise 3x/week")
export type TrackingMode = 'combined' | 'individual';

export interface LifeGoal {
  id: string;
  userId: string;
  connectionId?: string;  // For merged/shared goals between connected users
  trackingMode: TrackingMode;  // 'combined' = shared progress, 'individual' = separate tracking
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  progress: number; // 0-100

  // Measurable targets
  targetValue?: number;
  currentValue?: number;
  unit?: string; // kg, hours, dollars, etc.

  // Dates
  startDate?: string;
  targetDate?: string;
  completedDate?: string;

  // Gamification
  difficulty: GoalDifficulty;
  xpReward: number;
  streakDays: number;
  longestStreak: number;
  currentStreak: number;
  streakEnabled: boolean;
  streakFrequency: StreakFrequency;
  streakTarget?: number;
  lastStreakUpdate?: string;

  // Organization
  tags: string[];
  isPublic: boolean;
  templateId?: string;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LifeGoalMilestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  orderIndex: number;
  isCompleted: boolean;
  completedDate?: string;
  targetDate?: string;
  xpReward: number;
  createdAt: string;
}

export interface LifeGoalCheckin {
  id: string;
  goalId: string;
  checkInDate: string;
  progressUpdate?: number;
  notes?: string;
  blockers?: string;
  wins?: string;
  nextActions?: string;
  createdAt: string;
}

export interface LifeGoalStreakEntry {
  id: string;
  goalId: string;
  date: string;
  completed: boolean;
  notes?: string;
  createdAt: string;
}

export interface LifeDream {
  id: string;
  userId: string;
  connectionId?: string;  // For merged/shared dreams between connected users
  trackingMode: TrackingMode;  // 'combined' = shared progress, 'individual' = separate tracking
  title: string;
  description?: string;
  category: DreamCategory;
  /** @deprecated Use estimatedTimeframe instead. Kept for backward compatibility. */
  priority?: DreamPriority;
  status: DreamStatus;

  // Planning
  estimatedCost?: number;
  estimatedTimeframe?: string;
  requiredResources: string[];
  inspirationSources: string[];

  // Progress
  achievedAt?: string;

  // Organization
  tags: string[];
  isPublic: boolean;

  // Vision board
  visionBoardImages: string[];
  visionBoardNotes?: string;

  // Metadata
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Personal progress tracking for shared goals.
 * In merged mode, each user tracks their own progress independently.
 */
export interface GoalProgressTracking {
  id: string;
  userId: string;
  goalId: string;
  personalProgress: number; // 0-100
  personalCurrentValue?: number;
  notes?: string;
  lastUpdated: string;
  createdAt: string;
}

/**
 * Merged connection info for goals module
 */
export interface MergedGoalsConnectionInfo {
  connectionId: string;
  partnerId: string;
  partnerName?: string;
}

export interface LifeGoalTemplate {
  id: string;
  name: string;
  description?: string;
  category: GoalCategory;
  difficulty: GoalDifficulty;
  estimatedDurationDays?: number;

  // Template structure
  defaultMilestones: MilestoneTemplate[];
  suggestedTags: string[];
  tips?: string;
  resources: string[];

  // Metadata
  isPublic: boolean;
  createdBy?: string;
  usageCount: number;
  createdAt: string;
}

export interface MilestoneTemplate {
  title: string;
  description?: string;
  orderIndex: number;
  estimatedDays?: number;
}

export interface LifeGoalWithMilestones extends LifeGoal {
  milestones: LifeGoalMilestone[];
}

export interface LifeGoalWithDetails extends LifeGoal {
  milestones: LifeGoalMilestone[];
  checkins: LifeGoalCheckin[];
  streakHistory: LifeGoalStreakEntry[];
  linkedHabits?: string[]; // habit IDs
  linkedTasks?: string[]; // task IDs
}

export interface LifeDreamWithGoals extends LifeDream {
  linkedGoals: LifeGoal[];
}

// Input types for creating/updating
export interface CreateLifeGoalInput {
  title: string;
  description?: string;
  category: GoalCategory;
  priority: GoalPriority;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  startDate?: string;
  targetDate?: string;
  difficulty?: GoalDifficulty;
  tags?: string[];
  templateId?: string;
  streakEnabled?: boolean;
  streakFrequency?: StreakFrequency;
  streakTarget?: number;
  // Sharing options
  isShared?: boolean;  // If true, goal is shared with partner (sets connection_id)
  trackingMode?: TrackingMode;  // Only relevant when isShared=true
}

export interface UpdateLifeGoalInput {
  title?: string;
  description?: string;
  category?: GoalCategory;
  priority?: GoalPriority;
  status?: GoalStatus;
  progress?: number;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate?: string;
  completedDate?: string;
  tags?: string[];
  notes?: string;
}

export interface CreateMilestoneInput {
  goalId: string;
  title: string;
  description?: string;
  orderIndex: number;
  targetDate?: string;
}

export interface CreateCheckinInput {
  goalId: string;
  progressUpdate?: number;
  notes?: string;
  blockers?: string;
  wins?: string;
  nextActions?: string;
}

export interface CreateLifeDreamInput {
  title: string;
  description?: string;
  category: DreamCategory;
  /** @deprecated Use estimatedTimeframe instead */
  priority?: DreamPriority;
  estimatedCost?: number;
  estimatedTimeframe?: string;
  requiredResources?: string[];
  inspirationSources?: string[];
  tags?: string[];
  visionBoardImages?: string[];
  visionBoardNotes?: string;
  // Sharing options
  isShared?: boolean;  // If true, dream is shared with partner (sets connection_id)
  trackingMode?: TrackingMode;  // Only relevant when isShared=true
}

export interface UpdateLifeDreamInput {
  title?: string;
  description?: string;
  category?: DreamCategory;
  /** @deprecated Use estimatedTimeframe instead */
  priority?: DreamPriority;
  status?: DreamStatus;
  estimatedCost?: number;
  estimatedTimeframe?: string;
  requiredResources?: string[];
  inspirationSources?: string[];
  achievedAt?: string;
  tags?: string[];
  visionBoardImages?: string[];
  visionBoardNotes?: string;
  notes?: string;
}

// Statistics and analytics
export interface GoalStats {
  total: number;
  notStarted: number;
  inProgress: number;
  completed: number;
  onHold: number;
  abandoned: number;
  totalXpEarned: number;
  avgProgress: number;
  completionRate: number;
}

export interface DreamStats {
  total: number;
  dreaming: number;
  planning: number;
  inProgress: number;
  achieved: number;
  noLongerInterested: number;
}
