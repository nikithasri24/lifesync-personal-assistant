import { ensureSupabase } from '../lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'
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
  AnalyticsData,
  SFHChallengeData,
  SFHEntryData,
} from './types'

class SupabaseAdapter {
  private readonly getUserId: () => string | null
  private clientCache: SupabaseClient | null = null

  constructor(getUserId: () => string | null) {
    this.getUserId = getUserId
  }

  private get client(): SupabaseClient {
    this.clientCache ??= ensureSupabase()
    return this.clientCache
  }

  private requireUserId(): string {
    const userId = this.getUserId()
    if (!userId) {
      throw new Error('Supabase user is not authenticated. Please sign in to continue.')
    }
    return userId
  }

  private sanitize<T extends Record<string, unknown>>(payload: T): T {
    const entries = Object.entries(payload).filter(([, value]) => value !== undefined)
    return Object.fromEntries(entries) as T
  }

  private async assertShoppingListOwnership(listId: string, userId: string): Promise<void> {
    const { data, error } = await this.client
      .from('shopping_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) {
      throw new Error('Shopping list not found for current user')
    }
  }

  private async assertShoppingItemOwnership(itemId: string, userId: string): Promise<string> {
    const { data, error } = await this.client
      .from('shopping_items')
      .select('id, shopping_list_id')
      .eq('id', itemId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data?.shopping_list_id) {
      throw new Error('Shopping item not found for current user')
    }

    await this.assertShoppingListOwnership(String(data.shopping_list_id), userId)
    return String(data.shopping_list_id)
  }

  private async assertMealPlanOwnership(planId: string, userId: string): Promise<void> {
    const { data, error } = await this.client
      .from('meal_plans')
      .select('id')
      .eq('id', planId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data) {
      throw new Error('Meal plan not found for current user')
    }
  }

  private async assertPlannedMealOwnership(mealId: string, userId: string): Promise<string> {
    const { data, error } = await this.client
      .from('planned_meals')
      .select('id, meal_plan_id')
      .eq('id', mealId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (!data?.meal_plan_id) {
      throw new Error('Planned meal not found for current user')
    }

    await this.assertMealPlanOwnership(String(data.meal_plan_id), userId)
    return String(data.meal_plan_id)
  }

  // ===== Tasks =====
  async getTasks(): Promise<TaskData[]> {
    logger.debug('SupabaseAdapter', 'getTasks invoked');
    const userId = this.requireUserId()
    logger.debug('getTasks user', { userId });
    const { data, error } = await this.client
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('deleted', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as TaskData[]
  }

  async createTask(task: Omit<TaskData, 'id' | 'created_at' | 'updated_at'>): Promise<TaskData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...task,
      user_id: userId,
      status: task.status ?? 'todo',
      priority: task.priority ?? 'medium',
      deleted: false,
    })

