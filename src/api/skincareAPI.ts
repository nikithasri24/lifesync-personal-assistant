/**
 * Skincare API
 * CRUD operations for skincare products, routines, and condition tracking
 */

import { supabase } from '../lib/supabase';
import type {
  SkincareProduct,
  SkincareRoutine,
  SkincareLog,
} from '../skincare/types';
import type { SkinConditionLog } from '../services/types';
import { logger } from '../services/logger';

// =====================================================
// SKINCARE PRODUCTS
// =====================================================

/**
 * Get all skincare products for the current user
 * @param filters - Optional filters for category and in_use status
 * @returns Promise<SkincareProduct[]> - Array of skincare products matching the filters
 * @throws Error if user not authenticated
 */
export async function getSkincareProducts(filters?: {
  category?: SkincareProduct['category'];
  in_use?: boolean;
}): Promise<SkincareProduct[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('skincare_products')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (filters) {
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.in_use !== undefined) {
      query = query.eq('in_use', filters.in_use);
    }
  }

  const { data, error } = await query;
  if (error) {
    logger.error('SkincareAPI', error, { context: 'getSkincareProducts', filters });
    throw error;
  }

  // Convert snake_case to camelCase
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    brand: row.brand || undefined,
    category: row.category,
    productType: row.product_type || undefined,
    usageTime: row.usage_time || [],
    orderInRoutine: row.order_in_routine || undefined,
    frequency: row.frequency || undefined,
    skinConcerns: row.skin_concerns || undefined,
    keyIngredients: row.key_ingredients || undefined,
    notes: row.notes || undefined,
    purchaseDate: row.purchase_date || undefined,
    expiryDate: row.expiry_date || undefined,
    price: row.price || undefined,
    size: row.size || undefined,
    whereToBuy: row.where_to_buy || undefined,
    repurchase: row.repurchase || undefined,
    currentlyUsing: row.currently_using,
    startedUsingDate: row.started_using_date || undefined,
    stoppedUsingDate: row.stopped_using_date || undefined,
    rating: row.rating || undefined,
    effectiveness: row.effectiveness || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new skincare product
 * @param product - Skincare product data
 * @returns Promise<SkincareProduct> - The created skincare product
 * @throws Error if creation fails or user not authenticated
 */
export async function createSkincareProduct(
  product: Omit<SkincareProduct, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SkincareProduct> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Convert camelCase to snake_case for database
  const dbProduct = {
    user_id: user.id,
    name: product.name,
    brand: product.brand || null,
    category: product.category,
    product_type: product.productType || null,
    usage_time: product.usageTime || [],
    order_in_routine: product.orderInRoutine || null,
    frequency: product.frequency || null,
    skin_concerns: product.skinConcerns || null,
    key_ingredients: product.keyIngredients || null,
    notes: product.notes || null,
    purchase_date: product.purchaseDate || null,
    expiry_date: product.expiryDate || null,
    price: product.price || null,
    size: product.size || null,
    where_to_buy: product.whereToBuy || null,
    repurchase: product.repurchase || null,
    currently_using: product.currentlyUsing,
    started_using_date: product.startedUsingDate || null,
    stopped_using_date: product.stoppedUsingDate || null,
    rating: product.rating || null,
    effectiveness: product.effectiveness || null,
  };

  logger.debug('SkincareAPI', 'Creating product with data', { dbProduct });

  const { data, error } = await supabase
    .from('skincare_products')
    .insert(dbProduct)
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'createSkincareProduct', product, dbProduct });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare product created', { id: data.id, name: data.name });

  // Convert snake_case back to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    brand: data.brand || undefined,
    category: data.category,
    productType: data.product_type || undefined,
    usageTime: data.usage_time || [],
    orderInRoutine: data.order_in_routine || undefined,
    frequency: data.frequency || undefined,
    skinConcerns: data.skin_concerns || undefined,
    keyIngredients: data.key_ingredients || undefined,
    notes: data.notes || undefined,
    purchaseDate: data.purchase_date || undefined,
    expiryDate: data.expiry_date || undefined,
    price: data.price || undefined,
    size: data.size || undefined,
    whereToBuy: data.where_to_buy || undefined,
    repurchase: data.repurchase || undefined,
    currentlyUsing: data.currently_using,
    startedUsingDate: data.started_using_date || undefined,
    stoppedUsingDate: data.stopped_using_date || undefined,
    rating: data.rating || undefined,
    effectiveness: data.effectiveness || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update an existing skincare product
 * @param id - Skincare product ID to update
 * @param updates - Partial skincare product data to update
 * @returns Promise<SkincareProduct> - The updated skincare product
 * @throws Error if product not found or user not authenticated
 */
