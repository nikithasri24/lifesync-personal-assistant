import { ensureSupabase } from '../lib/supabase'
import type { SupabaseClient, PostgrestError, PostgrestResponse } from '@supabase/supabase-js'

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
  LifeGoal,
  CalendarEvent,
  ScheduleBlock,
  SkincareProduct,
  SkincareRoutine,
  SkinConditionLog,
  Trip,
  TravelDocument,
} from './types'
import type { Note, Goal, Dream, JournalEntry } from '../types'

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
    const { data, error }: { data: { id: string }[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
      .from('financial_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as FinancialAccountData[]
  }

  async getFinancialTransactions(): Promise<FinancialTransactionData[]> {
    const userId = this.requireUserId()
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
      .from('financial_transactions')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create financial transaction')
    return data as FinancialTransactionData
  }

  async updateFinancialTransaction(
    id: string,
    updates: Partial<FinancialTransactionData>,
  ): Promise<FinancialTransactionData> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
      .from('financial_transactions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to update financial transaction')
    return data as FinancialTransactionData
  }

  // ===== Shopping =====
  async getShoppingLists(): Promise<ShoppingListData[]> {
    const userId = this.requireUserId()
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
      .from('focus_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })

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
      status: session.status ?? 'in-progress',
      started_at: session.started_at ?? new Date().toISOString(),
    })

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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

    const { data, error }: { data: TaskData[]|ProjectData[]|HabitData[]|HabitEntryData[]|FinancialAccountData[]|FinancialTransactionData[]|ShoppingListData[]|ShoppingItemData[]|PantryItemData[]|MealPlanData[]|PlannedMealData[]|FocusSessionData[]|RecipeData[] | null; error: PostgrestError | null } = await this.client
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
  private async getTaskAnalytics(userId: string): Promise<{ total: number; completed: number }> {
    const [taskTotal, taskCompleted]: [
      PostgrestResponse<TaskData>,
      PostgrestResponse<TaskData>
    ] = await Promise.all([
      this.client.from('tasks').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      this.client.from('tasks').select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'done')
    ]);

    if (taskTotal.error) throw new Error(taskTotal.error.message);
    if (taskCompleted.error) throw new Error(taskCompleted.error.message);

    return {
      total: taskTotal.count ?? 0,
      completed: taskCompleted.count ?? 0
    };
  }

  private async getHabitAnalytics(userId: string): Promise<{ total: number }> {
    const habitTotal = await this.client.from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (habitTotal.error) throw new Error(habitTotal.error.message);

    return { total: habitTotal.count ?? 0 };
  }

  private async getFocusAnalytics(userId: string): Promise<{ total: number; totalMinutes: number }> {
    const focusSummary = await this.client.from('focus_sessions')
      .select('duration, actual_duration', { count: 'exact' })
      .eq('user_id', userId);

    if (focusSummary.error) throw new Error(focusSummary.error.message);

    const focusData = (focusSummary.data ?? []) as Array<{ duration?: number; actual_duration?: number }>;
    const totalMinutes = focusData.reduce(
      (acc, session) => acc + (session.actual_duration ?? session.duration ?? 0),
      0
    );

    return {
      total: focusSummary.count ?? focusData.length,
      totalMinutes
    };
  }

  private async getFinanceAnalytics(userId: string): Promise<{ total: number; totalExpenses: number }> {
    const financeSummary = await this.client.from('financial_transactions')
      .select('amount, type')
      .eq('user_id', userId);

    if (financeSummary.error) throw new Error(financeSummary.error.message);

    const financeData = (financeSummary.data ?? []) as Array<{ amount?: number | string; type?: string }>;
    const totalTransactions = financeData.length;
    const totalExpenses = financeData
      .filter((txn) => txn.type === 'expense')
      .reduce((acc, txn) => acc + Number(txn.amount ?? 0), 0);

    return {
      total: totalTransactions,
      totalExpenses
    };
  }

  async getAnalytics(): Promise<AnalyticsData> {
    const userId = this.requireUserId();

    const [tasks, habits, focus, finance] = await Promise.all([
      this.getTaskAnalytics(userId),
      this.getHabitAnalytics(userId),
      this.getFocusAnalytics(userId),
      this.getFinanceAnalytics(userId)
    ]);

    return {
      tasks: {
        total: String(tasks.total),
        completed: String(tasks.completed),
      },
      habits: {
        total: String(habits.total),
      },
      finance: {
        total: String(finance.total),
        total_expenses: finance.totalExpenses.toFixed(2),
      },
      focus: {
        total: String(focus.total),
        total_focus_time: String(focus.totalMinutes),
      },
    };
  }

  // ===== Notes =====
  async getNotes(): Promise<Note[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    type NoteRow = {
      id: string;
      title: string | null;
      content: string;
      tags: string[] | null;
      category: string | null;
      created_at: string;
      updated_at: string;
    };

    return (data ?? []).map((row: NoteRow) => ({
      id: row.id,
      title: row.title ?? '',
      content: row.content,
      tags: row.tags ?? [],
      category: row.category ?? undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }))
  }

  async getNote(id: string): Promise<Note> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Note not found')

    return {
      id: data.id,
      title: data.title ?? '',
      content: data.content,
      tags: data.tags ?? [],
      category: data.category ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  async createNote(note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>): Promise<Note> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      user_id: userId,
      title: note.title || null,
      content: note.content,
      tags: note.tags ?? [],
      category: note.category ?? null,
    })

    const { data, error } = await this.client
      .from('notes')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create note')

    return {
      id: data.id,
      title: data.title ?? '',
      content: data.content,
      tags: data.tags ?? [],
      category: data.category ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  async updateNote(id: string, updates: Partial<Note>): Promise<Note> {
    const userId = this.requireUserId()
    const payload: {
      title?: string | null;
      content?: string;
      tags?: string[];
      category?: string | null;
    } = {}

    if (updates.title !== undefined) payload.title = updates.title || null
    if (updates.content !== undefined) payload.content = updates.content
    if (updates.tags !== undefined) payload.tags = updates.tags
    if (updates.category !== undefined) payload.category = updates.category || null

    const { data, error } = await this.client
      .from('notes')
      .update(this.sanitize(payload))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Note not found or update failed')

    return {
      id: data.id,
      title: data.title ?? '',
      content: data.content,
      tags: data.tags ?? [],
      category: data.category ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }

  async deleteNote(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Goals & Dreams =====
  async getGoals(): Promise<Goal[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    type GoalRow = {
      id: string;
      title: string;
      description: string | null;
      category: Goal['category'] | null;
      priority: Goal['priority'] | null;
      status: Goal['status'] | null;
      progress: number | null;
      target_date: string | null;
      completed_date: string | null;
      tags: string[] | null;
      is_public: boolean | null;
      difficulty: Goal['difficulty'] | null;
      xp_reward: number | null;
      notes: string | null;
      created_at: string;
    };

    return (data ?? []).map((row: GoalRow) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      category: row.category ?? 'personal',
      priority: row.priority ?? 'medium',
      status: row.status ?? 'not-started',
      progress: row.progress ?? 0,
      startDate: new Date(row.created_at),
      targetDate: row.target_date ? new Date(row.target_date) : new Date(),
      completedDate: row.completed_date ? new Date(row.completed_date) : undefined,
      tags: row.tags ?? [],
      isPublic: row.is_public ?? false,
      difficulty: row.difficulty ?? 'medium',
      xpReward: row.xp_reward ?? 0,
      notes: row.notes ?? '',
      createdAt: new Date(row.created_at),
    }))
  }

  async getGoal(id: string): Promise<Goal> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Goal not found')

    return {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      category: data.category ?? 'personal',
      priority: data.priority ?? 'medium',
      status: data.status ?? 'not-started',
      progress: data.progress ?? 0,
      startDate: new Date(data.created_at),
      targetDate: data.target_date ? new Date(data.target_date) : new Date(),
      completedDate: data.completed_date ? new Date(data.completed_date) : undefined,
      tags: data.tags ?? [],
      isPublic: data.is_public ?? false,
      difficulty: data.difficulty ?? 'medium',
      xpReward: data.xp_reward ?? 0,
      notes: data.notes ?? '',
      createdAt: new Date(data.created_at),
    }
  }

  async createGoal(goal: Omit<Goal, 'id' | 'createdAt'>): Promise<Goal> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      user_id: userId,
      title: goal.title,
      description: goal.description ?? null,
      category: goal.category ?? null,
      priority: goal.priority ?? 'medium',
      status: goal.status ?? 'not-started',
      progress: goal.progress ?? 0,
      target_date: goal.targetDate ? goal.targetDate.toISOString().split('T')[0] : null,
      tags: goal.tags ?? [],
      is_public: goal.isPublic ?? false,
      difficulty: goal.difficulty ?? 'medium',
      xp_reward: goal.xpReward ?? 0,
      notes: goal.notes ?? '',
    })

    const { data, error } = await this.client
      .from('goals')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create goal')

    return {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      category: data.category ?? 'personal',
      priority: data.priority ?? 'medium',
      status: data.status ?? 'not-started',
      progress: data.progress ?? 0,
      startDate: new Date(data.created_at),
      targetDate: data.target_date ? new Date(data.target_date) : new Date(),
      completedDate: data.completed_date ? new Date(data.completed_date) : undefined,
      tags: data.tags ?? [],
      isPublic: data.is_public ?? false,
      difficulty: data.difficulty ?? 'medium',
      xpReward: data.xp_reward ?? 0,
      notes: data.notes ?? '',
      createdAt: new Date(data.created_at),
    }
  }

  async updateGoal(id: string, updates: Partial<Goal>): Promise<Goal> {
    const userId = this.requireUserId()
    const payload: {
      title?: string;
      description?: string | null;
      category?: Goal['category'] | null;
      priority?: Goal['priority'];
      status?: Goal['status'];
      progress?: number;
      target_date?: string | null;
      tags?: string[];
      is_public?: boolean;
      difficulty?: Goal['difficulty'];
      xp_reward?: number;
      notes?: string;
    } = {}

    if (updates.title !== undefined) payload.title = updates.title
    if (updates.description !== undefined) payload.description = updates.description ?? null
    if (updates.category !== undefined) payload.category = updates.category ?? null
    if (updates.priority !== undefined) payload.priority = updates.priority
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.progress !== undefined) payload.progress = updates.progress
    if (updates.targetDate !== undefined) {
      payload.target_date = updates.targetDate ? updates.targetDate.toISOString().split('T')[0] : null
    }
    if (updates.tags !== undefined) payload.tags = updates.tags
    if (updates.isPublic !== undefined) payload.is_public = updates.isPublic
    if (updates.difficulty !== undefined) payload.difficulty = updates.difficulty
    if (updates.xpReward !== undefined) payload.xp_reward = updates.xpReward
    if (updates.notes !== undefined) payload.notes = updates.notes

    const { data, error } = await this.client
      .from('goals')
      .update(this.sanitize(payload))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Goal not found or update failed')

    return {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      category: data.category ?? 'personal',
      priority: data.priority ?? 'medium',
      status: data.status ?? 'not-started',
      progress: data.progress ?? 0,
      startDate: new Date(data.created_at),
      targetDate: data.target_date ? new Date(data.target_date) : new Date(),
      completedDate: data.completed_date ? new Date(data.completed_date) : undefined,
      tags: data.tags ?? [],
      isPublic: data.is_public ?? false,
      difficulty: data.difficulty ?? 'medium',
      xpReward: data.xp_reward ?? 0,
      notes: data.notes ?? '',
      createdAt: new Date(data.created_at),
    }
  }

  async deleteGoal(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  async getDreams(): Promise<Dream[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('dreams')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    type DreamRow = {
      id: string;
      title: string;
      description: string | null;
      category: Dream['category'] | null;
      priority: Dream['priority'] | null;
      status: Dream['status'] | null;
      estimated_cost: number | null;
      estimated_timeframe: string | null;
      tags: string[] | null;
      is_public: boolean | null;
      created_at: string;
      last_updated: string;
      achieved_at: string | null;
      notes: string | null;
    };

    return (data ?? []).map((row: DreamRow) => ({
      id: row.id,
      title: row.title,
      description: row.description ?? '',
      category: row.category ?? 'lifestyle',
      priority: row.priority ?? 'someday',
      status: row.status ?? 'dreaming',
      estimatedCost: row.estimated_cost ?? undefined,
      estimatedTimeframe: row.estimated_timeframe ?? undefined,
      tags: row.tags ?? [],
      isPublic: row.is_public ?? false,
      createdAt: new Date(row.created_at),
      lastUpdated: new Date(row.last_updated),
      achievedAt: row.achieved_at ? new Date(row.achieved_at) : undefined,
      notes: row.notes ?? '',
    }))
  }

  async createDream(dream: Omit<Dream, 'id' | 'createdAt' | 'lastUpdated'>): Promise<Dream> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      user_id: userId,
      title: dream.title,
      description: dream.description ?? null,
      category: dream.category ?? null,
      priority: dream.priority ?? 'someday',
      status: dream.status ?? 'dreaming',
      estimated_cost: dream.estimatedCost ?? null,
      estimated_timeframe: dream.estimatedTimeframe ?? null,
      tags: dream.tags ?? [],
      is_public: dream.isPublic ?? false,
      notes: dream.notes ?? '',
    })

    const { data, error } = await this.client
      .from('dreams')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create dream')

    return {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      category: data.category ?? 'lifestyle',
      priority: data.priority ?? 'someday',
      status: data.status ?? 'dreaming',
      estimatedCost: data.estimated_cost ?? undefined,
      estimatedTimeframe: data.estimated_timeframe ?? undefined,
      tags: data.tags ?? [],
      isPublic: data.is_public ?? false,
      createdAt: new Date(data.created_at),
      lastUpdated: new Date(data.last_updated),
      achievedAt: data.achieved_at ? new Date(data.achieved_at) : undefined,
      notes: data.notes ?? '',
    }
  }

  async updateDream(id: string, updates: Partial<Dream>): Promise<Dream> {
    const userId = this.requireUserId()
    const payload: {
      title?: string;
      description?: string | null;
      category?: Dream['category'] | null;
      priority?: Dream['priority'];
      status?: Dream['status'];
      estimated_cost?: number | null;
      estimated_timeframe?: string | null;
      tags?: string[];
      is_public?: boolean;
      notes?: string;
    } = {}

    if (updates.title !== undefined) payload.title = updates.title
    if (updates.description !== undefined) payload.description = updates.description ?? null
    if (updates.category !== undefined) payload.category = updates.category ?? null
    if (updates.priority !== undefined) payload.priority = updates.priority
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.estimatedCost !== undefined) payload.estimated_cost = updates.estimatedCost ?? null
    if (updates.estimatedTimeframe !== undefined) payload.estimated_timeframe = updates.estimatedTimeframe ?? null
    if (updates.tags !== undefined) payload.tags = updates.tags
    if (updates.isPublic !== undefined) payload.is_public = updates.isPublic
    if (updates.notes !== undefined) payload.notes = updates.notes

    const { data, error } = await this.client
      .from('dreams')
      .update(this.sanitize(payload))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Dream not found or update failed')

    return {
      id: data.id,
      title: data.title,
      description: data.description ?? '',
      category: data.category ?? 'lifestyle',
      priority: data.priority ?? 'someday',
      status: data.status ?? 'dreaming',
      estimatedCost: data.estimated_cost ?? undefined,
      estimatedTimeframe: data.estimated_timeframe ?? undefined,
      tags: data.tags ?? [],
      isPublic: data.is_public ?? false,
      createdAt: new Date(data.created_at),
      lastUpdated: new Date(data.last_updated),
      achievedAt: data.achieved_at ? new Date(data.achieved_at) : undefined,
      notes: data.notes ?? '',
    }
  }

  async deleteDream(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('dreams')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Journal =====
  async getJournalEntries(): Promise<JournalEntry[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)

    type JournalEntryRow = {
      id: string;
      title: string | null;
      content: string;
      mood: JournalMood;
      tags: string[] | null;
      attachments: Attachment[] | null;
      created_at: string;
      weather: unknown | null;
      gratitude: string | null;
    };

    return (data ?? []).map((row: JournalEntryRow) => ({
      id: row.id,
      title: row.title ?? '',
      content: row.content,
      mood: row.mood,
      tags: row.tags ?? [],
      attachments: row.attachments ?? [],
      createdAt: new Date(row.created_at),
      weather: row.weather ?? undefined,
      gratitude: row.gratitude ?? undefined,
    }))
  }

  async getJournalEntry(id: string): Promise<JournalEntry> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('journal_entries')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Journal entry not found')

    return {
      id: data.id,
      title: data.title ?? '',
      content: data.content,
      mood: data.mood,
      tags: data.tags ?? [],
      attachments: data.attachments ?? [],
      createdAt: new Date(data.created_at),
      weather: data.weather ?? undefined,
      gratitude: data.gratitude ?? undefined,
    }
  }

  async createJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      user_id: userId,
      title: entry.title || null,
      content: entry.content,
      mood: entry.mood,
      tags: entry.tags ?? [],
      weather: entry.weather ?? null,
      gratitude: entry.gratitude ?? null,
      attachments: entry.attachments ?? [],
    })

    const { data, error } = await this.client
      .from('journal_entries')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create journal entry')

    return {
      id: data.id,
      title: data.title ?? '',
      content: data.content,
      mood: data.mood,
      tags: data.tags ?? [],
      attachments: data.attachments ?? [],
      createdAt: new Date(data.created_at),
      weather: data.weather ?? undefined,
      gratitude: data.gratitude ?? undefined,
    }
  }

  async updateJournalEntry(id: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    const userId = this.requireUserId()
    const payload: {
      title?: string | null;
      content?: string;
      mood?: JournalMood;
      tags?: string[];
      weather?: unknown | null;
      gratitude?: string | null;
      attachments?: Attachment[];
    } = {}

    if (updates.title !== undefined) payload.title = updates.title || null
    if (updates.content !== undefined) payload.content = updates.content
    if (updates.mood !== undefined) payload.mood = updates.mood
    if (updates.tags !== undefined) payload.tags = updates.tags
    if (updates.weather !== undefined) payload.weather = updates.weather ?? null
    if (updates.gratitude !== undefined) payload.gratitude = updates.gratitude ?? null
    if (updates.attachments !== undefined) payload.attachments = updates.attachments

    const { data, error } = await this.client
      .from('journal_entries')
      .update(this.sanitize(payload))
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Journal entry not found or update failed')

    return {
      id: data.id,
      title: data.title ?? '',
      content: data.content,
      mood: data.mood,
      tags: data.tags ?? [],
      attachments: data.attachments ?? [],
      createdAt: new Date(data.created_at),
      weather: data.weather ?? undefined,
      gratitude: data.gratitude ?? undefined,
    }
  }

  async deleteJournalEntry(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('journal_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Life Goals =====
  async getLifeGoals(): Promise<LifeGoal[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('life_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as LifeGoal[]
  }

  async getLifeGoal(id: string): Promise<LifeGoal> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('life_goals')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Life goal not found')
    return data as LifeGoal
  }

  async createLifeGoal(goal: Omit<LifeGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<LifeGoal> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...goal,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('life_goals')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create life goal')
    return data as LifeGoal
  }

  async updateLifeGoal(id: string, updates: Partial<LifeGoal>): Promise<LifeGoal> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('life_goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Life goal not found or update failed')
    return data as LifeGoal
  }

  async deleteLifeGoal(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('life_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Skincare =====
  async getSkincareProducts(): Promise<SkincareProduct[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('skincare_products')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false})

    if (error) throw new Error(error.message)
    return (data ?? []) as SkincareProduct[]
  }

  async createSkincareProduct(product: Omit<SkincareProduct, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SkincareProduct> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...product,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('skincare_products')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create skincare product')
    return data as SkincareProduct
  }

  async updateSkincareProduct(id: string, updates: Partial<SkincareProduct>): Promise<SkincareProduct> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('skincare_products')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Skincare product not found or update failed')
    return data as SkincareProduct
  }

  async deleteSkincareProduct(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('skincare_products')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  async getSkincareRoutines(): Promise<SkincareRoutine[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('skincare_routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as SkincareRoutine[]
  }

  async createSkincareRoutine(routine: Omit<SkincareRoutine, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<SkincareRoutine> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...routine,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('skincare_routines')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create skincare routine')
    return data as SkincareRoutine
  }

  async getSkinConditionLogs(): Promise<SkinConditionLog[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('skin_condition_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as SkinConditionLog[]
  }

  async createSkinConditionLog(log: Omit<SkinConditionLog, 'id' | 'user_id' | 'created_at'>): Promise<SkinConditionLog> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...log,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('skin_condition_logs')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create skin condition log')
    return data as SkinConditionLog
  }

  // ===== Travel =====
  async getTrips(): Promise<Trip[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as Trip[]
  }

  async getTrip(id: string): Promise<Trip> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('trips')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Trip not found')
    return data as Trip
  }

  async createTrip(trip: Omit<Trip, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Trip> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...trip,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('trips')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create trip')
    return data as Trip
  }

  async updateTrip(id: string, updates: Partial<Trip>): Promise<Trip> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('trips')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Trip not found or update failed')
    return data as Trip
  }

  async deleteTrip(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('trips')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  async getTravelDocuments(tripId?: string): Promise<TravelDocument[]> {
    const userId = this.requireUserId()
    let query = this.client
      .from('travel_documents')
      .select('*')
      .eq('user_id', userId)

    if (tripId) {
      query = query.eq('trip_id', tripId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return (data ?? []) as TravelDocument[]
  }

  async createTravelDocument(doc: Omit<TravelDocument, 'id' | 'user_id' | 'created_at'>): Promise<TravelDocument> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...doc,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('travel_documents')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create travel document')
    return data as TravelDocument
  }

  // ===== Calendar =====
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('calendar_events')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as CalendarEvent[]
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('calendar_events')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Calendar event not found')
    return data as CalendarEvent
  }

  async createCalendarEvent(event: Omit<CalendarEvent, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<CalendarEvent> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...event,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('calendar_events')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create calendar event')
    return data as CalendarEvent
  }

  async updateCalendarEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('calendar_events')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Calendar event not found or update failed')
    return data as CalendarEvent
  }

  async deleteCalendarEvent(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('calendar_events')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  }

  // ===== Scheduler =====
  async getScheduleBlocks(): Promise<ScheduleBlock[]> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) throw new Error(error.message)
    return (data ?? []) as ScheduleBlock[]
  }

  async getScheduleBlock(id: string): Promise<ScheduleBlock> {
    const userId = this.requireUserId()
    const { data, error } = await this.client
      .from('schedule_blocks')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Schedule block not found')
    return data as ScheduleBlock
  }

  async createScheduleBlock(block: Omit<ScheduleBlock, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<ScheduleBlock> {
    const userId = this.requireUserId()
    const payload = this.sanitize({
      ...block,
      user_id: userId,
    })

    const { data, error } = await this.client
      .from('schedule_blocks')
      .insert(payload)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Failed to create schedule block')
    return data as ScheduleBlock
  }

  async updateScheduleBlock(id: string, updates: Partial<ScheduleBlock>): Promise<ScheduleBlock> {
    const userId = this.requireUserId()
    const payload = this.sanitize(updates)

    const { data, error } = await this.client
      .from('schedule_blocks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw new Error(error.message)
    if (!data) throw new Error('Schedule block not found or update failed')
    return data as ScheduleBlock
  }

  async deleteScheduleBlock(id: string): Promise<void> {
    const userId = this.requireUserId()
    const { error } = await this.client
      .from('schedule_blocks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
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

}

export default SupabaseAdapter
