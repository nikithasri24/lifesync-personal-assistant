// LifeSync API Client - Real Database Integration
// Complete TypeScript client for all LifeSync API endpoints

import { isSupabaseConfigured } from '../lib/supabase';
import SupabaseAdapter from './supabaseAdapter';
import { logger } from './logger';
import type {
  TaskData,
  ProjectData,
  HabitData,
  HabitEntryData,
  FinancialAccountData,
  FinancialTransactionData,
  ShoppingListData,
  ShoppingItemData,
  PantryItemData,
  MealPlanData,
  PlannedMealData,
  FocusSessionData,
  RecipeData,
  _RecipeIngredientData,
  AnalyticsData,
  SFHChallengeData,
  SFHEntryData,
} from './types';

export type {
  TaskData,
  ProjectData,
  HabitData,
  HabitEntryData,
  FinancialAccountData,
  FinancialTransactionData,
  ShoppingListData,
  ShoppingItemData,
  PantryItemData,
  MealPlanData,
  PlannedMealData,
  FocusSessionData,
  RecipeData,
  RecipeIngredientData,
  AnalyticsData,
} from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// ==================== API CLIENT CLASS ====================

class ApiClient {
  private userId: string | null = null;
  private readonly supabaseAdapter = isSupabaseConfigured ? new SupabaseAdapter(() => this.userId) : null;

  constructor() {
    logger.info('Supabase configured', { isSupabaseConfigured });
    logger.info('Using Supabase adapter', { hasAdapter: Boolean(this.supabaseAdapter) });
  }

