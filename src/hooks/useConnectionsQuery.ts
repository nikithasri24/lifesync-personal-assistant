/**
 * React Query hooks for Connections & Invitations
 *
 * Provides hooks for managing user connections, invitations, and permissions.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logger } from '@/services/logger';
import {
  getUserConnections,
  getConnectionPermissions,
  getPendingInvitations,
  createConnection,
  acceptConnection,
  rejectConnection,
  updateConnection,
  deleteConnection,
  setModulePermission,
} from '@/shared/api/connectionsAPI';
import { clearMergedConnectionCache } from '@/api/mealPlanningAPI';
import { clearFinanceMergedConnectionCache } from '@/hooks/useFinanceQuery';
import type {
  ConnectionWithUser,
  ConnectionWithPermissions,
  PendingInvitation,
  CreateConnectionInput,
  AcceptConnectionInput,
  UpdateConnectionInput,
  ProfileConnection,
  ShareableModule,
  ModulePermissionLevel,
} from '@/shared/types/connections';

// Response type for invitations query
type InvitationsResponse = {
  sent: PendingInvitation[];
  received: PendingInvitation[];
};

// ==================== Query Keys ====================

export const connectionsKeys = {
  all: ['connections'] as const,
  lists: () => [...connectionsKeys.all, 'list'] as const,
  connections: () => [...connectionsKeys.lists(), 'connections'] as const,
  invitations: () => [...connectionsKeys.all, 'invitations'] as const,
};

// ==================== Queries ====================

/**
 * Fetch all active connections for current user
 */
export function useConnectionsQuery() {
  return useQuery<ConnectionWithPermissions[]>({
    queryKey: connectionsKeys.connections(),
    queryFn: async () => {
      logger.debug('Shared', 'Fetching user connections');
      const connections = await getUserConnections();
      const withPermissions = await Promise.all(
        connections.map(async (connection) => {
          const permissions = await getConnectionPermissions(connection.id);
          return { ...connection, ...permissions };
        })
      );
      logger.info('Shared', 'Connections loaded', { count: withPermissions.length });
      return withPermissions;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch pending invitations (sent and received)
 */
export function useInvitationsQuery() {
  return useQuery<InvitationsResponse>({
    queryKey: connectionsKeys.invitations(),
    queryFn: async () => {
      logger.debug('Shared', 'Fetching invitations');
      const invitations = await getPendingInvitations();
      logger.info('Shared', 'Invitations loaded', {
        sent: invitations.sent.length,
        received: invitations.received.length,
      });
      return invitations;
    },
    staleTime: 1000 * 60 * 2, // 2 minutes (more frequently updated)
  });
}

// ==================== Mutations ====================

/**
 * Send a new connection invitation
 */
export function useCreateInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateConnectionInput) => {
      logger.debug('Shared', 'Creating invitation', { email: input.receiverEmail });
      return await createConnection(input);
    },
    onSuccess: (newInvitation) => {
      logger.info('Shared', 'Invitation created', { id: newInvitation.id });
      // Invalidate invitations to show new sent invitation
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.invitations() });
    },
    onError: (error: Error) => {
      logger.error('Shared', error);
    },
  });
}

/**
 * Accept a pending connection invitation
 */
export function useAcceptInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AcceptConnectionInput) => {
      logger.debug('Shared', 'Accepting invitation', { connectionId: input.connectionId });
      return await acceptConnection(input);
    },
    onSuccess: (acceptedConnection) => {
      logger.info('Shared', 'Invitation accepted', { id: acceptedConnection.id });
      // Invalidate both connections and invitations
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.connections() });
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.invitations() });
    },
    onError: (error: Error) => {
      logger.error('Shared', error);
    },
  });
}

/**
 * Reject a pending connection invitation
 */
export function useRejectInvitationMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      logger.debug('Shared', 'Rejecting invitation', { connectionId });
      return await rejectConnection(connectionId);
    },
    onSuccess: () => {
      logger.info('Shared', 'Invitation rejected');
      // Invalidate invitations to remove from list
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.invitations() });
    },
    onError: (error: Error) => {
      logger.error('Shared', error);
    },
  });
}

/**
 * Delete an existing connection
 */
export function useDeleteConnectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      logger.debug('Shared', 'Deleting connection', { connectionId });
      await deleteConnection(connectionId);
      return connectionId;
    },
    onMutate: async (connectionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: connectionsKeys.connections() });

      // Snapshot previous value
      const previousConnections = queryClient.getQueryData<ConnectionWithUser[]>(
        connectionsKeys.connections()
      );

      // Optimistically remove from cache
      queryClient.setQueryData<ConnectionWithUser[]>(
        connectionsKeys.connections(),
        (old) => old?.filter((conn) => conn.id !== connectionId) ?? []
      );

      return { previousConnections };
    },
    onError: (error: Error, connectionId, context) => {
      logger.error('Shared', error);
      // Rollback on error
      if (context?.previousConnections) {
        queryClient.setQueryData(connectionsKeys.connections(), context.previousConnections);
      }
    },
    onSuccess: (connectionId) => {
      logger.info('Shared', 'Connection deleted', { id: connectionId });
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.connections() });
    },
  });
}

/**
 * Update connection metadata or permissions
 */
export function useUpdateConnectionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: UpdateConnectionInput }) => {
      logger.debug('Shared', 'Updating connection', { id });
      return await updateConnection(id, updates);
    },
    onSuccess: (updatedConnection) => {
      logger.info('Shared', 'Connection updated', { id: updatedConnection.id });
      // Update cache with new data - updatedConnection is ProfileConnection
      queryClient.setQueryData<ConnectionWithUser[]>(
        connectionsKeys.connections(),
        (old) => {
          if (!old) return [];
          // Convert ProfileConnection to ConnectionWithUser if needed
          // For now, just invalidate and let it refetch
          return old;
        }
      );
      // Invalidate to refetch with full ConnectionWithUser data
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.connections() });
    },
    onError: (error: Error) => {
      logger.error('Shared', error);
    },
  });
}

/**
 * Update module permission for a connection
 */
export function useUpdatePermissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      connectionId: string;
      module: ShareableModule;
      permissionLevel: ModulePermissionLevel;
      settings?: Record<string, unknown>;
    }) => {
      logger.debug('Shared', 'Updating permission', {
        connectionId: input.connectionId,
        module: input.module,
        level: input.permissionLevel,
      });
      return await setModulePermission(input);
    },
    onSuccess: (permission) => {
      logger.info('Shared', 'Permission updated', {
        module: permission.module,
        level: permission.permissionLevel,
      });
      // Clear merged connection cache since permission level may have changed
      // This ensures the next fetch re-evaluates merged status
      if (permission.module === 'meals') {
        clearMergedConnectionCache();
      }
      if (permission.module === 'finances') {
        clearFinanceMergedConnectionCache();
      }
      // Invalidate connections to refetch with updated permissions
      void queryClient.invalidateQueries({ queryKey: connectionsKeys.connections() });
    },
    onError: (error: Error) => {
      logger.error('Shared', error);
    },
  });
}
