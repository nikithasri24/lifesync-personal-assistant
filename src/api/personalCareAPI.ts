/**
 * Personal Care API
 * CRUD operations for personal care categories, items, products, and logs
 */

import { supabase } from '../lib/supabase';
import type {
  PersonalCareCategory,
  PersonalCareCategoryInput,
  PersonalCareItem,
  PersonalCareItemInput,
  PersonalCareProduct,
  PersonalCareProductInput,
  PersonalCareLog,
  PersonalCareLogInput,
  PersonalCareItemProduct,
  PersonalCareSchedule,
  PersonalCareScheduleInput,
  PersonalCareScheduleWithItem,
  FrequencyType,
  ScheduleStatus,
} from '../skincare/personalCareTypes';
import { CATEGORY_TEMPLATES, ITEM_TEMPLATES, type ItemTemplate } from '../skincare/templates';
import { apiCall, requireAuth } from './apiWrapper';
import { NotFoundError } from '../lib/errors';

// =====================================================
// CATEGORIES
// =====================================================

/**
 * Get all personal care categories for the current user
 */
export async function getPersonalCareCategories(options?: {
  activeOnly?: boolean;
}): Promise<PersonalCareCategory[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('personal_care_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        frequencyType: row.frequency_type,
        icon: row.icon,
        color: row.color || undefined,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    { domain: 'PersonalCareAPI', operation: 'getCategories', data: options }
  );
}

/**
 * Create a new personal care category
 */
export async function createPersonalCareCategory(
  category: PersonalCareCategoryInput
): Promise<PersonalCareCategory> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbCategory = {
        user_id: user.id,
        name: category.name,
        frequency_type: category.frequencyType,
        icon: category.icon,
        color: category.color,
        is_active: category.isActive,
        sort_order: category.sortOrder,
      };

      const { data, error } = await supabase
        .from('personal_care_categories')
        .insert(dbCategory)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        frequencyType: data.frequency_type,
        icon: data.icon,
        color: data.color || undefined,
        isActive: data.is_active,
        sortOrder: data.sort_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'createCategory', data: { name: category.name } }
  );
}

/**
 * Update a personal care category
 */
export async function updatePersonalCareCategory(
  id: string,
  updates: Partial<PersonalCareCategoryInput>
): Promise<PersonalCareCategory> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.frequencyType !== undefined) dbUpdates.frequency_type = updates.frequencyType;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.color !== undefined) dbUpdates.color = updates.color;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;

      const { data, error } = await supabase
        .from('personal_care_categories')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        frequencyType: data.frequency_type,
        icon: data.icon,
        color: data.color || undefined,
        isActive: data.is_active,
        sortOrder: data.sort_order,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'updateCategory', data: { id } }
  );
}

/**
 * Delete a personal care category
 */
export async function deletePersonalCareCategory(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('personal_care_categories')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'PersonalCareAPI', operation: 'deleteCategory', data: { id } }
  );
}

/**
 * Initialize personal care with default frequency-based categories and suggested items
 * Only creates if user has no categories yet
 * Returns the created categories with their items
 */
