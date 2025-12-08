/**
 * Skincare API
 * CRUD operations for skincare products, routines, and condition tracking
 */

import { supabase } from '../lib/supabase';
import type { SkincareProduct, SkincareRoutine, SkinConditionLog } from '../services/types';
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

  return (data ?? []) as SkincareProduct[];
}

/**
 * Create a new skincare product
 * @param product - Skincare product data
 * @returns Promise<SkincareProduct> - The created skincare product
 * @throws Error if creation fails or user not authenticated
 */
export async function createSkincareProduct(
  product: Omit<SkincareProduct, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<SkincareProduct> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('skincare_products')
    .insert({ ...product, user_id: user.id })
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'createSkincareProduct', product });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare product created', { id: data.id, name: data.name });
  return data as SkincareProduct;
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

  const { data, error } = await supabase
    .from('skincare_products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    logger.error('SkincareAPI', error, { context: 'updateSkincareProduct', id, updates });
    throw error;
  }

  logger.info('SkincareAPI', 'Skincare product updated', { id });
  return data as SkincareProduct;
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
