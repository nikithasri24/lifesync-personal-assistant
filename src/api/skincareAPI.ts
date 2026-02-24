/**
 * Skincare API
 * CRUD operations for skincare products, routines, and condition tracking
 */

import { supabase } from '../lib/supabase';
import type {
  SkincareProduct,
  SkincareWeeklyRoutine,
  SkincareWeeklyRoutineInput,
} from '../skincare/types';
import type { SkinConditionLog } from '../services/types';
import { logger } from '../services/logger';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

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
  return apiCall(
    async () => {
      const user = await requireAuth();

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
      if (error) throw error;

      // Convert snake_case to camelCase
      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        brand: row.brand || undefined,
        category: row.category as ProductCategory,
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
    },
    { domain: 'SkincareAPI', operation: 'getSkincareProducts', data: { filters } }
  );
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
  return apiCall(
    async () => {
      const user = await requireAuth();

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

      const result = await supabase
        .from('skincare_products')
        .insert(dbProduct)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Skincare Product');
      logger.info('SkincareAPI', 'Skincare product created', { id: data.id, name: data.name });

      // Convert snake_case back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        brand: data.brand || undefined,
        category: data.category as ProductCategory,
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
    },
    { domain: 'SkincareAPI', operation: 'createSkincareProduct', data: { name: product.name } }
  );
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
  return apiCall(
    async () => {
      const user = await requireAuth();

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

      const result = await supabase
        .from('skincare_products')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Skincare Product', id);
      logger.info('SkincareAPI', 'Skincare product updated', { id });

      // Convert snake_case back to camelCase
      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        brand: data.brand || undefined,
        category: data.category as ProductCategory,
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
    },
    { domain: 'SkincareAPI', operation: 'updateSkincareProduct', data: { id } }
  );
}

/**
 * Delete a skincare product
 * @param id - Skincare product ID to delete
 * @returns Promise<void>
 * @throws Error if deletion fails or user not authenticated
 */
export async function deleteSkincareProduct(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('skincare_products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
      logger.info('SkincareAPI', 'Skincare product deleted', { id });
    },
    { domain: 'SkincareAPI', operation: 'deleteSkincareProduct', data: { id } }
  );
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
  return apiCall(
    async () => {
      const user = await requireAuth();

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
      if (error) throw error;
      return (data ?? []) as SkinConditionLog[];
    },
    { domain: 'SkincareAPI', operation: 'getSkinConditionLogs', data: { filters } }
  );
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
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('skin_condition_logs')
        .insert({ ...log, user_id: user.id })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Skin Condition Log');
      logger.info('SkincareAPI', 'Skin condition log created', { id: data.id, date: data.date });
      return data as SkinConditionLog;
    },
    { domain: 'SkincareAPI', operation: 'createSkinConditionLog', data: { date: log.date } }
  );
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

  const productsInUse = products.filter((p) => p.currentlyUsing).length;
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
// WEEKLY ROUTINES (Simple text-based)
// =====================================================

/**
 * Get all weekly routines for the current user
 * @returns Promise<SkincareWeeklyRoutine[]> - Array of weekly routines (0-6 days)
 */
export async function getWeeklyRoutines(): Promise<SkincareWeeklyRoutine[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('skincare_weekly_routines')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true });

      if (error) throw error;

      return (data || []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        dayOfWeek: row.day_of_week,
        amRoutine: row.am_routine || undefined,
        pmRoutine: row.pm_routine || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    { domain: 'SkincareAPI', operation: 'getWeeklyRoutines' }
  );
}

/**
 * Upsert a weekly routine for a specific day
 * @param routine - The weekly routine input
 * @returns Promise<SkincareWeeklyRoutine> - The created/updated routine
 */
export async function upsertWeeklyRoutine(
  routine: SkincareWeeklyRoutineInput
): Promise<SkincareWeeklyRoutine> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('skincare_weekly_routines')
        .upsert(
          {
            user_id: user.id,
            day_of_week: routine.dayOfWeek,
            am_routine: routine.amRoutine || null,
            pm_routine: routine.pmRoutine || null,
            notes: routine.notes || null,
          },
          { onConflict: 'user_id,day_of_week' }
        )
        .select()
        .single();

      if (error) throw error;

      logger.info('SkincareAPI', 'Weekly routine upserted', { dayOfWeek: routine.dayOfWeek });

      return {
        id: data.id,
        userId: data.user_id,
        dayOfWeek: data.day_of_week,
        amRoutine: data.am_routine || undefined,
        pmRoutine: data.pm_routine || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'SkincareAPI', operation: 'upsertWeeklyRoutine', data: { dayOfWeek: routine.dayOfWeek } }
  );
}
