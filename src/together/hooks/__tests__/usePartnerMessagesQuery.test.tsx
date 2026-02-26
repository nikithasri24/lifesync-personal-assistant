/**
 * Unit tests for usePartnerMessagesQuery hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  usePartnerMessages,
  useInfinitePartnerMessages,
  usePendingMessageReveals,
  usePartnerMessage,
  useCreatePartnerMessage,
  useUpdatePartnerMessage,
  useRevealMessage,
  useMarkMessageRead,
  useDeletePartnerMessage,
} from '../usePartnerMessagesQuery';
import * as messagesAPI from '../../api/messagesAPI';
import { supabase } from '@/lib/supabase';
import type { PartnerMessage, MessageFilters } from '../../types';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('../../api/messagesAPI');
vi.mock('@/services/logger');
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('usePartnerMessagesQuery', () => {
  let queryClient: QueryClient;

  const mockUser = { id: 'user-123' };
  const mockMessage: PartnerMessage = {
    id: 'message-1',
    sender_id: 'user-123',
    recipient_id: 'user-456',
    connection_id: 'conn-1',
    title: 'Love Note',
    message_body: 'You are amazing!',
    reveal_trigger: 'manual',
    status: 'sent',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: mockUser as any },
      error: null,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('usePartnerMessages', () => {
    it('should fetch messages successfully', async () => {
      const mockMessages = [mockMessage];
      vi.mocked(messagesAPI.getPartnerMessages).mockResolvedValue(mockMessages);

      const { result } = renderHook(() => usePartnerMessages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMessages);
      expect(messagesAPI.getPartnerMessages).toHaveBeenCalledWith(undefined);
    });

    it('should fetch messages with filters', async () => {
      const filters: MessageFilters = { status: 'sent' };
      vi.mocked(messagesAPI.getPartnerMessages).mockResolvedValue([]);

      const { result } = renderHook(() => usePartnerMessages(filters), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(messagesAPI.getPartnerMessages).toHaveBeenCalledWith(filters);
    });

    it('should handle fetch error', async () => {
      const mockError = new Error('Failed to fetch messages');
      vi.mocked(messagesAPI.getPartnerMessages).mockRejectedValue(mockError);

      const { result } = renderHook(() => usePartnerMessages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useInfinitePartnerMessages', () => {
    it('should fetch first page of messages', async () => {
      const mockMessages = Array.from({ length: 20 }, (_, i) => ({
        ...mockMessage,
        id: `message-${i}`,
      }));
      vi.mocked(messagesAPI.getPartnerMessages).mockResolvedValue(mockMessages);

      const { result } = renderHook(() => useInfinitePartnerMessages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.pages[0]).toHaveLength(20);
    });

    it('should load more pages when hasNextPage is true', async () => {
      const mockMessages = Array.from({ length: 25 }, (_, i) => ({
        ...mockMessage,
        id: `message-${i}`,
      }));
      vi.mocked(messagesAPI.getPartnerMessages).mockResolvedValue(mockMessages);

      const { result } = renderHook(() => useInfinitePartnerMessages(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.hasNextPage).toBe(true);

      result.current.fetchNextPage();

      await waitFor(() => {
        expect(result.current.data?.pages).toHaveLength(2);
      });

      expect(result.current.data?.pages[1]).toHaveLength(5); // Remaining 5 items
    });
  });

  describe('usePendingMessageReveals', () => {
    it('should fetch pending message reveals', async () => {
      const mockPending = [{ ...mockMessage, status: 'pending' as const }];
      vi.mocked(messagesAPI.getPendingMessageReveals).mockResolvedValue(mockPending);

      const { result } = renderHook(() => usePendingMessageReveals(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockPending);
      expect(messagesAPI.getPendingMessageReveals).toHaveBeenCalled();
    });
  });

  describe('usePartnerMessage', () => {
    it('should fetch single message by ID', async () => {
      vi.mocked(messagesAPI.getPartnerMessage).mockResolvedValue(mockMessage);

      const { result } = renderHook(() => usePartnerMessage('message-1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockMessage);
      expect(messagesAPI.getPartnerMessage).toHaveBeenCalledWith('message-1');
    });

    it('should not fetch when ID is empty', () => {
      const { result } = renderHook(() => usePartnerMessage(''), { wrapper });

      expect(result.current.isFetching).toBe(false);
    });
  });

  describe('useCreatePartnerMessage', () => {
    it('should create message successfully', async () => {
      const newMessage = {
        recipient_id: 'user-456',
        connection_id: 'conn-1',
        title: 'New Message',
        message_body: 'Hello!',
        reveal_trigger: 'manual' as const,
      };

      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useCreatePartnerMessage(), { wrapper });

      result.current.mutate(newMessage);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_id: mockUser.id,
          recipient_id: newMessage.recipient_id,
          title: newMessage.title,
          message_body: newMessage.message_body,
          reveal_trigger: newMessage.reveal_trigger,
        })
      );
      expect(result.current.data).toEqual(mockMessage);
    });

    it('should handle authentication error', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useCreatePartnerMessage(), { wrapper });

      result.current.mutate({
        recipient_id: 'user-456',
        connection_id: 'conn-1',
        title: 'Test',
        message_body: 'Test',
        reveal_trigger: 'manual',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error?.message).toContain('Not authenticated');
    });

    it('should invalidate queries on success', async () => {
      const mockSupabaseChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreatePartnerMessage(), { wrapper });

      result.current.mutate({
        recipient_id: 'user-456',
        connection_id: 'conn-1',
        title: 'Test',
        message_body: 'Test',
        reveal_trigger: 'manual',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['partner-messages', 'list'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['partner-messages', 'pending'] })
      );
    });
  });

  describe('useUpdatePartnerMessage', () => {
    it('should update message successfully', async () => {
      const updates = { title: 'Updated Title' };
      const updated = { ...mockMessage, ...updates };

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updated, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useUpdatePartnerMessage(), { wrapper });

      result.current.mutate({ id: 'message-1', ...updates });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(updates);
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'message-1');
      expect(result.current.data).toEqual(updated);
    });
  });

  describe('useRevealMessage', () => {
    it('should reveal message successfully', async () => {
      const revealed = {
        ...mockMessage,
        status: 'revealed' as const,
        revealed_at: expect.any(String),
      };

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: revealed, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useRevealMessage(), { wrapper });

      result.current.mutate('message-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revealed',
          revealed_at: expect.any(String),
        })
      );
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'message-1');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('recipient_id', mockUser.id);
    });

    it('should optimistically update cache', async () => {
      // Seed cache
      queryClient.setQueryData(['partner-messages', 'message-1'], mockMessage);

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockMessage, status: 'revealed', revealed_at: '2024-01-02T00:00:00Z' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useRevealMessage(), { wrapper });

      result.current.mutate('message-1');

      // Check optimistic update - wait for onMutate to complete
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<PartnerMessage>([
          'partner-messages',
          'message-1',
        ]);
        expect(cachedData?.status).toBe('revealed');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('should rollback on error', async () => {
      // Seed cache
      queryClient.setQueryData(['partner-messages', 'message-1'], mockMessage);

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Reveal failed' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useRevealMessage(), { wrapper });

      result.current.mutate('message-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check rollback
      const cachedData = queryClient.getQueryData<PartnerMessage>([
        'partner-messages',
        'message-1',
      ]);
      expect(cachedData?.status).toBe('sent'); // Original value
    });
  });

  describe('useMarkMessageRead', () => {
    it('should mark message as read successfully', async () => {
      const read = {
        ...mockMessage,
        status: 'read' as const,
        read_at: expect.any(String),
      };

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: read, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useMarkMessageRead(), { wrapper });

      result.current.mutate('message-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'read',
          read_at: expect.any(String),
        })
      );
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'message-1');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('recipient_id', mockUser.id);
    });

    it('should optimistically update cache', async () => {
      // Seed cache
      queryClient.setQueryData(['partner-messages', 'message-1'], {
        ...mockMessage,
        status: 'revealed',
      });

      const mockSupabaseChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { ...mockMessage, status: 'read', read_at: '2024-01-02T00:00:00Z' },
          error: null,
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useMarkMessageRead(), { wrapper });

      result.current.mutate('message-1');

      // Check optimistic update - wait for onMutate to complete
      await waitFor(() => {
        const cachedData = queryClient.getQueryData<PartnerMessage>([
          'partner-messages',
          'message-1',
        ]);
        expect(cachedData?.status).toBe('read');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('useDeletePartnerMessage', () => {
    it('should delete message successfully', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      // Second eq call should return the result
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain).mockResolvedValueOnce({ error: null });

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useDeletePartnerMessage(), { wrapper });

      result.current.mutate('message-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockSupabaseChain.delete).toHaveBeenCalled();
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('id', 'message-1');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('sender_id', mockUser.id);
    });

    it('should remove from cache and invalidate queries on success', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      };

      // Second eq call should return the result
      mockSupabaseChain.eq.mockReturnValueOnce(mockSupabaseChain).mockResolvedValueOnce({ error: null });

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      // Seed cache
      queryClient.setQueryData(['partner-messages', 'message-1'], mockMessage);
      const removeSpy = vi.spyOn(queryClient, 'removeQueries');
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeletePartnerMessage(), { wrapper });

      result.current.mutate('message-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(removeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['partner-messages', 'message-1'] })
      );
      expect(invalidateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['partner-messages', 'list'] })
      );
    });

    it('should handle delete error', async () => {
      const mockSupabaseChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const { result } = renderHook(() => useDeletePartnerMessage(), { wrapper });

      result.current.mutate('message-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });
});
