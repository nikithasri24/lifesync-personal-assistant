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
  status?: 'pending' | 'sent' | 'cancelled';
  sent_at?: string;
  created_at?: string;
}

/**
 * Queue a notification
 */
export async function queueNotification(
  notification: Omit<NotificationQueueItem, 'id' | 'user_id' | 'created_at' | 'sent_at' | 'status'>
): Promise<{ id: string }> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('notification_queue')
        .insert({
          user_id: user.id,
          status: 'pending',
          ...notification,
        })
        .select('id')
        .single();

      if (error) throw error;
      return { id: data.id };
    },
    { domain: 'NotificationAPI', operation: 'queueNotification', data: { type: notification.type } }
  );
}

/**
 * Get upcoming reminders (pending notifications)
 */
export async function getUpcomingReminders(): Promise<NotificationQueueItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as NotificationQueueItem[];
    },
    { domain: 'NotificationAPI', operation: 'getUpcomingReminders' }
  );
}

/**
 * Get due reminders (notifications scheduled for now or earlier)
 */
export async function getDueReminders(): Promise<NotificationQueueItem[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('notification_queue')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .lte('scheduled_for', new Date().toISOString())
        .order('scheduled_for', { ascending: true });

      if (error) throw error;
      return data as NotificationQueueItem[];
    },
    { domain: 'NotificationAPI', operation: 'getDueReminders' }
  );
}

/**
 * Cancel a reminder
 */
export async function cancelReminder(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('notification_queue')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'NotificationAPI', operation: 'cancelReminder', data: { id } }
  );
}

/**
 * Mark a reminder as sent
 */
export async function markReminderSent(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('notification_queue')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    { domain: 'NotificationAPI', operation: 'markReminderSent', data: { id } }
  );
}