  setAuthContext(userId: string | null) {
    this.userId = userId;
  }

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
      logger.error('ApiClient', error instanceof Error ? error : new Error(`API Request failed: ${endpoint}`), { endpoint });
      throw error;
    }
  }

  // ==================== TASK OPERATIONS ====================

  async getTasks(): Promise<TaskData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getTasks();
    }
    return this.request<TaskData[]>('/tasks');
  }

  async createTask(task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>): Promise<TaskData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createTask(task);
    }
    return this.request<TaskData>('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateTask(id, updates);
    }
    return this.request<TaskData>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(id: string): Promise<TaskData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.deleteTask(id);
    }
    return this.request<TaskData>(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async restoreTask(id: string): Promise<TaskData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.restoreTask(id);
    }
    return this.request<TaskData>(`/tasks/${id}/restore`, {
      method: 'POST',
    });
  }

  async permanentlyDeleteTask(
    id: string,
  ): Promise<{ message: string; task: TaskData }> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.permanentlyDeleteTask(id);
    }
    return this.request<{ message: string; task: TaskData }>(`/tasks/${id}/permanent`, {
      method: 'DELETE',
    });
  }

  // ==================== PROJECT OPERATIONS ====================

  async getProjects(): Promise<ProjectData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getProjects();
    }
    return this.request<ProjectData[]>('/projects');
  }

  async createProject(project: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createProject(project);
    }
    return this.request<ProjectData>('/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  }

  async updateProject(id: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateProject(id, updates);
    }
    return this.request<ProjectData>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteProject(id: string): Promise<{ message: string; project: ProjectData }> {
    if (this.supabaseAdapter) {
      await this.supabaseAdapter.deleteProject(id);
      return { message: 'deleted', project: { id } as ProjectData };
    }
    return this.request<{ message: string; project: ProjectData }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== TASK ORDERING ====================
  async reorderTasks(order: Array<{ id: string; position: number }>): Promise<{ success: boolean; updated: number }> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.reorderTasks(order);
    }
    return this.request<{ success: boolean; updated: number }>(`/tasks/reorder`, {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
  }

  // ==================== HABIT OPERATIONS ====================

  async getHabits(): Promise<HabitData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getHabits();
    }
    return this.request<HabitData[]>('/habits');
  }

  async createHabit(habit: Omit<HabitData, 'id' | 'created_at' | 'updated_at'>): Promise<HabitData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createHabit(habit);
    }
    return this.request<HabitData>('/habits', {
      method: 'POST',
      body: JSON.stringify(habit),
    });
  }

  async addHabitEntry(habitId: string, entry: Omit<HabitEntryData, 'id' | 'habit_id' | 'created_at'>): Promise<HabitEntryData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.addHabitEntry(habitId, entry);
    }
    return this.request<HabitEntryData>(`/habits/${habitId}/entries`, {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  }

  async deleteHabitEntryForDate(habitId: string, date: string): Promise<void> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.deleteHabitEntryForDate(habitId, date);
    }
    // In mock/local mode, no-op
    return Promise.resolve();
  }

  async getHabitEntryForDate(habitId: string, date: string) {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getHabitEntryForDate(habitId, date);
    }
    return Promise.resolve<{ id: string; value: number } | null>(null)
  }

  async deleteAllHabitEntries(habitId: string): Promise<void> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.deleteAllHabitEntries(habitId)
    }
    return Promise.resolve()
  }

  async updateHabit(habitId: string, updates: Partial<HabitData>): Promise<HabitData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateHabit(habitId, updates);
    }
    return this.request<HabitData>(`/habits/${habitId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteHabit(habitId: string): Promise<{ message: string; habit: HabitData }> {
    if (this.supabaseAdapter) {
      await this.supabaseAdapter.deleteHabit(habitId);
      return { message: 'deleted', habit: { id: habitId } as HabitData };
    }
    return this.request<{ message: string; habit: HabitData }>(`/habits/${habitId}`, {
      method: 'DELETE',
    });
  }

  // ==================== FINANCIAL OPERATIONS ====================

  async getFinancialAccounts(): Promise<FinancialAccountData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getFinancialAccounts();
    }
    return this.request<FinancialAccountData[]>('/financial/accounts');
  }

  async getFinancialTransactions(): Promise<FinancialTransactionData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getFinancialTransactions();
    }
    return this.request<FinancialTransactionData[]>('/financial/transactions');
  }

  async createFinancialTransaction(transaction: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialTransactionData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createFinancialTransaction(transaction);
    }
    return this.request<FinancialTransactionData>('/financial/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
  }

  async updateFinancialTransaction(id: string, updates: Partial<FinancialTransactionData>): Promise<FinancialTransactionData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateFinancialTransaction(id, updates);
    }
    return this.request<FinancialTransactionData>(`/financial/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ==================== SHOPPING OPERATIONS ====================

  async getShoppingLists(): Promise<ShoppingListData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getShoppingLists();
    }
    return this.request<ShoppingListData[]>('/shopping/lists');
  }

  async createShoppingList(list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>): Promise<ShoppingListData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createShoppingList(list);
    }
    return this.request<ShoppingListData>('/shopping/lists', {
      method: 'POST',
      body: JSON.stringify(list),
    });
  }

  async getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getShoppingListItems(listId);
    }
    return this.request<ShoppingItemData[]>(`/shopping/lists/${listId}/items`);
  }

  async addShoppingItem(listId: string, item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>): Promise<ShoppingItemData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.addShoppingItem(listId, item);
    }
    return this.request<ShoppingItemData>(`/shopping/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updateShoppingItem(itemId: string, updates: Partial<ShoppingItemData>): Promise<ShoppingItemData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateShoppingItem(itemId, updates);
    }
    return this.request<ShoppingItemData>(`/shopping/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteShoppingItem(itemId: string): Promise<ShoppingItemData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.deleteShoppingItem(itemId);
    }
    return this.request<ShoppingItemData>(`/shopping/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // ==================== PANTRY OPERATIONS ====================

  async getPantryItems(): Promise<PantryItemData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getPantryItems();
    }
    return this.request<PantryItemData[]>('/pantry/items');
  }

  async createPantryItem(
    item: Omit<PantryItemData, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
  ): Promise<PantryItemData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createPantryItem(item);
    }
    return this.request<PantryItemData>('/pantry/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async updatePantryItem(id: string, updates: Partial<PantryItemData>): Promise<PantryItemData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updatePantryItem(id, updates);
    }
    return this.request<PantryItemData>(`/pantry/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePantryItem(id: string): Promise<PantryItemData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.deletePantryItem(id);
    }
    return this.request<PantryItemData>(`/pantry/items/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== MEAL PLANNING OPERATIONS ====================

  async getMealPlans(): Promise<MealPlanData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getMealPlans();
    }
    return this.request<MealPlanData[]>('/meal-plans');
  }

  async createMealPlan(
    plan: Omit<MealPlanData, 'id' | 'created_at' | 'updated_at' | 'planned_meals' | 'user_id'>,
  ): Promise<MealPlanData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createMealPlan(plan);
    }
    return this.request<MealPlanData>('/meal-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async updateMealPlan(id: string, updates: Partial<MealPlanData>): Promise<MealPlanData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateMealPlan(id, updates);
    }
    return this.request<MealPlanData>(`/meal-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteMealPlan(id: string): Promise<{ message: string; meal_plan: MealPlanData }> {
    if (this.supabaseAdapter) {
      await this.supabaseAdapter.deleteMealPlan(id);
      return { message: 'deleted', meal_plan: { id } as MealPlanData };
    }
    return this.request<{ message: string; meal_plan: MealPlanData }>(`/meal-plans/${id}`, {
      method: 'DELETE',
    });
  }

  async createPlannedMeal(
    meal: Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<PlannedMealData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createPlannedMeal(meal);
    }
    return this.request<PlannedMealData>('/planned-meals', {
      method: 'POST',
      body: JSON.stringify(meal),
    });
  }

  async updatePlannedMeal(id: string, updates: Partial<PlannedMealData>): Promise<PlannedMealData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updatePlannedMeal(id, updates);
    }
    return this.request<PlannedMealData>(`/planned-meals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deletePlannedMeal(id: string): Promise<{ message: string; planned_meal: PlannedMealData }> {
    if (this.supabaseAdapter) {
      await this.supabaseAdapter.deletePlannedMeal(id);
      return { message: 'deleted', planned_meal: { id } as PlannedMealData };
    }
    return this.request<{ message: string; planned_meal: PlannedMealData }>(`/planned-meals/${id}`, {
      method: 'DELETE',
    });
  }

  // ==================== FOCUS SESSION OPERATIONS ====================

  async getFocusSessions(): Promise<FocusSessionData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getFocusSessions();
    }
    return this.request<FocusSessionData[]>('/focus/sessions');
  }

  async createFocusSession(session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>): Promise<FocusSessionData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createFocusSession(session);
    }
    return this.request<FocusSessionData>('/focus/sessions', {
      method: 'POST',
      body: JSON.stringify(session),
    });
  }

  async updateFocusSession(id: string, updates: Partial<FocusSessionData>): Promise<FocusSessionData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateFocusSession(id, updates);
    }
    return this.request<FocusSessionData>(`/focus/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // ==================== RECIPE OPERATIONS ====================

  async getRecipes(): Promise<RecipeData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getRecipes();
    }
    return this.request<RecipeData[]>('/recipes');
  }

  async createRecipe(recipe: Omit<RecipeData, 'id' | 'created_at' | 'updated_at'>): Promise<RecipeData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createRecipe(recipe);
    }
    return this.request<RecipeData>('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipe),
    });
  }

  async updateRecipe(id: string, updates: Partial<RecipeData>): Promise<RecipeData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateRecipe(id, updates);
    }
    return this.request<RecipeData>(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteRecipe(id: string): Promise<void> {
    if (this.supabaseAdapter) {
      await this.supabaseAdapter.deleteRecipe(id);
      return;
    }
    await this.request<void>(`/recipes/${id}`, { method: 'DELETE' });
  }

  // ==================== ANALYTICS ====================

  async getAnalytics(): Promise<AnalyticsData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getAnalytics();
    }
    return this.request<AnalyticsData>('/analytics/dashboard');
  }

  // ==================== 75 HARD ====================
  async getSFHChallenges(): Promise<SFHChallengeData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getSFHChallenges();
    }
    return [];
  }

  async getSFHEntries(challengeIds: string[]): Promise<SFHEntryData[]> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.getSFHEntries(challengeIds);
    }
    return [];
  }

  async createSFHChallenge(challenge: Omit<SFHChallengeData, 'id' | 'created_at' | 'user_id'>): Promise<SFHChallengeData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createSFHChallenge(challenge);
    }
    throw new Error('Supabase not configured');
  }

  async updateSFHChallenge(id: string, updates: Partial<SFHChallengeData>): Promise<SFHChallengeData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateSFHChallenge(id, updates);
    }
    throw new Error('Supabase not configured');
  }

  async deleteSFHChallenge(id: string): Promise<void> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.deleteSFHChallenge(id);
    }
    throw new Error('Supabase not configured');
  }

  async createSFHEntry(entry: Omit<SFHEntryData, 'id' | 'created_at' | 'user_id'>): Promise<SFHEntryData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.createSFHEntry(entry);
    }
    throw new Error('Supabase not configured');
  }

  async updateSFHEntry(id: string, updates: Partial<SFHEntryData>): Promise<SFHEntryData> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.updateSFHEntry(id, updates);
    }
    throw new Error('Supabase not configured');
  }

  async deleteSFHEntriesForChallenge(challengeId: string): Promise<void> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.deleteSFHEntriesForChallenge(challengeId);
    }
    return Promise.resolve();
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    if (this.supabaseAdapter) {
      return this.supabaseAdapter.healthCheck();
    }
    return this.request<{ status: string; timestamp: string }>('/health');
  }
}

// ==================== EXPORT SINGLETON ====================

export const apiClient = new ApiClient();
export default apiClient;
