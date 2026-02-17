/**
 * Shared Queries Hook
 * React Query hooks for fetching shared connections, invitations, and activity
 */

import { useQuery } from '@tanstack/react-query';
import { useConnectionsQuery, useInvitationsQuery } from '@/hooks/useConnectionsQuery';
import { supabase } from '@/lib/supabase';
import { logger } from '@/services/logger';
import type {
  PartnerConnection,
  Invitation,
  ActivityItem,
  SharedStats,
  ModulePermission,
} from '../types';
import type { ConnectionWithPermissions } from '@/shared/types/connections';

/**
 * Map ConnectionWithPermissions to PartnerConnection
 */
function mapToPartnerConnection(conn: ConnectionWithPermissions): PartnerConnection {
  // Extract permissions and filter out 'off' permissions
  const permissions: ModulePermission[] = conn.myPermissions
    .filter((p) => p.permissionLevel !== 'off')
    .map((p) => ({
      module: p.module as PartnerConnection['permissions'][0]['module'],
      permission: p.permissionLevel as PartnerConnection['permissions'][0]['permission'],
    }));

  return {
    id: conn.id,
    partner_id: conn.otherUser.id,
    partner_name: conn.otherUser.fullName || conn.otherUser.email,
    partner_email: conn.otherUser.email,
    relationship: conn.relationship as PartnerConnection['relationship'],
    permissions,
    connected_at: conn.createdAt,
    status: conn.status === 'active' ? 'active' : 'paused',
  };
}

/**
 * Hook to fetch partner connections
 */
export function usePartnerConnections() {
  const { data: connections = [], isLoading, error } = useConnectionsQuery();

  const partnerConnections: PartnerConnection[] = connections.map(mapToPartnerConnection);

  return {
    data: partnerConnections,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch invitations
 */
export function usePartnerInvitations() {
  const { data: invitationsData, isLoading, error } = useInvitationsQuery();

  const invitations: Invitation[] = [
    ...(invitationsData?.received ?? []).map((inv) => ({
      id: inv.invitation.id,
      from_user_id: inv.fromUser.id,
      from_name: inv.fromUser.fullName || inv.fromUser.email,
      from_email: inv.fromUser.email,
      to_user_id: inv.connection.receiverId,
      to_email: inv.connection.connectedUserEmail || '',
      relationship: inv.connection.relationship as Invitation['relationship'],
      message: inv.invitation.message || null,
      permissions: Object.entries(inv.invitation.proposedPermissions).map(([module, level]) => ({
        module: module as ModulePermission['module'],
        permission: level as ModulePermission['permission'],
      })),
      status: 'pending' as const,
      direction: 'received' as const,
      created_at: inv.invitation.createdAt,
      expires_at: inv.invitation.expiresAt,
    })),
    ...(invitationsData?.sent ?? []).map((inv) => ({
      id: inv.invitation.id,
      from_user_id: inv.fromUser.id,
      from_name: inv.fromUser.fullName || inv.fromUser.email,
      from_email: inv.fromUser.email,
      to_user_id: inv.connection.receiverId || null,
      to_email: inv.connection.connectedUserEmail || '',
      relationship: inv.connection.relationship as Invitation['relationship'],
      message: inv.invitation.message || null,
      permissions: Object.entries(inv.invitation.proposedPermissions).map(([module, level]) => ({
        module: module as ModulePermission['module'],
        permission: level as ModulePermission['permission'],
      })),
      status: 'pending' as const,
      direction: 'sent' as const,
      created_at: inv.invitation.createdAt,
      expires_at: inv.invitation.expiresAt,
    })),
  ];

  return {
    data: invitations,
    isLoading,
    error,
  };
}

/**
 * Hook to fetch shared activity (placeholder for now - returns empty array)
 * TODO: Implement activity tracking in database
 */
export function useSharedActivity() {
  return useQuery<ActivityItem[]>({
    queryKey: ['shared', 'activity'],
    queryFn: async () => {
      logger.debug('Shared', 'Fetching shared activity');
      // TODO: Replace with actual activity tracking query
      // For now, return empty array
      return [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to calculate shared stats
 */
export function useSharedStats() {
  const { data: connections = [] } = usePartnerConnections();

  const stats: SharedStats = {
    partner_count: connections.length,
    shared_modules_count: connections.reduce(
      (acc, conn) => acc + conn.permissions.filter((p) => p.permission !== 'off').length,
      0
    ),
    shared_items_count: 0, // TODO: Calculate from actual shared data
  };

  return stats;
}
