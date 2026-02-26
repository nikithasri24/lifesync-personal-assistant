/**
 * Unit tests for messagesAPI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getPartnerMessages,
  getPendingMessageReveals,
  getPartnerMessage,
  createPartnerMessage,
  updatePartnerMessage,
  revealMessage,
  markMessageRead,
  deletePartnerMessage,
} from '../messagesAPI';
import { supabase } from '@/lib/supabase';
import type { PartnerMessage, MessageFilters } from '../../types';
import { requireAuth } from '@/api/apiWrapper';
import { getTogetherMergedConnection } from '../../hooks/useTogetherMergedMode';

// Mock dependencies
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

vi.mock('@/api/apiWrapper', () => ({
  apiCall: vi.fn((fn) => fn()),
  requireAuth: vi.fn(),
}));

vi.mock('../../hooks/useTogetherMergedMode', () => ({
  getTogetherMergedConnection: vi.fn(),
}));

vi.mock('@/services/logger');

describe('messagesAPI', () => {
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
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue(mockUser);
  });

  describe('getPartnerMessages', () => {
    it('should fetch messages for current user', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [mockMessage], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getPartnerMessages();

      expect(result).toEqual([mockMessage]);
      expect(supabase.from).toHaveBeenCalledWith('partner_messages');
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('sender_id.eq.user-123')
      );
    });

    it('should fetch messages for both users in merged mode', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue({
        connectionId: 'conn-1',
        partnerId: 'user-456',
      });

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: [mockMessage], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getPartnerMessages();

      expect(result).toEqual([mockMessage]);
      expect(mockQuery.or).toHaveBeenCalledWith(
        expect.stringContaining('sender_id.eq.user-456')
      );
    });

    it('should apply status filter', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockMessage], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MessageFilters = { status: 'sent' };
      await getPartnerMessages(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'sent');
    });

    it('should apply is_sent filter', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockMessage], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MessageFilters = { is_sent: true };
      await getPartnerMessages(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('sender_id', mockUser.id);
    });

    it('should apply is_received filter', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockMessage], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MessageFilters = { is_received: true };
      await getPartnerMessages(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('recipient_id', mockUser.id);
    });

    it('should apply trigger filter', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockMessage], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const filters: MessageFilters = { trigger: 'specific_date' };
      await getPartnerMessages(filters);

      expect(mockQuery.eq).toHaveBeenCalledWith('reveal_trigger', 'specific_date');
    });

    it('should handle errors', async () => {
      vi.mocked(getTogetherMergedConnection).mockResolvedValue(null);

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getPartnerMessages()).rejects.toThrow();
    });
  });

  describe('getPendingMessageReveals', () => {
    it('should fetch pending reveals for current user', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: [mockMessage], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getPendingMessageReveals();

      expect(result).toEqual([mockMessage]);
      expect(supabase.from).toHaveBeenCalledWith('pending_message_reveals');
      expect(mockQuery.eq).toHaveBeenCalledWith('recipient_id', mockUser.id);
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: 'View error' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getPendingMessageReveals()).rejects.toThrow();
    });
  });

  describe('getPartnerMessage', () => {
    it('should fetch single message by ID', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getPartnerMessage('message-1');

      expect(result).toEqual(mockMessage);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'message-1');
    });

    it('should return null when message not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await getPartnerMessage('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(getPartnerMessage('message-1')).rejects.toThrow();
    });
  });

  describe('createPartnerMessage', () => {
    it('should create a new partner message', async () => {
      const newMessage = {
        recipient_id: 'user-456',
        connection_id: 'conn-1',
        title: 'New Message',
        message_body: 'Hello!',
        reveal_trigger: 'manual' as const,
      };

      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockMessage, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await createPartnerMessage(newMessage);

      expect(result).toEqual(mockMessage);
      expect(mockQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          sender_id: mockUser.id,
          recipient_id: newMessage.recipient_id,
          title: newMessage.title,
          message_body: newMessage.message_body,
          reveal_trigger: newMessage.reveal_trigger,
        })
      );
    });

    it('should handle errors', async () => {
      const mockQuery = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(createPartnerMessage({
        recipient_id: 'user-456',
        connection_id: 'conn-1',
        title: 'Test',
        message_body: 'Test',
        reveal_trigger: 'manual',
      })).rejects.toThrow();
    });
  });

  describe('updatePartnerMessage', () => {
    it('should update an existing message', async () => {
      const updates = { title: 'Updated Title' };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { ...mockMessage, ...updates }, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await updatePartnerMessage('message-1', updates);

      expect(result.title).toBe('Updated Title');
      expect(mockQuery.update).toHaveBeenCalledWith(updates);
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'message-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(updatePartnerMessage('message-1', { title: 'Test' })).rejects.toThrow();
    });
  });

  describe('revealMessage', () => {
    it('should reveal a message', async () => {
      const revealedMessage = { ...mockMessage, status: 'revealed' as const, revealed_at: expect.any(String) };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: revealedMessage, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await revealMessage('message-1');

      expect(result.status).toBe('revealed');
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'revealed',
          revealed_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'message-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Reveal failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(revealMessage('message-1')).rejects.toThrow();
    });
  });

  describe('markMessageRead', () => {
    it('should mark a message as read', async () => {
      const readMessage = { ...mockMessage, status: 'read' as const, read_at: expect.any(String) };

      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: readMessage, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      const result = await markMessageRead('message-1');

      expect(result.status).toBe('read');
      expect(mockQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'read',
          read_at: expect.any(String),
        })
      );
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'message-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Mark read failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(markMessageRead('message-1')).rejects.toThrow();
    });
  });

  describe('deletePartnerMessage', () => {
    it('should delete a message', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await deletePartnerMessage('message-1');

      expect(mockQuery.delete).toHaveBeenCalled();
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'message-1');
    });

    it('should handle errors', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQuery as any);

      await expect(deletePartnerMessage('message-1')).rejects.toThrow();
    });
  });
});
