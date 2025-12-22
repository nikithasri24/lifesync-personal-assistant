/**
 * Notification API
 * Operations for notification queue with Supabase
 */

import { supabase } from '../lib/supabase';
import { apiCall, requireAuth } from './apiWrapper';

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
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase.from('notification_queue').insert({
        user_id: user.id,
        ...notification,
      });

      if (error) throw error;
    },
    { domain: 'NotificationAPI', operation: 'queueNotification', data: { type: notification.type } }
  );
}

