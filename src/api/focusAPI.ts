/**
 * Focus Sessions API
 * CRUD operations for focus sessions with Supabase
 */

import { supabase } from '../lib/supabase';
import type { FocusSessionData } from '../services/types';
import { apiCall, requireAuth, handleSupabaseResponse } from './apiWrapper';

// =====================================================
// FOCUS SESSIONS CRUD OPERATIONS
// =====================================================

/**
 * Get all focus sessions for the current user
 */
export async function getFocusSessions(filters?: {
  status?: FocusSessionData['status'];
  startDate?: string;
  endDate?: string;
}): Promise<FocusSessionData[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      let query = supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('started_at', { ascending: false });

      // Apply filters
      if (filters) {
        if (filters.status) query = query.eq('status', filters.status);
        if (filters.startDate) query = query.gte('started_at', filters.startDate);
        if (filters.endDate) query = query.lte('started_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as FocusSessionData[];
    },
    { domain: 'FocusAPI', operation: 'getFocusSessions', data: { filters } }
  );
}

/**
 * Get a single focus session by ID
 */
export async function getFocusSession(id: string): Promise<FocusSessionData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      const data = handleSupabaseResponse(result, 'Focus Session', id);
      return data as FocusSessionData;
    },
    { domain: 'FocusAPI', operation: 'getFocusSession', data: { id } }
  );
}

/**
 * Create a new focus session
 */
export async function createFocusSession(
  session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>
): Promise<FocusSessionData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('focus_sessions')
        .insert({
          user_id: user.id,
          ...session,
          status: session.status ?? 'in-progress',
          started_at: session.started_at ?? new Date().toISOString(),
        })
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Focus Session');
      return data as FocusSessionData;
    },
    { domain: 'FocusAPI', operation: 'createFocusSession', data: { status: session.status } }
  );
}

/**
 * Update a focus session
 */
export async function updateFocusSession(
  id: string,
  updates: Partial<FocusSessionData>
): Promise<FocusSessionData> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const result = await supabase
        .from('focus_sessions')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      const data = handleSupabaseResponse(result, 'Focus Session', id);
      return data as FocusSessionData;
    },
    { domain: 'FocusAPI', operation: 'updateFocusSession', data: { id } }
  );
}

/**
 * Delete a focus session
 */
export async function deleteFocusSession(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('focus_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'FocusAPI', operation: 'deleteFocusSession', data: { id } }
  );
}
