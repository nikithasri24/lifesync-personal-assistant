/**
 * Partner Messages API
 * CRUD operations for partner messages with reveal triggers and merged mode support
 */

import { supabase } from '@/lib/supabase';
import { apiCall, requireAuth } from '@/api/apiWrapper';
import { parseToLifeSyncError } from '@/lib/errors';
import { logger } from '@/services/logger';
import { getTogetherMergedConnection } from '../hooks/useTogetherMergedMode';
import type {
  PartnerMessage,
  CreatePartnerMessageRequest,
  UpdatePartnerMessageRequest,
  MessageFilters,
} from '../types';

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all partner messages with optional filters (supports merged mode)
 */
export async function getPartnerMessages(filters?: MessageFilters): Promise<PartnerMessage[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      // Check for merged connection
      const mergedConnection = await getTogetherMergedConnection('messages');

      let query = supabase
        .from('partner_messages')
        .select('*')
        .order('created_at', { ascending: false });

      // If merged mode, get messages involving both users
      // Otherwise, just get current user's sent/received messages
      if (mergedConnection) {
        logger.debug('Together', 'Merged mode enabled - fetching messages for both users');
        query = query.or(
          `sender_id.eq.${user.id},recipient_id.eq.${user.id},sender_id.eq.${mergedConnection.partnerId},recipient_id.eq.${mergedConnection.partnerId}`
        );
      } else {
        query = query.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);
      }

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.is_sent) {
        query = query.eq('sender_id', user.id);
      }
      if (filters?.is_received) {
        query = query.eq('recipient_id', user.id);
      }
      if (filters?.trigger) {
        query = query.eq('reveal_trigger', filters.trigger);
      }

      const { data, error } = await query;

      if (error) throw parseToLifeSyncError(error);

      return data || [];
    },
    { domain: 'Together', operation: 'getPartnerMessages' }
  );
}

/**
 * Get pending message reveals (messages awaiting trigger)
 */
export async function getPendingMessageReveals(): Promise<PartnerMessage[]> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('pending_message_reveals')
        .select('*')
        .eq('recipient_id', user.id);

      if (error) throw parseToLifeSyncError(error);

      return data || [];
    },
    { domain: 'Together', operation: 'getPendingMessageReveals' }
  );
}

/**
 * Get single message by ID
 */
export async function getPartnerMessage(id: string): Promise<PartnerMessage | null> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('partner_messages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw parseToLifeSyncError(error);

      return data;
    },
    { domain: 'Together', operation: 'getPartnerMessage', data: { id } }
  );
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new partner message
 */
export async function createPartnerMessage(
  message: CreatePartnerMessageRequest
): Promise<PartnerMessage> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const insertPayload = {
        sender_id: user.id,
        recipient_id: message.recipient_id,
        connection_id: message.connection_id,
        title: message.title,
        message_body: message.message_body,
        reveal_trigger: message.reveal_trigger,
        reveal_date: message.reveal_date || null,
        achievement_id: message.achievement_id || null,
        photo_urls: message.photo_urls || null,
        video_url: message.video_url || null,
        background_music_url: message.background_music_url || null,
        status: message.status || 'draft',
      };

      logger.debug('Together', 'Creating partner message', {
        trigger: message.reveal_trigger,
      });

      const { data, error } = await supabase
        .from('partner_messages')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to create partner message', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Partner message created', { id: data.id });
      return data;
    },
    { domain: 'Together', operation: 'createPartnerMessage' }
  );
}

/**
 * Update existing partner message
 */
export async function updatePartnerMessage(
  id: string,
  updates: Partial<CreatePartnerMessageRequest>
): Promise<PartnerMessage> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('partner_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to update partner message', { error, id });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Partner message updated', { id });
      return data;
    },
    { domain: 'Together', operation: 'updatePartnerMessage', data: { id } }
  );
}

/**
 * Reveal a scheduled message (change status from scheduled to revealed)
 */
export async function revealMessage(id: string): Promise<PartnerMessage> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('partner_messages')
        .update({
          status: 'revealed',
          revealed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to reveal message', { error, id });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Message revealed', { id });
      return data;
    },
    { domain: 'Together', operation: 'revealMessage', data: { id } }
  );
}

/**
 * Mark message as read
 */
export async function markMessageRead(id: string): Promise<PartnerMessage> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { data, error } = await supabase
        .from('partner_messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to mark message as read', { error, id });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Message marked as read', { id });
      return data;
    },
    { domain: 'Together', operation: 'markMessageRead', data: { id } }
  );
}

/**
 * Delete partner message
 */
export async function deletePartnerMessage(id: string): Promise<void> {
  return apiCall(
    async () => {
      const user = await requireAuth();

      const { error } = await supabase
        .from('partner_messages')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Together', 'Failed to delete partner message', { error, id });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Partner message deleted', { id });
    },
    { domain: 'Together', operation: 'deletePartnerMessage', data: { id } }
  );
}
