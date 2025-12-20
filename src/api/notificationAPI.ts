/**
 * Notification API
 * Operations for notification queue with Supabase
 */

import { supabase } from '../lib/supabase';

export interface NotificationQueueItem {
  id?: string;
  user_id: string;
  type: string;
  priority: 'low' | 'normal' | 'high';
  payload: Record<string, unknown>;
  scheduled_for: string;
  sent_at?: string;
  created_at?: string;
}

/**
 * Queue a notification
 */
export async function queueNotification(
  notification: Omit<NotificationQueueItem, 'id' | 'user_id' | 'created_at' | 'sent_at'>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('notification_queue').insert({
    user_id: user.id,
    ...notification,
  });

  if (error) throw error;
}