export async function updateSkincareProduct(
  id: string,
  updates: Partial<SkincareProduct>
): Promise<SkincareProduct> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Convert camelCase to snake_case for database
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.productType !== undefined) dbUpdates.product_type = updates.productType;
  if (updates.usageTime !== undefined) dbUpdates.usage_time = updates.usageTime;
  if (updates.orderInRoutine !== undefined) dbUpdates.order_in_routine = updates.orderInRoutine;
  if (updates.frequency !== undefined) dbUpdates.frequency = updates.frequency;
  if (updates.skinConcerns !== undefined) dbUpdates.skin_concerns = updates.skinConcerns;
  if (updates.keyIngredients !== undefined) dbUpdates.key_ingredients = updates.keyIngredients;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
  if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
  if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
  if (updates.price !== undefined) dbUpdates.price = updates.price;
  if (updates.size !== undefined) dbUpdates.size = updates.size;
  if (updates.whereToBuy !== undefined) dbUpdates.where_to_buy = updates.whereToBuy;
  if (updates.repurchase !== undefined) dbUpdates.repurchase = updates.repurchase;
  if (updates.currentlyUsing !== undefined) dbUpdates.currently_using = updates.currentlyUsing;
  if (updates.startedUsingDate !== undefined) dbUpdates.started_using_date = updates.startedUsingDate;
  if (updates.stoppedUsingDate !== undefined) dbUpdates.stopped_using_date = updates.stoppedUsingDate;
  if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
  if (updates.effectiveness !== undefined) dbUpdates.effectiveness = updates.effectiveness;

  const { data, error } = await supabase
    .from('skincare_products')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'updateSkincareProduct', id, updates });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare product updated', { id });

  // Convert snake_case back to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    brand: data.brand || undefined,
    category: data.category,
    productType: data.product_type || undefined,
    usageTime: data.usage_time || [],
    orderInRoutine: data.order_in_routine || undefined,
    frequency: data.frequency || undefined,
    skinConcerns: data.skin_concerns || undefined,
    keyIngredients: data.key_ingredients || undefined,
    notes: data.notes || undefined,
    purchaseDate: data.purchase_date || undefined,
    expiryDate: data.expiry_date || undefined,
    price: data.price || undefined,
    size: data.size || undefined,
    whereToBuy: data.where_to_buy || undefined,
    repurchase: data.repurchase || undefined,
    currentlyUsing: data.currently_using,
    startedUsingDate: data.started_using_date || undefined,
    stoppedUsingDate: data.stopped_using_date || undefined,
    rating: data.rating || undefined,
    effectiveness: data.effectiveness || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a skincare product
 * @param id - Skincare product ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteSkincareProduct(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('skincare_products')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('SkincareAPI', error, { context: 'deleteSkincareProduct', id });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare product deleted', { id });
}

// =====================================================
// SKIN CONDITION LOGS
// =====================================================

/**
 * Get skin condition logs for the current user
 * @param filters - Optional filters for date range
 * @returns Promise<SkinConditionLog[]> - Array of skin condition logs matching the filters
 * @throws Error if user not authenticated
 */
export async function getSkinConditionLogs(filters?: {
  startDate?: string;
  endDate?: string;
}): Promise<SkinConditionLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('skin_condition_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (filters) {
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
  }

  const { data, error } = await query;
  if (error) {
    logger.error('SkincareAPI', error, { context: 'getSkinConditionLogs', filters });
    throw error;
  }

  return (data ?? []) as SkinConditionLog[];
}

