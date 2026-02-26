/**
 * Unit tests for usePartnerLinkQuery hooks
 */

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePartnerLink, useUpdatePartnerName } from '../usePartnerLinkQuery';
import * as connectionsAPI from '@/shared/api/connectionsAPI';
import type { ConnectionWithPermissions } from '@/shared/types/connections';
import { useConnectionsQuery } from '@/hooks/useConnectionsQuery';

// Mock dependencies
vi.mock('@/hooks/useConnectionsQuery');
vi.mock('@/shared/api/connectionsAPI');
vi.mock('@/services/logger');

describe('usePartnerLinkQuery', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('usePartnerLink', () => {
    it('should return null when no connections exist', () => {
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePartnerLink(), { wrapper });

      expect(result.current.data).toBeNull();
      expect(result.current.isLoading).toBe(false);
    });

    it('should convert first connection to partner link', () => {
      const mockConnection: ConnectionWithPermissions = {
        id: 'conn-123',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
        relationshipStartDate: '2023-06-15',
        myLabel: 'My Partner',
        permissions: {},
        otherUser: {
          id: 'user-2',
          email: 'partner@example.com',
          fullName: 'Partner Name',
        },
      };

      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: [mockConnection],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePartnerLink(), { wrapper });

      expect(result.current.data).toMatchObject({
        id: 'conn-123',
        requester_id: 'user-1',
        partner_id: 'user-2',
        status: 'accepted',
        relationship_start_date: '2023-06-15',
        partner_name: 'My Partner',
        partner_email: 'partner@example.com',
      });
      expect(result.current.data?.days_together).toBeGreaterThan(0);
    });

    it('should calculate days_together correctly', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const mockConnection: ConnectionWithPermissions = {
        id: 'conn-123',
        requesterId: 'user-1',
        receiverId: 'user-2',
        status: 'active',
        createdAt: '2024-01-01T00:00:00Z',
        relationshipStartDate: thirtyDaysAgo.toISOString().split('T')[0],
        myLabel: 'Partner',
        permissions: {},
        otherUser: {
          id: 'user-2',
          email: 'partner@example.com',
        },
      };

      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: [mockConnection],
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => usePartnerLink(), { wrapper });

      // Should be approximately 30 days (allow for slight variation due to timing)
      expect(result.current.data?.days_together).toBeGreaterThanOrEqual(30);
      expect(result.current.data?.days_together).toBeLessThanOrEqual(31);
    });

    it('should handle loading state', () => {
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });

      const { result } = renderHook(() => usePartnerLink(), { wrapper });

      expect(result.current.isLoading).toBe(true);
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch connections');
      vi.mocked(useConnectionsQuery).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });

      const { result } = renderHook(() => usePartnerLink(), { wrapper });

      expect(result.current.error).toBe(mockError);
    });
  });

  describe('useUpdatePartnerName', () => {
    it('should update partner name successfully', async () => {
      vi.mocked(connectionsAPI.updateConnection).mockResolvedValue({
        id: 'conn-123',
        label: 'New Partner Name',
      } as any);

      const { result } = renderHook(() => useUpdatePartnerName(), { wrapper });

      result.current.mutate({
        connectionId: 'conn-123',
        name: 'New Partner Name',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(connectionsAPI.updateConnection).toHaveBeenCalledWith('conn-123', {
        label: 'New Partner Name',
      });
    });

    it('should invalidate connections query on success', async () => {
      vi.mocked(connectionsAPI.updateConnection).mockResolvedValue({} as any);
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useUpdatePartnerName(), { wrapper });

      result.current.mutate({
        connectionId: 'conn-123',
        name: 'New Name',
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: ['connections'],
      });
    });

    it('should handle update error', async () => {
      const mockError = new Error('Update failed');
      vi.mocked(connectionsAPI.updateConnection).mockRejectedValue(mockError);

      const { result } = renderHook(() => useUpdatePartnerName(), { wrapper });

      result.current.mutate({
        connectionId: 'conn-123',
        name: 'New Name',
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(mockError);
    });
  });
});
