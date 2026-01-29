// Shared data contracts for LifeSync services
// These mirror the Supabase/PostgreSQL schema while remaining compatible with the legacy REST API.

/**
 * TaskData - User tasks for the task management system
 * This is the canonical Task type used throughout the application.
 * It aligns with the Supabase/PostgreSQL schema.
 */
export interface TaskData {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  project_id?: string | null;
  status?: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'important';
  estimated_time?: number | null;
  actual_time?: number | null;
  due_date?: string | null;
  scheduled_start?: string | null; // ISO timestamp for scheduled start
  scheduled_end?: string | null; // ISO timestamp for scheduled end
  tags?: string[] | null;
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other' | null;
  notes?: string | null;
  starred?: boolean | null;
  archived?: boolean | null;
  deleted?: boolean | null;
  parent_id?: string | null;
  position?: number | null;
  deleted_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  // Properties from lib/supabase.ts Task type
  sidebar_section?: 'todo' | 'in_progress' | 'backlog' | 'scheduled' | null;
  depends_on?: string[] | null;
  follow_up_tasks?: FollowUpTask[] | null;
  is_waiting_for?: string | null;
  trigger_date?: string | null;
  is_blocked?: boolean | null;
  reminder?: string | null;
  attachments?: string[] | null;
  assigned_to?: string | null; // User ID of the person this task is assigned to
  assigned_by?: string | null; // User ID of the person who assigned this task
  assigned_at?: string | null; // When the task was assigned
  // Recurrence fields
  recurrence_pattern?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | null;
  recurrence_interval?: number | null; // e.g., every 2 weeks
  recurrence_days?: number[] | null; // for weekly: [0,1,2,3,4,5,6] (Sun-Sat), for monthly: [1,15] (days of month)
  recurrence_end_date?: string | null; // when recurrence should stop
  recurrence_count?: number | null; // max occurrences (alternative to end_date)
  parent_recurring_id?: string | null; // link to the original recurring task template
  // Location fields for errands and location-based reminders
  location_name?: string | null; // e.g., "Costco", "Target", "Home Depot"
  location_address?: string | null; // Full address
  location_coordinates?: { lat: number; lng: number } | null; // GPS coordinates
  is_errand?: boolean | null; // Mark as errand for location-based reminders
}

/**
 * FollowUpTask - A subtask or follow-up action for a task
 */
export interface FollowUpTask {
  id: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  days_after?: number;
  trigger_condition?: 'immediate' | 'delayed' | 'manual';
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  estimated_time?: number;
  tags?: string[];
  completed?: boolean;
}

