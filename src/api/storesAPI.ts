/**
 * Stores API with Merged Mode Support
 * CRUD operations for shopping stores with Supabase
 *
 * Merged Mode: When both users in a connection set the shopping module to "merged",
 * the API fetches data for both users. RLS policies ensure proper access control.
 *
 * Implementation:
 * - getShoppingMergedConnection() checks if merged mode is enabled
 * - Fetch functions include partner's data when merged
 * - RLS policies on stores table handle security
 */

import { supabase } from '../lib/supabase';
import type { StoreData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';
import { getMergedConnectionId, type MergedConnectionResult } from '../shared/api/SharedDataProvider';
import { logger } from '@/services/logger';

// Merged connection cache for Shopping
let cachedMergedConnection: MergedConnectionResult | null | undefined;

/**
 * Get merged connection for shopping module
 * Returns connection info if both users have enabled merged mode, null otherwise
 */
export async function getShoppingMergedConnection(): Promise<MergedConnectionResult | null> {
  if (cachedMergedConnection !== undefined) {
    logger.debug('StoresAPI', 'Returning cached merged connection', { cachedMergedConnection });
    return cachedMergedConnection;
  }

  logger.debug('StoresAPI', 'Fetching merged connection');
  cachedMergedConnection = await getMergedConnectionId('shopping');
  logger.debug('StoresAPI', 'Cached connection', { cachedMergedConnection });

  return cachedMergedConnection;
}

/**
 * Clear cached merged connection (call when connection status changes)
 */
export function clearShoppingMergedConnectionCache(): void {
  cachedMergedConnection = undefined;
}

export async function getStores(): Promise<StoreData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getShoppingMergedConnection();

      let query = supabase
        .from('stores')
        .select('*')
        .order('favorite', { ascending: false })
        .order('name', { ascending: true });

      // If merged mode, RLS handles access
      // We query for all accessible stores (own + partner's)
      // RLS policy will filter based on merged permissions
      if (mergedConnection) {
        logger.debug('StoresAPI', 'Merged mode enabled, fetching for both users');
        // RLS handles the filtering, no need for explicit OR clause
      } else {
        // Personal mode: only get current user's stores
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      logger.debug('StoresAPI', 'Fetched stores', {
        count: data?.length ?? 0,
        mode: mergedConnection ? 'merged' : 'personal',
      });
      return (data ?? []) as StoreData[];
    },
    { domain: 'StoresAPI', operation: 'getStores' }
  );
}

export async function createStore(
  store: Omit<StoreData, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'connection_id'>
): Promise<StoreData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Get connection_id if user has merged permission
      const mergedConnection = await getShoppingMergedConnection();

      const result = await supabase
        .from('stores')
        .insert({
          user_id: user.id,
          connection_id: mergedConnection?.connectionId ?? null,
          ...store
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Store');
      return data as StoreData;
    },
    { domain: 'StoresAPI', operation: 'createStore', data: { name: store.name } }
  );
}

export async function updateStore(
  id: string,
  updates: Partial<StoreData>
): Promise<StoreData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('stores')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Store', id);
      return data as StoreData;
    },
    { domain: 'StoresAPI', operation: 'updateStore', data: { id } }
  );
}

export async function deleteStore(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'StoresAPI', operation: 'deleteStore', data: { id } }
  );
}
