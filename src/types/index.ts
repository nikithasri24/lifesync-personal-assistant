export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in-progress' | 'waiting' | 'scheduled' | 'done';

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  categoryId?: string;
  projectId?: string;
  parentId?: string;
  tags: string[];
  estimatedTime?: number;
  actualTime?: number;
  dueDate?: Date;
  completed: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
  deleted?: boolean;
  deletedAt?: Date;
}

export type HabitFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

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
  updatedAt: Date;
}

export interface MoodEntry {
  id: string;
  mood: JournalMood;
  energy: 'low' | 'medium' | 'high';
  notes?: string;
  createdAt: Date;
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGoalsCompleted: number;
}