export interface ProjectData {
  id?: string;
  user_id?: string;
  name: string;
  description?: string | null;
  color?: string | null;
  status?: 'active' | 'completed' | 'on_hold';
  icon?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface HabitData {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  category?: string;
  frequency?: 'daily' | 'weekly' | 'monthly';
  target_value?: number;
  unit?: string;
  goal_mode?: 'daily-target' | 'total-goal' | 'course-completion';
  goal_target?: number;
  goal_unit?: string;
  current_progress?: number;
  color?: string;
  icon?: string;
  streak_count?: number;
  best_streak?: number;
  is_active?: boolean;
  reminder_time?: string;
  reminder_enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface HabitEntryData {
  id?: string;
  habit_id: string;
  date: string;
  value?: number;
  notes?: string;
  created_at?: string;
}

export interface FinancialTransactionData {
  id?: string;
  user_id?: string;
  account_id?: string;
  category_id?: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description?: string;
  payee?: string;
  date: string;
  tags?: string[];
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FinancialAccountData {
  id?: string;
  user_id?: string;
  name: string;
  type: string;
  institution?: string;
  account_number?: string;
  balance?: number;
  currency?: string;
  color?: string;
  icon?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ShoppingListData {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  status?: 'active' | 'completed' | 'archived';
  total_estimated_cost?: number;
  total_actual_cost?: number;
  store?: string;
  shopping_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface StoreData {
  id?: string;
  user_id?: string;
  name: string;
  type: 'grocery' | 'wholesale' | 'specialty' | 'organic' | 'international' | 'pharmacy';
  address?: string;
  phone?: string;
  website?: string;
  logo?: string;
  color?: string;
  coordinates?: { lat: number; lng: number } | null;
  preferences?: {
    priceRating?: number;
    qualityRating?: number;
    cleanlinessRating?: number;
    serviceRating?: number;
    overallRating?: number;
  } | null;
  specialties?: string[];
  best_for?: string[];
  avg_prices?: Record<string, number>;
  distance?: number;
  last_visited?: string;
  favorite?: boolean;
  hours?: Record<string, { open: string; close: string } | null> | null;
  has_delivery?: boolean;
  has_pickup?: boolean;
  delivery_fee?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ShoppingItemData {
  id?: string;
  shopping_list_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  estimated_price?: number;
  actual_price?: number;
  category?: string;
  subcategory?: string;
  brand?: string;
  notes?: string;
  is_purchased?: boolean;
  purchased_at?: string;
  position?: number;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  assigned_store?: string;
  best_stores?: string[];
  barcode?: string;
  image_url?: string;
  nutrition_info?: Record<string, unknown>;
  added_by?: string;
  purchased_by?: string;
  auto_added?: boolean;
  recipe_id?: string;
  store?: string;
  aisle?: string;
  recurring?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface PantryItemData {
  id?: string;
  user_id?: string;
  name: string;
  quantity?: number;
  unit?: string;
  category?: string;
  subcategory?: string;
  location?: string;
  expiration_date?: string;
  notes?: string;
  is_low_stock?: boolean;
  low_stock_threshold?: number;
  auto_restock?: boolean;
  restock_quantity?: number;
  last_purchased_at?: string;
  last_used_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlannedMealData {
  id?: string;
  meal_plan_id: string;
  recipe_id?: string;
  meal_type: string;
  date: string;
  servings?: number;
  custom_meal?: string;
  people_count?: number;
  status?: 'planned' | 'prepped' | 'cooked' | 'eaten' | 'substituted' | 'postponed';
  notes?: string;
  prepared_at?: string;
  consumed_at?: string;

  // Substitution and backlog tracking
  actual_food_log_id?: string;
  substituted_with?: string;
  is_postponed?: boolean;
  postponed_reason?: string;
  original_date?: string;

  created_at?: string;
  updated_at?: string;
}

export interface MealPlanData {
  id?: string;
  user_id?: string;
  name: string;
  week_start_date: string;
  notes?: string;
  meal_columns?: Record<string, unknown> | null;
  shopping_list_generated?: boolean;
  total_estimated_cost?: number;
  created_at?: string;
  updated_at?: string;
  planned_meals?: PlannedMealData[];
}

export interface RecipeIngredientData {
  id?: string;
  recipe_id: string;
  name: string;
  quantity?: number;
  unit?: string;
  notes?: string;
  position?: number;
  category?: string;
  optional?: boolean;
  created_at?: string;
}

export interface FocusSessionData {
  id?: string;
  user_id?: string;
  task_id?: string | null;
  type: 'pomodoro' | 'deep-work' | 'custom';
  duration_minutes: number; // planned duration in minutes
  actual_duration_seconds?: number | null; // actual duration in seconds
  started_at: string;
  completed_at?: string | null;
  status: 'in-progress' | 'completed' | 'abandoned';
  breaks_taken?: number | null;
  distractions?: number | null;
  productivity_score?: number | null; // 1-10
  notes?: string | null;
  environment_data?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface RecipeData {
  id?: string;
  user_id?: string;
  name: string;
  description?: string;
  cuisine?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  calories_per_serving?: number;
  instructions?: string;
  ingredients?: Array<{ name: string; amount?: string; unit?: string }> | null;
  tags?: string[];
  is_favorite?: boolean;
  dietary_restrictions?: string[];
  nutrition_info?: Record<string, number>;
  source_type?: string;
  source_url?: string;
  video_thumbnail?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnalyticsData {
  tasks: {
    total: string;
    completed: string;
  };
  habits: {
    total: string;
  };
  finance: {
    total: string;
    total_expenses: string;
  };
  focus: {
    total: string;
    total_focus_time: string;
  };
}

// =====================================================
// PROJECT TRACKING - Enhanced Projects System
// =====================================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  start_date?: string;
  target_date?: string;
  completed_date?: string;
  tags: string[];
  color?: string;
  icon?: string;
  progress: number; // 0-100
  milestones?: ProjectMilestone[];
  team_members?: string[]; // for shared projects
  created_at: string;
  updated_at: string;
}

export interface ProjectMilestone {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  target_date?: string;
  completed: boolean;
  completed_date?: string;
  order_index: number;
  created_at?: string;
}

export interface ProjectTask {
  id: string;
  project_id: string;
  task_id: string; // reference to tasks table
  created_at?: string;
}

// =====================================================
// TASK SCHEDULER - Schedule Blocks System
// =====================================================

export interface ScheduleBlock {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:MM format
  end_time: string;
  task_id?: string | null;
  title?: string | null; // for non-task events
  type: 'task' | 'event' | 'focus' | 'break';
  is_recurring: boolean;
  recurrence_rule?: string | null; // RRULE format
  color?: string | null;
  created_at: string;
  updated_at: string;
}

// =====================================================
// LIFE GOALS - Long-term Life Planning
// =====================================================

export interface LifeGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  category: 'career' | 'financial' | 'family' | 'experiences' | 'legacy' | 'health' | 'personal-growth';
  target_age?: number | null;
  target_year?: number | null;
  priority: 'must-have' | 'important' | 'nice-to-have';
  status: 'dreaming' | 'planning' | 'in-progress' | 'achieved';
  achievement_date?: string | null;
  related_goal_ids: string[]; // link to shorter-term goals
  milestones: string[];
  created_at: string;
  updated_at: string;
}

// =====================================================
// CALENDAR - Calendar Events System
// =====================================================

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  start_date: string;
  start_time?: string | null;
  end_date: string;
  end_time?: string | null;
  all_day: boolean;
  location?: string | null;
  type: 'event' | 'meeting' | 'reminder' | 'birthday' | 'holiday';
  color?: string | null;
  is_recurring: boolean;
  recurrence_rule?: string | null;
  reminder_minutes?: number | null;
  attendees?: string[] | null;
  task_id?: string | null; // link to tasks
  project_id?: string | null; // link to projects
  created_at: string;
  updated_at: string;
}

// =====================================================
// SKINCARE - Skincare Tracking System
// =====================================================

export interface SkincareProduct {
  id: string;
  user_id: string;
  name: string;
  brand: string;
  category: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'treatment' | 'mask' | 'exfoliant';
  ingredients: string[];
  key_ingredients: string[]; // active ingredients
  open_date?: string | null;
  expiry_date?: string | null;
  purchase_date?: string | null;
  price?: number | null;
  rating?: number | null;
  notes?: string | null;
  in_use: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkincareRoutine {
  id: string;
  user_id: string;
  name: string; // "Morning Routine", "Evening Routine"
  time_of_day: 'am' | 'pm' | 'both';
  steps: SkincareRoutineStep[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SkincareRoutineStep {
  id: string;
  routine_id: string;
  order_index: number;
  product_id?: string | null;
  step_type: string; // "cleanse", "tone", "treat", "moisturize", "protect"
  instructions?: string | null;
  created_at: string;
}

export interface SkinConditionLog {
  id: string;
  user_id: string;
  date: string;
  overall_condition: 1 | 2 | 3 | 4 | 5; // 1=terrible, 5=excellent
  concerns: string[]; // "acne", "dryness", "redness", "sensitivity"
  notes?: string | null;
  photo_url?: string | null;
  created_at: string;
}

// =====================================================
// TRAVEL - Travel Planning System
// =====================================================

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  destination_countries: string[];
  start_date: string;
  end_date: string;
  status: 'planning' | 'booked' | 'in-progress' | 'completed';
  budget?: number | null;
  actual_cost?: number | null;
  travelers: string[]; // names
  created_at: string;
  updated_at: string;
}

export interface TripDay {
  id: string;
  trip_id: string;
  date: string;
  location: string;
  activities: string[];
  accommodations?: string | null;
  transportation?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface TravelDocument {
  id: string;
  trip_id?: string | null; // optional, for general docs
  user_id: string;
  type: 'passport' | 'visa' | 'ticket' | 'booking' | 'insurance' | 'vaccination';
  name: string;
  document_number?: string | null;
  issue_date?: string | null;
  expiry_date?: string | null;
  file_url?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface PackingList {
  id: string;
  trip_id?: string | null;
  user_id: string;
  name: string;
  items: PackingItem[];
  created_at: string;
}

export interface PackingItem {
  id: string;
  list_id: string;
  name: string;
  category: 'clothing' | 'toiletries' | 'electronics' | 'documents' | 'misc';
  quantity: number;
  packed: boolean;
  created_at: string;
}

export interface VisaRequirement {
  id: string;
  user_id: string;
  passport_country: string;
  destination_country: string;
  visa_required: boolean;
  visa_type?: string | null;
  max_stay_days?: number | null;
  notes?: string | null;
  last_updated: string;
}
