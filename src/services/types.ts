// Shared data contracts for LifeSync services
// These mirror the Supabase/PostgreSQL schema while remaining compatible with the legacy REST API.

export interface TaskData {
  id?: string;
  user_id?: string;
  title: string;
  description?: string;
  project_id?: string | null;
  status?: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_time?: number | null;
  actual_time?: number | null;
  due_date?: string | null;
  tags?: string[] | null;
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other' | null;
  notes?: string | null;
  starred?: boolean | null;
  archived?: boolean | null;
  deleted?: boolean | null;
  parent_id?: string | null;
  deleted_at?: string | null;
  completed_at?: string | null;
  created_at?: string;
  updated_at?: string;
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
  mood?: string;
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
  status?: 'planned' | 'prepped' | 'cooked' | 'eaten';
  notes?: string;
  prepared_at?: string;
  consumed_at?: string;
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
  task_id?: string;
  preset: string;
  duration: number;
  actual_duration?: number;
  start_time: string;
  end_time?: string;
  status?: 'active' | 'completed' | 'cancelled' | 'paused';
  breaks_taken?: number;
  distractions?: number;
  mood_before?: string;
  mood_after?: string;
  productivity_score?: number;
  notes?: string;
  environment_data?: any;
  created_at?: string;
  updated_at?: string;
}

// 75 Hard (stored as JSON-friendly rows for simpler sync)
export interface SFHChallengeData {
  id?: string;
  user_id?: string;
  name: string;
  start_date: string; // yyyy-MM-dd
  end_date: string;   // yyyy-MM-dd
  is_active: boolean;
  current_day: number;
  rules: Array<{ id: string; title: string; description: string; is_required: boolean; is_custom: boolean; daily_target?: number; segment_labels?: string[] }>;
  notes?: string | null;
  created_at?: string;
}

export interface SFHEntryData {
  id?: string;
  user_id?: string;
  challenge_id: string;
  date: string; // yyyy-MM-dd
  day: number;
  rule_completions: Array<{ rule_id: string; completed: boolean; completed_at?: string | null; segments?: boolean[] }>;
  notes?: string | null;
  progress_photo_url?: string | null;
  weight?: number | null;
  measurements?: Record<string, number> | null;
  created_at?: string;
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
  tags?: string[];
  is_favorite?: boolean;
  dietary_restrictions?: string[];
  nutrition_info?: Record<string, number>;
  source_type?: string;
  source_url?: string;
  author_name?: string;
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
