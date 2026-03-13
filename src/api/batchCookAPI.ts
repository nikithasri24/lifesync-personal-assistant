/**
 * Batch Cook API
 * CRUD operations for batch cook sessions, dishes, and meal logs.
 *
 * NOTE: batch_cook_sessions, batch_cook_dishes, and meal_logs are new tables
 * added via migration 20260311000000_batch_cook_sessions.sql. They are not yet
 * in database.types.ts (requires `supabase gen types typescript` after applying
 * the migration). Until then, the Supabase client returns `any` for these
 * tables, which triggers @typescript-eslint/no-unsafe-* rules.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call */

import { supabase } from '../lib/supabase';
import { requireAuth } from './apiWrapper';
import { logger } from '../services/logger';
import { sanitizeInput, sanitizeText } from '../utils/sanitize';
import type { BatchCookSession, BatchCookDish, MealLog, BatchCookSessionInput, MealLogInput } from '../meals/types';
import { format } from 'date-fns';

// ============================================================
// Mappers
// ============================================================

function mapSession(row: Record<string, unknown>, dishes: BatchCookDish[] = []): BatchCookSession {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    cookDate: row.cook_date as string,
    notes: (row.notes as string | null) ?? undefined,
    dishes,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  };
}

function mapDish(row: Record<string, unknown>): BatchCookDish {
  return {
    id: row.id as string,
    sessionId: row.session_id as string,
    recipeId: (row.recipe_id as string | null) ?? undefined,
    recipeName: (row.recipe_name as string | null) ?? undefined,
    customName: (row.custom_name as string | null) ?? undefined,
    servingsCooked: row.servings_cooked as number,
    servingsRemaining: row.servings_remaining as number,
    notes: (row.notes as string | null) ?? undefined,
    createdAt: new Date(row.created_at as string),
  };
}

function mapMealLog(row: Record<string, unknown>): MealLog {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    loggedDate: row.logged_date as string,
    mealType: row.meal_type as MealLog['mealType'],
    batchDishId: (row.batch_dish_id as string | null) ?? undefined,
    recipeId: (row.recipe_id as string | null) ?? undefined,
    customName: (row.custom_name as string | null) ?? undefined,
    servingsConsumed: row.servings_consumed as number,
    notes: (row.notes as string | null) ?? undefined,
    createdAt: new Date(row.created_at as string),
  };
}

// ============================================================
// Batch Cook Sessions
// ============================================================

/**
 * Fetch all batch cook sessions for the current user, including dishes.
 * Optionally accepts a connection_id to include shared sessions.
 */
export async function getBatchCookSessions(): Promise<BatchCookSession[]> {
  const user = await requireAuth();

  const { data: sessions, error } = await supabase
    .from('batch_cook_sessions')
    .select(`
      *,
      batch_cook_dishes (
        *,
        recipes ( name )
      )
    `)
    // RLS policy handles partner access — the SELECT returns own + partner sessions automatically
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'getBatchCookSessions' });
    throw error;
  }

  return (sessions ?? []).map((s: Record<string, unknown>) => {
    const rawDishes = (s.batch_cook_dishes as Record<string, unknown>[] | null) ?? [];
    const dishes = rawDishes.map((d) => mapDish({
      ...d,
      recipe_name: (d.recipes as { name?: string } | null)?.name ?? null,
    }));
    return mapSession(s, dishes);
  });
}

/**
 * Get all sessions that still have food remaining (servings_remaining > 0 on any dish),
 * ordered by cook_date DESC (most recent first).
 *
 * When multiple sessions have food left — e.g. last week's prep AND next week's prep —
 * all of them are returned so the UI can show a session-switcher tab row.
 *
 * Fallback: if every session is empty, returns the single most recent session so the
 * "all eaten" empty state is still rendered correctly.
 */
export async function getActiveSessions(): Promise<BatchCookSession[]> {
  const all = await getBatchCookSessions();
  const withFood = all.filter(s => s.dishes.some(d => d.servingsRemaining > 0));
  return withFood.length > 0 ? withFood : all.slice(0, 1);
}

/**
 * Backward-compat wrapper — returns just the first active session.
 * Prefer getActiveSessions() when displaying the Fridge Pool.
 */
export async function getActiveBatchSession(): Promise<BatchCookSession | null> {
  const sessions = await getActiveSessions();
  return sessions[0] ?? null;
}

/**
 * Create a new batch cook session along with its dishes in a single transaction.
 */
