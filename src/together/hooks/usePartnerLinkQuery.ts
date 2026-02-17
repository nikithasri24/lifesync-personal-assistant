/**
 * Partner Link React Query Hooks
 * Reuses existing Shared connections for Together feature
 */

import { useMemo } from 'react';
import { useConnectionsQuery } from '@/hooks/useConnectionsQuery';
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
    requester_id: connection.requester_id,
    partner_id: connection.receiver_id,
    status: 'accepted', // Maps from ConnectionStatus 'active' to PartnerLink 'accepted'
    relationship_start_date: null, // TODO: Read from profile_connections.relationship_start_date
    created_at: connection.created_at,
    updated_at: connection.updated_at || connection.created_at,
    requester_email: connection.requester_email,
    partner_email: connection.receiver_email,
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
 * Note: Partner linking is handled by the existing Shared feature
 * Users should go to /shared to send connection requests
 * Together feature simply displays the first accepted connection as "partner"
 */
