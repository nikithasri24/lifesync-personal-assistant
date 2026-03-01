/**
 * Conversations Query Hooks
 * React Query hooks for AI conversation management
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '@/lib/react-query';
import {
  getConversations,
  getPagedConversations,
  getConversation,
  createConversation,
  updateConversation,
  deleteConversation,
  addMessageToConversation,
} from '@/api/conversationsAPI';
import type { Conversation, ConversationMessage } from '@/types/infrastructure';
import { logger } from '@/services/logger';
import { DEFAULT_PAGE_SIZE, type PaginatedResult } from '@/types/pagination';

/**
 * Query: Get all conversations
 */
export function useConversations(filters?: {
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return useQuery({
    queryKey: queryKeys.conversations.list(filters),
    queryFn: () => getConversations(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Query: Get paginated list of conversations.
 * Replaces the soft limit: true pagination with keepPreviousData.
 */
export function usePagedConversations(
  filters?: { startDate?: Date; endDate?: Date },
  page = 1
): ReturnType<typeof useQuery<PaginatedResult<Conversation>>> {
  return useQuery<PaginatedResult<Conversation>>({
    queryKey: queryKeys.conversations.list({ ...filters, page } as Record<string, unknown>),
    queryFn: () => getPagedConversations(filters, { page, pageSize: DEFAULT_PAGE_SIZE }),
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });
}

/**
 * Query: Get single conversation
 */
export function useConversation(id: string) {
  return useQuery({
    queryKey: queryKeys.conversations.detail(id),
    queryFn: () => getConversation(id),
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Mutation: Create new conversation
 */
export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createConversation,
    onSuccess: (newConversation) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      logger.info('Conversations', 'Created new conversation', {
        conversationId: newConversation.id,
      });
    },
    onError: (error) => {
      logger.error('Conversations', error as Error, {
        context: 'Failed to create conversation',
      });
    },
  });
}

/**
 * Mutation: Update conversation
 */
export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => updateConversation(id, updates),
    onSuccess: (updatedConversation) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.detail(updatedConversation.id) });
      logger.info('Conversations', 'Updated conversation', {
        conversationId: updatedConversation.id,
      });
    },
    onError: (error) => {
      logger.error('Conversations', error as Error, {
        context: 'Failed to update conversation',
      });
    },
  });
}

/**
 * Mutation: Delete conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteConversation,
    onSuccess: (_, conversationId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      void queryClient.removeQueries({ queryKey: queryKeys.conversations.detail(conversationId) });
      logger.info('Conversations', 'Deleted conversation', {
        conversationId,
      });
    },
    onError: (error) => {
      logger.error('Conversations', error as Error, {
        context: 'Failed to delete conversation',
      });
    },
  });
}

/**
 * Mutation: Send message (add to conversation)
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, message }) => addMessageToConversation(conversationId, message),
    onMutate: async ({ conversationId, message }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: queryKeys.conversations.detail(conversationId) });

      // Snapshot previous value
      const previousConversation = queryClient.getQueryData<Conversation>(queryKeys.conversations.detail(conversationId));

      // Optimistically update conversation
      if (previousConversation) {
        queryClient.setQueryData<Conversation>(queryKeys.conversations.detail(conversationId), {
          ...previousConversation,
          messages: [...(previousConversation.messages || []), message],
        });
      }

      return { previousConversation };
    },
    onSuccess: (updatedConversation) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });
      void queryClient.setQueryData(queryKeys.conversations.detail(updatedConversation.id), updatedConversation);
      logger.info('Conversations', 'Sent message', {
        conversationId: updatedConversation.id,
        messageRole: updatedConversation.messages?.[updatedConversation.messages.length - 1]?.role,
      });
    },
    onError: (error, { conversationId }, context) => {
      // Rollback on error
      if (context?.previousConversation) {
        queryClient.setQueryData(queryKeys.conversations.detail(conversationId), context.previousConversation);
      }
      logger.error('Conversations', error as Error, {
        context: 'Failed to send message',
        conversationId,
      });
    },
  });
}
