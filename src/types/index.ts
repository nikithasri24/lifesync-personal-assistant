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
  category?: TaskCategory | string
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

// 75 Hard Challenge types
export interface SeventyFiveHardRule {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  isCustom: boolean;
  dailyTarget?: number; // e.g. 2 for twice-daily workout
  segmentLabels?: string[]; // custom labels per segment
}

export interface RuleCompletion {
  ruleId: string;
  completed: boolean;
  completedAt?: Date;
  segments?: boolean[]; // for multi-target rules; length = dailyTarget
}

export interface SeventyFiveHardEntry {
  id: string;
  challengeId: string;
  date: Date;
  day: number;
  ruleCompletions: RuleCompletion[];
  notes?: string;
  progressPhotoUrl?: string;
  weight?: number;
  measurements: Record<string, number>;
}

export interface SeventyFiveHardChallenge {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  currentDay: number;
  rules: SeventyFiveHardRule[];
  dailyEntries: SeventyFiveHardEntry[];
  notes?: string;
  createdAt: Date;
}

// ==================== Travel Types ====================

export type TravelType = 'vacation' | 'business' | 'weekend' | 'adventure';

export interface TravelItineraryItem {
  id: string;
  date: Date;
  time?: string;
  type?: 'flight' | 'hotel' | 'activity' | 'transport' | 'note';
  title: string;
  location?: string;
  notes?: string;
}

export interface TravelTrip {
  id: string;
  title: string;
  destination: string;
  country?: string;
  startDate: Date;
  endDate: Date;
  type: TravelType;
  status: 'planning' | 'ongoing' | 'completed' | 'cancelled';
  budget?: number;
  spent?: number;
  notes?: string;
  itinerary: TravelItineraryItem[];
  creditCardTrip?: boolean;
  rating?: number;
  memories?: string[];
}

export interface CreditCardTrip {
  id: string;
  cardName: string;
  description: string;
  pointsEarned: number;
  pointsUsed: number;
  earnedDate: Date;
  redeemedDate?: Date;
  bonusCategory?: string;
}

export interface PTOEntry {
  id: string;
  startDate: Date;
  endDate: Date;
  days: number;
  type: 'approved' | 'pending' | 'planned' | 'taken';
  reason?: string;
}

export interface WorldProgress {
  countries: { total: number; visited: number; list: string[] };
  states: { total: number; visited: number; list: string[] };
  continents: Record<string, number>;
}

export interface MoonPhase {
  date: Date;
  phase: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
  illumination: number;
  isNewMoon: boolean;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: 'trip' | 'pto' | 'event';
}

export interface TravelStats {
  totalTrips: number;
}

export interface Country {
  id: string;
  code: string;
  name: string;
  continent: string;
  visited: boolean;
  visitDate?: string | Date;
  rating?: number;
  tripCount: number;
  photos?: string[];
  notes?: string;
}

export interface USState {
  id: string;
  code: string;
  name: string;
  capital?: string;
  visited: boolean;
  visitDate?: string | Date;
  rating?: number;
  tripCount: number;
  nationalParks?: string[];
  photos?: string[];
  notes?: string;
}

export interface IndiaState {
  id: string;
  code: string;
  name: string;
  capital?: string;
  visited: boolean;
  visitDate?: string | Date;
  rating?: number;
  tripCount: number;
  photos?: string[];
  notes?: string;
}

// Travel-focused National Park type (distinct from components map type)
export interface NationalPark {
  id: string;
  name: string;
  state: string;
  coordinates?: { lat: number; lng: number };
  visited?: boolean;
  rating?: number;
  visitDate?: string | Date;
  photos?: string[];
  notes?: string;
}
