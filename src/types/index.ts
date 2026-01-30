// Re-export canonical task types from task.ts
export type {
  TaskPriority,
  TaskStatus,
  TaskCategory,
  SubTask,
  FollowUpTask,
  Task,
  TaskInput,
  TaskUpdate,
  TaskFilters,
  TaskAnalytics,
} from './task';

// TodoItem has been deprecated and removed. Use Task from '@/types/task' instead.
// Migration: task.completed → task.status === 'done'

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  status: 'active' | 'completed' | 'on_hold'
  icon: string
  createdAt: Date
  updatedAt?: Date
}

export type FocusSessionStatus = 'active' | 'completed' | 'cancelled' | 'paused'

export interface FocusSession {
  id: string
  preset: string
  duration: number
  actualDuration?: number
  startTime: Date
  endTime?: Date
  status: FocusSessionStatus
  taskId?: string
  todoId?: string
  notes?: string
}

export interface HabitCompletion {
  id: string;
  completedAt: Date;
  notes?: string;
}

export interface HabitReminder {
  enabled: boolean;
  time: string;
  days: number[];
  title: string;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: HabitFrequency;
  targetCount: number;
  goalMode?: 'daily-target' | 'total-goal';
  goalTarget?: number;
  goalUnit?: string;
  currentProgress: number;
  color: string;
  categoryId: string;
  reminder?: HabitReminder;
  completions: HabitCompletion[];
  createdAt: Date;
  streak: number;
}

export interface HabitCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
}

export type NoteType = 'note' | 'list';

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  noteType: NoteType;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListItem {
  id: string;
  noteId: string;
  title: string;
  notes?: string;
  completed: boolean;
  completedAt?: Date;
  tags: string[];
  dueDate?: Date;
  url?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'link';
  url: string;
  size?: number;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  tags: string[];
  attachments: Attachment[];
  createdAt: Date;
}

/**
 * @deprecated Use LifeGoal from '@/goals/types/lifeGoals' instead.
 * This type is kept for backward compatibility.
 */
export type { LifeGoal as Goal } from '../goals/types/lifeGoals';

/**
 * @deprecated Use LifeDream from '@/goals/types/lifeGoals' instead.
 * This type is kept for backward compatibility.
 */
export type { LifeDream as Dream } from '../goals/types/lifeGoals';

export interface Ingredient {
  name: string;
  amount?: string;
  unit?: string;
  notes?: string;
}

export interface RecipeFlowStep {
  id: string;
  step: number;
  title: string;
  description: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  calories?: number;
  instructions: string[];
  ingredients: Array<{
    name: string;
    amount?: string;
    unit?: string;
  }>;
  tags?: string[];
  isFavorite?: boolean;
  dietaryRestrictions?: string[];
  nutritionInfo?: Record<string, unknown>;
  sourceType?: 'manual' | 'url' | 'ai' | 'youtube';
  sourceUrl?: string;
  videoThumbnail?: string;
  image?: string;
  rating?: number;
  notes?: string;
  flowChart?: unknown[];
  createdAt: Date;
}

export interface MealColumn {
  id: string;
  name: string;
  defaultServings: number;
  defaultPeopleCount: number;
  color: string;
  icon?: string;
  order: number;
}

export type MealStatus = 'planned' | 'prepped' | 'cooked' | 'eaten' | 'substituted' | 'postponed';

export interface PlannedMeal {
  id: string;
  mealPlanId: string;
  date: Date;
  mealType: string;
  recipeId?: string;
  customMeal?: string;
  servings: number;
  peopleCount: number;
  status: MealStatus;
  notes?: string;

  // Substitution and backlog tracking
  actualFoodLogId?: string;      // Link to food_log entry for what was actually eaten
  substitutedWith?: string;       // Quick note of what was eaten instead
  isPostponed?: boolean;          // Whether this meal is in the backlog
  postponedReason?: string;       // Reason for postponing
  originalDate?: Date;            // Original scheduled date before postponing

  createdAt: Date;
}

export interface MealPlanWeek {
  id: string;
  name: string;
  weekStartDate: Date;
  mealColumns: MealColumn[];
  meals: PlannedMeal[];
  notes?: string;
  shoppingListGenerated?: boolean;
  totalEstimatedCost?: number;
  connectionId?: string;  // For merged/shared meal plans between connected users
  partnerId?: string;     // Partner's user ID when in merged mode
  createdAt: Date;
  updatedAt: Date;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'bakery' | 'other';
  location?: string;
  expirationDate?: Date;
  notes?: string;
  isLowStock?: boolean;
  lowStockThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGoalsCompleted: number;
}
export * from './travel';
export * from './infrastructure';

// ==================== Health & Period Tracking Types ====================

export interface HealthKitSample {
  startDate: Date;
  endDate: Date;
  value: number;
}

export interface HealthKitFlowData {
  samples: HealthKitSample[];
}

export interface HealthKitData {
  menstrualFlow?: HealthKitFlowData;
  symptoms?: { samples: unknown[] };
  ovulation?: unknown;
  basalBodyTemperature?: { samples: unknown[] };
}

export interface HealthSyncStatus {
  lastSync: Date;
  status: 'success' | 'error';
  recordsImported: number;
  errors: string[];
}

export interface PeriodCycle {
  id: string;
  startDate: Date;
  endDate?: Date;
  flow: 'light' | 'medium' | 'heavy';
  symptoms: string[];
  source: 'apple-health' | 'manual';
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface HealthKitMessageHandler {
  postMessage: (message: unknown) => Promise<unknown>;
}

interface WebKitMessageHandlers {
  health?: HealthKitMessageHandler;
}

interface WebKit {
  messageHandlers?: WebKitMessageHandlers;
}

declare global {
  interface Window {
    webkit?: WebKit;
    HealthKit?: unknown;
  }
}