export async function createBatchCookSession(input: BatchCookSessionInput): Promise<BatchCookSession> {
  const user = await requireAuth();

  const { data: session, error: sessionErr } = await supabase
    .from('batch_cook_sessions')
    .insert({
      user_id: user.id,
      name: sanitizeInput(input.name),
      cook_date: input.cookDate,
      notes: input.notes ? sanitizeText(input.notes) : null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (sessionErr || !session) {
    logger.error('BatchCook', sessionErr as unknown as Error, { context: 'createBatchCookSession' });
    throw sessionErr ?? new Error('Failed to create session');
  }

  const dishRows = input.dishes
    .filter(d => d.recipeId ?? d.customName?.trim())
    .map(d => ({
      session_id: session.id,
      recipe_id: d.recipeId ?? null,
      custom_name: d.customName ? sanitizeInput(d.customName) : null,
      servings_cooked: d.servingsCooked,
      servings_remaining: d.servingsCooked,
      notes: d.notes ? sanitizeText(d.notes) : null,
    }));

  if (dishRows.length > 0) {
    const { error: dishErr } = await supabase.from('batch_cook_dishes').insert(dishRows);
    if (dishErr) {
      logger.error('BatchCook', dishErr as unknown as Error, { context: 'createBatchCookDishes' });
      throw dishErr;
    }
  }

  logger.debug('BatchCook', 'Session created', { sessionId: session.id, dishes: dishRows.length });
  const sessions = await getBatchCookSessions();
  return sessions.find(s => s.id === session.id) ?? mapSession(session as Record<string, unknown>, []);
}

/**
 * Delete a batch cook session (cascades to dishes).
 */
export async function deleteBatchCookSession(sessionId: string): Promise<void> {
  const { error } = await supabase
    .from('batch_cook_sessions')
    .delete()
    .eq('id', sessionId);

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'deleteBatchCookSession' });
    throw error;
  }
}

/**
 * Add a new dish to an already-started batch cook session.
 * Useful when you cook something extra mid-week and want to track it.
 */
export async function addDishToSession(
  sessionId: string,
  customName: string,
  servingsCooked: number,
  recipeId?: string | null
): Promise<void> {
  const servings = Math.max(1, servingsCooked);
  const { error } = await supabase.from('batch_cook_dishes').insert({
    session_id: sessionId,
    custom_name: customName.trim(),
    recipe_id: recipeId ?? null,
    servings_cooked: servings,
    servings_remaining: servings,
  });

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'addDishToSession' });
    throw error;
  }
}

/**
 * Rename a batch cook dish's custom name.
 */
export async function updateDishName(dishId: string, customName: string): Promise<void> {
  const { error } = await supabase
    .from('batch_cook_dishes')
    .update({ custom_name: customName.trim(), updated_at: new Date().toISOString() })
    .eq('id', dishId);

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'updateDishName' });
    throw error;
  }
}

/**
 * Link (or unlink) a batch cook dish to an existing recipe.
 * This enables shopping list generation from the dish's recipe ingredients.
 */
export async function updateDishRecipe(dishId: string, recipeId: string | null): Promise<void> {
  const { error } = await supabase
    .from('batch_cook_dishes')
    .update({ recipe_id: recipeId, updated_at: new Date().toISOString() })
    .eq('id', dishId);

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'updateDishRecipe' });
    throw error;
  }
}

/**
 * Update servings_remaining on a single dish directly (for manual adjustments).
 */
export async function updateDishServings(dishId: string, servingsRemaining: number): Promise<void> {
  const { error } = await supabase
    .from('batch_cook_dishes')
    .update({ servings_remaining: Math.max(0, servingsRemaining), updated_at: new Date().toISOString() })
    .eq('id', dishId);

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'updateDishServings' });
    throw error;
  }
}

// ============================================================
// Meal Logs
// ============================================================

/**
 * Fetch meal logs for a date range.
 */
export async function getMealLogs(fromDate: string, toDate: string): Promise<MealLog[]> {
  const user = await requireAuth();

  // Fetch own logs + partner logs (RLS on meal_logs allows partner reads via the
  // "Partners can view each other meal logs" policy on profile_connections).
  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .gte('logged_date', fromDate)
    .lte('logged_date', toDate)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'getMealLogs' });
    throw error;
  }

  return (data ?? []).map(mapMealLog);
}

/**
 * Fetch today's meal logs for the current user (and optionally a partner).
 */
export async function getTodaysMealLogs(partnerUserId?: string): Promise<MealLog[]> {
  const today = format(new Date(), 'yyyy-MM-dd');
  const user = await requireAuth();

  const userIds = [user.id, ...(partnerUserId ? [partnerUserId] : [])];

  const { data, error } = await supabase
    .from('meal_logs')
    .select('*')
    .in('user_id', userIds)
    .eq('logged_date', today)
    .order('created_at', { ascending: true });

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'getTodaysMealLogs' });
    throw error;
  }

  return (data ?? []).map(mapMealLog);
}

/**
 * Log a meal. The DB trigger auto-decrements servings_remaining on the dish.
 */
export async function createMealLog(input: MealLogInput): Promise<MealLog> {
  const user = await requireAuth();

  const { data, error } = await supabase
    .from('meal_logs')
    .insert({
      user_id: user.id,
      logged_date: input.loggedDate,
      meal_type: input.mealType,
      batch_dish_id: input.batchDishId ?? null,
      recipe_id: input.recipeId ?? null,
      custom_name: input.customName ? sanitizeInput(input.customName) : null,
      servings_consumed: input.servingsConsumed,
      notes: input.notes ? sanitizeText(input.notes) : null,
    })
    .select()
    .single();

  if (error || !data) {
    logger.error('BatchCook', error as unknown as Error, { context: 'createMealLog' });
    throw error ?? new Error('Failed to log meal');
  }

  logger.debug('BatchCook', 'Meal logged', { logId: data.id, mealType: input.mealType });
  return mapMealLog(data as Record<string, unknown>);
}

/**
 * Delete a meal log (DB trigger re-increments servings_remaining).
 */
export async function deleteMealLog(logId: string): Promise<void> {
  const { error } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', logId);

  if (error) {
    logger.error('BatchCook', error as unknown as Error, { context: 'deleteMealLog' });
    throw error;
  }
}
