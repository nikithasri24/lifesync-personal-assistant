/**
 * Partner Link React Query Hooks
 * Reuses existing Shared connections for Together feature
 */

import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useConnectionsQuery } from '@/hooks/useConnectionsQuery';
import { updateConnection } from '@/shared/api/connectionsAPI';
import { logger } from '@/services/logger';
import type { PartnerLink } from '../types';
import type { ConnectionWithPermissions } from '@/shared/types/connections';

// =====================================================
// HELPERS
// =====================================================

/**
 * Convert ConnectionWithPermissions to PartnerLink format
 */
function connectionToPartnerLink(connection: ConnectionWithPermissions): PartnerLink {
  return {
    id: connection.id,
    requester_id: connection.requesterId,
    partner_id: connection.receiverId,
    status: 'accepted', // Maps from ConnectionStatus 'active' to PartnerLink 'accepted'
    relationship_start_date: null, // TODO: Read from profile_connections.relationship_start_date
    created_at: connection.createdAt,
    updated_at: connection.updatedAt || connection.createdAt,
    requester_email: connection.otherUser?.email,
    partner_email: connection.otherUser?.email,
    partner_name: connection.myLabel || connection.otherUser?.fullName || connection.otherUser?.email,
    days_together: null,
  };
}

// =====================================================
// QUERIES
// =====================================================

/**
 * Get active partner link for current user
 * Reuses existing Shared connections
 */
export function usePartnerLink() {
  const { data: connections = [], isLoading, error } = useConnectionsQuery();

  // Find first accepted connection to use as partner
  const partnerLink = useMemo(() => {
    if (connections.length === 0) {
      logger.debug('Together', 'No connections found');
      return null;
    }

    // Use first connection as partner
    const connection = connections[0];
    logger.debug('Together', 'Using existing connection as partner', {
      connectionId: connection.id,
    });

    return connectionToPartnerLink(connection);
  }, [connections]);

  return {
    data: partnerLink,
    isLoading,
    error,
  };
}

/**
 * Update partner name/label
 */
export function useUpdatePartnerName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ connectionId, name }: { connectionId: string; name: string }) => {
      logger.debug('Together', 'Updating partner name', { connectionId, name });
      return updateConnection(connectionId, { label: name });
    },
    onSuccess: () => {
      logger.info('Together', 'Partner name updated successfully');
      // Invalidate connections query to refresh the partner link
      void queryClient.invalidateQueries({ queryKey: ['connections'] });
    },
    onError: (error) => {
      logger.error('Together', error, { context: 'Failed to update partner name' });
    },
  });
}

/**
 * Note: Partner linking is handled by the existing Shared feature
 * Users should go to /shared to send connection requests
 * Together feature simply displays the first accepted connection as "partner"
 */