export async function initializePersonalCare(): Promise<{
  categories: PersonalCareCategory[];
  items: PersonalCareItem[];
}> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check if user already has categories
      const { data: existingCategories } = await supabase
        .from('personal_care_categories')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (existingCategories && existingCategories.length > 0) {
        // User already has categories, fetch and return them
        const categories = await getPersonalCareCategories();
        const items = await getPersonalCareItems();
        return { categories, items };
      }

      // Create the 4 frequency-based categories
      const categoryInserts = CATEGORY_TEMPLATES.map(template => ({
        user_id: user.id,
        name: template.name,
        frequency_type: template.frequencyType,
        icon: template.icon,
        color: template.color,
        is_active: true,
        sort_order: template.sortOrder,
      }));

      const { data: createdCategories, error: catError } = await supabase
        .from('personal_care_categories')
        .insert(categoryInserts)
        .select();

      if (catError) throw catError;

      // Map frequency type to category ID
      const frequencyToCategoryId = new Map<FrequencyType, string>();
      createdCategories?.forEach(cat => {
        frequencyToCategoryId.set(cat.frequency_type as FrequencyType, cat.id);
      });

      // Create all template items (initially inactive so user can choose which to enable)
      const itemInserts = ITEM_TEMPLATES.map((template: ItemTemplate) => ({
        user_id: user.id,
        category_id: frequencyToCategoryId.get(template.categoryFrequency),
        name: template.name,
        icon: template.icon,
        tracking_mode: template.trackingMode,
        schedule_interval_days: template.scheduleIntervalDays,
        notes: template.notes,
        is_active: false, // Start inactive - user enables what they want
        sort_order: 0,
      })).filter(item => item.category_id); // Filter out any without valid category

      const { data: createdItems, error: itemError } = await supabase
        .from('personal_care_items')
        .insert(itemInserts)
        .select();

      if (itemError) throw itemError;

      // Transform and return
      const categories: PersonalCareCategory[] = (createdCategories ?? []).map(row => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        frequencyType: row.frequency_type,
        icon: row.icon,
        color: row.color || undefined,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      const items: PersonalCareItem[] = (createdItems ?? []).map(row => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        name: row.name,
        icon: row.icon || undefined,
        trackingMode: row.tracking_mode,
        scheduleIntervalDays: row.schedule_interval_days || undefined,
        goalIntervalDays: row.goal_interval_days || undefined,
        lastCompletedAt: row.last_completed_at || undefined,
        nextDueDate: row.next_due_date || undefined,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return { categories, items };
    },
    { domain: 'PersonalCareAPI', operation: 'initialize' }
  );
}

// =====================================================
// ITEMS
// =====================================================

/**
 * Get all personal care items for the current user
 */
export async function getPersonalCareItems(options?: {
  categoryId?: string;
  activeOnly?: boolean;
  trackingMode?: PersonalCareItem['trackingMode'];
}): Promise<PersonalCareItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('personal_care_items')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order', { ascending: true });

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }
      if (options?.activeOnly) {
        query = query.eq('is_active', true);
      }
      if (options?.trackingMode) {
        query = query.eq('tracking_mode', options.trackingMode);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        name: row.name,
        icon: row.icon || undefined,
        trackingMode: row.tracking_mode,
        scheduleIntervalDays: row.schedule_interval_days || undefined,
        goalIntervalDays: row.goal_interval_days || undefined,
        lastCompletedAt: row.last_completed_at || undefined,
        nextDueDate: row.next_due_date || undefined,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    { domain: 'PersonalCareAPI', operation: 'getItems', data: options }
  );
}

/**
 * Get scheduled items that are due (nextDueDate <= today)
 */
export async function getScheduledItemsDue(): Promise<PersonalCareItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('personal_care_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('tracking_mode', 'scheduled')
        .eq('is_active', true)
        .lte('next_due_date', today)
        .order('next_due_date', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        categoryId: row.category_id,
        name: row.name,
        icon: row.icon || undefined,
        trackingMode: row.tracking_mode,
        scheduleIntervalDays: row.schedule_interval_days || undefined,
        goalIntervalDays: row.goal_interval_days || undefined,
        lastCompletedAt: row.last_completed_at || undefined,
        nextDueDate: row.next_due_date || undefined,
        isActive: row.is_active,
        sortOrder: row.sort_order,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    { domain: 'PersonalCareAPI', operation: 'getScheduledItemsDue' }
  );
}

/**
 * Create a new personal care item
 */
export async function createPersonalCareItem(
  item: PersonalCareItemInput
): Promise<PersonalCareItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Calculate initial next_due_date for scheduled items
      let nextDueDate: string | null = null;
      if (item.trackingMode === 'scheduled' && item.scheduleIntervalDays) {
        const date = new Date();
        date.setDate(date.getDate() + item.scheduleIntervalDays);
        nextDueDate = date.toISOString().split('T')[0];
      }

      const dbItem = {
        user_id: user.id,
        category_id: item.categoryId,
        name: item.name,
        icon: item.icon,
        tracking_mode: item.trackingMode,
        schedule_interval_days: item.scheduleIntervalDays,
        goal_interval_days: item.goalIntervalDays,
        next_due_date: nextDueDate,
        is_active: item.isActive,
        sort_order: item.sortOrder,
        notes: item.notes,
      };

      const { data, error } = await supabase
        .from('personal_care_items')
        .insert(dbItem)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        categoryId: data.category_id,
        name: data.name,
        icon: data.icon || undefined,
        trackingMode: data.tracking_mode,
        scheduleIntervalDays: data.schedule_interval_days || undefined,
        goalIntervalDays: data.goal_interval_days || undefined,
        lastCompletedAt: data.last_completed_at || undefined,
        nextDueDate: data.next_due_date || undefined,
        isActive: data.is_active,
        sortOrder: data.sort_order,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'createItem', data: { name: item.name } }
  );
}

