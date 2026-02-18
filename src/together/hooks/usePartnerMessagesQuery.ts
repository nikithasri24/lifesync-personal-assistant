/**
 * Partner Messages React Query Hooks
 * Manage personal letters and messages with reveal triggers
 */

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import { parseToLifeSyncError, getUserErrorMessage, AuthenticationError } from '@/lib/errors';
import { useToast } from '@/hooks/useToast';
import {
  getPartnerMessages,
  getPendingMessageReveals,
  getPartnerMessage,
} from '../api/messagesAPI';
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
  infinite: (filters?: MessageFilters) => [...partnerMessageKeys.all, 'infinite', filters] as const,
  pending: () => [...partnerMessageKeys.all, 'pending'] as const,
  detail: (id: string) => [...partnerMessageKeys.all, id] as const,
};

// =====================================================
// QUERIES
// =====================================================

/**
 * Get all partner messages with optional filters
 * Uses API layer which automatically handles merged mode
 */
export function usePartnerMessages(filters?: MessageFilters) {
  return useQuery({
    queryKey: partnerMessageKeys.list(filters),
    queryFn: () => getPartnerMessages(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get partner messages with infinite scroll/pagination
 * Uses API layer which automatically handles merged mode
 */
export function useInfinitePartnerMessages(filters?: MessageFilters) {
  const PAGE_SIZE = 20;

  return useInfiniteQuery({
    queryKey: partnerMessageKeys.infinite(filters),
    queryFn: async ({ pageParam = 0 }): Promise<PartnerMessage[]> => {
      logger.debug('Together', 'Fetching partner messages (paginated)', {
        filters,
        offset: pageParam,
        limit: PAGE_SIZE,
      });

      // Fetch all messages using API (includes merged mode support)
      const allMessages = await getPartnerMessages(filters);

      // Client-side pagination
      const start = pageParam;
      const end = start + PAGE_SIZE;
      const page = allMessages.slice(start, end);

      logger.debug('Together', 'Partner messages fetched (paginated)', {
        count: page.length,
        offset: pageParam,
      });

      return page;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If last page has fewer items than PAGE_SIZE, we've reached the end
      if (lastPage.length < PAGE_SIZE) {
        return undefined;
      }
      // Return the offset for the next page
      return allPages.length * PAGE_SIZE;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get pending message reveals (messages awaiting trigger)
 * Uses API layer which automatically handles merged mode
 */
export function usePendingMessageReveals() {
  return useQuery({
    queryKey: partnerMessageKeys.pending(),
    queryFn: () => getPendingMessageReveals(),
    staleTime: 1 * 60 * 1000, // 1 minute (check frequently for reveals)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get single message by ID
 * Uses API layer which automatically handles merged mode
 */
export function usePartnerMessage(id: string) {
  return useQuery({
    queryKey: partnerMessageKeys.detail(id),
    queryFn: () => getPartnerMessage(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
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
  const { showToast } = useToast();

  return useMutation({
    mutationFn: async (message: CreatePartnerMessageRequest): Promise<PartnerMessage> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new AuthenticationError('Not authenticated');
      }

      // Build the insert payload explicitly
      const insertPayload = {
        sender_id: user.id,
        recipient_id: message.recipient_id,
        connection_id: message.connection_id,
        title: message.title,
        message_body: message.message_body,
        reveal_trigger: message.reveal_trigger,
        reveal_date: message.reveal_date,
        achievement_id: message.achievement_id,
        photo_urls: message.photo_urls || null,
        video_url: message.video_url || null,
        background_music_url: message.background_music_url || null,
        status: message.status || 'draft',
      };

      logger.debug('Together', 'Creating partner message', {
        trigger: message.reveal_trigger,
        payload: insertPayload,
      });

      const { data, error } = await supabase
        .from('partner_messages')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        logger.error('Together', 'Failed to create partner message', {
          error,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          payload: insertPayload,
        });
        throw parseToLifeSyncError(error);
      }

      logger.info('Together', 'Partner message created', { id: data.id });
      return data;
    },
    onSuccess: () => {
      showToast('Message created successfully!', 'success');
      // Invalidate lists and infinite queries, not detail queries
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.pending() });
      void queryClient.invalidateQueries({ queryKey: [...partnerMessageKeys.all, 'infinite'] });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'createPartnerMessage' });
    },
  });
}

/**
 * Update existing partner message
 */
export function useUpdatePartnerMessage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
      showToast('Message updated successfully!', 'success');
      // Update specific item in cache
      queryClient.setQueryData(partnerMessageKeys.detail(data.id), data);
      // Invalidate lists and infinite queries (detail query already updated)
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.pending() });
      void queryClient.invalidateQueries({ queryKey: [...partnerMessageKeys.all, 'infinite'] });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'updatePartnerMessage' });
    },
  });
}

