/**
 * Push Subscriptions API
 * CRUD operations for push notification subscriptions
 */

import { supabase } from '../lib/supabase';

export interface PushSubscription {
  id?: string;
  user_id: string;
  endpoint: string;
  p256dh?: string;
  auth?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Upsert a push subscription
 */
export async function upsertPushSubscription(
  subscription: Omit<PushSubscription, 'id' | 'created_at' | 'updated_at'>
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      ...subscription,
      updated_at: new Date().toISOString(),
    });

  if (error) throw error;
}

/**
 * Deactivate a push subscription by endpoint
 */
export async function deactivatePushSubscription(
  endpoint: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .update({ 
      is_active: false,
      updated_at: new Date().toISOString(),
    })
    .eq('endpoint', endpoint)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get active push subscriptions for current user
 */
export async function getActivePushSubscriptions(): Promise<PushSubscription[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (error) throw error;
  return data as PushSubscription[];
}

