// LifeSync API Client - Real Database Integration
// Complete TypeScript client for all LifeSync API endpoints

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ==================== TYPE DEFINITIONS ====================

export interface TaskData {
  id?: string;
  title: string;
  description?: string;
  project_id?: string;
  status?: 'todo' | 'done' | 'waiting' | 'scheduled' | 'in_progress';
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimated_time?: number;
  actual_time?: number;
  due_date?: string;
  tags?: string[];
  category?: 'work' | 'personal' | 'learning' | 'creative' | 'health' | 'other';
  notes?: string;
  starred?: boolean;
  archived?: boolean;
  deleted?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectData {
  id?: string;
  name: string;
  description?: string;
  color?: string;
  status?: 'active' | 'completed' | 'on_hold';
  icon?: string;
  created_at?: string;
  updated_at?: string;
}

export interface HabitData {
  id?: string;
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

export interface ShoppingListData {
  id?: string;
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
  brand?: string;
  notes?: string;
  is_purchased?: boolean;
  purchased_at?: string;
  position?: number;
  created_at?: string;
  updated_at?: string;
}

export interface FocusSessionData {
  id?: string;
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

export interface RecipeData {
  id?: string;
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

// ==================== API CLIENT CLASS ====================

class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ==================== TASK OPERATIONS ====================

  async getTasks(): Promise<TaskData[]> {
    return this.request<TaskData[]>('/tasks');
  }

  async createTask(task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>): Promise<TaskData> {
    return this.request<TaskData>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
    return this.request<TaskData>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<TaskData> {
    return this.request<TaskData>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== PROJECT OPERATIONS ====================

  async getProjects(): Promise<ProjectData[]> {
    return this.request<ProjectData[]>('/projects');
  }

  async createProject(project: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectData> {
    return this.request<ProjectData>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    return this.request<ProjectData>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<{ message: string; project: ProjectData }> {
    return this.request<{ message: string; project: ProjectData }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== HABIT OPERATIONS ====================

  async getHabits(): Promise<HabitData[]> {
    return this.request<HabitData[]>('/habits');
  }

  async createHabit(habit: Omit<HabitData, 'id' | 'created_at' | 'updated_at'>): Promise<HabitData> {
    return this.request<HabitData>('/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
    });
  }

  async addHabitEntry(habitId: string, entry: Omit<HabitEntryData, 'id' | 'habit_id' | 'created_at'>): Promise<HabitEntryData> {
    return this.request<HabitEntryData>(`/habits/${habitId}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async updateHabit(habitId: string, updates: Partial<HabitData>): Promise<HabitData> {
    return this.request<HabitData>(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteHabit(habitId: string): Promise<{ message: string; habit: HabitData }> {
    return this.request<{ message: string; habit: HabitData }>(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  }

  // ==================== FINANCIAL OPERATIONS ====================

  async getFinancialAccounts(): Promise<any[]> {
    return this.request<any[]>('/financial/accounts');
  }

  async getFinancialTransactions(): Promise<FinancialTransactionData[]> {
    return this.request<FinancialTransactionData[]>('/financial/transactions');
  }

  async createFinancialTransaction(transaction: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialTransactionData> {
    return this.request<FinancialTransactionData>('/financial/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  // ==================== SHOPPING OPERATIONS ====================

  async getShoppingLists(): Promise<ShoppingListData[]> {
    return this.request<ShoppingListData[]>('/shopping/lists');
  }

  async createShoppingList(list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>): Promise<ShoppingListData> {
    return this.request<ShoppingListData>('/shopping/lists', {
      method: 'POST',
      body: JSON.stringify(list),
    });
  }

  async getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
    return this.request<ShoppingItemData[]>(`/shopping/lists/${listId}/items`);
  }

  async addShoppingItem(listId: string, item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>): Promise<ShoppingItemData> {
    return this.request<ShoppingItemData>(`/shopping/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  // ==================== FOCUS SESSION OPERATIONS ====================

  async getFocusSessions(): Promise<FocusSessionData[]> {
    return this.request<FocusSessionData[]>('/focus/sessions');
  }

  async createFocusSession(session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>): Promise<FocusSessionData> {
    return this.request<FocusSessionData>('/focus/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async updateFocusSession(id: string, updates: Partial<FocusSessionData>): Promise<FocusSessionData> {
    return this.request<FocusSessionData>(`/focus/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ==================== RECIPE OPERATIONS ====================

  async getRecipes(): Promise<RecipeData[]> {
    return this.request<RecipeData[]>('/recipes');
  }

  async createRecipe(recipe: Omit<RecipeData, 'id' | 'created_at' | 'updated_at'>): Promise<RecipeData> {
    return this.request<RecipeData>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(): Promise<AnalyticsData> {
    return this.request<AnalyticsData>('/analytics/dashboard');
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// ==================== EXPORT SINGLETON ====================

export const apiClient = new ApiClient();
export default apiClient;