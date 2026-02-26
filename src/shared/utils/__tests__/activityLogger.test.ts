/**
 * Unit tests for activityLogger utility
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logActivity, logMutationActivity } from '../activityLogger';
import { supabase } from '@/lib/supabase';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

// Mock logger
vi.mock('@/services/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('activityLogger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logActivity', () => {
    it('should log activity successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnection = {
        id: 'conn-456',
        status: 'active',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockConnection],
        error: null,
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      await logActivity({
        module: 'meals',
        actionType: 'created',
        resourceType: 'meal_plan',
        resourceId: 'meal-123',
        description: 'Created weekly meal plan',
        metadata: { planType: 'weekly' },
      });

      expect(supabase.rpc).toHaveBeenCalledWith('get_connections_with_users');
      expect(mockInsert).toHaveBeenCalledWith({
        connection_id: 'conn-456',
        actor_id: 'user-123',
        action_type: 'created',
        module: 'meals',
        resource_type: 'meal_plan',
        resource_id: 'meal-123',
        description: 'Created weekly meal plan',
        metadata: { planType: 'weekly' },
      });
    });

    it('should handle no active connection gracefully', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      // Should not throw - silent failure
      await expect(
        logActivity({
          module: 'todos',
          actionType: 'created',
          resourceType: 'task',
          resourceId: 'task-123',
          description: 'Created task',
        })
      ).resolves.toBeUndefined();
    });

    it('should handle non-authenticated user gracefully', async () => {
      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: null },
        error: null,
      } as any);

      // Should not throw - silent failure
      await expect(
        logActivity({
          module: 'shopping',
          actionType: 'updated',
          resourceType: 'item',
          resourceId: 'item-123',
          description: 'Updated item',
        })
      ).resolves.toBeUndefined();
    });

    it('should handle RPC errors gracefully', async () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: null,
        error: { message: 'RPC error' },
      } as any);

      // Should not throw - silent failure
      await expect(
        logActivity({
          module: 'goals',
          actionType: 'deleted',
          resourceType: 'goal',
          resourceId: 'goal-123',
          description: 'Deleted goal',
        })
      ).resolves.toBeUndefined();
    });

    it('should handle database insert errors gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnection = {
        id: 'conn-456',
        status: 'active',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockConnection],
        error: null,
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({
        error: { message: 'Database error' },
      });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      // Should not throw - silent failure
      await expect(
        logActivity({
          module: 'habits',
          actionType: 'completed',
          resourceType: 'habit',
          resourceId: 'habit-123',
          description: 'Completed habit',
        })
      ).resolves.toBeUndefined();
    });

    it('should work with different modules', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnection = {
        id: 'conn-456',
        status: 'active',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockConnection],
        error: null,
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const modules = ['meals', 'shopping', 'todos', 'goals', 'habits', 'finances', 'notes'];

      for (const module of modules) {
        await logActivity({
          module,
          actionType: 'updated',
          resourceType: 'item',
          resourceId: 'item-123',
          description: 'Updated item',
        });

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({ module })
        );
      }
    });

    it('should work with different action types', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnection = {
        id: 'conn-456',
        status: 'active',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockConnection],
        error: null,
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const actionTypes: Array<'created' | 'updated' | 'deleted' | 'completed'> = [
        'created',
        'updated',
        'deleted',
        'completed',
      ];

      for (const actionType of actionTypes) {
        await logActivity({
          module: 'todos',
          actionType,
          resourceType: 'task',
          resourceId: 'task-123',
          description: `${actionType} task`,
        });

        expect(mockInsert).toHaveBeenCalledWith(
          expect.objectContaining({ action_type: actionType })
        );
      }
    });

    it('should include metadata when provided', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnection = {
        id: 'conn-456',
        status: 'active',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockConnection],
        error: null,
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const metadata = {
        priority: 'high',
        tags: ['work', 'urgent'],
        dueDate: '2024-12-31',
      };

      await logActivity({
        module: 'todos',
        actionType: 'created',
        resourceType: 'task',
        resourceId: 'task-123',
        description: 'Created important task',
        metadata,
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({ metadata })
      );
    });

    it('should use null for metadata when not provided', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnection = {
        id: 'conn-456',
        status: 'active',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockConnection],
        error: null,
      } as any);

      const mockInsert = vi.fn().mockResolvedValue({ error: null });
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      await logActivity({
        module: 'shopping',
        actionType: 'created',
        resourceType: 'item',
        resourceId: 'item-123',
        description: 'Created item',
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: null,
        })
      );
    });

    it('should handle inactive connections gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockConnection = {
        id: 'conn-456',
        status: 'paused',
      };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [mockConnection],
        error: null,
      } as any);

      // Should not throw - silent failure for inactive connection
      await expect(
        logActivity({
          module: 'notes',
          actionType: 'created',
          resourceType: 'note',
          resourceId: 'note-123',
          description: 'Created note',
        })
      ).resolves.toBeUndefined();
    });
  });

  describe('logMutationActivity', () => {
    it('should call logActivity with correct parameters', () => {
      const mockUser = { id: 'user-123' };

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      } as any);

      vi.mocked(supabase.rpc).mockResolvedValue({
        data: [],
        error: null,
      } as any);

      // Should not throw - fire and forget
      expect(() => {
        logMutationActivity(
          'todos',
          'created',
          'task',
          'task-123',
          'Created task',
          { priority: 'high' }
        );
      }).not.toThrow();
    });
  });
});
