export interface HabitCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  habits: Habit[];
  collapsed?: boolean;
  createdAt: Date;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customFrequency?: HabitCustomFrequency;
  targetCount: number;
  goalMode?: 'daily-target' | 'total-goal' | 'course-completion';
  goalTarget?: number;
  goalUnit?: string;
  currentProgress?: number;
  completions: HabitCompletion[];
  createdAt: Date;
  categoryId: string;
  color: string;
  reminder?: HabitReminder;
  streak?: number;
}

export interface HabitCustomFrequency {
  type: 'every-x-days' | 'specific-days' | 'x-times-per-week' | 'x-times-per-month';
  interval?: number; // for every-x-days
  daysOfWeek?: number[]; // for specific-days (0-6, Sunday to Saturday)
  timesPerPeriod?: number; // for x-times-per-week or x-times-per-month
}

export interface HabitReminder {
  enabled: boolean;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday to Saturday)
  title: string;
  message?: string;
  sound?: boolean;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedAt: Date;
  notes?: string;
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

export interface SeventyFiveHardRule {
  id: string;
  title: string;
  description: string;
  isRequired: boolean;
  isCustom: boolean;
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
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
}

export interface RuleCompletion {
  ruleId: string;
  completed: boolean;
  notes?: string;
  completedAt?: Date;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  category: 'work' | 'personal' | 'ideas' | 'meeting' | 'project';
  createdAt: Date;
  updatedAt: Date;
  isPinned: boolean;
}

export interface TodoCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  todos: TodoItem[];
  createdAt: Date;
}

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  status: 'need-to-start' | 'currently-working' | 'pending-others' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  categoryId: string; // personal, household, work
  dueDate?: Date;
  assignedTo?: string; // for pending from others
  blockedBy?: string; // reason for being blocked
  waitingFor?: string; // what the task is waiting for
  waitingForType?: 'person' | 'approval' | 'information' | 'event' | 'delivery' | 'other'; // type of waiting
  waitingForContact?: string; // who/what to follow up with
  waitingForDeadline?: Date; // when to follow up if no response
  waitingForNotes?: string; // additional waiting context
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  estimatedTime?: number; // in minutes
  completedAt?: Date;
  // Legacy field for backward compatibility
  completed?: boolean;
  // New fields for enhanced functionality
  recurring?: RecurringPattern;
  parentId?: string; // for sub-tasks
  subtasks?: TodoItem[];
  calendarEventId?: string; // link to calendar event
  focusTime?: number; // pomodoro time spent in minutes
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  status: 'active' | 'completed' | 'on-hold' | 'cancelled';
  startDate: Date;
  endDate?: Date;
  progress: number; // 0-100
  todos: TodoItem[];
  createdAt: Date;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: 'excellent' | 'good' | 'neutral' | 'bad' | 'terrible';
  tags: string[];
  attachments: Attachment[];
  createdAt: Date;
  weather?: string;
  gratitude?: string[];
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'link';
  url: string;
  size?: number;
}