/**
 * Create a new skin condition log
 * @param log - Skin condition log data
 * @returns Promise<SkinConditionLog> - The created skin condition log
 * @throws Error if creation fails or user not authenticated
 */
export async function createSkinConditionLog(
  log: Omit<SkinConditionLog, 'id' | 'user_id' | 'created_at'>
): Promise<SkinConditionLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('skin_condition_logs')
    .insert({ ...log, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'createSkinConditionLog', log });
    throw error;
  }

  logger.info('SkincareAPI', 'Skin condition log created', { id: data.id, date: data.date });
  return data as SkinConditionLog;
}

// =====================================================
// SKINCARE STATS
// =====================================================

/**
 * Get skincare statistics including product counts and skin condition averages
 * @returns Promise with skincare statistics
 * @throws Error if user not authenticated
 */
export async function getSkincareStats(): Promise<{
  totalProducts: number;
  productsInUse: number;
  averageCondition: number;
  recentLogs: SkinConditionLog[];
}> {
  const products = await getSkincareProducts();
  const logs = await getSkinConditionLogs();

  const productsInUse = products.filter((p) => p.in_use).length;
  const recentLogs = logs.slice(0, 7); // last 7 logs
  const averageCondition =
    logs.length > 0
      ? logs.reduce((sum, log) => sum + log.overall_condition, 0) / logs.length
      : 0;

  return {
    totalProducts: products.length,
    productsInUse,
    averageCondition,
    recentLogs,
  };
}

// =====================================================
// SKINCARE ROUTINES
// =====================================================

/**
 * Get all skincare routines for the current user
 * @param filters - Optional filters for routine type and active status
 * @returns Promise<SkincareRoutine[]> - Array of skincare routines
 * @throws Error if user not authenticated
 */