    const { data, error } = await this.client
      .from('tasks')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create task')
    const taskData = data as TaskData
    logger.debug('createTask created task', { taskId: taskData.id })
    return taskData
  }

  async updateTask(id: string, updates: Partial<TaskData>): Promise<TaskData> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    // Important: do NOT request representation on UPDATE to avoid 406 from PostgREST
    const { error: updateError } = await this.client
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)

    if (updateError) throw new Error(updateError.message)

    // Fetch the updated row afterwards
    const { error: fetchError } = await this.client
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) throw new Error(fetchError.message)
    // If still null, return a minimal object (id + provided updates) to keep UI consistent
    return ({ id, user_id: userId, ...payload } as unknown) as TaskData
  }

  async deleteTask(id: string): Promise<TaskData> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('tasks')
      .update({ deleted: true, deleted_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to delete task')
    return data as TaskData
  }

  async restoreTask(id: string): Promise<TaskData> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('tasks')
      .update({ deleted: false, deleted_at: null })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to restore task')
    return data as TaskData
  }

  async permanentlyDeleteTask(id: string): Promise<{ message: string; task: TaskData }> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle()

    if (error) throw new Error(error.message)

    return {
      message: 'deleted',
      task: (data ?? { id }) as TaskData,
    }
  }

  // Batch reorder tasks by updating their position field
  async reorderTasks(order: Array<{ id: string; position: number }>): Promise<{ success: boolean; updated: number }> {
    const userId = this.requireUserId()
    // Perform updates individually to satisfy RLS per-row checks
    const results = await Promise.allSettled(
      order.map(({ id, position }) =>
        this.client
          .from('tasks')
          .update({ position })
          .eq('id', id)
          .eq('user_id', userId)
      )
    )
    const updated = results.filter(r => r.status === 'fulfilled').length
    return { success: updated === order.length, updated }
  }

  // ===== Projects =====
  async getProjects(): Promise<ProjectData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as ProjectData[]
  }

  async createProject(project: Omit<ProjectData, 'id' | 'created_at' | 'updated_at'>): Promise<ProjectData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...project,
      user_id: userId,
      status: project.status ?? 'active',
      color: project.color ?? '#6366f1',
      icon: project.icon ?? '📁',
    })

    const { data, error } = await this.client
      .from('projects')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create project')
    return data as ProjectData
  }

  async updateProject(id: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('projects')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update project')
    return data as ProjectData
  }

  async deleteProject(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Habits =====
  async getHabits(): Promise<HabitData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as HabitData[]
  }

  async createHabit(habit: Omit<HabitData, 'id' | 'created_at' | 'updated_at'>): Promise<HabitData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...habit,
      user_id: userId,
      frequency: habit.frequency ?? 'daily',
      goal_mode: habit.goal_mode ?? 'daily-target',
      streak_count: 0,
      best_streak: 0,
      current_progress: habit.current_progress ?? 0,
    })

    const { data, error } = await this.client
      .from('habits')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create habit')
    return data as HabitData
  }

  async addHabitEntry(
    habitId: string,
    entry: Omit<HabitEntryData, 'id' | 'habit_id' | 'created_at'>,
  ): Promise<HabitEntryData> {
    this.requireUserId()
    const value = entry.value ?? 1

    const { data, error } = await this.client
      .rpc('upsert_habit_entry', {
        p_habit_id: habitId,
        p_date: String(entry.date), // ensure date string YYYY-MM-DD
        p_value: value,
        p_notes: entry.notes ?? null,
      })
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to add habit entry')
    return data as HabitEntryData
  }

  async updateHabit(habitId: string, updates: Partial<HabitData>): Promise<HabitData> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('habits')
      .update(payload)
      .eq('id', habitId)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update habit')
    return data as HabitData
  }

  async deleteHabitEntryForDate(habitId: string, date: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('habit_entries')
      .delete()
      .eq('habit_id', habitId)
      .eq('date', date)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  async getHabitEntryForDate(habitId: string, date: string): Promise<{ id: string; value: number } | null> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('habit_entries')
      .select('id, value')
      .eq('habit_id', habitId)
      .eq('date', date)
      .eq('user_id', userId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    return { id: data.id as string, value: Number(data.value ?? 0) }
  }

  async deleteAllHabitEntries(habitId: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('habit_entries')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  }

  async deleteHabit(habitId: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Finance =====
  async getFinancialAccounts(): Promise<FinancialAccountData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('financial_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as FinancialAccountData[]
  }

  async getFinancialTransactions(): Promise<FinancialTransactionData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('financial_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as FinancialTransactionData[]
  }

  async createFinancialTransaction(
    transaction: Omit<FinancialTransactionData, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<FinancialTransactionData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...transaction,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('financial_transactions')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create financial transaction')
    return data as FinancialTransactionData
  }

  // ===== Shopping =====
  async getShoppingLists(): Promise<ShoppingListData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('shopping_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as ShoppingListData[]
  }

  async createShoppingList(
    list: Omit<ShoppingListData, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<ShoppingListData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...list,
      user_id: userId,
      status: list.status ?? 'active',
    })

    const { data, error } = await this.client
      .from('shopping_lists')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create shopping list')
    return data as ShoppingListData
  }

  async getShoppingListItems(listId: string): Promise<ShoppingItemData[]> {
    const userId = this.requireUserId()
    await this.assertShoppingListOwnership(listId, userId)

    const { data, error } = await this.client
      .from('shopping_items')
      .select('*')
      .eq('shopping_list_id', listId)
      .order('created_at', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as ShoppingItemData[]
  }

  async addShoppingItem(
    listId: string,
    item: Omit<ShoppingItemData, 'id' | 'shopping_list_id' | 'created_at' | 'updated_at'>,
  ): Promise<ShoppingItemData> {
    const userId = this.requireUserId()
    await this.assertShoppingListOwnership(listId, userId)
    const payload = this.sanitize({
      ...item,
      shopping_list_id: listId,
      is_purchased: item.is_purchased ?? false,
    })

    const { data, error } = await this.client
      .from('shopping_items')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to add shopping item')
    return data as ShoppingItemData
  }

  async updateShoppingItem(
    itemId: string,
    updates: Partial<ShoppingItemData>,
  ): Promise<ShoppingItemData> {
    const userId = this.requireUserId()
    await this.assertShoppingItemOwnership(itemId, userId)
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('shopping_items')
      .update(payload)
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update shopping item')
    return data as ShoppingItemData
  }

  async deleteShoppingItem(itemId: string): Promise<ShoppingItemData> {
    const userId = this.requireUserId()
    await this.assertShoppingItemOwnership(itemId, userId)

    const { data, error } = await this.client
      .from('shopping_items')
      .delete()
      .eq('id', itemId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to delete shopping item')
    return data as ShoppingItemData
  }

  // ===== Pantry =====
  async getPantryItems(): Promise<PantryItemData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('pantry_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as PantryItemData[]
  }

  async createPantryItem(
    item: Omit<PantryItemData, 'id' | 'created_at' | 'updated_at' | 'user_id'>,
  ): Promise<PantryItemData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...item,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('pantry_items')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create pantry item')
    return data as PantryItemData
  }

  async updatePantryItem(
    id: string,
    updates: Partial<PantryItemData>,
  ): Promise<PantryItemData> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('pantry_items')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update pantry item')
    return data as PantryItemData
  }

  async deletePantryItem(id: string): Promise<PantryItemData> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('pantry_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to delete pantry item')
    return data as PantryItemData
  }

  // ===== Meal planning =====
  async getMealPlans(): Promise<MealPlanData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('meal_plans')
      .select('*, planned_meals(*)')
      .eq('user_id', userId)
      .order('week_start_date', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as MealPlanData[]
  }

  async createMealPlan(
    plan: Omit<MealPlanData, 'id' | 'created_at' | 'updated_at' | 'planned_meals' | 'user_id'>,
  ): Promise<MealPlanData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...plan,
      user_id: userId,
    })

    // First, check if a plan already exists for this user and week
    const { data: existingRows, error: findErr } = await this.client
      .from('meal_plans')
      .select('*, planned_meals(*)')
      .eq('user_id', userId)
      .eq('week_start_date', plan.week_start_date)
      .limit(1)

    if (findErr) {
      // Non-fatal: proceed to insert if lookup fails
      logger.warn('find meal_plan failed; attempting insert', { error: findErr })
    } else if (existingRows && existingRows.length > 0) {
      return existingRows[0] as MealPlanData
    }

    // Insert new plan
    const { data, error } = await this.client
      .from('meal_plans')
      .insert(payload)
      .select('*, planned_meals(*)')
      .single()

    if (error) throw new Error(error.message)
    return data as MealPlanData
  }

  async updateMealPlan(id: string, updates: Partial<MealPlanData>): Promise<MealPlanData> {
    const userId = this.requireUserId()
    await this.assertMealPlanOwnership(id, userId)
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('meal_plans')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*, planned_meals(*)')
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update meal plan')
    return data as MealPlanData
  }

  async deleteMealPlan(id: string): Promise<void> {
    const userId = this.requireUserId()
    await this.assertMealPlanOwnership(id, userId)

    const { error } = await this.client
      .from('meal_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  async createPlannedMeal(
    meal: Omit<PlannedMealData, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<PlannedMealData> {
    const userId = this.requireUserId()
    await this.assertMealPlanOwnership(meal.meal_plan_id, userId)
    const payload = this.sanitize(meal)

    const { data, error } = await this.client
      .from('planned_meals')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create planned meal')
    return data as PlannedMealData
  }

  async updatePlannedMeal(
    id: string,
    updates: Partial<PlannedMealData>,
  ): Promise<PlannedMealData> {
    const userId = this.requireUserId()
    await this.assertPlannedMealOwnership(id, userId)
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('planned_meals')
      .update(payload)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update planned meal')
    return data as PlannedMealData
  }

  async deletePlannedMeal(id: string): Promise<void> {
    const userId = this.requireUserId()
    await this.assertPlannedMealOwnership(id, userId)

    const { error } = await this.client
      .from('planned_meals')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  }

  // ===== Focus sessions =====
  async getFocusSessions(): Promise<FocusSessionData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('start_time', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as FocusSessionData[]
  }

  async createFocusSession(
    session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<FocusSessionData> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...session,
      user_id: userId,
      status: session.status ?? 'active',
      start_time: session.start_time ?? new Date().toISOString(),
    })

    const { data, error } = await this.client
      .from('focus_sessions')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create focus session')
    return data as FocusSessionData
  }

  async updateFocusSession(id: string, updates: Partial<FocusSessionData>): Promise<FocusSessionData> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('focus_sessions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update focus session')
    return data as FocusSessionData
  }

  // ===== Recipes =====
  async getRecipes(): Promise<RecipeData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as RecipeData[]
  }

  async createRecipe(recipe: Omit<RecipeData, 'id' | 'created_at' | 'updated_at'>): Promise<RecipeData> {
    const userId = this.requireUserId()
    // To avoid noisy console 400s from supabase-js, insert a minimal row first
    const recipeAny = recipe as Record<string, unknown>
    const nameValue = recipeAny.name
    const safeName = (typeof nameValue === 'string' ? nameValue : 'Untitled').slice(0, 255)
    const ultra = this.sanitize({ user_id: userId, name: safeName })
    const insertRes = await this.client
      .from('recipes')
      .insert(ultra)
      .select()
      .single()

    if (insertRes.error) throw new Error(insertRes.error.message)
    if (!insertRes.data) throw new Error('Failed to create recipe')

    const created = insertRes.data as RecipeData

    // Best-effort patch with additional fields, but don't error if schema doesn't have them
    const patch: Partial<RecipeData> = this.sanitize({
      description:
        recipeAny.description !== undefined && typeof recipeAny.description === 'string'
          ? recipeAny.description
          : undefined,
      difficulty: recipe.difficulty ?? undefined,
      servings: recipe.servings ?? undefined,
      prep_time: recipeAny.prep_time !== undefined ? Number(recipeAny.prep_time) : undefined,
      cook_time: recipeAny.cook_time !== undefined ? Number(recipeAny.cook_time) : undefined,
      instructions:
        recipeAny.instructions !== undefined && typeof recipeAny.instructions === 'string'
          ? recipeAny.instructions
          : undefined,
      ingredients: recipeAny.ingredients !== undefined ? (recipeAny.ingredients as string[]) : undefined,
      tags: Array.isArray(recipeAny.tags) ? (recipeAny.tags as string[]) : undefined,
      source_url:
        recipeAny.source_url && typeof recipeAny.source_url === 'string'
          ? recipeAny.source_url.slice(0, 255)
          : undefined,
      video_thumbnail:
        recipeAny.video_thumbnail && typeof recipeAny.video_thumbnail === 'string'
          ? recipeAny.video_thumbnail.slice(0, 255)
          : undefined,
    })

    if (Object.keys(patch).length > 0) {
      const updRes = await this.client
        .from('recipes')
        .update(patch)
        .eq('id', created.id)
        .eq('user_id', userId)
        .select()
        .single()

      if (updRes.error) {
        // Log and continue; we already created the base row
        logger.warn('recipes patch failed', { error: updRes.error.message })
      } else if (updRes.data) {
        // If patch returned the full row, prefer it
        return updRes.data as RecipeData
      }
    }

    return created
  }

  async updateRecipe(id: string, updates: Partial<RecipeData>): Promise<RecipeData> {
    const userId = this.requireUserId()
    const safe: Partial<RecipeData> = { ...updates }
    if (typeof safe.name === 'string') safe.name = safe.name.slice(0, 255)
    if (typeof safe.source_url === 'string') safe.source_url = safe.source_url.slice(0, 255)
    if (typeof safe.video_thumbnail === 'string') safe.video_thumbnail = safe.video_thumbnail.slice(0, 255)
    const payload = this.sanitize(safe)

    const { data, error } = await this.client
      .from('recipes')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update recipe')
    return data as RecipeData
  }

  async deleteRecipe(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('recipes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Analytics =====
  async getAnalytics(): Promise<AnalyticsData> {
    const userId = this.requireUserId()

    const client = this.client
    const [taskTotal, taskCompleted, habitTotal, focusSummary, financeSummary] = await Promise.all([
      client.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'done'),
      client.from('habits').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      client
        .from('focus_sessions')
        .select('duration, actual_duration', { count: 'exact' })
        .eq('user_id', userId),
      client
        .from('financial_transactions')
        .select('amount, type')
        .eq('user_id', userId),
    ])

    if (taskTotal.error) throw new Error(taskTotal.error.message)
    if (taskCompleted.error) throw new Error(taskCompleted.error.message)
    if (habitTotal.error) throw new Error(habitTotal.error.message)
    if (focusSummary.error) throw new Error(focusSummary.error.message)
    if (financeSummary.error) throw new Error(financeSummary.error.message)

    const focusData = (focusSummary.data ?? []) as Array<{ duration?: number; actual_duration?: number }>
    const totalFocusMinutes = focusData.reduce(
      (acc, session) => acc + (session.actual_duration ?? session.duration ?? 0),
      0
    )

    const financeData = (financeSummary.data ?? []) as Array<{ amount?: number | string; type?: string }>
    const totalTransactions = financeData.length
    const totalExpenses = financeData
      .filter((txn) => txn.type === 'expense')
      .reduce((acc, txn) => acc + Number(txn.amount ?? 0), 0)

    return {
      tasks: {
        total: String(taskTotal.count ?? 0),
        completed: String(taskCompleted.count ?? 0),
      },
      habits: {
        total: String(habitTotal.count ?? 0),
      },
      finance: {
        total: String(totalTransactions),
        total_expenses: totalExpenses.toFixed(2),
      },
      focus: {
        total: String(focusSummary.count ?? focusData.length),
        total_focus_time: String(totalFocusMinutes),
      },
    }
  }

  // ===== Health check =====
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const userId = this.getUserId()
    if (userId) {
      const { error } = await this.client
        .from('tasks')
        .select('id', { head: true, limit: 1 })
        .eq('user_id', userId)

      if (error) throw new Error(error.message)
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    }
  }

  // ===== 75 HARD (JSON-backed) =====
  async getSFHChallenges(): Promise<SFHChallengeData[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('sfh_challenge')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []) as SFHChallengeData[]
  }

  async getSFHEntries(challengeIds: string[]): Promise<SFHEntryData[]> {
    if (challengeIds.length === 0) return []
    // Fetch entries for the specified challenges (RLS will ensure user can only access their own)
    const { data, error } = await this.client
      .from('sfh_daily_checkins')
      .select('*')
      .in('challenge_id', challengeIds)
      .order('date', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as SFHEntryData[]
  }

  async createSFHChallenge(challenge: Omit<SFHChallengeData, 'id' | 'created_at' | 'user_id'>): Promise<SFHChallengeData> {
    const userId = this.requireUserId()
    const payload = { ...challenge, user_id: userId }
    const { data, error } = await this.client
      .from('sfh_challenge')
      .insert(payload)
      .select()
      .single()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create SFH challenge')
    return data as SFHChallengeData
  }

  async updateSFHChallenge(id: string, updates: Partial<SFHChallengeData>): Promise<SFHChallengeData> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('sfh_challenge')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update SFH challenge')
    return data as SFHChallengeData
  }

  async deleteSFHChallenge(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('sfh_challenge')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)
    if (error) throw new Error(error.message)
  }

  async createSFHEntry(entry: Omit<SFHEntryData, 'id' | 'created_at' | 'user_id'>): Promise<SFHEntryData> {
    // No need to add user_id - it's inferred through challenge_id and RLS
    const { data, error } = await this.client
      .from('sfh_daily_checkins')
      .insert(entry)
      .select()
      .single()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create SFH entry')
    return data as SFHEntryData
  }

  async updateSFHEntry(id: string, updates: Partial<SFHEntryData>): Promise<SFHEntryData> {
    // RLS ensures user can only update their own entries
    const { data, error } = await this.client
      .from('sfh_daily_checkins')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update SFH entry')
    return data as SFHEntryData
  }

  async deleteSFHEntriesForChallenge(challengeId: string): Promise<void> {
    // RLS ensures user can only delete their own entries
    const { error } = await this.client
      .from('sfh_daily_checkins')
      .delete()
      .eq('challenge_id', challengeId)
    if (error) throw new Error(error.message)
  }
}

export default SupabaseAdapter