export interface ShoppingItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string; // 'lbs', 'oz', 'pcs', 'bottles', etc.
  category: 'produce' | 'dairy' | 'meat' | 'pantry' | 'frozen' | 'bakery' | 'deli' | 'household' | 'personal' | 'electronics' | 'other';
  subcategory?: string; // more specific categorization
  priority: 'low' | 'medium' | 'high';
  purchased: boolean;
  price?: number;
  estimatedPrice?: number;
  store?: string;
  aisle?: string;
  brand?: string;
  size?: string;
  notes?: string;
  imageUrl?: string;
  barcode?: string;
  nutritionInfo?: {
    calories?: number;
    organic?: boolean;
    glutenFree?: boolean;
    vegan?: boolean;
  };
  tags?: string[];
  addedBy?: string; // for shared lists
  purchasedAt?: Date;
  purchasedBy?: string;
  listId: string;
  recipeId?: string; // if added from a recipe
  autoAdded?: boolean; // if added by smart suggestions
  recurring?: {
    frequency: 'weekly' | 'biweekly' | 'monthly';
    lastPurchased?: Date;
    autoAdd: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  type: 'personal' | 'shared' | 'recipe-based' | 'template';
  color: string;
  icon?: string;
  store?: string;
  totalEstimatedCost?: number;
  totalActualCost?: number;
  items: string[]; // ShoppingItem IDs
  collaborators?: string[];
  owner: string;
  completedAt?: Date;
  archived: boolean;
  template?: boolean; // if this is a reusable template
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Store {
  id: string;
  name: string;
  address?: string;
  layout?: {
    aisles: StoreAisle[];
  };
  avgPrices?: { [itemName: string]: number };
  lastVisited?: Date;
  favorite: boolean;
}

export interface StoreAisle {
  id: string;
  name: string;
  number?: number;
  categories: string[];
}

export interface ShoppingHistory {
  id: string;
  itemName: string;
  store: string;
  price: number;
  quantity: number;
  unit?: string;
  brand?: string;
  purchasedAt: Date;
  category: string;
}

export interface ShoppingInsights {
  monthlySpending: number;
  averageItemPrice: { [itemName: string]: number };
  frequentItems: Array<{
    name: string;
    purchaseCount: number;
    averagePrice: number;
    lastPurchased: Date;
  }>;
  budgetAnalysis: {
    thisMonth: number;
    lastMonth: number;
    categoryBreakdown: { [category: string]: number };
  };
  suggestions: ShoppingSuggestion[];
}

export interface ShoppingSuggestion {
  id: string;
  type: 'recurring' | 'recipe-based' | 'seasonal' | 'deal' | 'substitute';
  itemName: string;
  reason: string;
  confidence: number;
  estimatedPrice?: number;
  store?: string;
  validUntil?: Date;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  ingredients: Ingredient[];
  instructions: string[];
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  rating?: number; // 1-5
  notes?: string;
  image?: string;
  createdAt: Date;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: Date;
  account?: string;
  tags: string[];
  receipt?: string;
  recurring?: {
    frequency: 'weekly' | 'monthly' | 'yearly';
    endDate?: Date;
  };
}

export interface Budget {
  id: string;
  name: string;
  category: string;
  budgetedAmount: number;
  spentAmount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  alerts: {
    at50Percent: boolean;
    at80Percent: boolean;
    atLimit: boolean;
  };
}

export interface DashboardData {
  todayTodos: TodoItem[];
  upcomingDeadlines: TodoItem[];
  todayHabits: Habit[];
  recentNotes: Note[];
  weeklyProgress: {
    habitsCompleted: number;
    todosCompleted: number;
    journalEntries: number;
  };
}

// New types for enhanced functionality

export interface RecurringPattern {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number; // every X days/weeks/months
  daysOfWeek?: number[]; // for weekly: 0-6 (Sunday to Saturday)
  dayOfMonth?: number; // for monthly: 1-31
  monthOfYear?: number; // for yearly: 1-12
  endDate?: Date;
  endAfterOccurrences?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  allDay: boolean;
  multiDay?: boolean; // for events spanning multiple days horizontally
  location?: string;
  attendees?: string[];
  calendarId: string; // which calendar it belongs to
  todoId?: string; // linked todo item
  recurring?: RecurringPattern;
  reminders?: EventReminder[];
  color?: string;
  source: 'internal' | 'google' | 'outlook' | 'apple';
  externalId?: string; // ID from external calendar
}

export interface EventReminder {
  type: 'notification' | 'email';
  minutesBefore: number;
}

export interface Calendar {
  id: string;
  name: string;
  description?: string;
  color: string;
  source: 'internal' | 'google' | 'outlook' | 'apple';
  syncEnabled: boolean;
  syncToken?: string;
  isDefault: boolean;
}

export interface FocusSession {
  id: string;
  todoId?: string;
  projectId?: string;
  duration: number; // planned duration in minutes
  actualDuration?: number; // actual time worked
  startTime: Date;
  endTime?: Date;
  type: 'pomodoro' | 'deep-work' | 'meeting' | 'break';
  notes?: string;
  completed: boolean;
  interruptions?: number;
}

export interface MoodEntry {
  id: string;
  date: Date;
  mood: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=excellent
  energy: 1 | 2 | 3 | 4 | 5;
  stress: 1 | 2 | 3 | 4 | 5;
  sleep?: number; // hours of sleep
  exercise?: boolean;
  socialTime?: boolean;
  notes?: string;
  tags?: string[];
  factors?: string[]; // what influenced the mood
}

export interface RelationshipGoal {
  id: string;
  title: string;
  description?: string;
  category: 'travel' | 'date' | 'experience' | 'personal-growth' | 'shared-hobby' | 'other';
  priority: 'low' | 'medium' | 'high';
  targetDate?: Date;
  completed: boolean;
  completedAt?: Date;
  cost?: number;
  location?: string;
  notes?: string;
  photos?: string[];
  sharedWith?: string[];
}

export interface BucketListItem {
  id: string;
  title: string;
  description?: string;
  category: 'travel' | 'adventure' | 'learning' | 'personal' | 'career' | 'relationships' | 'other';
  priority: 'someday' | 'next-year' | 'this-year' | 'urgent';
  estimatedCost?: number;
  location?: string;
  timeRequired?: string; // "2 weeks", "1 day", etc.
  completed: boolean;
  completedAt?: Date;
  notes?: string;
  photos?: string[];
  linkedGoals?: string[]; // IDs of related relationship goals
}

export interface LoveLanguage {
  primary: 'words-of-affirmation' | 'acts-of-service' | 'receiving-gifts' | 'quality-time' | 'physical-touch';
  secondary?: 'words-of-affirmation' | 'acts-of-service' | 'receiving-gifts' | 'quality-time' | 'physical-touch';
  preferences: {
    [key: string]: string[]; // specific preferences for each language
  };
  reminders: {
    frequency: 'daily' | 'weekly' | 'monthly';
    suggestions: string[];
  };
}

export interface ConflictResolution {
  id: string;
  date: Date;
  topic: string;
  description: string;
  triggers: string[];
  resolution?: string;
  whatWorked: string[];
  whatDidntWork: string[];
  lessonsLearned: string[];
  followUp?: string;
  resolved: boolean;
  rating?: 1 | 2 | 3 | 4 | 5; // how well it was handled
}

export interface SharedItem {
  id: string;
  title: string;
  type: 'book' | 'movie' | 'tv-show' | 'podcast' | 'article' | 'video' | 'other';
  category: 'to-read' | 'to-watch' | 'currently-reading' | 'currently-watching' | 'completed' | 'abandoned';
  priority: 'low' | 'medium' | 'high';
  addedBy: string;
  recommendedBy?: string;
  dateAdded: Date;
  dateCompleted?: Date;
  rating?: 1 | 2 | 3 | 4 | 5;
  review?: string;
  genres?: string[];
  estimatedTime?: string; // "300 pages", "2 hours", etc.
  link?: string;
  notes?: string;
  sharedNotes?: string; // notes visible to partner
}

export interface GiftIdea {
  id: string;
  recipient: string;
  title: string;
  description?: string;
  category: 'birthday' | 'anniversary' | 'holiday' | 'just-because' | 'special-occasion';
  priority: 'low' | 'medium' | 'high';
  priceRange: 'under-25' | '25-50' | '50-100' | '100-250' | '250-500' | 'over-500';
  estimatedCost?: number;
  occasion?: string;
  targetDate?: Date;
  purchased: boolean;
  purchasedAt?: Date;
  link?: string;
  store?: string;
  notes?: string;
  addedBy: string;
  tags?: string[];
}

export interface ImportConfig {
  source: 'notion' | 'google-keep' | 'google-calendar' | 'outlook' | 'apple-calendar' | 'todoist' | 'any-do';
  dataTypes: ('todos' | 'notes' | 'calendar' | 'habits')[];
  mapping: {
    [key: string]: string; // field mapping from source to our schema
  };
  filters?: {
    dateRange?: { start: Date; end: Date };
    categories?: string[];
    tags?: string[];
  };
}

export interface DataExport {
  id: string;
  format: 'json' | 'csv' | 'pdf' | 'ical';
  dataTypes: ('todos' | 'notes' | 'calendar' | 'habits' | 'journal' | 'mood' | 'goals')[];
  filters?: {
    dateRange?: { start: Date; end: Date };
    categories?: string[];
    completed?: boolean;
  };
  createdAt: Date;
  downloadUrl?: string;
  expiresAt?: Date;
}

// Period Tracking Types
export interface PeriodCycle {
  id: string;
  startDate: Date;
  endDate?: Date;
  flow: 'light' | 'medium' | 'heavy';
  symptoms: PeriodSymptom[];
  notes?: string;
  source: 'manual' | 'apple-health' | 'google-fit';
  synced: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PeriodSymptom {
  id: string;
  type: 'cramps' | 'headache' | 'mood-swings' | 'bloating' | 'fatigue' | 'acne' | 'back-pain' | 'breast-tenderness' | 'nausea' | 'food-cravings' | 'other';
  severity: 1 | 2 | 3 | 4 | 5; // 1 = mild, 5 = severe
  notes?: string;
  timestamp: Date;
}

export interface PeriodPrediction {
  id: string;
  predictedStartDate: Date;
  predictedEndDate: Date;
  confidence: number; // 0-1 (0-100%)
  cycleLength: number; // average cycle length in days
  periodLength: number; // average period length in days
  basedOnCycles: number; // number of cycles used for prediction
  createdAt: Date;
}

export interface PeriodSettings {
  trackingEnabled: boolean;
  appleHealthSyncEnabled: boolean;
  googleFitSyncEnabled: boolean;
  notificationsEnabled: boolean;
  reminderDays: number; // days before predicted start
  averageCycleLength: number;
  averagePeriodLength: number;
  lastSyncDate?: Date;
  privacyMode: boolean; // hide sensitive data in shared views
}

export interface PeriodInsights {
  id: string;
  cycleRegularity: 'regular' | 'irregular' | 'insufficient-data';
  averageCycleLength: number;
  averagePeriodLength: number;
  commonSymptoms: string[];
  cycleVariation: number; // standard deviation of cycle lengths
  trends: {
    cycleLength: 'increasing' | 'decreasing' | 'stable';
    periodLength: 'increasing' | 'decreasing' | 'stable';
    symptoms: 'improving' | 'worsening' | 'stable';
  };
  generatedAt: Date;
}

// Health Integration Types
export interface HealthKitData {
  menstrualFlow?: {
    samples: Array<{
      startDate: Date;
      endDate: Date;
      value: 1 | 2 | 3 | 4 | 5; // Apple Health flow values
    }>;
  };
  symptoms?: {
    samples: Array<{
      type: string;
      startDate: Date;
      severity?: number;
    }>;
  };
  ovulation?: {
    samples: Array<{
      startDate: Date;
      value: string;
    }>;
  };
  basalBodyTemperature?: {
    samples: Array<{
      date: Date;
      value: number; // in Celsius
    }>;
  };
}

export interface HealthSyncStatus {
  lastSync: Date;
  status: 'syncing' | 'success' | 'error' | 'permission-denied';
  recordsImported: number;
  errors?: string[];
}

// Goals and Achievement Types
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'health' | 'personal' | 'career' | 'fitness';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'not-started' | 'in-progress' | 'paused' | 'completed' | 'failed';
  progress: number; // 0-100
  targetValue?: number;
  currentValue?: number;
  unit?: string; // '$', 'lbs', 'hours', etc.
  startDate: Date;
  targetDate: Date;
  completedDate?: Date;
  milestones: Milestone[];
  tags: string[];
  isPublic: boolean;
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary';
  xpReward: number;
  streakDays: number;
  lastUpdated: Date;
  createdAt: Date;
  notes: string;
  attachments: Attachment[];
  subGoals: SubGoal[];
  // Streak functionality
  streakEnabled: boolean;
  streakFrequency: 'daily' | 'weekly' | 'monthly';
  streakTarget?: number; // e.g., 21 days, 12 weeks, 6 months
  streakHistory: StreakEntry[];
  lastStreakUpdate?: Date;
  longestStreak: number;
  currentStreak: number;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  isCompleted: boolean;
  completedDate?: Date;
  xpReward: number;
}

export interface SubGoal {
  id: string;
  title: string;
  isCompleted: boolean;
  completedDate?: Date;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'link';
  url: string;
  size?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  unlockedAt?: Date;
  isUnlocked: boolean;
  category: 'streak' | 'completion' | 'progress' | 'milestone' | 'special';
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalGoalsCompleted: number;
  totalDreamsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  achievements: Achievement[];
  totalXpEarned: number;
}

// Dreams - Aspirational items with different structure
export interface Dream {
  id: string;
  title: string;
  description: string;
  category: 'travel' | 'experiences' | 'possessions' | 'achievements' | 'relationships' | 'lifestyle';
  priority: 'someday' | 'within-5-years' | 'within-10-years' | 'lifetime';
  status: 'dreaming' | 'planning' | 'in-progress' | 'achieved' | 'no-longer-interested';
  estimatedCost?: number;
  estimatedTimeframe?: string; // "2 years", "when I retire", "by age 40"
  requiredResources: string[]; // ["Save $50k", "Learn Italian", "Get passport"]
  inspirationSources: string[]; // URLs, books, people who inspired this dream
  tags: string[];
  isPublic: boolean;
  createdAt: Date;
  lastUpdated: Date;
  achievedAt?: Date;
  notes: string;
  attachments: Attachment[];
  relatedGoals: string[]; // IDs of goals that support this dream
  visualBoard: DreamVisual[]; // Vision board items
}

export interface DreamVisual {
  id: string;
  type: 'image' | 'quote' | 'video' | 'article';
  title: string;
  url?: string;
  description?: string;
  addedAt: Date;
}

export interface StreakEntry {
  id: string;
  goalId: string;
  date: Date;
  completed: boolean;
  notes?: string;
  value?: number; // for goals with measurable progress
}

// National Parks Types
export interface NationalPark {
  id: string;
  name: string;
  state: string;
  visited: boolean;
  visitDate?: Date;
  rating?: number;
  photos?: string[];
  notes?: string;
  coordinates: { lat: number; lng: number };
}

export interface TravelTrip {
  id: string;
  title: string;
  destination: string;
  startDate: Date;
  endDate: Date;
  type: 'vacation' | 'business' | 'weekend' | 'adventure';
  status: 'planning' | 'booked' | 'ongoing' | 'completed';
  budget?: number;
  spent?: number;
  notes?: string;
  photos?: string[];
  itinerary?: TravelItineraryItem[];
  creditCardTrip?: boolean;
  pointsUsed?: number;
  country?: string;
  state?: string;
  nationalParks?: string[];
  memories?: string[];
  rating?: number;
  distanceTraveled?: number;
}

export interface TravelItineraryItem {
  id: string;
  title: string;
  date: Date;
  time?: string;
  type: 'flight' | 'hotel' | 'activity' | 'restaurant' | 'transport';
  location?: string;
  notes?: string;
  cost?: number;
}

export interface CreditCardTrip {
  id: string;
  tripId?: string;
  cardName: string;
  pointsEarned: number;
  pointsUsed: number;
  bonusCategory?: string;
  description: string;
  earnedDate: Date;
  redeemedDate?: Date;
}

export interface PTOEntry {
  id: string;
  startDate: Date;
  endDate: Date;
  days: number;
  type: 'planned' | 'approved' | 'pending' | 'used';
  reason?: string;
  notes?: string;
}

export interface WorldProgress {
  countries: {
    total: number;
    visited: number;
    list: { code: string; name: string; visited: boolean; visitDate?: Date; tripCount: number }[];
  };
  states: {
    total: number;
    visited: number;
    list: { code: string; name: string; visited: boolean; visitDate?: Date; tripCount: number }[];
  };
  continents: {
    northAmerica: number;
    southAmerica: number;
    europe: number;
    asia: number;
    africa: number;
    oceania: number;
    antarctica: number;
  };
}

export interface Country {
  id: string;
  name: string;
  code: string; // ISO country code
  continent: string;
  visited: boolean;
  visitDate?: Date;
  rating?: number;
  notes?: string;
  photos?: string[];
  tripCount: number;
  coordinates?: { lat: number; lng: number };
}

export interface USState {
  id: string;
  name: string;
  code: string; // State abbreviation
  visited: boolean;
  visitDate?: Date;
  rating?: number;
  notes?: string;
  photos?: string[];
  tripCount: number;
  nationalParks?: string[]; // National parks in this state
}

export interface IndiaState {
  id: string;
  name: string;
  code: string; // State code
  visited: boolean;
  visitDate?: Date;
  rating?: number;
  notes?: string;
  photos?: string[];
  tripCount: number;
  capital?: string;
}

export interface MoonPhase {
  date: Date;
  phase: 'new' | 'waxing-crescent' | 'first-quarter' | 'waxing-gibbous' | 'full' | 'waning-gibbous' | 'last-quarter' | 'waning-crescent';
  illumination: number; // 0-100%
  isNewMoon: boolean;
  nextNewMoon?: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor'; // for stargazing
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'pto' | 'trip' | 'moon' | 'stargazing';
  duration?: number;
  description?: string;
}

export interface TravelStats {
  totalTrips: number;
  totalDays: number;
  totalMiles: number;
  countriesVisited: number;
  statesVisited: number;
  nationalParksVisited: number;
  totalSpent: number;
  averageTripLength: number;
  longestTrip: number;
  favoriteSeason: string;
  mostVisitedCountry: string;
}