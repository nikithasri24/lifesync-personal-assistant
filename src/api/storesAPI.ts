/**
 * Stores API
 * CRUD operations for shopping stores with Supabase
 */

import { supabase } from '../lib/supabase';
import type { StoreData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

export async function getStores(): Promise<StoreData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .order('favorite', { ascending: false })
        .order('name', { ascending: true });

      if (error) throw error;
      return (data ?? []) as StoreData[];
    },
    { domain: 'StoresAPI', operation: 'getStores' }
  );
}

export async function createStore(
  store: Omit<StoreData, 'id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<StoreData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('stores')
        .insert({ user_id: user.id, ...store })
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