/**
 * Update a personal care item
 */
export async function updatePersonalCareItem(
  id: string,
  updates: Partial<PersonalCareItemInput>
): Promise<PersonalCareItem> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbUpdates: Record<string, unknown> = {};
      if (updates.categoryId !== undefined) dbUpdates.category_id = updates.categoryId;
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.icon !== undefined) dbUpdates.icon = updates.icon;
      if (updates.trackingMode !== undefined) dbUpdates.tracking_mode = updates.trackingMode;
      if (updates.scheduleIntervalDays !== undefined) dbUpdates.schedule_interval_days = updates.scheduleIntervalDays;
      if (updates.goalIntervalDays !== undefined) dbUpdates.goal_interval_days = updates.goalIntervalDays;
      if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
      if (updates.sortOrder !== undefined) dbUpdates.sort_order = updates.sortOrder;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('personal_care_items')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        categoryId: data.category_id,
        name: data.name,
        icon: data.icon || undefined,
        trackingMode: data.tracking_mode,
        scheduleIntervalDays: data.schedule_interval_days || undefined,
        goalIntervalDays: data.goal_interval_days || undefined,
        lastCompletedAt: data.last_completed_at || undefined,
        nextDueDate: data.next_due_date || undefined,
        isActive: data.is_active,
        sortOrder: data.sort_order,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'updateItem', data: { id } }
  );
}

/**
 * Delete a personal care item
 */
export async function deletePersonalCareItem(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('personal_care_items')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'PersonalCareAPI', operation: 'deleteItem', data: { id } }
  );
}

// =====================================================
// PRODUCTS
// =====================================================

/**
 * Get all personal care products for the current user
 */
export async function getPersonalCareProducts(options?: {
  currentlyUsing?: boolean;
}): Promise<PersonalCareProduct[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('personal_care_products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (options?.currentlyUsing !== undefined) {
        query = query.eq('currently_using', options.currentlyUsing);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        name: row.name,
        brand: row.brand || undefined,
        category: row.category || undefined,
        productType: row.product_type || undefined,
        purchaseDate: row.purchase_date || undefined,
        expiryDate: row.expiry_date || undefined,
        price: row.price || undefined,
        size: row.size || undefined,
        whereToBuy: row.where_to_buy || undefined,
        currentlyUsing: row.currently_using,
        rating: row.rating || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));
    },
    { domain: 'PersonalCareAPI', operation: 'getProducts', data: options }
  );
}

/**
 * Create a new personal care product
 */
export async function createPersonalCareProduct(
  product: PersonalCareProductInput
): Promise<PersonalCareProduct> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbProduct = {
        user_id: user.id,
        name: product.name,
        brand: product.brand,
        category: product.category,
        product_type: product.productType,
        purchase_date: product.purchaseDate,
        expiry_date: product.expiryDate,
        price: product.price,
        size: product.size,
        where_to_buy: product.whereToBuy,
        currently_using: product.currentlyUsing,
        rating: product.rating,
        notes: product.notes,
      };

      const { data, error } = await supabase
        .from('personal_care_products')
        .insert(dbProduct)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        brand: data.brand || undefined,
        category: data.category || undefined,
        productType: data.product_type || undefined,
        purchaseDate: data.purchase_date || undefined,
        expiryDate: data.expiry_date || undefined,
        price: data.price || undefined,
        size: data.size || undefined,
        whereToBuy: data.where_to_buy || undefined,
        currentlyUsing: data.currently_using,
        rating: data.rating || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'createProduct', data: { name: product.name } }
  );
}

/**
 * Update a personal care product
 */