export async function getSkincareRoutines(filters?: {
  routineType?: 'AM' | 'PM' | 'WEEKLY' | 'SPECIAL';
  isActive?: boolean;
}): Promise<SkincareRoutine[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('skincare_routines')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (filters) {
    if (filters.routineType) {
      query = query.eq('routine_type', filters.routineType);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
  }

  const { data, error } = await query;
  if (error) {
    logger.error('SkincareAPI', error, { context: 'getSkincareRoutines', filters });
    throw error;
  }

  // Convert snake_case to camelCase
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    routineType: row.routine_type,
    isActive: row.is_active,
    productIds: row.product_ids || [],
    daysOfWeek: row.days_of_week || undefined,
    reminderEnabled: row.reminder_enabled || undefined,
    reminderTime: row.reminder_time || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Get routines for a specific day of week and time slot
 * @param dayOfWeek - Day of week (0=Sunday, 1=Monday, etc.)
 * @param timeSlot - Time slot ('AM' or 'PM')
 * @returns Promise<SkincareRoutine[]> - Array of matching routines
 * @throws Error if user not authenticated
 */
export async function getRoutinesForDay(
  dayOfWeek: number,
  timeSlot: 'AM' | 'PM'
): Promise<SkincareRoutine[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .rpc('get_routines_for_day_and_time', {
      p_user_id: user.id,
      p_day_of_week: dayOfWeek,
      p_time_slot: timeSlot,
    });

  if (error) {
    logger.error('SkincareAPI', error, { context: 'getRoutinesForDay', dayOfWeek, timeSlot });
    throw error;
  }

  // Convert snake_case to camelCase
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    name: row.name,
    routineType: row.routine_type,
    isActive: row.is_active,
    productIds: row.product_ids || [],
    daysOfWeek: row.days_of_week || undefined,
    reminderEnabled: row.reminder_enabled || undefined,
    reminderTime: row.reminder_time || undefined,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Create a new skincare routine
 * @param routine - Skincare routine data
 * @returns Promise<SkincareRoutine> - The created routine
 * @throws Error if creation fails or user not authenticated
 */
export async function createSkincareRoutine(
  routine: Omit<SkincareRoutine, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
): Promise<SkincareRoutine> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Convert camelCase to snake_case for database
  const dbRoutine = {
    user_id: user.id,
    name: routine.name,
    routine_type: routine.routineType,
    is_active: routine.isActive,
    product_ids: routine.productIds,
    days_of_week: routine.daysOfWeek || null,
    reminder_enabled: routine.reminderEnabled || false,
    reminder_time: routine.reminderTime || null,
    notes: routine.notes || null,
  };

  const { data, error } = await supabase
    .from('skincare_routines')
    .insert(dbRoutine)
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'createSkincareRoutine', routine });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare routine created', { id: data.id, name: data.name });

  // Convert snake_case back to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    routineType: data.routine_type,
    isActive: data.is_active,
    productIds: data.product_ids || [],
    daysOfWeek: data.days_of_week || undefined,
    reminderEnabled: data.reminder_enabled || undefined,
    reminderTime: data.reminder_time || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update an existing skincare routine
 * @param id - Routine ID to update
 * @param updates - Partial routine data to update
 * @returns Promise<SkincareRoutine> - The updated routine
 * @throws Error if routine not found or user not authenticated
 */
export async function updateSkincareRoutine(
  id: string,
  updates: Partial<SkincareRoutine>
): Promise<SkincareRoutine> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Convert camelCase to snake_case for database
  const dbUpdates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.routineType !== undefined) dbUpdates.routine_type = updates.routineType;
  if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
  if (updates.productIds !== undefined) dbUpdates.product_ids = updates.productIds;
  if (updates.daysOfWeek !== undefined) dbUpdates.days_of_week = updates.daysOfWeek;
  if (updates.reminderEnabled !== undefined) dbUpdates.reminder_enabled = updates.reminderEnabled;
  if (updates.reminderTime !== undefined) dbUpdates.reminder_time = updates.reminderTime;
  if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

  const { data, error } = await supabase
    .from('skincare_routines')
    .update(dbUpdates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'updateSkincareRoutine', id, updates });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare routine updated', { id });

  // Convert snake_case back to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    name: data.name,
    routineType: data.routine_type,
    isActive: data.is_active,
    productIds: data.product_ids || [],
    daysOfWeek: data.days_of_week || undefined,
    reminderEnabled: data.reminder_enabled || undefined,
    reminderTime: data.reminder_time || undefined,
    notes: data.notes || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a skincare routine
 * @param id - Routine ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteSkincareRoutine(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('skincare_routines')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    logger.error('SkincareAPI', error, { context: 'deleteSkincareRoutine', id });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare routine deleted', { id });
}

// =====================================================
// SKINCARE LOGS (Completion Tracking)
// =====================================================

/**
 * Get skincare logs for the current user
 * @param filters - Optional filters for date range and routine type
 * @returns Promise<SkincareLog[]> - Array of skincare logs
 * @throws Error if user not authenticated
 */
