/**
 * Unit tests for useSharedQueries hooks
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  usePartnerConnections,
  usePartnerInvitations,
  useSharedActivity,
  useSharedStats,
} from '../useSharedQueries';
import type { ConnectionWithPermissions, ReceivedInvitation, SentInvitation } from '@/shared/types/connections';

// Mock useConnectionsQuery
vi.mock('@/hooks/useConnectionsQuery', () => ({
  useConnectionsQuery: vi.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  useInvitationsQuery: vi.fn(() => ({
    data: { received: [], sent: [] },
    isLoading: false,
    error: null,
  })),
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

describe('useSharedQueries', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
        },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('usePartnerConnections', () => {
    it('should return empty array when no connections', async () => {
      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerConnections(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should map connections to partner connections', async () => {
      const mockConnections: ConnectionWithPermissions[] = [
        {
          id: 'conn-1',
          requesterId: 'user-1',
          receiverId: 'user-2',
          status: 'active',
          relationship: 'spouse',
          label: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          otherUser: {
            id: 'user-2',
            email: 'partner@example.com',
            fullName: 'Partner Name',
            avatarUrl: null,
          },
          myPermissions: [
            {
              module: 'meals',
              permissionLevel: 'collaborate',
            },
            {
              module: 'shopping',
              permissionLevel: 'view',
            },
          ],
          theirPermissions: [],
        },
      ];

      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: mockConnections,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerConnections(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]).toMatchObject({
        id: 'conn-1',
        partner_id: 'user-2',
        partner_name: 'Partner Name',
        partner_email: 'partner@example.com',
        relationship: 'spouse',
        status: 'active',
      });
      expect(result.current.data[0].permissions).toHaveLength(2);
    });

    it('should filter out "off" permissions', async () => {
      const mockConnections: ConnectionWithPermissions[] = [
        {
          id: 'conn-1',
          requesterId: 'user-1',
          receiverId: 'user-2',
          status: 'active',
          relationship: 'spouse',
          label: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          otherUser: {
            id: 'user-2',
            email: 'partner@example.com',
            fullName: 'Partner Name',
            avatarUrl: null,
          },
          myPermissions: [
            {
              module: 'meals',
              permissionLevel: 'collaborate',
            },
            {
              module: 'shopping',
              permissionLevel: 'off' as any,
            },
          ],
          theirPermissions: [],
        },
      ];

      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: mockConnections,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerConnections(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data[0].permissions).toHaveLength(1);
      expect(result.current.data[0].permissions[0].module).toBe('meals');
    });

    it('should use email as fallback for partner name', async () => {
      const mockConnections: ConnectionWithPermissions[] = [
        {
          id: 'conn-1',
          requesterId: 'user-1',
          receiverId: 'user-2',
          status: 'active',
          relationship: 'spouse',
          label: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          otherUser: {
            id: 'user-2',
            email: 'partner@example.com',
            fullName: null,
            avatarUrl: null,
          },
          myPermissions: [],
          theirPermissions: [],
        },
      ];

      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: mockConnections,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerConnections(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data[0].partner_name).toBe('partner@example.com');
    });

    it('should handle loading state', async () => {
      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerConnections(), { wrapper });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toEqual([]);
    });

    it('should handle errors', async () => {
      const mockError = new Error('Failed to fetch connections');

      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: mockError,
      } as any);

      const { result } = renderHook(() => usePartnerConnections(), { wrapper });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('usePartnerInvitations', () => {
    it('should return empty array when no invitations', async () => {
      const { useInvitationsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useInvitationsQuery).mockReturnValue({
        data: { received: [], sent: [] },
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerInvitations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should map received invitations', async () => {
      const mockInvitations: { received: ReceivedInvitation[]; sent: SentInvitation[] } = {
        received: [
          {
            invitation: {
              id: 'inv-1',
              connectionId: 'conn-1',
              senderId: 'user-1',
              receiverEmail: 'me@example.com',
              status: 'pending',
              message: 'Join me!',
              proposedPermissions: {
                meals: 'collaborate',
              },
              createdAt: '2024-01-01',
              expiresAt: '2024-02-01',
            },
            fromUser: {
              id: 'user-1',
              email: 'sender@example.com',
              fullName: 'Sender Name',
              avatarUrl: null,
            },
            connection: {
              id: 'conn-1',
              requesterId: 'user-1',
              receiverId: 'user-2',
              status: 'pending',
              relationship: 'spouse',
              label: null,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
              connectedUserEmail: 'me@example.com',
            },
          },
        ],
        sent: [],
      };

      const { useInvitationsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useInvitationsQuery).mockReturnValue({
        data: mockInvitations,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerInvitations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]).toMatchObject({
        id: 'inv-1',
        from_user_id: 'user-1',
        from_name: 'Sender Name',
        from_email: 'sender@example.com',
        direction: 'received',
        status: 'pending',
      });
    });

    it('should map sent invitations', async () => {
      const mockInvitations: { received: ReceivedInvitation[]; sent: SentInvitation[] } = {
        received: [],
        sent: [
          {
            invitation: {
              id: 'inv-2',
              connectionId: 'conn-2',
              senderId: 'user-1',
              receiverEmail: 'partner@example.com',
              status: 'pending',
              message: null,
              proposedPermissions: {
                shopping: 'view',
              },
              createdAt: '2024-01-01',
              expiresAt: '2024-02-01',
            },
            fromUser: {
              id: 'user-1',
              email: 'me@example.com',
              fullName: 'My Name',
              avatarUrl: null,
            },
            connection: {
              id: 'conn-2',
              requesterId: 'user-1',
              receiverId: null,
              status: 'pending',
              relationship: 'partner',
              label: null,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
              connectedUserEmail: 'partner@example.com',
            },
          },
        ],
      };

      const { useInvitationsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useInvitationsQuery).mockReturnValue({
        data: mockInvitations,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerInvitations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data[0]).toMatchObject({
        id: 'inv-2',
        from_user_id: 'user-1',
        from_name: 'My Name',
        to_email: 'partner@example.com',
        direction: 'sent',
        status: 'pending',
      });
    });

    it('should combine received and sent invitations', async () => {
      const mockInvitations: { received: ReceivedInvitation[]; sent: SentInvitation[] } = {
        received: [
          {
            invitation: {
              id: 'inv-1',
              connectionId: 'conn-1',
              senderId: 'user-2',
              receiverEmail: 'me@example.com',
              status: 'pending',
              message: null,
              proposedPermissions: {},
              createdAt: '2024-01-01',
              expiresAt: '2024-02-01',
            },
            fromUser: {
              id: 'user-2',
              email: 'sender@example.com',
              fullName: 'Sender',
              avatarUrl: null,
            },
            connection: {
              id: 'conn-1',
              requesterId: 'user-2',
              receiverId: 'user-1',
              status: 'pending',
              relationship: 'spouse',
              label: null,
              createdAt: '2024-01-01',
              updatedAt: '2024-01-01',
              connectedUserEmail: 'me@example.com',
            },
          },
        ],
        sent: [
          {
            invitation: {
              id: 'inv-2',
              connectionId: 'conn-2',
              senderId: 'user-1',
              receiverEmail: 'partner@example.com',
              status: 'pending',
              message: null,
              proposedPermissions: {},
              createdAt: '2024-01-02',
              expiresAt: '2024-02-02',
            },
            fromUser: {
              id: 'user-1',
              email: 'me@example.com',
              fullName: 'Me',
              avatarUrl: null,
            },
            connection: {
              id: 'conn-2',
              requesterId: 'user-1',
              receiverId: null,
              status: 'pending',
              relationship: 'partner',
              label: null,
              createdAt: '2024-01-02',
              updatedAt: '2024-01-02',
              connectedUserEmail: 'partner@example.com',
            },
          },
        ],
      };

      const { useInvitationsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useInvitationsQuery).mockReturnValue({
        data: mockInvitations,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => usePartnerInvitations(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data.find(inv => inv.direction === 'received')).toBeDefined();
      expect(result.current.data.find(inv => inv.direction === 'sent')).toBeDefined();
    });
  });

  describe('useSharedActivity', () => {
    it('should return empty array (placeholder)', async () => {
      const { result } = renderHook(() => useSharedActivity(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('should use correct query key', () => {
      renderHook(() => useSharedActivity(), { wrapper });

      const queries = queryClient.getQueryCache().getAll();
      const activityQuery = queries.find(q =>
        JSON.stringify(q.queryKey) === JSON.stringify(['shared', 'activity'])
      );

      expect(activityQuery).toBeDefined();
    });

    it('should have 2 minute stale time', async () => {
      const { result } = renderHook(() => useSharedActivity(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      const query = queryClient.getQueryCache().find({
        queryKey: ['shared', 'activity']
      });
      expect(query?.options.staleTime).toBe(1000 * 60 * 2);
    });
  });

  describe('useSharedStats', () => {
    it('should calculate stats from connections', async () => {
      const mockConnections: ConnectionWithPermissions[] = [
        {
          id: 'conn-1',
          requesterId: 'user-1',
          receiverId: 'user-2',
          status: 'active',
          relationship: 'spouse',
          label: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          otherUser: {
            id: 'user-2',
            email: 'partner@example.com',
            fullName: 'Partner',
            avatarUrl: null,
          },
          myPermissions: [
            {
              module: 'meals',
              permissionLevel: 'collaborate',
            },
            {
              module: 'shopping',
              permissionLevel: 'view',
            },
          ],
          theirPermissions: [],
        },
      ];

      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: mockConnections,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useSharedStats(), { wrapper });

      expect(result.current).toEqual({
        partner_count: 1,
        shared_modules_count: 2,
        shared_items_count: 0,
      });
    });

    it('should return zero stats when no connections', async () => {
      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useSharedStats(), { wrapper });

      expect(result.current).toEqual({
        partner_count: 0,
        shared_modules_count: 0,
        shared_items_count: 0,
      });
    });

    it('should filter out "off" permissions in count', async () => {
      const mockConnections: ConnectionWithPermissions[] = [
        {
          id: 'conn-1',
          requesterId: 'user-1',
          receiverId: 'user-2',
          status: 'active',
          relationship: 'spouse',
          label: null,
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
          otherUser: {
            id: 'user-2',
            email: 'partner@example.com',
            fullName: 'Partner',
            avatarUrl: null,
          },
          myPermissions: [
            {
              module: 'meals',
              permissionLevel: 'collaborate',
            },
            {
              module: 'shopping',
              permissionLevel: 'off' as any,
            },
            {
              module: 'todos',
              permissionLevel: 'view',
            },
          ],
          theirPermissions: [],
        },
      ];

      const { useConnectionsQuery } = await import('@/hooks/useConnectionsQuery');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: mockConnections,
        isLoading: false,
        error: null,
      } as any);

      const { result } = renderHook(() => useSharedStats(), { wrapper });

      expect(result.current.shared_modules_count).toBe(2);
    });
  });
});