export async function updatePersonalCareProduct(
  id: string,
  updates: Partial<PersonalCareProductInput>
): Promise<PersonalCareProduct> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.productType !== undefined) dbUpdates.product_type = updates.productType;
      if (updates.purchaseDate !== undefined) dbUpdates.purchase_date = updates.purchaseDate;
      if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.size !== undefined) dbUpdates.size = updates.size;
      if (updates.whereToBuy !== undefined) dbUpdates.where_to_buy = updates.whereToBuy;
      if (updates.currentlyUsing !== undefined) dbUpdates.currently_using = updates.currentlyUsing;
      if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { data, error } = await supabase
        .from('personal_care_products')
        .update(dbUpdates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        brand: data.brand || undefined,
        category: data.category || undefined,
        productType: data.product_type || undefined,
        purchaseDate: data.purchase_date || undefined,
        expiryDate: data.expiry_date || undefined,
        price: data.price || undefined,
        size: data.size || undefined,
        whereToBuy: data.where_to_buy || undefined,
        currentlyUsing: data.currently_using,
        rating: data.rating || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'updateProduct', data: { id } }
  );
}

/**
 * Delete a personal care product
 */
export async function deletePersonalCareProduct(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('personal_care_products')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'PersonalCareAPI', operation: 'deleteProduct', data: { id } }
  );
}

// =====================================================
// LOGS
// =====================================================

/**
 * Get personal care logs with optional filters
 */
export async function getPersonalCareLogs(options?: {
  itemId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): Promise<PersonalCareLog[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('personal_care_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      if (options?.itemId) {
        query = query.eq('item_id', options.itemId);
      }
      if (options?.startDate) {
        query = query.gte('completed_at', options.startDate);
      }
      if (options?.endDate) {
        query = query.lte('completed_at', options.endDate);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        itemId: row.item_id,
        completedAt: row.completed_at,
        skipped: row.skipped,
        notes: row.notes || undefined,
        rating: row.rating || undefined,
        productsUsed: row.products_used || undefined,
        createdAt: row.created_at,
      }));
    },
    { domain: 'PersonalCareAPI', operation: 'getLogs', data: options }
  );
}

/**
 * Log completion of a personal care item
 * This triggers the database function to update next_due_date for scheduled items
 */
export async function logPersonalCareCompletion(
  log: PersonalCareLogInput
): Promise<PersonalCareLog> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const dbLog = {
        user_id: user.id,
        item_id: log.itemId,
        completed_at: log.completedAt,
        skipped: log.skipped,
        notes: log.notes,
        rating: log.rating,
        products_used: log.productsUsed,
      };

      const { data, error } = await supabase
        .from('personal_care_logs')
        .insert(dbLog)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        itemId: data.item_id,
        completedAt: data.completed_at,
        skipped: data.skipped,
        notes: data.notes || undefined,
        rating: data.rating || undefined,
        productsUsed: data.products_used || undefined,
        createdAt: data.created_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'logCompletion', data: { itemId: log.itemId } }
  );
}

/**
 * Delete a personal care log
 */
export async function deletePersonalCareLog(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('personal_care_logs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'PersonalCareAPI', operation: 'deleteLog', data: { id } }
  );
}

// =====================================================
// ITEM-PRODUCT LINKING
// =====================================================

/**
 * Link a product to an item
 */