/**
 * Mark message as revealed
 */
export function useRevealMessage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
    onMutate: async (messageId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: partnerMessageKeys.detail(messageId) });
      await queryClient.cancelQueries({ queryKey: partnerMessageKeys.lists() });
      await queryClient.cancelQueries({ queryKey: partnerMessageKeys.pending() });

      // Snapshot previous value
      const previousMessage = queryClient.getQueryData<PartnerMessage>(
        partnerMessageKeys.detail(messageId)
      );

      const revealedAt = new Date().toISOString();

      // Optimistically update detail query
      if (previousMessage) {
        queryClient.setQueryData<PartnerMessage>(
          partnerMessageKeys.detail(messageId),
          {
            ...previousMessage,
            status: 'revealed',
            revealed_at: revealedAt,
          }
        );
      }

      // Optimistically update lists
      queryClient.setQueriesData<PartnerMessage[]>(
        { queryKey: partnerMessageKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: 'revealed', revealed_at: revealedAt }
              : msg
          );
        }
      );

      // Optimistically update pending reveals
      queryClient.setQueriesData<PartnerMessage[]>(
        { queryKey: partnerMessageKeys.pending() },
        (old) => {
          if (!old) return old;
          // Remove from pending list
          return old.filter((msg) => msg.id !== messageId);
        }
      );

      return { previousMessage };
    },
    onSuccess: (data) => {
      showToast('Message revealed!', 'success');
      // Update specific item in cache with server data
      queryClient.setQueryData(partnerMessageKeys.detail(data.id), data);
      // Invalidate lists and infinite queries
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.pending() });
      void queryClient.invalidateQueries({ queryKey: [...partnerMessageKeys.all, 'infinite'] });
    },
    onError: (error, messageId, context) => {
      // Rollback on error
      if (context?.previousMessage) {
        queryClient.setQueryData(
          partnerMessageKeys.detail(messageId),
          context.previousMessage
        );
      }
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.pending() });

      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'revealMessage' });
    },
  });
}

/**
 * Mark message as read
 */
export function useMarkMessageRead() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
    onMutate: async (messageId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: partnerMessageKeys.detail(messageId) });
      await queryClient.cancelQueries({ queryKey: partnerMessageKeys.lists() });

      // Snapshot previous value
      const previousMessage = queryClient.getQueryData<PartnerMessage>(
        partnerMessageKeys.detail(messageId)
      );

      // Optimistically update detail query
      if (previousMessage) {
        queryClient.setQueryData<PartnerMessage>(
          partnerMessageKeys.detail(messageId),
          {
            ...previousMessage,
            status: 'read',
            read_at: new Date().toISOString(),
          }
        );
      }

      // Optimistically update lists
      queryClient.setQueriesData<PartnerMessage[]>(
        { queryKey: partnerMessageKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((msg) =>
            msg.id === messageId
              ? { ...msg, status: 'read', read_at: new Date().toISOString() }
              : msg
          );
        }
      );

      return { previousMessage };
    },
    onSuccess: (data) => {
      showToast('Message marked as read', 'success');
      // Update specific item in cache with server data
      queryClient.setQueryData(partnerMessageKeys.detail(data.id), data);
      // Invalidate lists and infinite queries
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: [...partnerMessageKeys.all, 'infinite'] });
    },
    onError: (error, messageId, context) => {
      // Rollback on error
      if (context?.previousMessage) {
        queryClient.setQueryData(
          partnerMessageKeys.detail(messageId),
          context.previousMessage
        );
      }
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.lists() });

      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'markMessageRead' });
    },
  });
}

/**
 * Delete partner message
 */
export function useDeletePartnerMessage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

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
    onSuccess: (_, id) => {
      showToast('Message deleted', 'success');
      // Remove from cache
      queryClient.removeQueries({ queryKey: partnerMessageKeys.detail(id) });
      // Invalidate lists and infinite queries
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.lists() });
      void queryClient.invalidateQueries({ queryKey: partnerMessageKeys.pending() });
      void queryClient.invalidateQueries({ queryKey: [...partnerMessageKeys.all, 'infinite'] });
    },
    onError: (error) => {
      const message = getUserErrorMessage(error);
      showToast(message, 'error');
      logger.error('Together', error as Error, { operation: 'deletePartnerMessage' });
    },
  });
}
