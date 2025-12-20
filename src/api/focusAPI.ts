/**
 * Focus Sessions API
 * CRUD operations for focus sessions with Supabase
 */

import { supabase } from '../lib/supabase';
import type { FocusSessionData } from '../services/types';

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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
}

/**
 * Get a single focus session by ID
 */
export async function getFocusSession(id: string): Promise<FocusSessionData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('focus_sessions')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) throw error;
  if (!data) throw new Error('Focus session not found');
  return data as FocusSessionData;
}

/**
 * Create a new focus session
 */
export async function createFocusSession(
  session: Omit<FocusSessionData, 'id' | 'created_at' | 'updated_at'>
): Promise<FocusSessionData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('focus_sessions')
    .insert({
      user_id: user.id,
      ...session,
      status: session.status ?? 'in-progress',
      started_at: session.started_at ?? new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create focus session');
  return data as FocusSessionData;
}

/**
 * Update a focus session
 */
export async function updateFocusSession(
  id: string,
  updates: Partial<FocusSessionData>
): Promise<FocusSessionData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('focus_sessions')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Focus session not found or update failed');
  return data as FocusSessionData;
}

/**
 * Delete a focus session
 */
export async function deleteFocusSession(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('focus_sessions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;
}