export async function linkProductToItem(
  itemId: string,
  productId: string,
  usageOrder?: number
): Promise<PersonalCareItemProduct> {
  return apiCall(
    async () => {
      await requireAuth();

      const { data, error } = await supabase
        .from('personal_care_item_products')
        .insert({
          item_id: itemId,
          product_id: productId,
          usage_order: usageOrder ?? 0,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        itemId: data.item_id,
        productId: data.product_id,
        usageOrder: data.usage_order,
        createdAt: data.created_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'linkProductToItem', data: { itemId, productId } }
  );
}

/**
 * Unlink a product from an item
 */
export async function unlinkProductFromItem(
  itemId: string,
  productId: string
): Promise<void> {
  return apiCall(
    async () => {
      await requireAuth();

      const { error } = await supabase
        .from('personal_care_item_products')
        .delete()
        .eq('item_id', itemId)
        .eq('product_id', productId);

      if (error) throw error;
    },
    { domain: 'PersonalCareAPI', operation: 'unlinkProductFromItem', data: { itemId, productId } }
  );
}

/**
 * Get products linked to an item
 */
export async function getItemProducts(
  itemId: string
): Promise<(PersonalCareProduct & { usageOrder: number })[]> {
  return apiCall(
    async () => {
      await requireAuth();

      const { data, error } = await supabase
        .from('personal_care_item_products')
        .select(`
          usage_order,
          personal_care_products (*)
        `)
        .eq('item_id', itemId)
        .order('usage_order', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => {
        // Supabase join can return array or single object - handle both
        const rawProduct = row.personal_care_products;
        const product = (Array.isArray(rawProduct) ? rawProduct[0] : rawProduct) as Record<string, unknown> | null;

        if (!product) {
          throw new NotFoundError('Product', itemId);
        }

        return {
          id: product.id as string,
          userId: product.user_id as string,
          name: product.name as string,
          brand: (product.brand as string) || undefined,
          category: (product.category as string) || undefined,
          productType: (product.product_type as string) || undefined,
          purchaseDate: (product.purchase_date as string) || undefined,
          expiryDate: (product.expiry_date as string) || undefined,
          price: (product.price as number) || undefined,
          size: (product.size as string) || undefined,
          whereToBuy: (product.where_to_buy as string) || undefined,
          currentlyUsing: product.currently_using as boolean,
          rating: (product.rating as number) || undefined,
          notes: (product.notes as string) || undefined,
          createdAt: product.created_at as string,
          updatedAt: product.updated_at as string,
          usageOrder: row.usage_order,
        };
      });
    },
    { domain: 'PersonalCareAPI', operation: 'getItemProducts', data: { itemId } }
  );
}

// =====================================================
// SCHEDULE (Calendar)
// =====================================================

/**
 * Get schedule entries for a month
 */
export async function getMonthSchedule(
  year: number,
  month: number
): Promise<PersonalCareScheduleWithItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Calculate start and end of month
      const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('personal_care_schedule')
        .select(`
          *,
          item:personal_care_items(*)
        `)
        .eq('user_id', user.id)
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      return (data ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        itemId: row.item_id,
        scheduledDate: row.scheduled_date,
        status: row.status as ScheduleStatus,
        completedAt: row.completed_at || undefined,
        notes: row.notes || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        item: row.item ? {
          id: row.item.id,
          userId: row.item.user_id,
          categoryId: row.item.category_id,
          name: row.item.name,
          icon: row.item.icon || undefined,
          trackingMode: row.item.tracking_mode,
          scheduleIntervalDays: row.item.schedule_interval_days || undefined,
          goalIntervalDays: row.item.goal_interval_days || undefined,
          lastCompletedAt: row.item.last_completed_at || undefined,
          nextDueDate: row.item.next_due_date || undefined,
          isActive: row.item.is_active,
          sortOrder: row.item.sort_order,
          notes: row.item.notes || undefined,
          createdAt: row.item.created_at,
          updatedAt: row.item.updated_at,
        } : null,
      })).filter(s => s.item !== null) as PersonalCareScheduleWithItem[];
    },
    { domain: 'PersonalCareAPI', operation: 'getMonthSchedule', data: { year, month } }
  );
}

/**
 * Schedule an item for a specific date (allows multiple items per day)
 */
export async function scheduleItem(
  itemId: string,
  scheduledDate: string
): Promise<PersonalCareSchedule> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('personal_care_schedule')
        .insert({
          user_id: user.id,
          item_id: itemId,
          scheduled_date: scheduledDate,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        itemId: data.item_id,
        scheduledDate: data.scheduled_date,
        status: data.status as ScheduleStatus,
        completedAt: data.completed_at || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'scheduleItem', data: { itemId, scheduledDate } }
  );
}

/**
 * Update schedule status (complete or skip)
 */
export async function updateScheduleStatus(
  scheduleId: string,
  status: ScheduleStatus,
  notes?: string
): Promise<PersonalCareSchedule> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const updateData: Record<string, unknown> = { status };
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('personal_care_schedule')
        .update(updateData)
        .eq('id', scheduleId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        userId: data.user_id,
        itemId: data.item_id,
        scheduledDate: data.scheduled_date,
        status: data.status as ScheduleStatus,
        completedAt: data.completed_at || undefined,
        notes: data.notes || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
    { domain: 'PersonalCareAPI', operation: 'updateScheduleStatus', data: { scheduleId, status } }
  );
}

/**
 * Remove a scheduled item by its ID
 */
export async function removeScheduledItem(scheduleId: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('personal_care_schedule')
        .delete()
        .eq('id', scheduleId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'PersonalCareAPI', operation: 'removeScheduledItem', data: { scheduleId } }
  );
}

