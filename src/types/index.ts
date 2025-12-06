export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskStatus = 'todo' | 'in-progress' | 'waiting' | 'scheduled' | 'done'

export type TaskCategory = 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other'

export interface SubTask {
  id: string
  title: string
  description?: string
  status?: TaskStatus
  completed?: boolean
  estimatedTime?: number
  actualTime?: number
}

export interface FollowUpTask {
  id: string
  title: string
  description?: string
  priority?: TaskPriority
  daysAfter?: number
  triggerCondition?: 'immediate' | 'delayed' | 'manual'
  category?: string
  estimatedTime?: number
  tags?: string[]
}

export interface TodoItem {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  categoryId?: TaskCategory
  category?: string
  projectId?: string
  parentId?: string
  tags: string[]
  estimatedTime?: number
  actualTime?: number
  dueDate?: Date
  completed: boolean
  completedAt?: Date
  createdAt: Date
  updatedAt?: Date
  deleted?: boolean
  deletedAt?: Date
  notes?: string
  starred?: boolean
  archived?: boolean
  assignedTo?: string
  dependsOn?: string[]
  followUpTasks?: FollowUpTask[]
  subtasks?: SubTask[]
}

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

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JournalMood = 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';

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
  mood: JournalMood;
  tags: string[];
  attachments: Attachment[];
  createdAt: Date;
  weather?: unknown;
  gratitude?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'health' | 'personal' | 'career' | 'fitness';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not-started' | 'in-progress' | 'paused' | 'completed' | 'failed';
  progress: number;
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  tags: string[];
  isPublic: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  xpReward: number;
  notes: string;
  createdAt: Date;
}

export interface Dream {
  id: string;
  title: string;
  description: string;
  category: 'travel' | 'experiences' | 'possessions' | 'achievements' | 'relationships' | 'lifestyle';
  priority: 'someday' | 'within-5-years' | 'within-10-years' | 'lifetime';
  status: 'dreaming' | 'planning' | 'in-progress' | 'achieved' | 'no-longer-interested';
  estimatedCost?: number;
  estimatedTimeframe?: string;
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  lastUpdated: Date;
  achievedAt?: Date;
  notes: string;
}

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
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  rating?: number;
  notes?: string;
  image?: string;
  isFavorite?: boolean;
  calories?: number;
  cuisine?: string;
  dietaryRestrictions?: string[];
  nutritionInfo?: Record<string, number>;
  flowChart?: RecipeFlowStep[];
  sourceType?: 'youtube' | 'manual';
  sourceUrl?: string;
  authorName?: string;
  videoThumbnail?: string;
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

export type MealStatus = 'planned' | 'prepped' | 'cooked' | 'eaten';

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
  createdAt: Date;
}

export interface MealPlanWeek {
  id: string;
  name: string;
  weekStartDate: Date;
  mealColumns: MealColumn[];
  meals: PlannedMeal[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'other';
  location?: string;
  expirationDate?: Date;
  notes?: string;
  isLowStock?: boolean;
  lowStockThreshold?: number;
  updatedAt: Date;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGoalsCompleted: number;
}
export * from './travel';

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