export async function getSkincareLogs(filters?: {
  startDate?: string;
  endDate?: string;
  routineType?: 'AM' | 'PM';
}): Promise<SkincareLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  let query = supabase
    .from('skincare_logs')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (filters) {
    if (filters.startDate) {
      query = query.gte('date', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('date', filters.endDate);
    }
    if (filters.routineType) {
      query = query.eq('routine_type', filters.routineType);
    }
  }

  const { data, error } = await query;
  if (error) {
    logger.error('SkincareAPI', error, { context: 'getSkincareLogs', filters });
    throw error;
  }

  // Convert snake_case to camelCase
  return (data ?? []).map((row) => ({
    id: row.id,
    userId: row.user_id,
    date: row.date,
    routineId: row.routine_id || undefined,
    routineType: row.routine_type,
    completed: row.completed,
    completedAt: row.completed_at || undefined,
    productsUsed: row.products_used || undefined,
    skippedProducts: row.skipped_products || undefined,
    skinCondition: row.skin_condition || undefined,
    skinNotes: row.skin_notes || undefined,
    weather: row.weather || undefined,
    stressLevel: row.stress_level || undefined,
    sleepQuality: row.sleep_quality || undefined,
    photoUrls: row.photo_urls || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/**
 * Log a routine completion (upsert for idempotency)
 * @param log - Skincare log data
 * @returns Promise<SkincareLog> - The created/updated log
 * @throws Error if operation fails or user not authenticated
 */
export async function logRoutineCompletion(log: {
  date: string;
  routineId: string | null;
  routineType: 'AM' | 'PM';
  productsUsed: string[];
  skippedProducts?: string[];
  skinCondition?: string;
  skinNotes?: string;
}): Promise<SkincareLog> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('skincare_logs')
    .upsert(
      {
        user_id: user.id,
        date: log.date,
        routine_id: log.routineId,
        routine_type: log.routineType,
        completed: true,
        completed_at: new Date().toISOString(),
        products_used: log.productsUsed,
        skipped_products: log.skippedProducts || [],
        skin_condition: log.skinCondition,
        skin_notes: log.skinNotes,
      },
      {
        onConflict: 'user_id,date,routine_type',
      }
    )
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'logRoutineCompletion', log });
    throw error;
  }

  logger.info('SkincareAPI', 'Routine completion logged', {
    date: data.date,
    routineType: data.routine_type,
  });

  // Convert snake_case to camelCase
  return {
    id: data.id,
    userId: data.user_id,
    date: data.date,
    routineId: data.routine_id || undefined,
    routineType: data.routine_type,
    completed: data.completed,
    completedAt: data.completed_at || undefined,
    productsUsed: data.products_used || undefined,
    skippedProducts: data.skipped_products || undefined,
    skinCondition: data.skin_condition || undefined,
    skinNotes: data.skin_notes || undefined,
    weather: data.weather || undefined,
    stressLevel: data.stress_level || undefined,
    sleepQuality: data.sleep_quality || undefined,
    photoUrls: data.photo_urls || undefined,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Reset completion for a specific date and routine type
 * @param date - Date to reset (YYYY-MM-DD)
 * @param routineType - Routine type to reset ('AM' or 'PM')
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function resetCompletion(date: string, routineType: 'AM' | 'PM'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('skincare_logs')
    .delete()
    .eq('user_id', user.id)
    .eq('date', date)
    .eq('routine_type', routineType);

  if (error) {
    logger.error('SkincareAPI', error, { context: 'resetCompletion', date, routineType });
    throw error;
  }

  logger.info('SkincareAPI', 'Completion reset', { date, routineType });
}

// =====================================================
// SKINCARE ANALYTICS
// =====================================================

/**
 * Get completion statistics for a date range
 * @param startDate - Start date (YYYY-MM-DD)
 * @param endDate - End date (YYYY-MM-DD)
 * @returns Promise with completion statistics
 * @throws Error if user not authenticated
 */
export async function getCompletionStats(
  startDate: string,
  endDate: string
): Promise<{
  totalDays: number;
  completedDays: number;
  completionRate: number;
  amCompletions: number;
  pmCompletions: number;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('get_skincare_completion_stats', {
    p_user_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    logger.error('SkincareAPI', error, { context: 'getCompletionStats', startDate, endDate });
    throw error;
  }

  // The RPC returns an array with a single result
  const result = Array.isArray(data) ? data[0] : data;

  return {
    totalDays: result?.total_days || 0,
    completedDays: result?.completed_days || 0,
    completionRate: result?.completion_rate || 0,
    amCompletions: result?.am_completions || 0,
    pmCompletions: result?.pm_completions || 0,
  };
}

/**
 * Get current and best skincare streaks
 * @returns Promise with streak data
 * @throws Error if user not authenticated
 */
export async function getSkincareStreak(): Promise<{
  currentStreak: number;
  bestStreak: number;
  lastCompletionDate: string | null;
}> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('calculate_skincare_streak', {
    p_user_id: user.id,
  });

  if (error) {
    logger.error('SkincareAPI', error, { context: 'getSkincareStreak' });
    throw error;
  }

  // The RPC returns an array with a single result
  const result = Array.isArray(data) ? data[0] : data;

  return {
    currentStreak: result?.current_streak || 0,
    bestStreak: result?.best_streak || 0,
    lastCompletionDate: result?.last_completion_date || null,
  };
}
