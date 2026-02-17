/**
 * Partner Messages React Query Hooks
 * Manage personal letters and messages with reveal triggers
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, AuthenticationError } from '@/lib/errors';
import type {
  PartnerMessage,
  CreatePartnerMessageRequest,
  UpdatePartnerMessageRequest,
  MessageFilters,
} from '../types';

// =====================================================
// QUERY KEYS
// =====================================================

export const partnerMessageKeys = {
  all: ['partner-messages'] as const,
  lists: () => [...partnerMessageKeys.all, 'list'] as const,
  list: (filters?: MessageFilters) => [...partnerMessageKeys.lists(), filters] as const,
  pending: () => [...partnerMessageKeys.all, 'pending'] as const,
  detail: (id: string) => [...partnerMessageKeys.all, id] as const,
};

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all partner messages with optional filters
 */
export function usePartnerMessages(filters?: MessageFilters) {
  return useQuery({
    queryKey: partnerMessageKeys.list(filters),
    queryFn: async (): Promise<PartnerMessage[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching partner messages', { filters });

      let query = supabase
        .from('partner_messages')
        .select('*')
        .order('created_at', { ascending: false });

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

      if (error) {
        logger.error('Together', 'Failed to fetch partner messages', { error });
        throw parseToLifeSyncError(error);
      }

      logger.debug('Together', 'Partner messages fetched', { count: data?.length || 0 });
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get pending message reveals (messages awaiting trigger)
 */
export function usePendingMessageReveals() {
  return useQuery({
    queryKey: partnerMessageKeys.pending(),
    queryFn: async (): Promise<PartnerMessage[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching pending message reveals');

      const { data, error } = await supabase
        .from('pending_message_reveals')
        .select('*')
        .eq('recipient_id', user.id);

      if (error) {
        logger.error('Together', 'Failed to fetch pending reveals', { error });
        throw parseToLifeSyncError(error);
      }

      logger.debug('Together', 'Pending reveals fetched', { count: data?.length || 0 });
      return data || [];
    },
    staleTime: 1 * 60 * 1000, // 1 minute (check frequently for reveals)
  });
}

/**
 * Get single message by ID
 */
export function usePartnerMessage(id: string) {
  return useQuery({
    queryKey: partnerMessageKeys.detail(id),
    queryFn: async (): Promise<PartnerMessage | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Fetching partner message', { id });

      const { data, error } = await supabase
        .from('partner_messages')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        logger.error('Together', 'Failed to fetch partner message', { error });
        throw parseToLifeSyncError(error);
      }

      return data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// =====================================================
// MUTATIONS
// =====================================================

/**
 * Create new partner message
 */
export function useCreatePartnerMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: CreatePartnerMessageRequest): Promise<PartnerMessage> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Creating partner message', {
        trigger: message.reveal_trigger,
      });

      const { data, error } = await supabase
        .from('partner_messages')
        .insert({
          sender_id: user.id,
          ...message,
          status: message.status || 'draft',
        })
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to create partner message', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Partner message created', { id: data.id });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.all });
    },
  });
}

/**
 * Update existing partner message
 */
export function useUpdatePartnerMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: UpdatePartnerMessageRequest): Promise<PartnerMessage> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Updating partner message', { id });

      const { data, error } = await supabase
        .from('partner_messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to update partner message', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Partner message updated', { id });
      return data;
    },
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.all });
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.detail(data.id) });
    },
  });
}

/**
 * Mark message as revealed
 */
export function useRevealMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string): Promise<PartnerMessage> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Revealing message', { messageId });

      const { data, error } = await supabase
        .from('partner_messages')
        .update({
          status: 'revealed',
          revealed_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('recipient_id', user.id) // Only recipient can reveal
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to reveal message', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Message revealed', { messageId });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.all });
    },
  });
}

/**
 * Mark message as read
 */
export function useMarkMessageRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string): Promise<PartnerMessage> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Marking message as read', { messageId });

      const { data, error } = await supabase
        .from('partner_messages')
        .update({
          status: 'read',
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .eq('recipient_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to mark message as read', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Message marked as read', { messageId });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.all });
    },
  });
}

/**
 * Delete partner message
 */
export function useDeletePartnerMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      logger.debug('Together', 'Deleting partner message', { id });

      const { error } = await supabase
        .from('partner_messages')
        .delete()
        .eq('id', id)
        .eq('sender_id', user.id); // Only sender can delete

      if (error) {
        logger.error('Together', 'Failed to delete partner message', { error });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Partner message deleted', { id });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.all });
    },
  });
}
